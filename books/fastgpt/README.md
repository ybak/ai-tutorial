# FastGPT:从入门到进阶

> 状态:**初稿成稿(2026-11-02)——13 章全部完成,基于官方文档(v4.17.3,核实日期 2026-11-01)逐章对照撰写;已过全书一致性统检(贯穿案例命名、章级/小节级交叉引用、术语中英对照、全角标点);关键界面与主链路已本地实测并配图(2026-11-03,15 张截图覆盖 9 章)。**
> ⚠️ 形态欠账:与 mcp/ragflow 书相同,各章为骨架齐全的紧凑章,距书稿标准(≥500 行/章,见[编写规范](../../docs/book-writing-guide.md))的增厚为后续欠账;代码示例**未实测**,关键界面与主链路已本地实测并配图(2026-11-03),余下未实测项见各章复核清单(工作流 HTTP 分支、渠道接入等)。

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
- **技能(Skill)**:可版本化的「文档 + 代码」能力包,绑定智能体、沙盒执行、版本化发布
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
