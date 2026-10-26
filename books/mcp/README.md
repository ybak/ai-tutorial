# MCP:跨框架工具接入协议

> 状态:**初稿 v2(2026-10-24)——基于官方规范原文([modelcontextprotocol/modelcontextprotocol](https://github.com/modelcontextprotocol/modelcontextprotocol) 2026-07-28)逐章对照重写**;TS SDK v2.4.0 双端实测。
> ⚠️ 形态欠账:当前各章为"规范对照 + 实测记录"形态(100-160 行/章),**尚未达到书稿标准**(≥500 行/章,骨架见[编写规范](../../docs/book-writing-guide.md))。下一步:按规范逐章扩充——补章首导读与导览图、"你什么时候需要它"、验收清单等骨架,内容厚度向 agentscope-java 书对齐。完成后按各章「复核清单」终核,升 status: published 进站点。

## 定位

Model Context Protocol,统一工具接入的跨框架标准。本书讲两件事:**协议本身**(核心概念、版本演进、能力建模与安全)与**规模化落地**(业务中台数千接口的 MCP 化、治理与企业路线)。让同一套工具能力被不同编排框架复用,并给出中台场景从 Pilot 到规模化的完整工程路径。

## 目标读者

- 后端工程师(主要实现者):Server 构建、接口到工具的映射工程
- 平台/架构:Gateway 聚合、多租户工具治理、版本与安全策略
- 集成方:各框架(agentscope-java / ragflow / copilotkit / AI CLI)的接入,详见各书交叉引用

## 与平台缺口地图的对应

以下条目来自[设计规格附录 A](../../docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md)(跨境电商智能体多租户平台 · 技术缺口地图):

| 角色 | 技术域 | 具体内容 | 覆盖 |
|------|--------|---------|------|
| 开发 | 协议 | MCP 工具接入 | 🔜 mcp 书 |

## 贯穿案例

**中台售后域的规模化切片**:业务中台某域约 20 个 REST 接口 → 按任务语义聚合为 6 个 MCP 工具 → 经 Gateway 暴露 → 被 agentscope-java 后端 Agent 与前端应用同时消费。第 4 章初始化,第 6 章打磨工具质量,第 7 章完整走一遍规模化方法,第 8 章多框架收尾。

## 章节规划(初稿)

| 章节 | 内容一句话 | 分量 |
|------|-----------|------|
| [第 1 章 初识 MCP](chapters/01-overview.md) | 问题域、生态、三个时代判断 | 薄(全书引子) |
| [第 2 章 协议核心概念](chapters/02-core-concepts.md) | 无状态模型、resultType、_meta、错误码分区、discover、MRTR | 中 |
| [第 3 章 协议版本演进与兼容](chapters/03-spec-versions.md) | 五版本主线、九大变更、官方七格矩阵、迁移八步 | 中 |
| [第 4 章 快速上手](chapters/04-quickstart.md) | SDK 选型、最小 Server、四行为实测、贯穿案例骨架 | 中 |
| [第 5 章 构建完整的 Server](chapters/05-build-server.md) | 真实 API 依赖、降级路径、日志红线、Host 测试 | 中 |
| [第 6 章 工具接入实战](chapters/06-tool-authoring.md) | schema/描述质量/两类错误/句柄模式/MRTR 流转 | 重 |
| [第 7 章 规模化:业务中台的 MCP 化](chapters/07-mcp-at-scale.md) | 接口≠工具、生成管线、域拆分+Gateway、检索发现、目录治理 | 最重 |
| [第 8 章 构建 Client 与跨框架接入](chapters/08-client-integrations.md) | 支持矩阵、双端实测、client 能力弃用影响 | 中 |
| [第 9 章 调试与 Inspector](chapters/09-debugging.md) | 官方调试工具箱:Inspector web/TUI/CLI、协议时代、安全审计 | 中 |
| [第 10 章 部署与安全](chapters/10-deploy-security.md) | 头体系、OAuth 栈、多租户、威胁清单、部署清单 | 重 |
| [第 11 章 Agent Skills 与扩展生态](chapters/11-extensions.md) | build-with-agent-skills;扩展四系:apps/auth/skills/tasks | 中 |
| [第 12 章 企业落地路线图](chapters/12-adoption-roadmap.md) | 四阶段、组织分工、成本模型、反模式、决策树 | 中 |

> 12 章初稿全部完成(2026-10-24 成稿,2026-10-27 全书统一编号体系、修复章节重排后的引用残骸、全角标点与文风统一);发布前按各章复核清单收尾。

---

元数据(bookId / title / tagline)以 `build/books/registry.mjs` 为准。
