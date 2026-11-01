# fastgpt 书立项成稿 + 图片逻辑入通用规范 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把教程图片逻辑写进通用规范并通用化 `fetch-images.mjs`;按 ragflow 同款流程新建《FastGPT:从入门到进阶》(4 篇 13 章),成稿后升 `published` 进站点。

**Architecture:** 三个 commit 对应三步——① 规范修订 + 脚本通用化(带测试);② fastgpt 立项(README + 书配置 + registry PLANNED 条目 + 根 README 行);③ 13 章成稿(子代理并行,≤3 并发)+ 全书统检 + 升 published 全链路预演。规格见 `docs/superpowers/specs/2026-11-01-fastgpt-book-and-image-guide-design.md`。

**Tech Stack:** Node.js ESM(`node:test` 单测)、markdown-it/mermaid 构建链(`build/`)、Markdown + mermaid 书稿、bash(curl 拉素材)。

## Global Constraints

- **子代理并发 ≤3**(本账户 12 并发曾致 5 代理 429 夭折;第 4-16 章任务按 3+3+3+3+1 分五批派发)
- 书稿正文**中文全角标点**(,。;:「」""——);代码/命令/标识符/文件名/HTTP 头保持半角
- 章节骨架严格按 `docs/book-writing-guide.md` §2;章首图二选一:操作章用操作流程图(`flowchart LR`,6-8 节点,节点标小节号),概念/总览章用导览图
- 版本基线:**FastGPT v4.17.3**(2026-11-01 核实);外部事实以官方文档为准,素材源 `labring/FastGPT` 仓库 `document/content/` 目录
- 每章 frontmatter 三字段:`chapter` / `title` / `source`(官方文档路径,相对 `document/content/`)
- 素材缓存目录 `output/_sources/fastgpt/`(output/ 已 gitignore,不入库)
- 贯穿案例对象名全书一致,禁止各章自造(见下方「章节写作简报」)
- 紧凑章目标行数:250-450 行/章(与 ragflow 初稿同款;≥500 增厚为已知欠账,README 挂账)
- commit 末尾:`Co-Authored-By: Claude Code <noreply@anthropic.com>`
- 所有构建/测试命令在 `build/` 目录下执行

---

## 章节写作简报(第 1-13 章任务共同引用,执行者必读)

每章由子代理撰写,写前先读三份材料:
1. `docs/book-writing-guide.md`(规范全文)
2. 样张:`books/ragflow/chapters/03-dataset-basics.md`(操作章)与 `books/ragflow/chapters/01-overview.md`(总览章)
3. 本计划下方对应章任务的「素材源/提纲/贯穿案例要求」

写作硬性要求(逐章自检):
- 骨架顺序:章标题 → `> 本章导读:`(150-250 字,收在「读完本章,你能……」)→ 章首 mermaid 图 + 图注(`*本章操作流程图*` 或 `*本章导览图*`)→ `## 你什么时候需要它` → `## N.1 概述`(或首节)→ 主体 H2 节(每节 H3 展开,问题 → 方案 → 代码/操作 → 边界与坑)→ `## 本章小结` → `## 验收清单`(☐ 5-7 条可自测动作句)→ `## 延伸阅读`(3-5 条,各附一句为什么相关)
- 操作流程图:横向 `flowchart LR`,起点即动作、终点为可验证状态,决策分支用菱形节点,节点标注对应小节号(如 `3.2 · 3.5`),全图 6-8 个节点、节点文字 2-3 行每行短
- 代码示例:关键概念必有可运行代码/配置片段;接口清单、方案对比、参数说明一律表格化
- 大段枚举文字(≥4 并列要点/≥5 步骤/≥3 状态)优先改画 mermaid
- 术语首次出现给中英对照;跨章引用格式「(见第 N 章)」「(→ xxx 书)」
- 章末「复核清单」(H3,挂在验收清单后):未实测项逐条挂账(仿 ragflow 章)
- 章内不出现未定义的贯穿案例对象名(只能用下方清单中的名字)

### 贯穿案例:跨境电商售后域「售后客服」

| 对象 | 值 |
|------|----|
| 知识库 | `after-sales-kb` |
| 三类文档 | 《售后政策手册》`after-sales-policy.pdf`(50 页含表格,季度级改版)/《商品 FAQ》`product-faq.xlsx`(约 200 行,列 Title/Content/Category/Year,每周更新)/《物流时效公告》`shipping-notice.html` + `shipping-notice.eml`(时效敏感) |
| 应用 | 「售后客服」——第 7 章工作流型为主线,第 6 章以简易配置版作入门对照 |
| 工具 | HTTP 工具节点对接中台「工单查询」接口 `GET /api/after-sale/tickets?phone={phone}`(→ mcp 书工具层) |
| 渠道 | 免登录分享链接 + 钉钉渠道 |
| 对外 | OpenAPI 对话接口;第 9 章发布为 MCP Server(→ mcp 书第 8 章) |
| 可观测 | SignOz/调用日志(→ langfuse 书) |

素材拉取通用命令(每章任务 1 执行,`$SOURCES` 为该章任务列出的文件清单):

```bash
cd "D:\work\code\book\ai-tutorial"
base="https://raw.githubusercontent.com/labring/FastGPT/main/document/content"
for f in $SOURCES; do
  mkdir -p "output/_sources/fastgpt/$(dirname "$f")"
  curl -s -o "output/_sources/fastgpt/$f" "$base/$f"
done
```

写章时用 Read 工具读 `output/_sources/fastgpt/<path>` 对应素材;素材与规范冲突时以规范为准,官方事实以素材为准并标注版本。

---

### Task 1: 规范 §4 增补图片条目 + build/README 用法同步

**Files:**
- Modify: `docs/book-writing-guide.md`(§4「图表」末尾追加 3 条)
- Modify: `build/README.md:30`(fetch-images 用法句)

**Interfaces:**
- Produces: 规范 §4 含图片三要素(引用约定/本地化流程/分工),为 Task 2 的多书脚本提供文档依据

- [ ] **Step 1: 修订 book-writing-guide.md §4**

在 §4 最后一条(`- 必须在 GitHub 网页端原生渲染…`)之后追加:

```markdown
- **图片(位图)引用约定**:章节统一写相对路径 `../assets/images/…`(相对章节文件,解析到书内 `assets/images/`);构建把书内 `assets/` 整目录镜像到产物同级,相对引用零改写即可解析
- **远程图床外链不进成品稿**:初稿可先写外链(如微信图床),入库前在 `build/` 下跑 `node fetch-images.mjs` 本地化——缺省扫描书架全部含 `chapters/` 的书(`--book <bookId>` 限定单本),远程图下载为 sha1 前 12 位哈希文件名落位书内 `assets/images/` 并改写引用;失败自动替换为占位引用块并留 HTML 注释记录原始 URL,下次运行自动重试;幂等,可重复跑
- **图表分工**:章首图一律 mermaid(上方两条图式);实截图、照片等位图走图片本地化链路;能用 mermaid 表达的结构不截屏
```

- [ ] **Step 2: 更新 build/README.md:30 用法句**

将 `辅助:\`node fetch-images.mjs\` 把章节里的远程图片下载到书内 \`assets/images/\` 并改写引用。` 改为:

```markdown
辅助:`node fetch-images.mjs` 把章节里的远程图片下载到书内 `assets/images/` 并改写引用;缺省扫描书架全部含 `chapters/` 的书,`--book <bookId>` 限定单本。
```

- [ ] **Step 3: 通读复核**

Read 两文件改动处,确认与 §4 既有 mermaid 条目无表述冲突(mermaid 管章首图,图片条目管位图)。

---

### Task 2: fetch-images.mjs 通用化 + 单测

**Files:**
- Modify: `build/fetch-images.mjs`(全书重构为多书形态)
- Create: `build/fetch-images.test.mjs`
- Modify: `build/package.json`(`test` script 加入新测试文件)

**Interfaces:**
- Consumes: 现有下载/改写/重试逻辑(不变)
- Produces: `node fetch-images.mjs [--book <bookId>]`;导出 `__internals = { parseArgs, discoverBooks, bookPaths, scanRefs, rewrite, fallbackBlock }` 供测试

- [ ] **Step 1: 写失败测试 `build/fetch-images.test.mjs`**

```js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd build && node --test fetch-images.test.mjs`
Expected: FAIL(`__internals` 不存在)

- [ ] **Step 3: 重构 fetch-images.mjs 为多书形态**

要点(完整改造,保持下载/改写/重试逻辑逐字节不变)。改造后函数签名清单:

```js
parseArgs(argv = process.argv.slice(2))              // → string|null;缺值/未知参数 throw
discoverBooks()                                      // → string[];books/ 下含 chapters/ 的书,升序
bookPaths(bookId)                                    // → { chaptersDir, imagesDir, failedList }
listChapters(chaptersDir)                            // → string[](原逻辑,chaptersDir 参数化)
findExisting(hash, imagesDir)                        // → string|undefined(原逻辑,imagesDir 参数化)
fetchImage(url, imagesDir)                           // → { ok, file?, reused?, bytes? } | { ok:false, error }(原逻辑)
runBook(bookId)                                      // → { urls, okUrls, failUrls, okRefs, failRefs, extStats, failedLines }
```

1. 删除模块级 `CHAPTERS_DIR` / `IMAGES_DIR` / `FAILED_LIST` 常量,替换为 `bookPaths(bookId)` 派生
2. 现 `main()` 主体迁入 `runBook(bookId)`:mkdir 本书 imagesDir → 扫描 → 下载 → 改写 → 写本书 `_failed.txt`,返回上表统计对象
3. 新 `main()`:parseArgs → 解析书清单(`--book` 校验书存在且含 `chapters/`,否则 throw)→ 逐本 `runBook` → 逐本打印 `统计` 行 + 末尾汇总;任一书失败率 > 30% 时 `process.exitCode = 2`
4. 文件尾部:`export const __internals = { parseArgs, discoverBooks, bookPaths, scanRefs, rewrite, fallbackBlock };` 且 `main` 仅在直接运行时执行:

```js
import { pathToFileURL } from 'node:url';
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((err) => { console.error(`[fetch-images] 失败: ${err?.stack ?? err}`); process.exitCode = 1; });
```

5. 头部注释更新为多书行为说明(`--book`、发现规则、失败清单路径 per-book)

- [ ] **Step 4: 跑测试与全书架空跑**

```bash
cd build
node --test fetch-images.test.mjs   # PASS
npm test                            # 全部测试 PASS(clean/site/books/fetch-images)
node fetch-images.mjs               # 真跑:agentscope-java 无新远程引用,其余书 0 引用,幂等无改写
node fetch-images.mjs --book ragflow
```
Expected: 测试全绿;真跑输出各书 `0 处` 引用或仅 agentscope 历史失败重试,git diff 无章节文件被改

- [ ] **Step 5: package.json 纳入测试 + commit ①**

`build/package.json` 的 `test` script 改为:
```json
"test": "node --test books/books.test.mjs clean.test.mjs fetch-images.test.mjs site.test.mjs"
```

```bash
git add docs/book-writing-guide.md build/README.md build/fetch-images.mjs build/fetch-images.test.mjs build/package.json
git commit -m "docs+build: 图片逻辑入通用规范 §4,fetch-images 通用化为全书架扫描

- book-writing-guide §4 增补图片三要素:引用约定/本地化流程/图表分工
- fetch-images.mjs 去单书硬编码:--book 限定,缺省扫 books/ 下含 chapters/ 的书,per-book 失败清单;下载/改写/重试逻辑不变
- 新增 fetch-images.test.mjs(发现/参数/扫描/改写,无网络),npm test 纳入

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: fastgpt 书立项

**Files:**
- Create: `books/fastgpt/README.md`
- Create: `books/fastgpt/assets/.gitkeep`
- Create: `build/books/fastgpt.mjs`
- Modify: `build/books/registry.mjs`(PLANNED_BOOKS 增内联条目)
- Modify: `README.md`(书列表增 fastgpt 行 🔜)

**Interfaces:**
- Produces: `build/books/fastgpt.mjs` 导出 `book`(字段与 ragflow.mjs 同款,含 PARTS);第 4-16 章的文件名/标题以此 PARTS 为准;升 published(Task 18)时仅改 status + registry 迁移

- [ ] **Step 1: 创建 books/fastgpt/README.md**

```markdown
# FastGPT:从入门到进阶

> 状态:**成稿中(2026-11-01 立项)——基于官方文档(v4.17.3,核实日期 2026-11-01)撰写。**
> ⚠️ 形态欠账:与 mcp/ragflow 书相同,各章为骨架齐全的紧凑章,距书稿标准(≥500 行/章,见[编写规范](../../docs/book-writing-guide.md))的增厚为后续欠账;代码示例与界面操作**未实测**,各章复核清单逐条挂账,待环境就绪后补实测。

## 定位

知识库问答与工作流编排实战。本书以 FastGPT v4.17 为主线,覆盖从部署、知识库构建、应用编排(对话 Agent 与工作流)到发布渠道、OpenAPI 集成、生产运营的完整链路——FastGPT 的长处是把 RAG 知识库与可视化工作流装进一个开箱即用的平台,本书既讲「怎么配」,也讲「怎么选」与「怎么运营」。

## 目标读者

- 后端工程师 / 平台工程师:部署运维 FastGPT,为团队提供知识库问答与应用托管能力
- 知识库运营:文档接入、检索调优、对话质量巡检
- Agent 开发者:用工作流/工具/技能编排业务流,经 OpenAPI/MCP 接入平台侧应用(→ mcp 书)

## 与平台缺口地图的对应

以下条目来自[设计规格附录 A](../../docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md)(跨境电商智能体多租户平台 · 技术缺口地图):

| 角色 | 技术域 | 具体内容 | 覆盖 |
|------|--------|---------|------|
| 开发 | RAG 知识库 + 低代码编排 | FastGPT 知识库、工作流、Agent 编排 | ✅ fastgpt 书 |
| 运营 | 知识库运营 | 文档同步、对话质检、评测迭代 | ✅ fastgpt 书内章 |

## 素材源与版本基线

- 素材源:[labring/FastGPT](https://github.com/labring/FastGPT) 官方仓库 `document/content/` 目录(guide/openapi/plugin/self-host/faq 五域)
- 版本基线:**v4.17.3(2026-11-01 核实的最新 tag)**,全部外部事实以此版文档为准
- 每章 frontmatter `source` 与构建配置 `sources` 字段记录对应官方文档路径,供溯源与未来 `--check`

## 贯穿案例

**售后客服**:把跨境电商售后域的三类文档——售后政策手册(50 页 PDF,含表格)、商品 FAQ(XLSX,约 200 行)、物流时效公告(HTML + 邮件)——建成知识库 `after-sales-kb`,经检索调优形成可问答知识,再编排为工作流应用「售后客服」:知识库搜索 + 问题分类 + HTTP 工具查工单(→ mcp 书的中台售后域),发布为免登录分享链接与钉钉渠道,经 OpenAPI 供平台侧消费、经 MCP Server 暴露给平台 Agent,经 SignOz/调用日志进入可观测(→ langfuse 书)。案例文档名、知识库名、应用名全书一致,禁止各章自造。

## 术语约定

- **知识库(Knowledge Base)**:FastGPT 的 RAG 载体,层次为 知识库 → 集合(Collection) → 数据(Chunk);与 ragflow 书的「数据集(Dataset)」同域不同名,各自以官方叫法为准
- **应用(App)**:四形态——简易配置、工作流、插件、Agent V2
- **工作流(Workflow)**:画布式节点编排;节点(Node)为最小执行单元
- **技能(Skill)**:可版本化的应用模板资产,可初始化/开发/集成/发布
- **MCP 工具**:经 MCP 协议接入的外部工具集;FastGPT 应用也可发布为 MCP Server

## 章节规划(4 篇 13 章)

| 章节 | 内容一句话 | 分量 |
|------|-----------|------|
| [第 1 章 初识 FastGPT](chapters/01-overview.md) | 定位、三形态(云/商业/社区)、与自建 RAG 及 ragflow 的取舍 | 薄(全书引子) |
| [第 2 章 部署与模型通道](chapters/02-deploy-models.md) | Docker 部署、env 配置、模型接入、本地模型、首问验证 | 中 |
| [第 3 章 知识库:从文档到知识](chapters/03-dataset-basics.md) | RAG 原理、知识库结构、导入格式、QA 拆分、chunk 管理 | 中 |
| [第 4 章 检索方案与调优](chapters/04-retrieval-tuning.md) | 语义/全文/混合检索、重排、阈值、搜索测试 | 重 |
| [第 5 章 知识库进阶:同步、标签与权限](chapters/05-dataset-advanced.md) | Web 同步、集合标签、文件级权限、API/第三方知识库 | 中 |
| [第 6 章 应用与对话 Agent](chapters/06-apps-agents.md) | 应用四形态、通用配置、Agent V2 设置与调试 | 中 |
| [第 7 章 工作流编排](chapters/07-workflow.md) | 画布与节点族、编排规则、辅助生成、Debug、售后客服工作流 | 重 |
| [第 8 章 工具与技能](chapters/08-tools-skills.md) | 系统工具、MCP 工具、技能开发与版本、插件体系 | 中 |
| [第 9 章 应用发布与渠道](chapters/09-publish-channels.md) | 分享链接、iframe、钉钉/飞书/企微/公众号、MCP Server 发布 | 中 |
| [第 10 章 对外集成:OpenAPI](chapters/10-openapi.md) | API Key、应用/对话/知识库 API、对齐 OpenAI 接口 | 中 |
| [第 11 章 生产运维](chapters/11-operations.md) | 配置全景、对象存储、沙箱、SignOz 可观测、升级迁移、排障 | 重 |
| [第 12 章 团队协作与权限治理](chapters/12-team-governance.md) | 团队空间、角色权限、SSO、团队模式 | 中 |
| [第 13 章 对话运营与评测](chapters/13-chat-operations-eval.md) | 对话记录查阅与标注、引用阅读器、应用评测、质量巡检 | 中 |

## 与其他书的交叉引用

- **mcp 书**:HTTP 工具/工单查询与中台售后域会合(第 8 章 ↔ mcp 书工具层);应用发布为 MCP Server 被平台 Agent 消费(第 9 章 ↔ mcp 书第 8 章)
- **ragflow 书**:同为知识库平台,选型对照在第 1 章;切片治理与质量巡检方法论互通(第 13 章 ↔ ragflow 书第 13 章)
- **langfuse 书**:SignOz/调用日志对接可观测(第 11 章)
- **agentscope-java 书**:自建 RAG 与平台型知识库的取舍(第 1 章)

---

元数据(bookId / title / tagline)以 `build/books/registry.mjs` 为准。
```

- [ ] **Step 2: 创建 build/books/fastgpt.mjs**

```js
/**
 * fastgpt.mjs — 《FastGPT:从入门到进阶》书配置
 *
 * 第四本 published 书(书架第四格,2026-11-01 立项)。结构与 ragflow.mjs 一致:
 * - book:书级元数据 + 渲染层文案字段 + chaptersDir/assetsDir 等路径约定
 * - book.PARTS:4 篇 13 章(基于官方文档撰写的对照书,sources 记录各章
 *   对应的官方仓库 document/content/ 路径,供溯源与未来 --check 用)
 * - book.buildLinkMap():无源文档链接映射,返回空 Map
 * - book.EXCLUDED_SOURCES:空
 * - legacyRootChapters: false(本仓库新增的书,不拥有旧站点根 chapters/ 路径)
 *
 * 版本基线:官方 docs v4.17.3(2026-11-01 核实)。
 * ⚠️ 立项时 status: 'planned',未在 registry.mjs 中 import——成稿并完成
 * 全链路预演后翻 'published' 并迁入 BUILDABLE_BOOKS(同 ragflow 流程)。
 */

export const book = {
  bookId: 'fastgpt',
  status: 'planned',
  title: 'FastGPT:从入门到进阶',
  subtitle: '知识库与工作流,从搭建到生产运营',
  date: '2026-11-01',
  tagline: '知识库问答与工作流编排实战,从搭建到生产运营',
  sourceNote: '基于 FastGPT 官方仓库文档(v4.17.3)撰写,含运营实践视角;代码示例未实测',
  sourceDescription: 'FastGPT 官方仓库 labring/FastGPT 的 document/content/ 目录(v4.17.3)',
  licenseNote: 'FastGPT 以 Apache-2.0 附加条件许可发布;本书为学习整理稿,遵循本仓库整体许可证分发。',
  trademarkNote: 'FastGPT 及相关商标归其权利人所有;本书与 FastGPT 项目及 labring 官方无隶属关系。',
  chaptersDir: 'books/fastgpt/chapters',
  assetsDir: 'books/fastgpt/assets',
  demoGithubBase: 'https://github.com/ybak/ai-tutorial/blob/main/books/fastgpt/demo/',
  pdfFileName: 'FastGPT-从入门到进阶.pdf',
  legacyRootChapters: false,
};

const PARTS = [
  { id: "part-1", title: "第一篇 认识与上线", chapters: [
    { file: "01-overview.md", chapter: 1, title: "初识 FastGPT", sources: ["guide/index.mdx", "guide/getting-started/index.mdx", "guide/getting-started/quick-start.mdx", "guide/version/opensource/intro.mdx", "guide/version/commercial.mdx", "guide/version/cloud/intro.mdx"] },
    { file: "02-deploy-models.md", chapter: 2, title: "部署与模型通道", sources: ["self-host/index.mdx", "self-host/deploy/docker.mdx", "self-host/config/env.mdx", "self-host/config/model/intro.mdx", "self-host/custom-models/ollama.mdx", "self-host/config/root-password.mdx"] },
  ]},
  { id: "part-2", title: "第二篇 知识库构建", chapters: [
    { file: "03-dataset-basics.md", chapter: 3, title: "知识库:从文档到知识", sources: ["guide/dataset/rag.mdx", "guide/dataset/faq.mdx"] },
    { file: "04-retrieval-tuning.md", chapter: 4, title: "检索方案与调优", sources: ["guide/dataset/dataset_engine.mdx", "self-host/milvus-bm25.mdx", "guide/dataset/faq.mdx"] },
    { file: "05-dataset-advanced.md", chapter: 5, title: "知识库进阶:同步、标签与权限", sources: ["guide/dataset/websync.mdx", "guide/dataset/collection_tags.mdx", "guide/dataset/collection_permission.mdx", "guide/dataset/third-party/api_dataset.mdx", "guide/dataset/third-party/dingtalk_dataset.mdx", "guide/dataset/third-party/lark_dataset.mdx", "guide/dataset/third-party/yuque_dataset.mdx", "guide/dataset/third-party/third_dataset.mdx"] },
  ]},
  { id: "part-3", title: "第三篇 应用构建与消费", chapters: [
    { file: "06-apps-agents.md", chapter: 6, title: "应用与对话 Agent", sources: ["guide/build/general/ai_settings.mdx", "guide/build/general/welcomeText.mdx", "guide/build/general/chat_input_guide.mdx", "guide/build/general/fileInput.mdx", "guide/build/general/voiceInput.mdx", "guide/build/agentv2/settings.mdx", "guide/build/agentv2/debug.mdx", "guide/build/agentv2/vm.mdx"] },
    { file: "07-workflow.md", chapter: 7, title: "工作流编排", sources: ["guide/build/workflow/intro.mdx", "guide/build/workflow/rules.mdx", "guide/build/workflow/assisted-generation.mdx", "guide/build/workflow/nodes/ai_chat.mdx", "guide/build/workflow/nodes/dataset_search.mdx", "guide/build/workflow/nodes/question_classify.mdx", "guide/build/workflow/nodes/tfswitch.mdx", "guide/build/workflow/nodes/http.mdx", "guide/build/workflow/nodes/loop.mdx", "guide/build/workflow/nodes/form_input.mdx", "guide/build/workflow/nodes/reply.mdx", "guide/build/workflow/nodes/text_editor.mdx", "guide/build/workflow/nodes/variable_update.mdx"] },
    { file: "08-tools-skills.md", chapter: 8, title: "工具与技能", sources: ["guide/build/tools/mcp_tools.mdx", "guide/build/skill/intro.mdx", "guide/build/skill/initialization.mdx", "guide/build/skill/development.mdx", "guide/build/skill/integration.mdx", "guide/build/skill/version.mdx", "plugin/index.mdx", "plugin/intro.mdx", "plugin/team-installation.mdx", "plugin/system-tool-development.mdx"] },
    { file: "09-publish-channels.md", chapter: 9, title: "应用发布与渠道", sources: ["guide/build/publish/link.mdx", "guide/build/publish/dingtalk.mdx", "guide/build/publish/feishu.mdx", "guide/build/publish/wecom.mdx", "guide/build/publish/wechat.mdx", "guide/build/publish/official_account.mdx", "guide/build/publish/mcp_server.mdx"] },
    { file: "10-openapi.md", chapter: 10, title: "对外集成:OpenAPI", sources: ["openapi/intro.mdx", "openapi/app.mdx", "openapi/chat.mdx", "openapi/dataset.mdx", "guide/build/publish/openapi.mdx"] },
  ]},
  { id: "part-4", title: "第四篇 生产与运营", chapters: [
    { file: "11-operations.md", chapter: 11, title: "生产运维", sources: ["self-host/config/object-storage.mdx", "self-host/config/sandbox/opensandbox.mdx", "self-host/config/signoz.mdx", "self-host/config/remote-debug-suite.mdx", "self-host/migration/docker_db.mdx", "self-host/migration/docker_mongo.mdx", "self-host/troubleshooting/attention.mdx", "self-host/troubleshooting/faq.mdx", "self-host/troubleshooting/methods.mdx", "self-host/troubleshooting/model-errors.mdx", "self-host/upgrading/4-17/4173.mdx"] },
    { file: "12-team-governance.md", chapter: 12, title: "团队协作与权限治理", sources: ["guide/workspace/team/team_roles_permissions.mdx", "guide/workspace/team/invitation_link.mdx", "guide/admin/sso.mdx", "guide/admin/teamMode.mdx"] },
    { file: "13-chat-operations-eval.md", chapter: 13, title: "对话运营与评测", sources: ["guide/chat/quoteList.mdx", "guide/chat/html.mdx", "guide/chat/htmlRendering.mdx", "guide/build/evaluation.mdx", "guide/build/faq.mdx", "faq/chat.mdx"] },
  ]},
];

/**
 * 无源文档链接映射,返回空 Map(接口与 agentscope-java.book.buildLinkMap 对齐)。
 * @returns {Map<string, string>} 空 Map
 */
function buildLinkMap() {
  return new Map();
}

// 构建映射类字段收敛为 book 字段(与 agentscope-java.mjs / mcp.mjs / ragflow.mjs 同款,所有消费方从 book 出发)
Object.assign(book, { PARTS, EXCLUDED_SOURCES: [], buildLinkMap });
```

注:第 11 章 `upgrading/4-17/4173.mdx` 等素材若 404,以 `self-host/upgrading/4-17/` 目录下实际存在的文件为准(素材拉取时校验,拉不到就从 sources 里去掉并在章 frontmatter 调整)。

- [ ] **Step 3: registry.mjs 登记 PLANNED 条目 + assets 占位**

`build/books/registry.mjs` 的 `PLANNED_BOOKS` 数组**开头**插入:

```js
  {
    bookId: 'fastgpt',
    status: 'planned',
    title: 'FastGPT:从入门到进阶',
    tagline: '知识库问答与工作流编排实战,从搭建到生产运营',
  },
```

创建空文件 `books/fastgpt/assets/.gitkeep`(site 构建要求 assets 目录存在)。

- [ ] **Step 4: 根 README 增书目行**

`README.md` 书列表表格中,`RAGFlow` 行之后插入:

```markdown
| FastGPT:从入门到进阶 | 🔜 规划中 | 4 篇 13 章,知识库与工作流,从搭建到生产运营 | [books/fastgpt/](books/fastgpt/README.md) |
```

- [ ] **Step 5: 验证 + commit ②**

```bash
cd build && npm test        # 全绿(fastgpt 未进 BUILDABLE,不受断言影响)
node -e "import('./books/registry.mjs').then(()=>console.log('registry ok'))"   # registry 可加载、无语法错
```

```bash
git add books/fastgpt/README.md books/fastgpt/assets/.gitkeep build/books/fastgpt.mjs build/books/registry.mjs README.md
git commit -m "docs(fastgpt): 立项——4 篇 13 章规划定稿与书配置,sources 溯源映射

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4-16: 第 1-13 章成稿(五批派发,批内 ≤3 并发)

每章一个任务,统一执行模式(以下步骤对各章任务重复,不再逐章复制):

**Files(每章):** Create: `books/fastgpt/chapters/<file>`

**统一步骤:**

- [ ] **Step 1: 拉素材**——执行「素材拉取通用命令」,`$SOURCES` 取该章 sources(见 fastgpt.mjs PARTS);逐个确认非 404(文件头是 `---` 或 markdown 而非 `404: Not Found`),404 的从阅读清单剔除
- [ ] **Step 2: 写章**——读规范 + 对应样张 + 素材,按「章节写作简报」全部硬性要求成稿 250-450 行;frontmatter `source` 填该章第一素材路径;章内小节号 N.1/N.2… 与章首流程图节点标号一致
- [ ] **Step 3: 自检**——
  ```bash
  wc -l books/fastgpt/chapters/<file>                    # ≥250
  grep -c "^## " books/fastgpt/chapters/<file>           # ≥6(含小结/验收清单/延伸阅读)
  grep -nE "[,;:!?]" books/fastgpt/chapters/<file> | grep -v '```' | head  # 正文半角标点应为 0(代码块内除外)
  ```
- [ ] **Step 4: 批次检查点(主代理)**——批内各章写完后,主代理抽查每章骨架完整性(导读/章首图/图注/验收清单/复核清单)与贯穿案例对象名,不合格打回重写,全部合格才派下一批

各章唯一内容约定:

| # | 文件 / 章首图式 | 提纲要点(主体 H2 节) | 章特定要求 |
|---|----------------|----------------------|-----------|
| 4 | `01-overview.md` / **导览图** | FastGPT 是什么(RAG+工作流+应用编排);核心概念地图(应用/知识库/工作流/工具/技能,表格);三形态对比与选型(云/商业/社区);与自建 RAG(→ agentscope-java 书)及 ragflow(知识库深度 vs 编排广度)的取舍;快速上手:云上十分钟首问 | 全书引子,埋贯穿案例预告;「业务上推荐优先用 X」类立场句加粗 |
| 5 | `02-deploy-models.md` / **操作流程图** | 部署形态与资源要求;Docker Compose 部署(官方一键脚本);环境变量与配置体系(env 分类表);模型通道:渠道/模型配置 model.json 结构;本地模型接入(Ollama);首问验证与部署常见坑 | 贯穿案例:为售后客服部署社区版;root 初始密码修改 |
| 6 | `03-dataset-basics.md` / **操作流程图** | RAG 原理与知识库结构(知识库→集合→数据/Chunk,图示);创建知识库与索引模型选型;文件导入:支持格式表 + 四种方式(本地/URL/手动/QA 拆分/CSV 批量);数据(Chunk)管理与训练状态;三类售后文档入库实操 | 三类文档入库后标注各自更新节奏,衔接第 5 章同步路线 |
| 7 | `04-retrieval-tuning.md` / **操作流程图** | 检索方案全景(语义/全文/混合,对比表);语义检索:向量模型与相似度阈值;全文检索与 BM25(Milvus 部署);混合检索与重排模型;搜索测试与参数调优(引用上限/空白配置);售后知识库检索调优实战(政策手册 vs FAQ 的参数差异) | 决策分支画进流程图:「按文档形态选检索方案」 |
| 8 | `05-dataset-advanced.md` / **操作流程图** | Web 站点同步(配置与频率);集合标签;文件级权限;API 知识库;第三方知识库(飞书/钉钉/语雀,表格对比);售后域选型:三类文档各自的最佳同步路线(决策表) | 与第 3 章的更新节奏呼应;低频→手动,高频→第三方同步 |
| 9 | `06-apps-agents.md` / **导览图** | 应用四形态全景(表格:适用场景/编排方式/复杂度);简易配置版「售后客服」(贯穿案例起点);通用配置:AI 参数/开场白/限定词/对话输入引导;多模态输入(文件/语音);Agent V2:设置、VM 与调试 | 简易版是第 7 章工作流版的对照基线 |
| 10 | `07-workflow.md` / **操作流程图** | 画布与编排规则(连线/变量引用);节点族全景(表格分类);对话主线搭建:问题分类→知识库搜索→AI 对话→指定回复;系统交互:HTTP/判断器/循环/表单输入/变量更新/文本编辑;辅助生成与 Debug 模式;售后客服工作流实战(分类→检索→查工单→答复) | HTTP 节点对接 `GET /api/after-sale/tickets?phone={phone}`;与第 6 章简易版效果对比 |
| 11 | `08-tools-skills.md` / **操作流程图** | 工具体系全景(系统工具/自定义工具/MCP 工具);MCP 工具接入(双向);技能(Skill):初始化/开发/集成/版本管理;插件体系与团队安装;工单查询工具实战:封装为可复用工具 | 工具封装后第 7 章工作流可换用(前后呼应) |
| 12 | `09-publish-channels.md` / **操作流程图** | 发布通道全景(表格);免登录分享链接与 iframe 嵌入;钉钉/飞书/企微机器人接入;公众号;发布为 MCP Server;售后客服发布实战(分享链接给客服团队 + 钉钉渠道) | MCP Server 发布是 → mcp 书衔接点 |
| 13 | `10-openapi.md` / **操作流程图** | API 体系与鉴权(API Key 创建/分类);应用管理 API;对话 API(OpenAI 兼容格式/流式/对话历史);知识库 API(集合与数据管理);售后客服 API 对接实战:平台侧消费链路 | 代码示例用 curl + fetch 双形态;结尾衔接 → mcp 书第 8 章 |
| 14 | `11-operations.md` / **操作流程图** | 生产配置全景(env 分层/密钥治理);对象存储(S3 协议);代码沙箱(OpenSandbox);可观测:SignOz 与调用日志(→ langfuse 书);版本升级与数据迁移(4.x 升级路径/Mongo 迁移);故障排查方法论(attention/methods/model-errors 归纳为决策树) | 排障部分 ≥4 并列要点必须 mermaid 化 |
| 15 | `12-team-governance.md` / **导览图** | 团队空间模型;成员角色与权限(表格);邀请链接;SSO 与外部成员同步;团队模式;售后域治理:客服/运营/开发三角色分权实例 | 与 ragflow 书第 13 章治理方法论互引 |
| 16 | `13-chat-operations-eval.md` / **操作流程图** | 对话记录查阅与标注;引用分块阅读器(quoteList);对话框 HTML 渲染;应用评测(Beta):数据集/指标/回归;常见问题与坏例治理;售后客服质量巡检 SOP(周检清单) | 与 ragflow 书第 13 章「更新流程与质量巡检」方法论呼应 |

---

### Task 17: 全书一致性统检

**Files:**
- Read all: `books/fastgpt/chapters/*.md`, `books/fastgpt/README.md`
- Modify: 统检发现的问题就地修复

- [ ] **Step 1: 机械检查**

```bash
cd "D:\work\code\book\ai-tutorial"
wc -l books/fastgpt/chapters/*.md                              # 13 个文件,全部 ≥250 行
grep -Ln "本章导读" books/fastgpt/chapters/*.md                 # 无输出(每章都有导读)
grep -Ln "验收清单" books/fastgpt/chapters/*.md                 # 无输出
grep -c "```mermaid" books/fastgpt/chapters/*.md               # 每章 ≥1(章首图)
grep -rn "after-sales-kb" books/fastgpt/chapters | wc -l       # 贯穿案例名出现在多章
grep -rnoE "售后助手|after-sales-dataset" books/fastgpt/       # 无输出(不得混入他书对象名)
grep -nE "[,;:!?]( |$)" books/fastgpt/chapters/*.md | grep -v '```' | head -20  # 正文半角标点清零
```

- [ ] **Step 2: 语义检查(主代理通读)**——章级/小节级交叉引用编号正确(「见第 N 章」指向存在且相关);章首流程图节点小节号与正文一致;术语中英对照首现;延伸阅读链接的文件都存在;每章复核清单挂账未实测项
- [ ] **Step 3: README 状态行更新**——`books/fastgpt/README.md` 顶部状态改为:**初稿成稿(2026-11-01)——13 章全部完成,基于官方文档(v4.17.3,核实日期 2026-11-01)逐章对照撰写;已过全书一致性统检(贯穿案例命名、章级/小节级交叉引用、术语中英对照、全角标点)**(仿 ragflow README 首行)
- [ ] **Step 4: 修复问题并复跑 Step 1 机械检查至全绿**

---

### Task 18: 升 published + 全链路预演 + commit ③

**Files:**
- Modify: `build/books/fastgpt.mjs`(status)
- Modify: `build/books/registry.mjs`(迁移 BUILDABLE)
- Modify: `build/books/books.test.mjs:32`(BUILDABLE 名单断言)
- Modify: `build/site.test.mjs:177`(runSite 书目录清单)
- Modify: `README.md`(书目行翻 ✅ + 学习路线提及)

**Interfaces:**
- Consumes: Task 3 的 fastgpt.mjs(改 status 即可,字段不动);Task 4-16 的 13 章文件(构建素材)

- [ ] **Step 1: 先改测试(红→绿)**

`build/books/books.test.mjs` 第 32 行:
```js
  assert.deepEqual(BUILDABLE_BOOKS.map((b) => b.bookId), ['agentscope-java', 'mcp', 'ragflow', 'fastgpt']);
```
`build/site.test.mjs` 第 177 行:
```js
  for (const id of ["agentscope-java", "mcp", "ragflow", "fastgpt"]) {
```

- [ ] **Step 2: fastgpt.mjs 翻 status**

`status: 'planned'` → `status: 'published'`,并把头部注释「⚠️ 立项时 status…」段更新为已发布说明。

- [ ] **Step 3: registry.mjs 迁移**

顶部 `import { book as fastgpt } from './fastgpt.mjs';`;`BUILDABLE_BOOKS = [agentscopeJava, mcp, ragflow, fastgpt]`;`PLANNED_BOOKS` 删除 fastgpt 内联条目;注释同步。

- [ ] **Step 4: 根 README 翻状态**

书列表行:`🔜 规划中` → `✅ 已发布`。「按角色学习路线」开发行补「知识库问答与低代码编排 → **fastgpt** 书」,运营行补「FastGPT 对话质检与评测 → **fastgpt** 书内章」。

- [ ] **Step 5: 全链路预演**

```bash
cd build
npm test                                  # 全绿(含两处新断言)
node build.mjs --check --book fastgpt     # 体检:JSX 残留/站内链接/覆盖率
node build.mjs --html --book fastgpt      # output/fastgpt/book.html 生成
node build.mjs --pdf-fallback --book fastgpt   # PDF 兜底路径可走通
npm run site                              # output/site/:书架页含 fastgpt 卡片,fastgpt 子站 13 章齐全,pagefind 索引无错
```
Expected: 五条命令全绿;`output/site/fastgpt/chapters/` 下 13 个章 HTML;书架页出现《FastGPT:从入门到进阶》卡片。任何失败:修复后重跑,不得带病提交。

- [ ] **Step 6: commit ③**

```bash
git add books/fastgpt/chapters books/fastgpt/README.md build/books/fastgpt.mjs build/books/registry.mjs build/books/books.test.mjs build/site.test.mjs README.md
git commit -m "docs(fastgpt): 13 章初稿成稿并升 published 进站点——全链路预演通过

- 4 篇 13 章:认识与上线/知识库构建/应用构建与消费/生产与运营
- 基于官方文档 v4.17.3 对照撰写,sources 溯源;贯穿案例「售后客服」(跨境电商售后域)
- 形态欠账与未实测项挂账 README 与各章复核清单(同 mcp/ragflow 初稿惯例)
- fastgpt.mjs 升 published 迁入 BUILDABLE_BOOKS;书目断言与站点测试同步
- 验证:npm test 全绿;--check/--html/--pdf-fallback/npm run site 全链路通过

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```
