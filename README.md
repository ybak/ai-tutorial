中文 | [English](README.en.md)

# ai-tutorial

中文 AI 应用实战教程，每本都在本机实测过，覆盖 MCP、RAG、RAGFlow、FastGPT、Langfuse、LiteLLM、CopilotKit、AgentScope Java 等。面向想动手搭 AI 应用的中文开发者。在线阅读与源码在同一仓库。

[![在线阅读](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E9%98%85%E8%AF%BB-%E6%96%87%E6%A1%A3%E7%AB%99-0969da?style=for-the-badge)](https://ybak.github.io/ai-tutorial/)

**[打开文档站](https://ybak.github.io/ai-tutorial/)** · 书架首页，各书在下表的子路径。

## 书目

| 书 | 一句话 | 章节 | 在线阅读 |
| --- | --- | --- | --- |
| [AgentScope Java 2.0:从入门到进阶](books/agentscope-java/README.md) | 从第一个 Agent 到生产级 Agent 平台 | 7 篇 44 章 | [/agentscope-java/](https://ybak.github.io/ai-tutorial/agentscope-java/) |
| [MCP:跨框架工具接入协议](books/mcp/README.md) | 从核心协议到中台规模化 | 4 篇 12 章 | [/mcp/](https://ybak.github.io/ai-tutorial/mcp/) |
| [RAGFlow:从入门到进阶](books/ragflow/README.md) | 从搭建知识库到生产级检索调优 | 4 篇 13 章 | [/ragflow/](https://ybak.github.io/ai-tutorial/ragflow/) |
| [CopilotKit:从前端接入 AI Agent](books/copilotkit/README.md) | 在 React 应用中植入 copilot 体验,从组件到自治 Agent(含可运行 demo 与实测截图) | 4 篇 8 章 | [/copilotkit/](https://ybak.github.io/ai-tutorial/copilotkit/) |
| [FastGPT:从入门到进阶](books/fastgpt/README.md) | 知识库与工作流,从搭建到生产运营 | 4 篇 13 章 | [/fastgpt/](https://ybak.github.io/ai-tutorial/fastgpt/) |
| [Super-agent 设计探索——以 Grok Bot 为例深度探索](books/super-agent/README.md) | 解读四特征五模块，并以 Grok Bot 对照落地连续、高效、主动、持久的助手形态 | 3 篇 3 章 | [/super-agent/](https://ybak.github.io/ai-tutorial/super-agent/) |
| [Langfuse:LLM 可观测与评估](books/langfuse/README.md) | LLM 应用的追踪、评估与 Prompt 管理,从自托管部署到质量工程(本机实测配图) | 4 篇 13 章 | [/langfuse/](https://ybak.github.io/ai-tutorial/langfuse/) |
| [LiteLLM：多模型网关、配额与降级](books/litellm/README.md) | 虚拟密钥、租户配额与降级；AgentScope / Spring AI / Langfuse 接到同一开源网关（模拟上游实测，无厂商密钥） | 4 篇 10 章 | [/litellm/](https://ybak.github.io/ai-tutorial/litellm/) |

如果这些书对你有帮助，欢迎点一个 ⭐ [Star](https://github.com/ybak/ai-tutorial)，或分享给身边正在做 Agent 开发的同学——这是我持续整理更新的最大动力。

[![GitHub stars](https://img.shields.io/github/stars/ybak/ai-tutorial?style=social)](https://github.com/ybak/ai-tutorial)

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

## 📄 声明

各书的来源、许可与用途声明见 [NOTICE.md](NOTICE.md)。书架内容仅供学习与技术分享，禁止用于商业用途。

## 关于 / 内部设计文档

面向「跨境电商智能体多租户平台」建设的团队教程书架：多本"从入门到进阶"的完整教程书并排，每本书自包含（书稿、图片、动手 Demo 与书内文档都在自己的目录下），合在一起覆盖平台建设所需的全部技术域。

### 🧭 按角色学习路线

书架的内容规划对应平台技术缺口地图（见 [docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md](docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md) 附录 A）：

| 角色 | 推荐书与章节 | 对应技术域 |
| --- | --- | --- |
| 开发 | **agentscope-java** 全书主线；RAG 知识库 → **ragflow** 书；知识库问答与低代码编排 → **fastgpt** 书；前端 AI 集成 → **copilotkit** 书；跨框架工具接入 → **mcp** 书；LLM 应用埋点与可观测 → **langfuse** 书；多模型网关、虚拟密钥与降级 → **litellm** 书 | Agent 编排、RAG 知识库、前端 AI 集成、协议、LLM 可观测、模型网关 |
| 测试 | **agentscope-java** 第 39 章（轨迹评估）起步；数据集与评分、Prompt 回归、幻觉检测 → **langfuse** 书（第 7-9、12 章） | Agent 评估、LLM 质量工程（性能压测为轻量专题，按需） |
| 运维 | **langfuse** 书：trace/成本监控（第 4-5 章）、本地部署与排障（第 2 章）、Prompt 版本管理与 A/B（第 6/8 章）；传统运维（Prometheus/Grafana、K8s、CI/CD）团队已有基础，按需补 | LLM 可观测、评估运营 |
| 产品 | AI 产品设计（交互模式、意图设计、badcase 管理）→ 并入 **ai-platform** 或薄册（候选池） | AI 产品设计 |
| 运营 | 知识库运营（切片治理/更新流程）→ **ragflow** 书内章；FastGPT 对话质检与评测 → **fastgpt** 书内章；Prompt 运营（版本管理、A/B）→ **langfuse** 书内章（第 6/8 章）；合规 → 附录专题（候选池） | 知识库运营、Prompt 运营、合规 |

### 🗃️ 候选池

按需立项，不成书架常驻：**ai-platform**（多租户平台架构仍未成书。其中「网关鉴权、配额、模型降级」已由 **litellm** 书落地为 10 章，隔离策略、计费产品和商家控制台仍在本候选里）、**spring-ai**（Java AI 应用：Spring AI / LangChain4j。LiteLLM 书第 8 章只写了如何把 Spring AI 的 OpenAI 客户端指到网关，不是 Spring AI 专书）、**dify**、**vercel-ai-sdk**。
