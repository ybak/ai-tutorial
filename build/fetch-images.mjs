#!/usr/bin/env node
/**
 * fetch-images.mjs — 把书架内各书（books/<bookId>/chapters/*.md）中的远程图片（微信图床等）下载到本地，
 * 让 PDF/HTML 离线可渲染。
 *
 * 行为：
 *   1. 缺省扫描 books/ 下全部含 chapters/ 子目录的书（隐藏目录跳过）；`--book <bookId>` 可只处理指定书
 *      （书必须存在且含 chapters/，否则报错）。
 *   2. 扫描各书 chapters/*.md 中的 `![alt](http…)` 与 `<img src="http…">`（只处理 http/https 外链，
 *      相对路径 ../assets/images/ 的本地引用跳过）。
 *   3. 去重后下载到 books/<bookId>/assets/images/<sha1(url) 前 12 位>.<扩展名>；扩展名优先取 Content-Type，
 *      其次按文件头魔数嗅探（微信图床可能返回 webp），再退回 URL 的 wx_fmt 参数。
 *   4. 请求头带 User-Agent + Referer: https://mp.weixin.qq.com/（微信图床防盗链）；
 *      并发 5；单张失败重试 2 次（间隔 2s）；响应为 HTML 错误页时按失败处理。
 *   5. 成功 → 章节稿中的 URL 替换为相对路径 ../assets/images/<file>（相对书内 assets/ 解析，产物侧镜像同级）；
 *      失败 → 记入 books/<bookId>/assets/images/_failed.txt（失败清单按书隔离），并把该图引用替换为
 *      `> **图**（原 alt 文案）：图片未能本地化，请参考在线版文档` 引用块；
 *      引用块上方保留一条 HTML 注释（渲染不可见）记录原始 URL/alt，供下次运行重试恢复。
 *   6. 幂等：已本地化的（../assets/images/ 引用）天然跳过；_failed 对应引用每次运行重试，
 *      重试成功则还原为本地图片引用；同名哈希文件已存在时直接复用不再下载。
 *      任一书失败率超过 30% 时以退出码 2 结束（疑似图床防爬升级）。
 *
 * 用法（在 build/ 下执行）：
 *   node fetch-images.mjs                # 扫描书架全部书
 *   node fetch-images.mjs --book ragflow # 只处理指定书
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..'); // 仓库根

const CONCURRENCY = 5;
const RETRIES = 2; // 失败后补试 2 次（共 3 次尝试）
const RETRY_DELAY_MS = 2000;
const TIMEOUT_MS = 30000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  Referer: 'https://mp.weixin.qq.com/',
};

/** 远程 markdown 图片：![alt](http…) */
const MD_IMAGE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
/** 远程 <img> 标签：<img … src="http…"> */
const HTML_IMAGE = /<img\b[^>]*?\bsrc="(https?:\/\/[^"]+)"[^>]*>/gi;
/** 上次运行失败时留下的占位注释 + 引用块（本次重试，成功则还原为本地图片） */
const FAILED_MARKER = /<!-- fetch-images-failed: (\{.*?\}) -->\n(>[^\n]*\n?)/g;

const FALLBACK_TEXT = '图片未能本地化，请参考在线版文档';

const CT_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 命令行参数：--book <bookId> 限定单书；无参返回 null；缺值/未知参数 throw */
function parseArgs(argv = process.argv.slice(2)) {
  let book = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--book') {
      const value = argv[i + 1];
      if (value === undefined) throw new Error('--book 需要一个书 ID 参数，如：--book ragflow');
      book = value;
      i++;
    } else {
      throw new Error(`未知参数: ${arg}（仅支持 --book <bookId>）`);
    }
  }
  return book;
}

/** 发现书架全部书：books/ 下含 chapters/ 子目录的条目（隐藏目录跳过），升序 */
function discoverBooks() {
  return fs
    .readdirSync(path.join(ROOT_DIR, 'books'), { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .filter((e) => fs.existsSync(path.join(ROOT_DIR, 'books', e.name, 'chapters')))
    .map((e) => e.name)
    .sort();
}

/** 书内路径派生：章节目录 / 本地图目录 / 失败清单 */
function bookPaths(bookId) {
  const chaptersDir = path.join(ROOT_DIR, 'books', bookId, 'chapters');
  const imagesDir = path.join(ROOT_DIR, 'books', bookId, 'assets', 'images');
  return { chaptersDir, imagesDir, failedList: path.join(imagesDir, '_failed.txt') };
}

/** 列出书内 chapters/ 下全部 .md（不递归，篇导读/序言/附录同样处理） */
function listChapters(chaptersDir) {
  return fs
    .readdirSync(chaptersDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name)
    .sort();
}

/** 失败占位用的 alt/url 需放进 HTML 注释：去掉会破坏注释的字符 */
function commentSafe(s) {
  return String(s).replace(/-->/g, '').replace(/[<>]/g, '');
}

/** 扫描单个 md：返回引用列表 [{ kind, url, alt, raw, index, line }] */
function scanRefs(text) {
  const refs = [];
  const lineOf = (idx) => text.slice(0, idx).split('\n').length;

  for (const m of text.matchAll(FAILED_MARKER)) {
    let payload = {};
    try {
      payload = JSON.parse(m[1]);
    } catch {
      continue; // 注释损坏则视为普通文本，不动
    }
    if (!payload.url) continue;
    refs.push({ kind: 'retry', url: payload.url, alt: payload.alt ?? '', raw: m[0], index: m.index, line: lineOf(m.index) });
  }
  for (const m of text.matchAll(MD_IMAGE)) {
    refs.push({ kind: 'md', url: m[2], alt: m[1], raw: m[0], index: m.index, line: lineOf(m.index) });
  }
  for (const m of text.matchAll(HTML_IMAGE)) {
    refs.push({ kind: 'html', url: m[1], alt: /\balt="([^"]*)"/i.exec(m[0])?.[1] ?? '', raw: m[0], index: m.index, line: lineOf(m.index) });
  }
  return refs.sort((a, b) => a.index - b.index);
}

/** 文件头魔数 → 扩展名（Content-Type 缺失/不可信时的兜底） */
function magicExt(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  const head = buf.subarray(0, 64).toString('latin1');
  if (head.startsWith('GIF8')) return 'gif';
  if (head.startsWith('RIFF') && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (/^\s*(<\?xml[\s\S]*?<svg|<svg)/i.test(head)) return 'svg';
  return null;
}

/**
 * 扩展名判定：Content-Type 优先（brief 指定），魔数其次（图床谎报类型时纠正），
 * 再次 URL 的 wx_fmt 参数，最后默认 png；返回 null 表示响应不是图片（HTML 错误页等）。
 */
function pickExt(contentType, buf, url) {
  const ct = contentType ? contentType.split(';')[0].trim().toLowerCase() : '';
  const ctExt = CT_EXT[ct] ?? null;
  const magic = magicExt(buf);

  if (!ctExt && !magic) {
    const head = buf.subarray(0, 200).toString('utf8').trimStart().toLowerCase();
    if (head.startsWith('<!doctype') || head.startsWith('<html')) return null; // 错误页，按失败处理
  }
  // 嗅探到的魔数与 Content-Type 冲突时信魔数（如声称 jpeg 实为 webp）
  if (magic && ctExt && magic !== ctExt) return magic;
  return ctExt ?? magic ?? wxFmtExt(url) ?? 'png';
}

function wxFmtExt(url) {
  const wx = /[?&]wx_fmt=(\w+)/.exec(url)?.[1]?.toLowerCase();
  if (wx === 'jpeg') return 'jpg';
  return wx && ['png', 'gif', 'webp', 'svg'].includes(wx) ? wx : null;
}

/** 哈希同名文件已存在（任意扩展名）→ 直接复用（幂等，不重复下载） */
function findExisting(hash, imagesDir) {
  return fs
    .readdirSync(imagesDir)
    .find((f) => f.startsWith(`${hash}.`) && fs.statSync(path.join(imagesDir, f)).size > 0);
}

/** 下载单张图（含重试），成功返回 { ok, file }，失败返回 { ok:false, error } */
async function fetchImage(url, imagesDir) {
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
  const existing = findExisting(hash, imagesDir);
  if (existing) return { ok: true, file: existing, reused: true };

  let lastErr = '';
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS);
    try {
      const res = await fetch(url, {
        headers: HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 24) throw new Error(`响应过小（${buf.length}B）`);
      const ext = pickExt(res.headers.get('content-type'), buf, url);
      if (!ext) throw new Error('响应不是图片（疑似错误页）');
      const file = `${hash}.${ext}`;
      fs.writeFileSync(path.join(imagesDir, file), buf);
      return { ok: true, file, bytes: buf.length };
    } catch (e) {
      lastErr = e?.message ?? String(e);
    }
  }
  return { ok: false, error: lastErr };
}

/** 并发池：以固定并发跑完 tasks（每个 task 是 () => Promise） */
async function runPool(tasks, concurrency) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const i = cursor++;
      await tasks[i]();
    }
  });
  await Promise.all(workers);
}

/** 失败占位块：HTML 注释（记录 url/alt 供下次重试，渲染不可见）+ 指定文案的引用块 */
function fallbackBlock(url, alt) {
  const comment = `<!-- fetch-images-failed: ${JSON.stringify({ url, alt: commentSafe(alt) })} -->`;
  const quote = `> **图**（${alt || '图片'}）：${FALLBACK_TEXT}`;
  return `${comment}\n${quote}`;
}

/** 计算单个引用的替换文本 */
function replacementFor(ref, results) {
  const r = results.get(ref.url);
  if (ref.kind === 'retry') {
    // 上次失败的占位：成功 → 还原为本地图片；仍失败 → 原样保留
    return r?.ok ? `![${ref.alt}](../assets/images/${r.file})` : ref.raw;
  }
  if (r?.ok) {
    return ref.kind === 'md' ? `![${ref.alt}](../assets/images/${r.file})` : ref.raw.replace(ref.url, `../assets/images/${r.file}`);
  }
  return fallbackBlock(ref.url, ref.alt);
}

/** 按引用改写单个 md 文件内容（refs 必须已按 index 升序且互不重叠） */
function rewrite(refs, results, original) {
  if (refs.length === 0) return original;
  const parts = [original.slice(0, refs[0].index)];
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    parts.push(replacementFor(ref, results));
    const nextStart = i + 1 < refs.length ? refs[i + 1].index : original.length;
    parts.push(original.slice(ref.index + ref.raw.length, nextStart));
  }
  return parts.join('');
}

/** 处理单本书：扫描 → 下载 → 改写 → 写失败清单，返回统计对象 */
async function runBook(bookId) {
  const { chaptersDir, imagesDir, failedList } = bookPaths(bookId);
  fs.mkdirSync(imagesDir, { recursive: true });
  const files = listChapters(chaptersDir);

  // 1. 扫描全部章节稿
  const perFile = new Map(); // file -> refs[]
  const uniqueUrls = new Set();
  for (const name of files) {
    const text = fs.readFileSync(path.join(chaptersDir, name), 'utf8');
    const refs = scanRefs(text);
    perFile.set(name, refs);
    for (const ref of refs) uniqueUrls.add(ref.url);
  }
  const retryUrls = new Set();
  for (const refs of perFile.values()) for (const ref of refs) if (ref.kind === 'retry') retryUrls.add(ref.url);

  console.log(`[fetch-images] <${bookId}> 扫描 ${files.length} 个章节稿：远程图片引用 ${[...perFile.values()].reduce((n, r) => n + r.length, 0)} 处，去重 URL ${uniqueUrls.size} 个（其中上次失败待重试 ${retryUrls.size} 个）`);

  // 2. 并发下载（并发 5，失败重试 2 次）
  const results = new Map(); // url -> {ok, file?, error?, bytes?}
  const urls = [...uniqueUrls];
  let done = 0;
  const tasks = urls.map((url) => async () => {
    const r = await fetchImage(url, imagesDir);
    results.set(url, r);
    done++;
    const tag = r.ok ? (r.reused ? '复用' : '下载') : '失败';
    const brief = r.ok ? `../assets/images/${r.file}${r.bytes ? ` (${(r.bytes / 1024).toFixed(0)}KB)` : ''}` : r.error;
    console.log(`[fetch-images] <${bookId}> [${done}/${urls.length}] ${tag} ${brief}  ${url.slice(0, 72)}…`);
  });
  await runPool(tasks, CONCURRENCY);

  // 3. 改写章节稿
  const failedLines = [];
  let okRefs = 0;
  let failRefs = 0;
  for (const [name, refs] of perFile) {
    if (refs.length === 0) continue;
    const original = fs.readFileSync(path.join(chaptersDir, name), 'utf8');
    const updated = rewrite(refs, results, original);
    if (updated !== original) fs.writeFileSync(path.join(chaptersDir, name), updated, 'utf8');
    for (const ref of refs) {
      const r = results.get(ref.url);
      if (r?.ok) okRefs++;
      else {
        failRefs++;
        failedLines.push(`${ref.url}\t(${name}:${ref.line}) ${ref.alt || '(无 alt)'}  ← ${r?.error ?? 'unknown'}`);
      }
    }
  }

  // 4. 失败清单（本次运行全量重写；无失败则清掉历史清单）
  if (failedLines.length > 0) {
    fs.writeFileSync(failedList, failedLines.join('\n') + '\n', 'utf8');
  } else if (fs.existsSync(failedList)) {
    fs.unlinkSync(failedList);
  }

  // 5. 统计
  const okUrls = urls.filter((u) => results.get(u)?.ok).length;
  const failUrls = urls.length - okUrls;
  const extStats = {};
  for (const u of urls) {
    const f = results.get(u)?.file;
    if (f) extStats[f.split('.').pop()] = (extStats[f.split('.').pop()] ?? 0) + 1;
  }
  return { urls, okUrls, failUrls, okRefs, failRefs, extStats, failedLines };
}

async function main() {
  const only = parseArgs();
  if (only && !fs.existsSync(bookPaths(only).chaptersDir)) {
    throw new Error(`书不存在或缺 chapters/ 目录: ${only}（书架现有: ${discoverBooks().join(', ')}）`);
  }
  const books = only ? [only] : discoverBooks();
  console.log(`[fetch-images] 处理书架 ${books.length} 本：${books.join(', ')}`);

  let totalUrls = 0;
  let totalOkUrls = 0;
  let totalFailUrls = 0;
  let totalOkRefs = 0;
  let totalFailRefs = 0;
  let anyFailed = false;
  for (const bookId of books) {
    const s = await runBook(bookId);
    const failRate = s.urls.length ? ((s.failUrls / s.urls.length) * 100).toFixed(1) : '0.0';
    console.log('─'.repeat(60));
    console.log(`[fetch-images] <${bookId}> 统计：URL 总数 ${s.urls.length}｜成功 ${s.okUrls}｜失败 ${s.failUrls}（失败率 ${failRate}%）`);
    console.log(`[fetch-images] <${bookId}> 引用处理：成功替换 ${s.okRefs} 处｜失败占位 ${s.failRefs} 处`);
    console.log(`[fetch-images] <${bookId}> 文件类型分布：${JSON.stringify(s.extStats)}`);
    if (s.failedLines.length > 0) {
      anyFailed = true;
      console.log(`[fetch-images] <${bookId}> 失败清单已写入: books/${bookId}/assets/images/_failed.txt（下次运行自动重试）`);
      for (const line of s.failedLines.slice(0, 10)) console.log(`[fetch-images]   - ${line}`);
      if (s.failedLines.length > 10) console.log(`[fetch-images]   - ……其余 ${s.failedLines.length - 10} 条见清单文件`);
    }
    if (s.failUrls / Math.max(s.urls.length, 1) > 0.3) {
      console.log(`[fetch-images] <${bookId}> 警告：失败率超过 30%，可能是图床防爬升级，请人工确认网络/代理后重试`);
      process.exitCode = 2;
    }
    totalUrls += s.urls.length;
    totalOkUrls += s.okUrls;
    totalFailUrls += s.failUrls;
    totalOkRefs += s.okRefs;
    totalFailRefs += s.failRefs;
  }

  const totalRate = totalUrls ? ((totalFailUrls / totalUrls) * 100).toFixed(1) : '0.0';
  console.log('═'.repeat(60));
  console.log(`[fetch-images] 书架汇总：${books.length} 本｜URL 总数 ${totalUrls}｜成功 ${totalOkUrls}｜失败 ${totalFailUrls}（失败率 ${totalRate}%）｜引用替换 ${totalOkRefs} 处｜失败占位 ${totalFailRefs} 处`);
  if (anyFailed) console.log(`[fetch-images] 存在失败项：对应清单见各书 assets/images/_failed.txt，下次运行自动重试`);
}

export const __internals = { parseArgs, discoverBooks, bookPaths, scanRefs, rewrite, fallbackBlock };

import { pathToFileURL } from 'node:url';
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((err) => { console.error(`[fetch-images] 失败: ${err?.stack ?? err}`); process.exitCode = 1; });
