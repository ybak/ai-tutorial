# ai-tutorial — 团队教程书架

面向「跨境电商智能体多租户平台」建设的团队教程书架：多本"从入门到进阶"的完整教程书并排，每本书自包含（书稿、图片、动手 Demo 与书内文档都在自己的目录下），合在一起覆盖平台建设所需的全部技术域。

## 📚 书列表

| 书 | 状态 | 一句话 | 链接 |
| --- | --- | --- | --- |
| AgentScope Java 2.0:从入门到进阶 | ✅ 已发布 | 7 篇 44 章,从第一个 Agent 到生产级 Agent 平台 | [books/agentscope-java/](books/agentscope-java/README.md) |
| MCP:跨框架工具接入协议 | ✅ 已发布 | 4 篇 12 章,从核心协议到中台规模化 | [books/mcp/](books/mcp/README.md) |
| RAGFlow:从入门到进阶 | ✅ 已发布 | 4 篇 13 章,从搭建知识库到生产级检索调优 | [books/ragflow/](books/ragflow/README.md) |
| CopilotKit:从前端接入 AI Agent | 🔜 规划中 | 在前端应用中植入 copilot 体验,从组件到自治 Agent | [books/copilotkit/](books/copilotkit/README.md) |
| Langfuse:LLM 可观测与评估 | 🔜 规划中 | LLM 应用的追踪、评估与 Prompt 管理 | [books/langfuse/](books/langfuse/README.md) |

在线阅读：[ybak.github.io/ai-tutorial](https://ybak.github.io/ai-tutorial/)（书架首页，各书在 `/agentscope-java/` 等子路径下）。

## 🧭 按角色学习路线

书架的内容规划对应平台技术缺口地图（见 [docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md](docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md) 附录 A）：

| 角色 | 推荐书与章节 | 对应技术域 |
| --- | --- | --- |
| 开发 | **agentscope-java** 全书主线；RAG 知识库 → **ragflow** 书；前端 AI 集成 → **copilotkit** 书（规划中）；跨框架工具接入 → **mcp** 书 | Agent 编排、RAG 知识库、前端 AI 集成、协议 |
| 测试 | **agentscope-java** 第 39 章（轨迹评估）起步；数据集与评分、Prompt 回归、幻觉检测 → **langfuse** 书（规划中） | Agent 评估、LLM 质量工程（性能压测为轻量专题，按需） |
| 运维 | **langfuse** 书（规划中）：trace/成本监控、Prompt 版本管理与 A/B；传统运维（Prometheus/Grafana、K8s、CI/CD）团队已有基础，按需补 | LLM 可观测、评估运营 |
| 产品 | AI 产品设计（交互模式、意图设计、badcase 管理）→ 并入 **ai-platform** 或薄册（候选池） | AI 产品设计 |
| 运营 | 知识库运营（切片治理/更新流程）→ **ragflow** 书内章；Prompt 运营（版本管理、A/B）→ **langfuse** 书内章（规划中）；合规 → 附录专题（候选池） | 知识库运营、Prompt 运营、合规 |

## 🗃️ 候选池

按需立项，不成书架常驻：**ai-platform**（多租户平台架构：隔离策略、租户路由、配额计费、网关鉴权——当前最大缺口）、**spring-ai**（Java AI 应用：Spring AI / LangChain4j）、**dify**、**vercel-ai-sdk**。

## 🔧 构建

站点与 PDF 的构建说明见 [build/README.md](build/README.md)：`npm run site` 产出书架 + 各书子站 + 全局搜索，`node build.mjs --pdf --book agentscope-java` 出单书 PDF。

## 🤝 参与贡献

发现错别字、内容过时、链接失效，或希望补充某章内容，欢迎提 Issue / PR：

1. Fork 本仓库 → 新建分支 → 修改对应书籍章节
2. **章节编写遵循统一规范：[docs/book-writing-guide.md](docs/book-writing-guide.md)**（章节骨架、厚度标准、图表与标点、贯穿案例、质量门槛）
3. 提交 PR 并说明修改动机

## 📣 关于作者 / 交流

- **GitHub**：[github.com/ybak](https://github.com/ybak)
- **交流群**：打开小红书扫码加入「AgentScopeJava 学习群」 👇

<p align="center">
  <img src="books/agentscope-java/assets/images/chatgroup/rednote-asj.jpg" alt="小红书「AgentScopeJava 学习群」二维码" width="360" />
</p>

如果这些书对你有帮助，欢迎点一个 ⭐ Star，或分享给身边正在做 Agent 开发的同学——这是我持续整理更新的最大动力。

## 📄 声明

各书的来源、许可与用途声明见 [NOTICE.md](NOTICE.md)。书架内容仅供学习与技术分享，禁止用于商业用途。
