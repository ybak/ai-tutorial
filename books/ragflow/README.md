# RAGFlow:从入门到进阶

> 状态:**初稿成稿(2026-10-27)——13 章全部完成,基于官方文档(v1.0.0-rc2,核实日期 2026-10-27)逐章对照撰写;已过全书一致性统检(贯穿案例命名、章级/小节级交叉引用、术语中英对照、全角标点)。**
> ⚠️ 形态欠账:与 mcp 书相同,各章为骨架齐全的紧凑章(235-434 行/章),距书稿标准(≥500 行/章,见[编写规范](../../docs/book-writing-guide.md))的增厚为后续欠账;代码示例与界面操作**未实测**,各章复核清单逐条挂账,待环境就绪后补实测。

## 定位

RAG 引擎实战,从搭建知识库到生产级检索调优。本书以 RAGFlow v1 为主线,覆盖从部署、知识库(数据集)构建到检索调优的完整链路,并把**知识库运营**(切片治理、更新流程、质量巡检)作为一等公民——RAG 系统上线只是开始,长期质量靠运营。

## 目标读者

- 后端工程师 / 平台工程师:搭建与运维 RAGFlow,为智能体平台提供知识库能力
- 知识库运营:负责切片治理、文档更新流程与质量巡检
- Agent 开发者:通过 Chat Assistant、画布 Agent、API/MCP 把知识能力接入自己的应用(→ mcp 书)

## 与平台缺口地图的对应

以下条目来自[设计规格附录 A](../../docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md)(跨境电商智能体多租户平台 · 技术缺口地图):

| 角色 | 技术域 | 具体内容 | 覆盖 |
|------|--------|---------|------|
| 开发 | RAG 知识库 | RagFlow、pgvector/Milvus | 🔜 ragflow 书 |
| 运营 | 知识库运营 | RagFlow 切片治理、更新流程 | 🔜 ragflow 书内章 |

## 素材源与版本基线

- 素材源:[infiniflow/ragflow](https://github.com/infiniflow/ragflow) 官方仓库 `docs/` 目录(126 个文件,约 2.6 万行)
- 版本基线:**v1.0.0-rc2(2026-10-16 发布)**,全部外部事实以此版文档为准,核实日期 2026-10-27
- 每章 frontmatter `source` 与构建配置 `sources` 字段记录对应官方文档路径,供溯源与未来 `--check`

## 贯穿案例

**售后知识底座**:把跨境电商售后域的三类文档——售后政策手册(50 页 PDF,含表格)、商品 FAQ(XLSX,约 200 行)、物流时效公告(HTML + 邮件)——建成数据集 `after-sales-kb`,经解析切片调优形成可检索知识,再经聊天助手「售后助手」与画布 Agent 服务客服场景,经 MCP 暴露给平台侧 Agent 消费(→ mcp 书的中台售后域),经 Team 共享给各店铺运营,经 tracing 进入可观测平台(→ langfuse 书)。案例文档名、数据集名、助手名全书一致,禁止各章自造。

## 术语约定

- **数据集(Dataset)**:v1 核心对象,v0 时代称知识库(Knowledge Base)。本书以「数据集(Dataset)」指核心对象,叙述性场景可用「知识库」泛指
- **切片(Chunk)**:解析产出的最小检索单元;「切片方法」对应官方 Chunk method
- **摄取管线(Ingestion Pipeline)**:v1 的自定义解析管线,以画布方式编排 Parser/Chunker/Transformer/Indexer
- **知识编译(Knowledge Compilation)/ 知识工件(Artifact)**:由数据集生成 Wiki、导航、图谱等加工产物
- **Agentic 模式**:v1.0.0-rc2 聊天助手的新编排方式,取代原 Low/Medium/High/Ultra 思考档位

## 章节规划(13 章 4 篇)

| 章节 | 内容一句话 | 分量 |
|------|-----------|------|
| [第 1 章 初识 RAGFlow](chapters/01-overview.md) | RAG 为什么、RAGFlow 是什么、与自建 RAG 的取舍 | 薄(全书引子) |
| [第 2 章 部署与模型通道](chapters/02-deploy-models.md) | Docker 部署、配置体系、在线/本地模型接入、首条链路验证 | 中 |
| [第 3 章 数据集:知识库的载体](chapters/03-dataset-basics.md) | 创建与权限、文件管理、数据源接入与同步、元数据 | 中 |
| [第 4 章 解析与切片:从文档到 Chunk](chapters/04-parsing-chunking.md) | 11 种内建解析方法选型、Parser/视觉模型、Chunker 参数、表列角色 | 重 |
| [第 5 章 检索增强与索引](chapters/05-enrichment-indexing.md) | Extractor 四件套(关键词/问题/标签/上下文)、Indexer 索引策略、子切片 | 中 |
| [第 6 章 知识编译与知识工件](chapters/06-knowledge-compilation.md) | Wiki/导航/图谱生成、模板与专属配置、与 Agent 上下文引擎的关系 | 中 |
| [第 7 章 检索测试与调优](chapters/07-retrieval-tuning.md) | Retrieval Testing、混合检索权重、多数据集 PageRank、检索质量定位法 | 重 |
| [第 8 章 聊天助手与会话](chapters/08-chat-assistant.md) | Chat Assistant 配置、Agentic 模式、Prompt 与参数、会话管理 | 中 |
| [第 9 章 搜索应用与接入渠道](chapters/09-search-channels.md) | Search 应用、Chat Channel 渠道接入、网页嵌入 | 薄 |
| [第 10 章 Agent 与工作流](chapters/10-agent-workflow.md) | 画布与组件族、Ingestion Pipeline、Memory 接入、客服 Agent 实例 | 重 |
| [第 11 章 对外集成:API 与 MCP](chapters/11-api-mcp.md) | HTTP/Python API 全景导航、API Key、RAGFlow 作为 MCP Server | 中 |
| [第 12 章 生产运维](chapters/12-operations.md) | 生产配置、监控与 tracing、备份恢复、v0→v1 升级、CLI 与 Admin UI、Sandbox | 重 |
| [第 13 章 团队协作与知识库运营](chapters/13-team-governance.md) | 权限体系、Team/Me 共享、多租户治理、更新流程与质量巡检 SOP | 重 |

> 初稿 8 章规划(2026-10-24)按官方 v1 文档素材面细化为 13 章:新增知识编译、Agent 与工作流、API/MCP 集成、团队协作四个独立面;原「RAG 评估」单章素材分散,并入第 7 章(检索测试)与第 13 章(质量巡检)。

## 与其他书的交叉引用

- **mcp 书**:RAGFlow 作为 MCP Server 被平台 Agent 消费(第 11 章 ↔ mcp 书第 8 章);工具层与知识层在同一售后域会合
- **langfuse 书**:RAGFlow 监控 tracing 对接可观测平台(第 12 章)
- **agentscope-java 书**:自建 RAG 与 RAGFlow 的取舍(第 1 章);平台侧 Agent 框架如何消费知识服务

---

元数据(bookId / title / tagline)以 `build/books/registry.mjs` 为准。
