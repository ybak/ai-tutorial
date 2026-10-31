/**
 * copilotkit.mjs — 《CopilotKit:从前端接入 AI Agent》书配置
 *
 * 第四本 published 书(书架第四格,2026-10-31 立项并成稿)。结构与 ragflow.mjs 一致:
 * - book:书级元数据 + 渲染层文案字段 + chaptersDir/assetsDir 等路径约定
 * - book.PARTS:4 篇 8 章(基于官方文档撰写的对照书,sources 记录各章
 *   对应的官方仓库 showcase/shell-docs/src/content/docs/ 路径,供溯源与未来 --check 用)
 * - book.buildLinkMap():无源文档链接映射,返回空 Map
 * - book.EXCLUDED_SOURCES:空
 * - legacyRootChapters: false(本仓库新增的书,不拥有旧站点根 chapters/ 路径)
 *
 * 版本基线:CopilotKit v2 官方文档(2026-10-31 稀疏克隆核实)。
 */

export const book = {
  bookId: 'copilotkit',
  status: 'published',
  title: 'CopilotKit:从前端接入 AI Agent',
  subtitle: '在 React 应用中植入 copilot 体验,从组件到自治 Agent',
  date: '2026-10-31',
  tagline: '前端 AI 集成实战,让智能体能力以自然的方式进入业务界面',
  sourceNote: '基于 CopilotKit 官方仓库文档(v2,2026-10-31)撰写,面向新手改写;代码示例未实测',
  sourceDescription: 'CopilotKit 官方仓库 CopilotKit/CopilotKit 的 showcase/shell-docs/src/content/docs/ 目录(v2)',
  licenseNote: 'CopilotKit 文档以 MIT 许可发布;本书为学习整理稿,遵循本仓库整体许可证分发。',
  trademarkNote: 'CopilotKit 及相关商标归其权利人所有;本书与 CopilotKit 项目及官方无隶属关系。',
  chaptersDir: 'books/copilotkit/chapters',
  assetsDir: 'books/copilotkit/assets',
  demoGithubBase: 'https://github.com/ybak/ai-tutorial/blob/main/books/copilotkit/demo/',
  pdfFileName: 'CopilotKit-从前端接入AI-Agent.pdf',
  legacyRootChapters: false,
};

const PARTS = [
  { id: "part-1", title: "第一篇 认识与起步", chapters: [
    { file: "01-overview.md", chapter: 1, title: "初识 CopilotKit", sources: ["showcase/shell-docs/src/content/docs/concepts/architecture.mdx", "showcase/shell-docs/src/content/docs/concepts/oss-vs-enterprise.mdx", "showcase/shell-docs/src/content/docs/agentic-protocols/ag-ui.mdx", "showcase/shell-docs/src/content/docs/agent-config.mdx"] },
    { file: "02-quick-start.md", chapter: 2, title: "快速开始:二十分钟跑通第一个 copilot", sources: ["showcase/shell-docs/src/content/docs/frontends/react-spa.mdx", "showcase/shell-docs/src/content/docs/integrations/built-in-agent/quickstart.mdx", "showcase/shell-docs/src/content/docs/backend/runtime-endpoints.mdx"] },
  ]},
  { id: "part-2", title: "第二篇 界面与状态", chapters: [
    { file: "03-components-ui.md", chapter: 3, title: "预置组件与自定义聊天界面", sources: ["showcase/shell-docs/src/content/docs/prebuilt-components/sidebar.mdx", "showcase/shell-docs/src/content/docs/prebuilt-components/chat.mdx", "showcase/shell-docs/src/content/docs/prebuilt-components/popup.mdx", "showcase/shell-docs/src/content/docs/custom-look-and-feel/css.mdx", "showcase/shell-docs/src/content/docs/custom-look-and-feel/headless-ui.mdx", "showcase/shell-docs/src/content/docs/custom-look-and-feel/slots.mdx", "showcase/shell-docs/src/content/docs/programmatic-control.mdx"] },
    { file: "04-shared-state.md", chapter: 4, title: "共享状态:让 Agent 看见并操作你的界面", sources: ["showcase/shell-docs/src/content/docs/shared-state.mdx", "showcase/shell-docs/src/content/docs/shared-state/agent-readonly.mdx", "showcase/shell-docs/src/content/docs/shared-state/rendering-in-app.mdx", "showcase/shell-docs/src/content/docs/shared-state/streaming.mdx", "showcase/shell-docs/src/content/docs/concepts/which-hook.mdx"] },
  ]},
  { id: "part-3", title: "第三篇 Agent 接入与人机协同", chapters: [
    { file: "05-backend-agents.md", chapter: 5, title: "接入后端 Agent:Runtime 与框架集成", sources: ["showcase/shell-docs/src/content/docs/backend/copilot-runtime.mdx", "showcase/shell-docs/src/content/docs/backend/agent-runner.mdx", "showcase/shell-docs/src/content/docs/backend/custom-agent.mdx", "showcase/shell-docs/src/content/docs/backend/runtime-endpoints.mdx", "showcase/shell-docs/src/content/docs/backend/message-history.mdx", "showcase/shell-docs/src/content/docs/integrations/langgraph/quickstart.mdx", "showcase/shell-docs/src/content/docs/integrations/langgraph/index.mdx", "showcase/shell-docs/src/content/docs/agent-config.mdx"] },
    { file: "06-frontend-tools-generative-ui.md", chapter: 6, title: "前端工具与生成式 UI", sources: ["showcase/shell-docs/src/content/docs/frontend-tools.mdx", "showcase/shell-docs/src/content/docs/generative-ui/index.mdx", "showcase/shell-docs/src/content/docs/generative-ui/tool-based.mdx", "showcase/shell-docs/src/content/docs/generative-ui/tool-rendering.mdx", "showcase/shell-docs/src/content/docs/generative-ui/state-rendering.mdx", "showcase/shell-docs/src/content/docs/generative-ui/display.mdx", "showcase/shell-docs/src/content/docs/generative-ui/interactive.mdx"] },
    { file: "07-hitl.md", chapter: 7, title: "人工介入:让人回到决策回路", sources: ["showcase/shell-docs/src/content/docs/human-in-the-loop/index.mdx", "showcase/shell-docs/src/content/docs/human-in-the-loop/governed-actions.mdx", "showcase/shell-docs/src/content/docs/human-in-the-loop/useInterrupt.mdx", "showcase/shell-docs/src/content/docs/human-in-the-loop/headless.mdx", "showcase/shell-docs/src/content/docs/integrations/langgraph/human-in-the-loop/interrupt-flow.mdx"] },
  ]},
  { id: "part-4", title: "第四篇 规模化与上线", chapters: [
    { file: "08-multi-agent-production.md", chapter: 8, title: "多 Agent、协议与生产化", sources: ["showcase/shell-docs/src/content/docs/multi-agent/subagents.mdx", "showcase/shell-docs/src/content/docs/agentic-protocols/ag-ui.mdx", "showcase/shell-docs/src/content/docs/agentic-protocols/a2a.mdx", "showcase/shell-docs/src/content/docs/agentic-protocols/mcp.mdx", "showcase/shell-docs/src/content/docs/agentic-protocols/ag-ui-middleware.mdx", "showcase/shell-docs/src/content/docs/threads-lifecycle.mdx", "showcase/shell-docs/src/content/docs/auth.mdx", "showcase/shell-docs/src/content/docs/deploy/aws-lambda.mdx", "showcase/shell-docs/src/content/docs/troubleshooting/common-issues.mdx"] },
  ]},
];

/**
 * 无源文档链接映射,返回空 Map(接口与 ragflow.book.buildLinkMap 对齐)。
 * @returns {Map<string, string>} 空 Map
 */
function buildLinkMap() {
  return new Map();
}

// 构建映射类字段收敛为 book 字段(与 agentscope-java.mjs / mcp.mjs / ragflow.mjs 同款,所有消费方从 book 出发)
Object.assign(book, { PARTS, EXCLUDED_SOURCES: [], buildLinkMap });
