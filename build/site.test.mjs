import { test } from "node:test";
import assert from "node:assert/strict";

import { buildSite, flattenPages, renderIndexPage, renderPager, renderRedirectPage, renderSearchPage, renderShelfPage, renderShell, renderSidebar, rewriteMarkdownLinks, runSite } from "./site.mjs";
import { book } from "./books/agentscope-java.mjs";

// 与 buildSite 内的推导一致:rewriteMarkdownLinks 的第二参数是「demo/ 目录的上级」blob 前缀
const demoBase = book.demoGithubBase.replace(/demo\/$/, "");

test("同目录章链接重写为 .html", () => {
  const out = rewriteMarkdownLinks('<a href="30-managed-agents.md">第 30 章</a>', demoBase);
  assert.equal(out, '<a href="30-managed-agents.html">第 30 章</a>');
});

test("重写保留锚点", () => {
  const out = rewriteMarkdownLinks('<a href="03-concept-map.md#core-ideas">x</a>', demoBase);
  assert.equal(out, '<a href="03-concept-map.html#core-ideas">x</a>');
});

test("../demo/ 链接降级为 GitHub 源文件地址(基址随书配置)", () => {
  const out = rewriteMarkdownLinks('<a href="../demo/cross-border-commerce/steps/step-12-sandbox.md">步骤</a>', demoBase);
  assert.equal(out, '<a href="https://github.com/ybak/ai-tutorial/blob/main/books/agentscope-java/demo/cross-border-commerce/steps/step-12-sandbox.md">步骤</a>');
});

test("其他 ../ 链接与外链、非 .md href 原样保留", () => {
  const src = '<a href="../assets/images/a.png">图</a><a href="https://example.com/x.md">外</a><a href="index.html">内</a>';
  assert.equal(rewriteMarkdownLinks(src, demoBase), src);
});

test("flattenPages 全书序列:54 项、首尾与篇导读位置正确", () => {
  const pages = flattenPages(book.PARTS);
  assert.equal(pages.length, 54); // 47 章文件(含序言/附录) + 7 个篇导读
  assert.equal(pages[0].href, "chapters/preface.html");
  assert.equal(pages[0].kind, "part-intro"); // 序言即 part-0 导读
  assert.equal(pages[1].href, "chapters/part-1-intro.html");
  assert.equal(pages[2].href, "chapters/01-overview.html");
  assert.equal(pages[2].kind, "chapter");
  assert.equal(pages.at(-1).href, "chapters/appendix-b-glossary.html");
  assert.ok(pages.at(-1).title.includes("附录 B")); // 冒号形态以 PARTS 为准,不硬写
  // 每篇导读都在其章之前
  for (let i = 1; i < pages.length; i++) {
    if (pages[i].kind === "part-intro" && pages[i - 1].kind === "chapter") {
      assert.notEqual(pages[i].part, pages[i - 1].part);
    }
  }
});

const twoParts = [
  { id: "p0", title: "序言", intro: "preface.md", chapters: [
    { file: "preface.md", chapter: null, title: "序言", sources: [] },
  ]},
  { id: "p1", title: "第一篇", intro: "part-1-intro.md", chapters: [
    { file: "part-1-intro.md", chapter: null, title: "第一篇导读", sources: [] },
    { file: "01-a.md", chapter: 1, title: "章一", sources: [] },
  ]},
];

test("renderSidebar:当前章高亮、当前篇展开、附录(无 intro)为纯文本标题", () => {
  const parts = [...twoParts, { id: "appendix", title: "附录", intro: null, chapters: [
    { file: "appendix-a.md", chapter: null, title: "附录 A", sources: [] },
  ]}];
  const nav = renderSidebar(parts, "chapters/01-a.html");
  assert.ok(nav.includes('<a href="../chapters/01-a.html" class="active">'));
  assert.ok(nav.includes("<details open>")); // 当前篇展开
  assert.ok(nav.includes("附录"));            // 无 intro 的篇仍列出
  assert.ok(nav.includes('<summary>附录</summary>')); // 无 intro 的篇:纯文本 summary
  assert.ok(!nav.match(/<summary><a[^>]*>附录</));     // 且不被链接包裹
});

test("renderPager:首项无上一篇、次项双向", () => {
  const flat = flattenPages(twoParts);
  assert.ok(!renderPager(flat, 0).includes("← 上一篇"));
  const mid = renderPager(flat, 1);
  assert.ok(mid.includes("← 上一篇") && mid.includes("下一篇 →"));
  assert.ok(mid.includes('href="../chapters/preface.html"'));
});

test("renderShell:顶栏下有仓库 Star 引导,书内导航仍在", () => {
  const html = renderShell({ title: "t", content: "<p>x</p>", rootPrefix: "" });
  assert.ok(html.includes('class="site-starbar"'));
  assert.ok(html.includes('href="https://github.com/ybak/ai-tutorial"'));
  assert.ok(html.includes("源码仓库 · 有用请 Star"));
  assert.ok(html.includes('target="_blank"'));
  const shelf = renderShelfPage([
    { bookId: "a", status: "published", title: "A", tagline: "ta" },
  ]);
  assert.ok(shelf.includes("源码仓库 · 有用请 Star"));
  assert.ok(shelf.includes('href="a/index.html"')); // 进书链接保留
  const home = renderIndexPage(book, flattenPages(twoParts));
  assert.ok(home.includes("源码仓库 · 有用请 Star"));
  assert.ok(home.includes('href="chapters/01-a.html"')); // 篇内章节导航保留
});

test("renderShell:章节页带侧边栏与 mermaid 脚本,根页面不带 ../ 前缀", () => {
  const chapter = renderShell({ title: "章一", content: "<p>x</p>", rootPrefix: "../",
    sidebar: "<nav></nav>", needMermaid: true });
  assert.ok(chapter.includes('src="../build/assets/vendor/mermaid.min.js"'));
  assert.ok(chapter.includes('action="../search.html"'));
  const home = renderShell({ title: "首页", content: "<p>x</p>", rootPrefix: "" });
  assert.ok(home.includes('action="search.html"'));
  assert.ok(!home.includes("mermaid.min.js"));
});

test("renderSearchPage:排除自身索引并引 pagefind UI", () => {
  const page = renderSearchPage();
  assert.ok(page.includes("data-pagefind-ignore"));
  assert.ok(page.includes("pagefind-ui"));
  assert.ok(page.includes("new PagefindUI"));
});

test("renderIndexPage:封面随书配置,每篇一张卡片,搜索指向站点根", () => {
  const html = renderIndexPage(book, flattenPages(twoParts));
  assert.ok(html.includes("home-card"));
  assert.ok(html.includes('href="chapters/01-a.html"'));
  assert.ok(html.includes(`action="../search.html"`)); // 书首页在 <bookId>/ 下,搜索在站点根
});

test("auditPage:相对 .md 残留被抓,GitHub 降级链接不报", async (t) => {
  const { auditPage } = await import("./site.mjs");
  const warns = [];
  const html = '<a href="30-x.md#s">a</a><a href="https://github.com/ybak/ai-tutorial/blob/main/demo/x.md">b</a>';
  auditPage(html, "/tmp/nonexistent-site", "t.html", warns);
  assert.equal(warns.length, 1);
  assert.ok(warns[0].includes('30-x.md#')); // matchAll 的 m[0] 在 # 处截断
});

test("auditPage:缺失图片告警,存在图片不报", async (t) => {
  const { auditPage } = await import("./site.mjs");
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "site-audit-"));
  fs.mkdirSync(path.join(tmp, "assets", "images"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "assets", "images", "ok.png"), "x");
  const warns = [];
  auditPage('<img src="../assets/images/ok.png"><img src="../assets/images/missing.png">', tmp, "t.html", warns);
  assert.equal(warns.length, 1);
  assert.ok(warns[0].includes("missing.png"));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("renderShell 支持显式 searchHref(书子站章节页指向站点根搜索)", () => {
  const html = renderShell({ title: 't', content: 'c', rootPrefix: '../', searchHref: '../../search.html' });
  assert.ok(html.includes('action="../../search.html"'));
});

test("rewriteMarkdownLinks 使用注入的 githubBase", () => {
  const out = rewriteMarkdownLinks('<a href="../demo/a.md">x</a>', 'https://github.com/o/r/blob/main/');
  assert.ok(out.includes('https://github.com/o/r/blob/main/demo/a.md'));
});

test("章节页 body 携带按书 filter 属性", () => {
  // renderShell 增加可选 pagefindFilter 参数
  const html = renderShell({ title: 't', content: 'c', rootPrefix: '../',
    searchHref: '../../search.html', pagefindFilter: '书: AgentScope Java 2.0:从入门到进阶' });
  assert.ok(html.includes('<body data-pagefind-filter="书: AgentScope Java 2.0:从入门到进阶">'));
});

test("filter 属性缺省时不输出,书架页/搜索页不带 filter", () => {
  const plain = renderShell({ title: 't', content: 'c', rootPrefix: '' });
  assert.ok(plain.includes("<body>"));
  assert.ok(!plain.includes("data-pagefind-filter"));
  assert.ok(!renderShelfPage([{ bookId: 'a', status: 'published', title: 'A' }]).includes("data-pagefind-filter"));
  assert.ok(!renderSearchPage().includes("data-pagefind-filter"));
  // 书首页:封面正文随书,整页归属该书 filter
  const home = renderIndexPage(book, flattenPages(twoParts));
  assert.ok(home.includes(`<body data-pagefind-filter="书: ${book.title}">`));
});

test("renderShelfPage:published 卡片有链接,planned 卡片无 <a>", () => {
  const html = renderShelfPage([
    { bookId: 'a', status: 'published', title: 'A', tagline: 'ta' },
    { bookId: 'p', status: 'planned', title: 'P', tagline: 'tp' },
  ]);
  assert.ok(html.includes('href="a/index.html"'));
  assert.ok(!/href="p/.test(html));
  assert.ok(html.includes('规划中'));
});

test("redirect stub:meta-refresh + pagefind ignore + 无站点 CSS", () => {
  const html = renderRedirectPage('agentscope-java/chapters/01-overview.html');
  assert.ok(html.includes('<meta http-equiv="refresh" content="0; url=agentscope-java/chapters/01-overview.html">'));
  assert.ok(html.includes('data-pagefind-ignore'));
  assert.ok(!html.includes('site-header')); // 不引站点外壳
  assert.ok(!html.includes('site-starbar')); // 重定向 stub 不带 Star 引导
});

test("runSite 产出旧路径 stub 且清场重建无残留", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  // runSite 需要每本 published 书的源目录存在;章节文件缺失仅 warn,不影响 stub
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "site-run-"));
  for (const id of ["agentscope-java", "mcp", "ragflow", "copilotkit"]) {
    fs.mkdirSync(path.join(tmp, "books", id, "chapters"), { recursive: true });
    fs.mkdirSync(path.join(tmp, "books", id, "assets"), { recursive: true });
  }
  const stubPath = path.join(tmp, "output", "site", "chapters", "01-overview.html");

  runSite(tmp);
  assert.ok(fs.existsSync(stubPath));
  const stub = fs.readFileSync(stubPath, "utf8");
  assert.ok(stub.includes("agentscope-java/chapters/01-overview.html")); // 内容含新路径
  assert.ok(stub.includes("http-equiv=\"refresh\""));

  // 清场重建:上次构建的残留(stub 路径上的脏内容)被整目录清掉后重新生成
  fs.writeFileSync(stubPath, "STALE-RESIDUE");
  runSite(tmp);
  const rebuilt = fs.readFileSync(stubPath, "utf8");
  assert.ok(!rebuilt.includes("STALE-RESIDUE"));
  assert.ok(rebuilt.includes('url=agentscope-java/chapters/01-overview.html'));
  fs.rmSync(tmp, { recursive: true, force: true });
});

// ---------- 反目标回归:渲染层零硬编码本书文案(BOOK 元数据收敛) ----------
// style.css 首行注释含书名,会经 <style> 内联进每页,故按 header/title/封面分区断言。
const region = (html, re) => html.match(re)?.[0] ?? "";

const fakeBook = {
  bookId: "fake-book", status: "published",
  title: "测试书", subtitle: "测试副题", date: "2026-01-01",
  sourceNote: "测试书来源说明",
  chaptersDir: "books/fake-book/chapters", assetsDir: "books/fake-book/assets",
  pdfFileName: "fake.pdf",
  demoGithubBase: "https://github.com/o/r/blob/main/books/fake-book/demo/",
  PARTS: [{ id: "p1", title: "第一篇", intro: null, chapters: [
    { file: "01-only.md", chapter: 1, title: "唯一章", sources: [] },
  ]}],
};

test("buildSite 假书全链路:header/title/封面零 agentscope 字样", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "site-fake-book-"));
  fs.mkdirSync(path.join(tmp, "books", "fake-book", "chapters"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "books", "fake-book", "assets"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "books", "fake-book", "chapters", "01-only.md"),
    "---\ntitle: 唯一章\n---\n\n正文。\n");
  const siteDir = buildSite(fakeBook, tmp);
  const home = fs.readFileSync(path.join(siteDir, "index.html"), "utf8");
  const chapter = fs.readFileSync(path.join(siteDir, "chapters", "01-only.html"), "utf8");
  for (const [page, html] of [["书首页", home], ["章节页", chapter]]) {
    const header = region(html, /<header class="site-header">[\s\S]*?<\/header>/);
    const title = region(html, /<title>[^<]*<\/title>/);
    const cover = region(html, /<section class="cover">[\s\S]*?<\/section>/);
    for (const [part, text] of [["header", header], ["title", title], ["封面", cover]]) {
      assert.ok(!/agentscope/i.test(text), `${page} 的 ${part} 不应含 agentscope 字样`);
    }
    assert.ok(header.includes(">测试书</a>"), `${page} header 站名应为当前书名`);
  }
  // <title>:书首页即书名(无尾缀),章节页「章名 · 书名」
  assert.ok(home.includes("<title>测试书</title>"));
  assert.ok(chapter.includes("<title>唯一章 · 测试书</title>"));
  // 封面整合说明随书 sourceNote,搜索框回指站点根,filter 按书
  assert.ok(region(home, /<section class="cover">[\s\S]*?<\/section>/).includes("测试书来源说明"));
  assert.ok(chapter.includes('action="../../search.html"'));
  assert.ok(chapter.includes('<body data-pagefind-filter="书: 测试书">'));
  assert.ok(chapter.includes("源码仓库 · 有用请 Star"));
  assert.ok(home.includes('href="https://github.com/ybak/ai-tutorial"'));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("renderCover/renderColophon 随 book 配置:假书零 agentscope,真书文案不变", async () => {
  const { renderCover, renderColophon } = await import("./build.mjs");
  const fake = {
    title: "测试书", subtitle: "测试副题", date: "2026-01-01",
    sourceNote: "测试书来源说明",
    sourceDescription: "某开源项目的中文文档（docs 目录）",
    licenseNote: "原项目以 MIT 许可证发布；本书遵循同一许可证分发。",
    trademarkNote: "相关商标归其权利人所有。",
  };
  const cover = renderCover(fake);
  const colophon = renderColophon(fake);
  assert.ok(cover.includes('<h1 class="cover-title">测试书</h1>'));
  assert.ok(cover.includes('<p class="cover-note">测试书来源说明</p>'));
  assert.ok(colophon.includes("本书《测试书》整理自 某开源项目的中文文档（docs 目录），整合日期 2026-01-01。"));
  assert.ok(colophon.includes("原项目以 MIT 许可证发布；本书遵循同一许可证分发。"));
  for (const [name, html] of [["封面", cover], ["出版说明", colophon]]) {
    assert.ok(!/agentscope/i.test(html), `${name} 不应含 agentscope 字样`);
  }
  // agentscope-java 单书行为兼容:封面/出版说明沿用既有文案
  assert.ok(renderCover(book).includes("基于 AgentScope Java v2 官方文档整合"));
  assert.ok(renderColophon(book).includes("整理自 AgentScope 官方仓库 agentscope-java"));
  assert.ok(renderColophon(book).includes("Apache License 2.0"));
});
