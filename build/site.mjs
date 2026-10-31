/**
 * site.mjs — --site 模式的静态站点构建器(多书版)。
 * 纯函数(链接重写/页面序列)可单测;buildSite(book) 负责单本书子站总装,
 * runSite() 总装全部书子站 + 站点根的书架首页与搜索页。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ALL_BOOKS, BUILDABLE_BOOKS } from './books/registry.mjs';
import { resolveBookPaths } from './books/paths.mjs';
import { escapeHtml, md, renderMermaidScripts, splitFrontMatter, syncVendorAssets } from './lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = __dirname;

/** 在线阅读 → 仓库 Star 的固定出口。文案保持一句，避免盖过书内导航。 */
const REPO_URL = 'https://github.com/ybak/ai-tutorial';
const REPO_CTA = '源码仓库 · 有用请 Star';

function renderRepoCta() {
  return `<a class="site-starbar" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${escapeHtml(REPO_CTA)}</a>`;
}

/**
 * 站点链接重写:相对 .md 链接 → .html(保留锚点);
 * ../demo/…md → GitHub blob 地址(githubBase 为「demo/ 目录上级」的 blob 前缀);
 * 绝对 URL/协议相对链接与其余 ../ 路径原样。
 */
export function rewriteMarkdownLinks(html, githubBase) {
  return html.replace(/href="([^"]+\.md)(#[^"]*)?"/g, (full, target, hash = '') => {
    if (target.startsWith('../demo/')) {
      return `href="${githubBase}${target.replace(/^\.\.\//, '')}${hash}"`;
    }
    if (target.startsWith('../')) return full;
    if (/^[a-z][a-z0-9+.-]*:/.test(target) || target.startsWith('//')) return full; // 外链
    return `href="${target.replace(/\.md$/, '.html')}${hash}"`;
  });
}

const toPageHref = (mdFile) => `chapters/${mdFile.replace(/\.md$/, '.html')}`;

// ---------- 渲染层 ----------

const readBuildAsset = (...seg) => fs.readFileSync(path.join(BUILD_DIR, ...seg), 'utf8');

/**
 * 整页外壳。rootPrefix:站点根相对前缀(章节页 '../',根页面 '');
 * bookTitle:当前书标题(书内页面传 book.title,header 站名与 <title> 尾缀随书;
 * 缺省为站点级页面——书架页/搜索页——站名固定「AI 教程书架」、title 不带书名尾缀);
 * needMermaid:引 mermaid 页尾脚本(章节页);searchUi:引 pagefind UI(仅搜索页);
 * searchHref:搜索框 action 显式覆盖(多书后搜索页固定在站点根,书子站页面
 * 需按自身层级回指,缺省回退旧语义 `${rootPrefix}search.html`);
 * pagefindFilter:非空时 <body> 输出 data-pagefind-filter 属性,整页归入该 filter
 * 值(供全局搜索按书过滤;书架页/搜索页不传)。
 * 顶栏下方固定一条仓库 Star 引导(书架、书首页、章节页、搜索页共用)。
 */
export function renderShell({ title, bookTitle = null, content, rootPrefix, sidebar = null, needMermaid = false, searchUi = false, searchHref = null, pagefindFilter = null }) {
  const style = readBuildAsset('assets', 'style.css');
  const siteStyle = readBuildAsset('assets', 'site.css');
  const hljsTheme = readBuildAsset('node_modules', 'highlight.js', 'styles', 'github.css');
  const vendor = `${rootPrefix}build/assets/vendor/`;
  const tail = [
    needMermaid ? renderMermaidScripts(vendor) : '',
    // pagefind UI 由 pagefind CLI 建索引时产出在站点 pagefind/ 目录(含全局 PagefindUI)
    searchUi ? `<link rel="stylesheet" href="${rootPrefix}pagefind/pagefind-ui.css">
<script src="${rootPrefix}pagefind/pagefind-ui.js"></script>
<script>
window.addEventListener('DOMContentLoaded', () => {
  new PagefindUI({ element: '#search', showImages: false });
  const q = new URLSearchParams(location.search).get('q');
  if (q) {
    const input = document.querySelector('#search input');
    input.value = q;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
});
</script>` : '',
  ].join('\n');
  // 站名与 title 尾缀随当前书;站点级页面(bookTitle 缺省)用固定站名、不拼尾缀
  const siteName = bookTitle ?? 'AI 教程书架';
  const titleSuffix = bookTitle != null && title !== bookTitle ? ` · ${escapeHtml(bookTitle)}` : '';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}${titleSuffix}</title>
<style>
${style}
</style>
<style>
${hljsTheme}
</style>
<style>
${siteStyle}
</style>
</head>
<body${pagefindFilter ? ` data-pagefind-filter="${escapeHtml(pagefindFilter)}"` : ''}>
<header class="site-header">
<button class="nav-toggle" aria-label="打开目录">☰</button>
<a class="site-title" href="${rootPrefix}index.html">${escapeHtml(siteName)}</a>
<form class="site-search" action="${searchHref ?? `${rootPrefix}search.html`}"><input type="search" name="q" placeholder="搜索全书…"></form>
</header>
${renderRepoCta()}
<div class="site-body">
${sidebar ? `<aside class="site-aside">${sidebar}</aside>` : ''}
<main class="site-main">
${content}
</main>
</div>
${tail}
<script>
document.querySelector('.site-header .nav-toggle')?.addEventListener('click',
  () => document.querySelector('.site-aside')?.classList.toggle('open'));
</script>
</body>
</html>
`;
}

/** 左侧两级目录:篇 = <details>(当前篇 open,标题链到篇导读页;无 intro 的篇为纯文本),章 = <a>(当前章高亮) */
export function renderSidebar(parts, currentHref) {
  const items = parts.map((part) => {
    const introHref = part.intro ? toPageHref(part.intro) : null;
    const partActive = introHref != null && introHref === currentHref;
    const isOpen = partActive || part.chapters.some((c) => toPageHref(c.file) === currentHref);
    const links = part.chapters.map((c) => {
      const href = toPageHref(c.file);
      const active = href === currentHref ? ' class="active"' : '';
      const label = c.chapter != null ? `${c.chapter}. ${c.title}` : c.title;
      return `<a href="../${href}"${active}>${escapeHtml(label)}</a>`;
    }).join('');
    const summary = introHref
      ? `<a href="../${introHref}"${partActive ? ' class="active"' : ''}>${escapeHtml(part.title)}</a>`
      : escapeHtml(part.title);
    return `<details${isOpen ? ' open' : ''}><summary>${summary}</summary>${links}</details>`;
  }).join('');
  return `<nav class="site-nav">${items}</nav>`;
}

/** 上一篇/下一篇;链接带 ../ 前缀(仅章节页使用) */
export function renderPager(flat, idx) {
  const link = (p, label) => `<a class="pager-link" href="../${p.href}"><span class="pager-label">${label}</span><span class="pager-title">${escapeHtml(p.title)}</span></a>`;
  const prev = idx > 0 ? link(flat[idx - 1], '← 上一篇') : '<span></span>';
  const next = idx < flat.length - 1 ? link(flat[idx + 1], '下一篇 →') : '<span></span>';
  return `<nav class="pager">${prev}${next}</nav>`;
}

/** 书首页:封面信息(随书配置)+ 篇卡片(篇标题 → 首个页面,其下页面链接)。rootPrefix 为 '' */
export function renderIndexPage(book, pages) {
  const byPart = new Map();
  for (const p of pages) {
    if (!byPart.has(p.part)) byPart.set(p.part, []);
    byPart.get(p.part).push(p);
  }
  const cards = [...byPart].map(([partTitle, items]) => `<section class="home-card">
<h3><a href="${items[0].href}">${escapeHtml(partTitle)}</a></h3>
${items.map((p) => `<a href="${p.href}">${escapeHtml(p.title)}</a>`).join('\n')}
</section>`).join('\n');
  const content = `<section class="cover">
<h1 class="cover-title">${escapeHtml(book.title)}</h1>
<p class="cover-subtitle">${escapeHtml(book.subtitle)}</p>
<hr class="cover-rule">
<p class="cover-note">${escapeHtml(book.sourceNote)} · 在线阅读版</p>
<p class="cover-date">${escapeHtml(book.date)}</p>
</section>
<div class="home-cards">
${cards}
</div>`;
  return renderShell({ title: book.title, bookTitle: book.title, content, rootPrefix: '', searchHref: '../search.html', pagefindFilter: `书: ${book.title}` });
}

/** 搜索页:pagefind UI 挂载点;data-pagefind-ignore 防止自身入索引。固定位于站点根。
 * PagefindUI 1.5 自动发现索引中的 filter 并渲染多选面板(无需构造参数),
 * 章节页/书首页 body 的 data-pagefind-filter 即其数据来源。 */
export function renderSearchPage() {
  return renderShell({
    title: '搜索',
    content: '<h1>搜索</h1>\n<div id="search"></div>',
    rootPrefix: '',
    searchHref: 'search.html',
    searchUi: true,
  }).replace('<body>', '<body data-pagefind-ignore>');
}

/**
 * 书架首页(站点根 index.html):每书一张卡片。
 * 卡片顺序 published 优先(规格 §7 首页软着陆:书架首屏即 agentscope 大卡片);
 * published → 链到 <bookId>/index.html,planned → 无子站,纯文本卡片 + 「规划中」徽标。
 */
export function renderShelfPage(books) {
  const ordered = [
    ...books.filter((b) => b.status === 'published'),
    ...books.filter((b) => b.status !== 'published'),
  ];
  const cards = ordered.map((b) => {
    const body = `<h3 class="shelf-title">${escapeHtml(b.title)}</h3>
<p class="shelf-tagline">${escapeHtml(b.tagline ?? '')}</p>`;
    return b.status === 'published'
      ? `<section class="home-card shelf-card">
<a class="shelf-link" href="${b.bookId}/index.html">${body}<span class="shelf-cta">进入阅读 →</span></a>
</section>`
      : `<section class="home-card shelf-card planned">
${body}<span class="shelf-badge">规划中</span>
</section>`;
  }).join('\n');
  const content = `<section class="cover">
<h1 class="cover-title">AI 教程书架</h1>
<p class="cover-subtitle">多本“从入门到进阶”完整教程,按需取阅</p>
<hr class="cover-rule">
</section>
<div class="home-cards">
${cards}
</div>`;
  return renderShell({ title: 'AI 教程书架', content, rootPrefix: '', searchHref: 'search.html' });
}

/**
 * 全站页面扁平序列(上一篇/下一篇依据):序言 → 各篇(篇导读 → 各章)→ 附录。
 * part-0 的 intro 即序言章,只在章位置登记一次(kind 仍为 part-intro)。
 */
export function flattenPages(parts) {
  const pages = [];
  for (const part of parts) {
    if (part.intro && !part.chapters.some((c) => c.file === part.intro)) {
      pages.push({ href: toPageHref(part.intro), title: part.title, part: part.title, kind: 'part-intro' });
    }
    for (const ch of part.chapters) {
      const kind = part.intro && ch.file === part.intro ? 'part-intro'
        : ch.chapter != null ? 'chapter' : 'extra';
      pages.push({ href: toPageHref(ch.file), title: ch.title, part: part.title, kind });
    }
  }
  return pages;
}

/**
 * 旧路径重定向 stub 页:极简 meta-refresh,不引站点 CSS/外壳,
 * data-pagefind-ignore 防止入搜索索引,canonical 与正文链接同指新地址。
 */
export function renderRedirectPage(toHref) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${toHref}">
<link rel="canonical" href="${toHref}">
<title>页面已迁移</title>
</head>
<body data-pagefind-ignore>本书已迁移至 <a href="${toHref}">新地址</a></body>
</html>
`;
}

// ---------- 总装 ----------

/**
 * 章节页渲染:正文(含链接重写,demo 链接按书配置降级 GitHub) + 侧边栏 + 翻页 + mermaid。
 * body 由调用方按 flattenPages 顺序对齐(flat[idx] 与 currentHref 同页);
 * githubBase 为该书 demo/ 目录上级的 GitHub blob 前缀;
 * 整页以 `书: <book.title>` 作为 pagefind filter,供全局搜索按书过滤。
 */
function renderChapterPage(body, currentHref, flat, idx, githubBase, book) {
  return renderShell({
    title: flat[idx].title,
    bookTitle: book.title,
    content: rewriteMarkdownLinks(md.render(body), githubBase) + renderPager(flat, idx),
    rootPrefix: '../',
    sidebar: renderSidebar(book.PARTS, currentHref),
    needMermaid: true,
    searchHref: '../../search.html',
    pagefindFilter: `书: ${book.title}`,
  });
}

/** 构建期校验:残留的相对 .md 链接(已降级的 GitHub 链接不算)与缺失图片 → [site][warn](不中断) */
export function auditPage(html, siteDir, label, warns) {
  for (const m of html.matchAll(/href="(?!https?:)[^"]*\.md[#"]/g)) {
    warns.push(`[site][warn] ${label}: 残留 .md 链接 ${m[0]}`);
  }
  for (const m of html.matchAll(/src="(\.\.\/assets\/[^"]+)"/g)) {
    if (!fs.existsSync(path.resolve(siteDir, 'chapters', m[1]))) {
      warns.push(`[site][warn] ${label}: 缺失图片 ${m[1]}`);
    }
  }
}

/**
 * 构建单本书子站 output/site/<bookId>/:镜像书源目录(chapters/ + assets/ + build/assets/vendor/),
 * 章节 ../assets/images/ 引用零改动可解析;demo 链接按 book.demoGithubBase 降级。
 * 路径全部经 resolveBookPaths 推导。返回书子站目录绝对路径。
 * 搜索索引不在此步产出,由 `npm run site` 的 pagefind 段完成;书内搜索框统一回指站点根 search.html。
 */
export function buildSite(book, rootDir) {
  const { chaptersAbs, assetsAbs, siteDir } = resolveBookPaths(book, rootDir);
  const warns = [];
  fs.mkdirSync(path.join(siteDir, 'chapters'), { recursive: true });

  // 资源:书 assets 原样 + vendor(mermaid 经 syncVendorAssets;pagefind UI 由 CLI 索引产物提供)
  fs.cpSync(assetsAbs, path.join(siteDir, 'assets'), { recursive: true });
  syncVendorAssets();
  fs.mkdirSync(path.join(siteDir, 'build', 'assets', 'vendor'), { recursive: true });
  fs.copyFileSync(path.join(BUILD_DIR, 'assets', 'vendor', 'mermaid.min.js'),
    path.join(siteDir, 'build', 'assets', 'vendor', 'mermaid.min.js'));

  // demo 降级基址:demoGithubBase 指向 demo/ 目录本身,重写规则需其上级前缀(拼回目标里的 demo/)
  const githubBase = book.demoGithubBase.replace(/demo\/$/, '');

  // 章节/篇导读页(顺序即 flattenPages;书配置中缺文件 → warn 跳过)
  const flat = flattenPages(book.PARTS);
  const bodies = new Map();
  for (const part of book.PARTS) {
    const files = [part.intro, ...part.chapters.map((c) => c.file)].filter(Boolean);
    for (const file of files) {
      const abs = path.join(chaptersAbs, file);
      if (!fs.existsSync(abs)) {
        warns.push(`[site][warn] 章节文件缺失,跳过: chapters/${file}`);
        continue;
      }
      bodies.set(toPageHref(file), splitFrontMatter(fs.readFileSync(abs, 'utf8')).body);
    }
  }
  let rendered = 0;
  for (let i = 0; i < flat.length; i++) {
    const body = bodies.get(flat[i].href);
    if (body == null) continue; // 缺文件已 warn
    const html = renderChapterPage(body, flat[i].href, flat, i, githubBase, book);
    auditPage(html, siteDir, flat[i].href, warns);
    fs.writeFileSync(path.join(siteDir, flat[i].href), html, 'utf8');
    rendered++;
  }

  // 书首页(搜索页只在站点根,由 runSite 产出)
  fs.writeFileSync(path.join(siteDir, 'index.html'), renderIndexPage(book, flat), 'utf8');

  for (const w of warns) console.log(w);
  console.log(`[site] ${book.bookId}: 已渲染 ${rendered}/${flat.length} 页 → ${siteDir}`);
  return siteDir;
}

/**
 * 旧路径重定向 stub(控制器裁定 Ruling-3):仅 legacyRootChapters === true 的书
 * 拥有站点根 chapters/ 旧路径,不遍历所有 published 书(为多本同名章节书保留语义)。
 * flattenPages 的 href 已是 chapters/<file>.html 形态,镜像写到站点根,目标 <bookId>/<href>。
 * 须在 runSite 清场之后调用:整目录删除先清掉全部旧产物(含上次 stub),天然幂等无残留。
 */
function writeLegacyRedirectStubs(siteRoot) {
  for (const b of BUILDABLE_BOOKS) {
    if (b.legacyRootChapters !== true) continue;
    fs.mkdirSync(path.join(siteRoot, 'chapters'), { recursive: true });
    for (const p of flattenPages(b.PARTS)) {
      fs.writeFileSync(path.join(siteRoot, p.href), renderRedirectPage(`${b.bookId}/${p.href}`), 'utf8');
    }
  }
}

/**
 * 总装全部站点:清空 output/site → 逐本可构建书产出子站 →
 * 站点根放书架首页(全部书目,含 planned)与搜索页 → 旧路径重定向 stub。
 * 返回站点根目录绝对路径。
 */
export function runSite(rootDir) {
  const siteRoot = path.join(rootDir, 'output', 'site');
  fs.rmSync(siteRoot, { recursive: true, force: true });
  for (const b of BUILDABLE_BOOKS) buildSite(b, rootDir);
  fs.writeFileSync(path.join(siteRoot, 'index.html'), renderShelfPage(ALL_BOOKS), 'utf8');
  fs.writeFileSync(path.join(siteRoot, 'search.html'), renderSearchPage(), 'utf8');
  writeLegacyRedirectStubs(siteRoot);
  return siteRoot;
}
