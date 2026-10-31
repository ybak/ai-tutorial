# CopilotKit:从前端接入 AI Agent

> 状态:已发布(2026-10-31 立项即成稿)

## 定位

在前端应用中植入 copilot 体验,从组件到自治 Agent。本书聚焦**前端 AI 集成**:用 CopilotKit 在 React 应用中实现流式输出、HITL(人工介入)与工具透明度的前端交互,让智能体能力以自然的方式进入业务界面。

## 目标读者

- 前端工程师:为业务系统接入 copilot 体验与 Agent 交互界面
- 与后端编排框架对接的全栈工程师(涉及 Runtime 配置部分)

## 与平台缺口地图的对应

以下条目来自[设计规格附录 A](../../docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md)(跨境电商智能体多租户平台 · 技术缺口地图):

| 角色 | 技术域 | 具体内容 | 覆盖 |
|------|--------|---------|------|
| 开发 | 前端 AI 集成 | CopilotKit(React) | 🔜 copilotkit 书 |

## 章节规划(8 章 4 篇)

| 章节 | 内容一句话 | 分量 |
|------|-----------|------|
| [第 1 章 初识 CopilotKit](chapters/01-overview.md) | 定位、三件套架构、一条消息的旅程、AG-UI 协议、开源与云边界 | 中 |
| [第 2 章 快速开始:二十分钟跑通第一个 copilot](chapters/02-quick-start.md) | 两条接入路线、Runtime 与内置 Agent、密钥安全、首跑排查 | 中 |
| [第 3 章 预置组件与自定义聊天界面](chapters/03-components-ui.md) | 三种布局、样式定制、会话控制、插槽与 headless 自建 | 重 |
| [第 4 章 共享状态:让 Agent 看见并操作你的界面](chapters/04-shared-state.md) | 上下文发布、状态双向同步、界面内渲染、流式与预测性更新 | 中 |
| [第 5 章 接入后端 Agent:Runtime 与框架集成](chapters/05-backend-agents.md) | agents 注册、LangGraph 主线、Agent Runner、消息历史、框架一览 | 重 |
| [第 6 章 前端工具与生成式 UI](chapters/06-frontend-tools-generative-ui.md) | 前端工具、工具调用渲染、组件即工具、状态渲染 vs 工具渲染 | 中 |
| [第 7 章 人工介入:让人回到决策回路](chapters/07-hitl.md) | 工具级审批、打断恢复、LangGraph interrupt 闭环、无头介入 | 中 |
| [第 8 章 多 Agent、协议与生产化](chapters/08-multi-agent-production.md) | 子代理路由、三协议全景、线程持久化、认证、部署与排查 | 重 |

> 初稿 8 章规划(2026-10-24)于 2026-10-31 启动编写时依官方 v2 文档细化:原「流式输出」并入共享状态(第 4 章),「工具透明度」明确为前端工具与生成式 UI(第 6 章),「自治 Agent 与生产化」拆解为多 Agent/协议/生产化(第 8 章);贯穿案例为跨境电商卖家运营台「星帆工作台」。

---

元数据(bookId / title / tagline)以 `build/books/registry.mjs` 为准。
