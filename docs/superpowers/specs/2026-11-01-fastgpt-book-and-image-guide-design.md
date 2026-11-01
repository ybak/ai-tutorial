# 设计:图片逻辑入通用规范 + fetch-images 通用化 + fastgpt 书成稿升 published

日期:2026-11-01
状态:已确认(用户批准)

## 背景与目标

- `docs/book-writing-guide.md`(通用教程输出原则)的 §4「图表」只覆盖 mermaid 图式;图片(位图)逻辑散落在 `build/README.md` 与 `build/fetch-images.mjs` 注释里,未入规范
- `build/fetch-images.mjs` 硬编码只处理 `books/agentscope-java`,规范无法对全书架成立
- 书架需新增 fastgpt 书,按 ragflow 书同款流程生产,且一步到位升 `published` 进站点

用户已确认的三个决策:① 规范 + 脚本通用化都做;② fastgpt 成稿后直接升 published(跑全链路预演);③ 贯穿案例沿用跨境电商售后域。

## 任务 A:图片逻辑入通用规范 + 脚本通用化

### A1 规范修订(`docs/book-writing-guide.md` §4 图表)

在 §4 增补「图片」条目,收录现有逻辑:

- **引用约定**:章节统一写 `../assets/images/…`(相对章节文件,解析到书内 `assets/`);构建把书内 `assets/` 整目录镜像到产物同级,相对引用零改写
- **本地化流程**:远程图床外链(微信等)不直接进成品稿——初稿可写外链,入库前在 `build/` 下跑 `node fetch-images.mjs` 本地化:下载为 sha1 前 12 位哈希文件名落位 `assets/images/` 并改写引用;失败自动替换为占位引用块,留 HTML 注释记录原始 URL 供下次运行重试;幂等可重复跑
- **分工**:章首图一律 mermaid(§4 已有规范);实截图、照片等位图走图片本地化链路

`build/README.md` 的脚本用法说明同步为多书形态。

### A2 脚本通用化(`build/fetch-images.mjs`)

- 书发现:默认扫描 `books/` 下**所有含 `chapters/` 目录的书**,自动发现、不依赖 registry——图片本地化是成稿环节工具,须先于书升 published 可用
- `--book <bookId>` 可选参数限定单本;书目录不存在或缺 `chapters/` 时报错退出
- 每本书独立的 `books/<bookId>/assets/images/` 落位目录与 `_failed.txt` 失败清单
- 扫描/下载/改写/重试逻辑不变;agentscope-java 行为完全向后兼容(已有哈希图片与 `_failed.txt` 不受影响;其余书当前无远程引用,零改动)

## 任务 B:fastgpt 书

### B1 立项元数据

| 项 | 值 |
|----|----|
| bookId | `fastgpt` |
| title | FastGPT:从入门到进阶 |
| subtitle | 知识库与工作流,从搭建到生产运营 |
| tagline | 知识库问答与工作流编排实战,从搭建到生产运营 |
| status | 立项时 `'planned'`(不进 registry 导入,站点构建不可见);成稿统检通过后翻 `'published'` 并 import 进 BUILDABLE_BOOKS(同 ragflow 流程) |
| 版本基线 | FastGPT **v4.17.3**(2026-11-01 核实,官方仓库最新 tag) |
| 素材源 | `labring/FastGPT` 仓库 `document/content/` 目录(guide/openapi/plugin/self-host/faq 五域) |
| 溯源 | 每章 frontmatter `source` 与 `build/books/fastgpt.mjs` 的 `sources` 字段记录官方文档路径(同 ragflow) |
| 许可声明 | `licenseNote`/`trademarkNote` 写入书配置(FastGPT 以 Apache-2.0 及附加条款发布;与项目无隶属),不动 NOTICE.md |

同步改动:立项时 `build/books/registry.mjs` 的 PLANNED_BOOKS 增加内联条目,根 `README.md` 书列表增加 fastgpt 行(状态 🔜 规划中、一句话、链接);升 published 时才改为 import 进 BUILDABLE_BOOKS,根 README 行翻 ✅ 已发布,并按角色学习路线的开发/运营行提及 fastgpt 书。

### B2 贯穿案例(跨境电商售后域,对象名全书一致,禁止各章自造)

| 对象 | 值 | 与书架其他书的衔接 |
|------|----|--------------------|
| 知识库 | `after-sales-kb` | 与 ragflow 书同名知识域 |
| 三类文档 | `after-sales-policy.pdf`(50 页含表格)/ `product-faq.xlsx`(约 200 行,列 Title/Content/Category/Year)/ `shipping-notice.html` + `shipping-notice.eml` | 与 ragflow 书同款文档 |
| 应用 | 「售后客服」——工作流型应用为主线;第 6 章以简易配置版作入门对照 | |
| 工具 | HTTP 工具节点对接中台「工单查询」接口 | → mcp 书工具层 |
| 渠道 | 免登录分享链接 + 钉钉渠道 | |
| 对外 | OpenAPI 对话接口;应用发布为 MCP Server | → mcp 书 |
| 可观测 | SignOz/调用日志对接 | → langfuse 书 |

术语以 FastGPT 官方中文文档为准(知识库→集合(Collection)→数据(Chunk) 的层次;应用四形态:简易配置/工作流/插件/Agent V2),成稿时校准。

### B3 章节规划(4 篇 13 章,与 ragflow 书同构)

| 篇 | 章 | 文件 | 内容 | 主要素材源(document/content/ 下) |
|----|----|------|------|----------------------------------|
| 一 认识与上线 | 1 初识 FastGPT | `01-overview.md` | 定位、三形态(云/商业/社区)、与自建 RAG 及 ragflow 的取舍 | guide/index、getting-started、version |
| | 2 部署与模型通道 | `02-deploy-models.md` | Docker 部署、env 配置、模型接入、本地模型、首问验证 | self-host/deploy、config/env、config/model、custom-models |
| 二 知识库构建 | 3 知识库:从文档到知识 | `03-dataset-basics.md` | RAG 原理、建库、导入格式、QA 拆分、chunk 管理 | guide/dataset/rag、faq |
| | 4 检索方案与调优 | `04-retrieval-tuning.md` | 语义/全文/混合检索、重排、阈值、搜索测试 | dataset/dataset_engine、self-host/milvus-bm25 |
| | 5 知识库进阶:同步、标签与权限 | `05-dataset-advanced.md` | Web 同步、集合标签、文件级权限、API/第三方知识库 | dataset/websync、collection_tags、collection_permission、third-party |
| 三 应用构建与消费 | 6 应用与对话 Agent | `06-apps-agents.md` | 应用类型、通用配置、Agent V2 设置与调试 | build/general、build/agentv2 |
| | 7 工作流编排 | `07-workflow.md` | 画布、节点族、编排规则、辅助生成、Debug | build/workflow |
| | 8 工具与技能 | `08-tools-skills.md` | 系统工具、MCP 工具、Skill 开发与版本 | build/tools、build/skill、plugin |
| | 9 应用发布与渠道 | `09-publish-channels.md` | 分享链接、iframe、钉钉/飞书/企微/公众号、MCP Server 发布 | build/publish |
| | 10 对外集成:OpenAPI | `10-openapi.md` | API Key、应用/对话/知识库 API、对齐 OpenAI 接口 | openapi |
| 四 生产与运营 | 11 生产运维 | `11-operations.md` | 配置全景、对象存储、沙箱、SignOz、升级迁移、排障 | self-host/config、migration、troubleshooting |
| | 12 团队协作与权限治理 | `12-team-governance.md` | 团队空间、角色权限、SSO、团队模式 | workspace/team、admin |
| | 13 对话运营与评测 | `13-chat-operations-eval.md` | 对话记录查阅与标注、引用阅读器、应用评测、运营日志 | guide/chat、build/evaluation |

### B4 成稿形态与验收

- 章节骨架严格按 `docs/book-writing-guide.md` §2(含章首操作流程图/导览图,一步到位);全角标点;贯穿案例对象名一致;章级/小节级交叉引用成网
- 形态:骨架齐全的紧凑章(约 250-450 行/章),与 ragflow 初稿同款;README 挂「形态欠账」(<500 行/章的增厚与未实测项,逐章复核清单挂账)
- 素材获取:子代理读官方仓库 raw 文档(`raw.githubusercontent.com/labring/FastGPT/main/document/content/...`),以 v4.17.3 为准
- 一致性统检:贯穿案例命名、交叉引用、术语中英对照、全角标点、mermaid 语法(GitHub 原生渲染)

### B5 commit 与执行策略

1. **commit ①**:任务 A(规范 §4 图片条目 + `fetch-images.mjs` 通用化 + `build/README.md` 用法)
2. **commit ②**:fastgpt 立项(`books/fastgpt/README.md` + `build/books/fastgpt.mjs`(status `planned`,不进 registry 导入) + registry PLANNED_BOOKS 条目 + 根 README 书目行 🔜)
3. **commit ③**:13 章成稿(并行子代理撰写,**并发 ≤3**——本账户 12 并发曾致 5 代理 429 夭折;约 5 批跑完;主代理做全书一致性统检)→ `fastgpt.mjs` status 翻 `published` 并 import 进 registry BUILDABLE_BOOKS → 按 `build/README.md` 跑全链路预演(`npm test`/`--check`/HTML/PDF fallback/`--site`;output/ 已 gitignore,预演为本地验证不入库)→ 根 README 翻 ✅

### 验收清单

- ☐ 规范 §4 含图片三要素(引用约定/本地化流程/分工),与 build/README.md 表述一致
- ☐ `node fetch-images.mjs` 全书架运行不报错,agentscope-java 现有图片引用与 `_failed.txt` 行为不变
- ☐ `books/fastgpt/` 13 章 + README 齐全,frontmatter `source` 可溯源到官方文档路径
- ☐ `npm run site` 与单书 `--check`/PDF fallback 通过;fastgpt 出现在书架页与站点子路径 `/fastgpt/`
- ☐ 根 README 书列表含 fastgpt(✅ 已发布)
- ☐ 全书一致性统检通过(案例命名/交叉引用/标点/术语)
