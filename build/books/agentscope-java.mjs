/**
 * agentscope-java.mjs — 《AgentScope Java 2.0：从入门到进阶》书配置（Task 1）
 *
 * 单一职责：数据。本书的全部构建参数集中于此：
 * - book：书级元数据（bookId/status/title/tagline/目录约定/PDF 文件名等），
 *   供 registry 注册与构建参数化（路径推导、--book CLI）使用；构建映射类
 *   字段（PARTS/buildLinkMap/EXCLUDED_SOURCES）也收敛在其上（Ruling-4），
 *   消费方一律从 book 出发：book.PARTS / book.buildLinkMap() / book.EXCLUDED_SOURCES。
 * - book 的渲染层文案字段（sourceNote/sourceDescription/licenseNote/trademarkNote）：
 *   封面整合说明与出版说明的来源/许可证/商标段随书取材，渲染层零硬编码
 *   （第二本书接入不会静默错挂 agentscope 文案）。
 * - book.PARTS：7 篇 44 章 + 序言 + 附录 2 的「章节文件 ← 源文件」映射
 *   （`sources` 相对 `agentscope-java/docs/v2/zh/`，正斜杠）。
 * - book.buildLinkMap()：由全部 sources 生成站内链接 → 章节引用查找表。
 *   源文档里链接前缀格式是 `/v2/zh/<path>`（无 .md），对应源路径
 *   `agentscope-java/docs/v2/zh/<path>.md`。
 * - book.EXCLUDED_SOURCES：Global Constraints 排除清单（刻意不收录的源文件），
 *   供 build.mjs --check 区分「指向排除文件的链接」与真未解析链接。
 *
 * 渲染层（book.html 封面/<title>、站点 header/封面）的书名/副题/日期统一取
 * book.title/subtitle/date（半角冒号形态），不再另设模块级 BOOK——避免渲染层
 * 绕过 book 配置、第二本书接入时静默错挂。
 */

export const book = {
  bookId: 'agentscope-java',
  status: 'published',
  title: 'AgentScope Java 2.0:从入门到进阶',
  subtitle: '由浅入深的智能体开发教程',
  date: '2026-10-11',
  tagline: '7 篇 44 章,从第一个 Agent 到生产级 Agent 平台',
  // 渲染层文案（封面整合说明 / 出版说明的来源、许可证、商标段）：随书配置，
  // 封面与出版说明从这些字段取材，渲染层零硬编码（第二本书接入不串挂本书文案）
  sourceNote: '基于 AgentScope Java v2 官方文档整合',
  sourceDescription: 'AgentScope 官方仓库 agentscope-java 的中文文档（docs/v2/zh 目录）',
  licenseNote: '原项目以 Apache License 2.0 许可证发布（见 agentscope-java/LICENSE）；本书作为该文档的学习整理稿，遵循同一许可证分发。',
  trademarkNote: 'AgentScope 及相关商标归其权利人所有；本书与 Apache 项目官方无隶属关系。',
  chaptersDir: 'books/agentscope-java/chapters',
  assetsDir: 'books/agentscope-java/assets',
  demoGithubBase: 'https://github.com/ybak/ai-tutorial/blob/main/books/agentscope-java/demo/',
  srcDir: '../agentscope-java/docs/v2/zh',
  pdfFileName: 'AgentScope-Java-2.0-从入门到进阶.pdf',
  // 旧站点根 chapters/ 路径的所有权标记（本书专用）：后续任务据此决定旧路径重定向 stub 的生成归属。
  legacyRootChapters: true,

  // 构建映射类字段（原 manifest.mjs 的 PARTS/EXCLUDED_SOURCES/buildLinkMap）
  // 定义在本对象之后（数据段较长，保持原位），文件末尾统一挂载到 book 上。
};

const PARTS = [
  { id: "part-0", title: "序言", intro: "preface.md", chapters: [
    { file: "preface.md", chapter: null, title: "序言：AgentScope 2.0 与如何使用本书", sources: ["intro.md", "docs/index.md"] },
  ]},
  { id: "part-1", title: "第一篇 起步", intro: "part-1-intro.md", chapters: [
    { file: "01-overview.md", chapter: 1, title: "初识 AgentScope 2.0", sources: ["docs/index.md"] },
    { file: "02-quickstart.md", chapter: 2, title: "快速开始", sources: ["docs/quickstart.md"] },
    { file: "03-concept-map.md", chapter: 3, title: "核心概念地图", sources: ["docs/building-blocks/agent.md", "docs/harness/architecture.md"] },
  ]},
  { id: "part-2", title: "第二篇 核心构建块", intro: "part-2-intro.md", chapters: [
    { file: "04-agent.md", chapter: 4, title: "Agent 与 ReAct 循环", sources: ["docs/building-blocks/agent.md"] },
    { file: "05-message-event.md", chapter: 5, title: "消息与事件", sources: ["docs/building-blocks/message-and-event.md"] },
    { file: "06-model.md", chapter: 6, title: "模型接入", sources: ["docs/building-blocks/model.md"] },
    { file: "07-tool.md", chapter: 7, title: "工具", sources: ["docs/building-blocks/tool.md"] },
    { file: "08-context.md", chapter: 8, title: "上下文", sources: ["docs/building-blocks/context.md"] },
    { file: "09-middleware.md", chapter: 9, title: "中间件", sources: ["docs/building-blocks/middleware.md"] },
    { file: "10-permission.md", chapter: 10, title: "权限系统与人工介入", sources: ["docs/building-blocks/permission-system.md"] },
  ]},
  { id: "part-3", title: "第三篇 Harness 工程能力", intro: "part-3-intro.md", chapters: [
    { file: "11-architecture.md", chapter: 11, title: "Harness 架构深入", sources: ["docs/harness/architecture.md"] },
    { file: "12-workspace.md", chapter: 12, title: "工作区与文件系统", sources: ["docs/harness/workspace.md", "docs/harness/filesystem.md"] },
    { file: "13-context-mgmt.md", chapter: 13, title: "上下文管理", sources: ["docs/harness/context.md"] },
    { file: "14-memory.md", chapter: 14, title: "记忆", sources: ["docs/harness/memory.md"] },
    { file: "15-skill.md", chapter: 15, title: "技能（Skill）", sources: ["docs/harness/skill.md"] },
    { file: "16-subagent.md", chapter: 16, title: "子 Agent 协作", sources: ["docs/harness/subagent.md"] },
    { file: "17-plan-mode.md", chapter: 17, title: "计划模式", sources: ["docs/harness/plan-mode.md"] },
    { file: "18-sandbox.md", chapter: 18, title: "沙箱执行", sources: ["docs/harness/sandbox.md"] },
    { file: "19-session-log.md", chapter: 19, title: "会话日志与恢复", sources: ["docs/harness/session-log.md"] },
    { file: "20-channel.md", chapter: 20, title: "渠道（Channel）", sources: ["docs/harness/channel.md"] },
  ]},
  { id: "part-4", title: "第四篇 生态与集成", intro: "part-4-intro.md", chapters: [
    { file: "21-model-providers.md", chapter: 21, title: "模型提供商精编", sources: ["integration/model/index.md","integration/model/openai.md","integration/model/openai-official.md","integration/model/deepseek.md","integration/model/glm.md","integration/model/kimi.md","integration/model/minimax.md","integration/model/dashscope.md","integration/model/gemini.md","integration/model/anthropic.md","integration/model/ollama.md"] },
    { file: "22-rag.md", chapter: 22, title: "RAG 集成", sources: ["integration/rag/index.md","integration/rag/overview.md","integration/rag/simple.md","integration/rag/dify.md","integration/rag/haystack.md","integration/rag/ragflow.md","integration/rag/bailian.md"] },
    { file: "23-memory-integrations.md", chapter: 23, title: "长期记忆集成", sources: ["integration/memory/index.md","integration/memory/overview.md","integration/memory/mem0.md","integration/memory/bailian.md","integration/memory/reme.md"] },
    { file: "24-storage-distributed.md", chapter: 24, title: "会话存储与分布式部署", sources: ["integration/session/index.md","integration/session/overview.md","integration/session/mysql.md","integration/session/redis.md","integration/session/oss.md","integration/distributed/index.md","integration/distributed/redis.md","integration/distributed/jdbc.md","integration/distributed/mongodb.md","integration/distributed/oss.md"] },
    { file: "25-im-channels.md", chapter: 25, title: "IM 渠道集成", sources: ["integration/channel/index.md","integration/channel/dingtalk.md","integration/channel/feishu.md","integration/channel/wecom.md","integration/channel/github.md","integration/channel/gitlab.md"] },
    { file: "26-protocols.md", chapter: 26, title: "Agent 协议", sources: ["integration/protocol/index.md","integration/protocol/overview.md","integration/protocol/a2a.md","integration/protocol/agent-protocol.md","integration/protocol/agui.md"] },
    { file: "27-skill-repos.md", chapter: 27, title: "Skill 仓库", sources: ["integration/skill/index.md","integration/skill/overview.md","integration/skill/git-repository.md","integration/skill/mysql-repository.md","integration/skill/postgresql-repository.md"] },
    { file: "28-infra-ecosystem.md", chapter: 28, title: "基础设施与生态工具", sources: ["integration/overview.md","integration/infrastructure/index.md","integration/infrastructure/overview.md","integration/infrastructure/higress.md","integration/infrastructure/nacos.md","integration/infrastructure/scheduler.md","integration/ecosystem/index.md","integration/ecosystem/overview.md","integration/ecosystem/studio.md","integration/ecosystem/chat-completions-web.md","integration/ecosystem/training.md"] },
  ]},
  { id: "part-5", title: "第五篇 AgentScope Service 平台", intro: "part-5-intro.md", chapters: [
    { file: "29-service-deploy.md", chapter: 29, title: "Service 概览与部署", sources: ["service/index.md","service/quickstart.md","service/environments.md","service/access.md","service/kubernetes.md","service/runtime-host.md"] },
    { file: "30-managed-agents.md", chapter: 30, title: "创建并运行托管 Agent", sources: ["service/create-managed-agent.md","service/managed-agent-configuration.md","service/hosted-agent-configuration.md","service/connect-hosted-agent.md","service/register-agentscope-agent.md","service/external-agent.md","service/workspaces.md"] },
    { file: "31-session-api.md", chapter: 31, title: "Session API：从调用到交付", sources: ["service/service-api.md","service/api-reference.md","service/agent-api-chat.md","service/sessions.md","service/sse-events.md","service/session-event-log.md","service/files.md","service/memory.md","service/vault.md","service/tools.md","service/channels.md"] },
    { file: "32-orchestration.md", chapter: 32, title: "编排：Team 与 Workflow", sources: ["service/orchestration.md","service/create-team.md","service/team-configuration.md","service/workflows.md"] },
    { file: "33-operations.md", chapter: 33, title: "运维与运营", sources: ["service/operations.md","service/automation.md","service/issues.md","service/console/index.md","service/configuration.md","service/usecases.md"] },
    { file: "34-service-cases.md", chapter: 34, title: "Service 实战案例", sources: ["service/cases/agent-as-tool.md","service/cases/business-assistant.md","service/cases/document-verification.md","service/cases/in-product-delivery.md","service/cases/incident-to-pr.md","service/cases/scheduled-research.md"] },
  ]},
  { id: "part-6", title: "第六篇 进阶：JEV 语义判断", intro: "part-6-intro.md", chapters: [
    { file: "35-jev-concepts.md", chapter: 35, title: "JEV 概念", sources: ["jev/index.md","jev/concepts.md"] },
    { file: "36-jev-integration.md", chapter: 36, title: "接入方式", sources: ["jev/guides/client.md","jev/guides/harness-runtime.md","jev/guides/agent-integration-example.md"] },
    { file: "37-jev-apis.md", chapter: 37, title: "核心能力 API", sources: ["jev/guides/tool-selection-api.md","jev/guides/tool-guard-api.md","jev/guides/context-compaction-api.md","jev/guides/context-planner-api.md","jev/guides/context-archive.md","jev/guides/memory-api.md","jev/guides/supervision-api.md","jev/guides/supervision-evidence.md","jev/guides/task-review.md","jev/guides/model-routing-api.md","jev/guides/phase-routing-api.md","jev/guides/team-routing.md","jev/guides/evidence-pipeline-api.md","jev/guides/rag-api.md","jev/guides/knowledge-adapter-api.md","jev/guides/content-guardrail-api.md","jev/guides/answer-refinement-api.md","jev/guides/draft-pipeline-api.md","jev/guides/code-review-api.md","jev/guides/browser-execution-api.md","jev/guides/browser-proposals.md","jev/guides/application-api.md","jev/guides/support-api.md","jev/guides/service-api.md"] },
    { file: "38-jev-evaluation.md", chapter: 38, title: "评估与运营", sources: ["jev/guides/judge-api.md","jev/guides/trace-evaluation-api.md","jev/guides/metric-definitions.md","jev/guides/evaluator-api.md","jev/evaluation.md","jev/operations.md","jev/sdk-reference.md"] },
  ]},
  { id: "part-7", title: "第七篇 生产实践", intro: "part-7-intro.md", chapters: [
    { file: "39-harness-series.md", chapter: 39, title: "如何构建 Agent Harness", sources: ["blogs/how-to-build-agent-harness/01-patterns.md","blogs/how-to-build-agent-harness/02-task-orchestration.md","blogs/how-to-build-agent-harness/03-context-and-state.md","blogs/how-to-build-agent-harness/04-controlled-execution.md"] },
    { file: "40-session-chat.md", chapter: 40, title: "最佳实践：可恢复会话聊天", sources: ["blogs/best-practices/session-chat.md"] },
    { file: "41-execution-control.md", chapter: 41, title: "会话执行控制与结构化决策", sources: ["blogs/session-execution-control.md","blogs/jev-structured-decision-for-agents.md"] },
    { file: "42-production.md", chapter: 42, title: "走向生产", sources: ["docs/others/going-to-production.md"] },
    // 本仓库原创案例，来源为 demo/cross-border-commerce；不映射上游行业博客。
    { file: "43-cases.md", chapter: 43, title: "跨境电商 Agent 多租户平台实战", sources: [] },
    { file: "44-faq.md", chapter: 44, title: "常见问题 FAQ", sources: ["docs/others/faq.md"] },
  ]},
  { id: "appendix", title: "附录", intro: null, chapters: [
    { file: "appendix-a-release-notes.md", chapter: null, title: "附录 A：Release Notes（v2）", sources: ["docs/others/release-notes.md"] },
    { file: "appendix-b-glossary.md", chapter: null, title: "附录 B：术语表", sources: [] },
  ]},
];

/** Global Constraints 排除清单（相对 docs/v2/zh/，含 .md 后缀） */
const EXCLUDED_SOURCES = [
  // 第 43 章改为本仓库 Demo 综合实战，原行业博客不再收录。
  "blogs/usecases/logistics.md",
  "blogs/usecases/finxscope.md",
  "blogs/usecases/aidc-logistics.md",
  "blogs/agentscope-v2-coding-agent.md",
  "blogs/agentscope-v1-builder.md",
  "blogs/agentscope-v1-harness.md",
  "docs/change-log.md",
  "blogs/agentscope-v2-release.md",
  "blogs/agentscope-v2-explained.md",
  "blogs/agentscope-service-release.md",
  "blogs/agentscope-service-release-tech.md",
  "blogs/managed-agents-agentscope-rumtime.md",
  "blogs/usecases/index.md",
  "community/contributors.md",
];

/**
 * 站内链接 → 章节引用映射（供 clean.mjs 的 ctx.linkMap 使用）。
 *
 * 每个 source 注册两条键：`/v2/zh/<path>` 与尾斜杠变体 `/v2/zh/<path>/`。
 * 同一 source 出现在多章时后注册者覆盖先者——PARTS 顺序即阅读顺序，
 * 正文章节（如 docs/index.md → 第 1 章）覆盖序言里的同一 source。
 * 无章号条目（序言/附录）用其标题作引用文本。
 *
 * @returns {Map<string, string>} "/v2/zh/xxx" → "第 N 章"
 */
function buildLinkMap() {
  const map = new Map();
  for (const part of PARTS) {
    for (const ch of part.chapters) {
      const ref = ch.chapter != null ? `第 ${ch.chapter} 章` : ch.title;
      for (const src of ch.sources) {
        const key = `/v2/zh/${src.replace(/\.md$/, '')}`;
        map.set(key, ref);
        map.set(`${key}/`, ref);
      }
    }
  }
  return map;
}

// Ruling-4：构建映射类字段收敛为 book 字段——所有消费方从 book 出发
// （book.PARTS / book.buildLinkMap() / book.EXCLUDED_SOURCES），模块级直引清零。
const EN_PARTS = [
  { id: "part-0", title: "Preface", intro: "preface.md", chapters: [
    { file: "preface.md", chapter: null, title: "Preface: AgentScope 2.0 and How to Use This Book", sources: ["intro.md", "docs/index.md"] },
  ]},
  { id: "part-1", title: "Part 1 Getting Started", intro: "part-1-intro.md", chapters: [
    { file: "01-overview.md", chapter: 1, title: "Getting to Know AgentScope 2.0", sources: ["docs/index.md"] },
    { file: "02-quickstart.md", chapter: 2, title: "Quick Start", sources: ["docs/quickstart.md"] },
    { file: "03-concept-map.md", chapter: 3, title: "Core Concept Map", sources: ["docs/building-blocks/agent.md", "docs/harness/architecture.md"] },
  ]},
];

Object.assign(book, {
  PARTS,
  EXCLUDED_SOURCES,
  buildLinkMap,
  locales: {
    en: {
      title: 'AgentScope Java 2.0: From First Steps to Production',
      subtitle: 'A hands-on tutorial for building agents',
      tagline: 'English edition, Part 1: from a first look at AgentScope 2.0 to a running agent',
      sourceNote: 'Reorganized from the official AgentScope Java v2 Chinese documentation into a tutorial. The cross-border commerce demo records its hands-on scope and remaining limits in that demo\'s verification notes',
      sourceDescription: 'The Chinese documentation under docs/v2/zh in the official AgentScope repository agentscope-java',
      licenseNote: 'The upstream project is released under the Apache License 2.0 (see agentscope-java/LICENSE). This book is a study reorganization of that documentation and is distributed under the same license.',
      trademarkNote: 'AgentScope and related trademarks belong to their owners. This book is not affiliated with the Apache project or its maintainers.',
      date: '2026-10-11',
      chaptersDir: 'books/agentscope-java/en/chapters',
      PARTS: EN_PARTS,
    },
  },
});
