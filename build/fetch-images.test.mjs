import { test } from "node:test";
import assert from "node:assert/strict";
import { __internals } from "./fetch-images.mjs";

const { parseArgs, discoverBooks, bookPaths, scanRefs, rewrite } = __internals;

test("discoverBooks:发现书架全部含 chapters/ 的书,升序", () => {
  const books = discoverBooks();
  assert.ok(books.includes("agentscope-java"));
  assert.ok(books.includes("ragflow"));
  assert.deepEqual(books, [...books].sort());
  for (const id of books) assert.ok(!id.startsWith("."), "不应包含隐藏目录");
});

test("parseArgs:无参为 null,--book 取值,缺值/未知参数报错", () => {
  const run = (argv) => parseArgs(argv);
  assert.equal(run([]), null);
  assert.equal(run(["--book", "ragflow"]), "ragflow");
  assert.throws(() => run(["--book"]));
  assert.throws(() => run(["--bokk", "x"]));
});

test("bookPaths:三路径都落在书目录内", () => {
  const p = bookPaths("ragflow");
  assert.ok(p.chaptersDir.replace(/\\/g, "/").endsWith("books/ragflow/chapters"));
  assert.ok(p.imagesDir.replace(/\\/g, "/").endsWith("books/ragflow/assets/images"));
  assert.ok(p.failedList.replace(/\\/g, "/").endsWith("books/ragflow/assets/images/_failed.txt"));
});

test("scanRefs:md 图、img 标签、失败占位三类引用都被识别且按位置排序", () => {
  const text = [
    "前文",
    "<!-- fetch-images-failed: {\"url\":\"https://a/x.png\",\"alt\":\"甲\"} -->",
    "> **图**(甲):图片未能本地化,请参考在线版文档",
    "![乙](https://b/y.png)",
    "<img src=\"https://c/z.png\" alt=\"丙\">",
  ].join("\n");
  const refs = scanRefs(text);
  assert.deepEqual(refs.map((r) => r.kind), ["retry", "md", "html"]);
  assert.equal(refs[0].url, "https://a/x.png");
  assert.equal(refs[1].alt, "乙");
  assert.equal(refs[2].alt, "丙");
});

test("rewrite:成功替换为本地路径,失败落占位块,重试成功还原", () => {
  const original = [
    "<!-- fetch-images-failed: {\"url\":\"https://a/x.png\",\"alt\":\"甲\"} -->",
    "> **图**(甲):图片未能本地化,请参考在线版文档",
    "![乙](https://b/y.png)",
    "<img src=\"https://c/z.png\" alt=\"丙\">",
  ].join("\n");
  const results = new Map([
    ["https://a/x.png", { ok: true, file: "def456.png" }], // 上次失败,本次重试成功 → 还原
    ["https://b/y.png", { ok: true, file: "abc123.png" }], // 下载成功 → 本地路径
    ["https://c/z.png", { ok: false, error: "HTTP 403" }], // 仍失败 → 占位块
  ]);
  const out = rewrite(scanRefs(original), results, original);
  assert.ok(out.includes("![甲](../assets/images/def456.png)"), "重试成功应还原为本地图片");
  assert.ok(!out.includes('"url":"https://a/x.png"'), "还原后旧占位注释应消失");
  assert.ok(out.includes("![乙](../assets/images/abc123.png)"));
  assert.ok(out.includes('{"url":"https://c/z.png"'), "仍失败应留下次重试注释");
  assert.ok(out.includes("图片未能本地化"));
});
