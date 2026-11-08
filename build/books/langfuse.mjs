/**
 * langfuse.mjs — 《Langfuse:LLM 可观测与评估》书配置
 *
 * 第五本成稿书(2026-11-08 立项成稿)。结构与 ragflow.mjs / fastgpt.mjs 一致:
 * - book:书级元数据 + chaptersDir/assetsDir 路径约定
 * - book.PARTS:4 篇 13 章(基于官方文档与本机 Langfuse v4.76.0 实测撰写,
 *   sources 记录各章对应的官方文档路径,供溯源与未来 --check 用)
 * - book.buildLinkMap():无源文档链接映射,返回空 Map
 * - book.EXCLUDED_SOURCES:空
 * - legacyRootChapters: false(本仓库新增的书,不拥有旧站点根 chapters/ 路径)
 *
 * 版本基线:Langfuse v4.76.0 + Python SDK 5.2.0(2026-11-08 核实)。
 * 成稿统检通过后翻 published 迁入 BUILDABLE_BOOKS(同 fastgpt 流程)。
 */

export const book = {
  bookId: 'langfuse',
  status: 'published',
  title: 'Langfuse:LLM 可观测与评估',
  subtitle: '追踪、评估与 Prompt 管理,从自托管到质量工程',
  date: '2026-11-08',
  tagline: 'LLM 应用的追踪、评估与 Prompt 管理,测试/运维/运营共用一本手册',
  sourceNote: '基于 Langfuse 官方文档(v4.76.0)与本机 Docker 自托管实例实测撰写;主链路已实测并配图;兼容性边界(如 RAGFlow rc2 集成)如实记录',
  sourceDescription: 'Langfuse 官方文档 langfuse.com/docs(v4.76.0)与 langfuse/langfuse 仓库',
  licenseNote: 'Langfuse 核心以 MIT 许可发布(部分功能 EE);本书为学习整理稿,遵循本仓库整体许可证分发。',
  trademarkNote: 'Langfuse 及相关商标归 Langfuse 项目方所有;本书与 Langfuse 官方无隶属关系。',
  chaptersDir: 'books/langfuse/chapters',
  assetsDir: 'books/langfuse/assets',
  demoGithubBase: 'https://github.com/ybak/ai-tutorial/blob/main/books/langfuse/demo/',
  pdfFileName: 'Langfuse-LLM可观测与评估.pdf',
  legacyRootChapters: false,
};

const PARTS = [
  { id: "part-1", title: "第一篇 认知与搭建", chapters: [
    { file: "01-overview.md", chapter: 1, title: "初识 Langfuse", sources: ["docs/index.mdx", "docs/observability/overview.mdx", "docs/compatibility.mdx", "docs/v4.mdx"] },
    { file: "02-deploy.md", chapter: 2, title: "本地部署", sources: ["self-hosting/index.mdx", "self-hosting/deployment/docker-compose.mdx", "self-hosting/configuration/index.mdx", "self-hosting/upgrade/versioning.mdx"] },
    { file: "03-quickstart.md", chapter: 3, title: "快速开始", sources: ["docs/observability/sdk/overview.mdx", "docs/languages/python/index.mdx", "docs/observability/sdk/upgrade-path.mdx"] },
  ]},
  { id: "part-2", title: "第二篇 追踪与监控", chapters: [
    { file: "04-tracing.md", chapter: 4, title: "Trace 模型与链路追踪", sources: ["docs/observability/concepts/traces.mdx", "docs/observability/concepts/sessions.mdx", "docs/observability/best-practices.mdx", "docs/observability/features/log-levels.mdx", "docs/observability/features/tags.mdx"] },
    { file: "05-cost-metrics.md", chapter: 5, title: "成本与性能监控", sources: ["docs/observability/features/token-cost.mdx", "docs/observability/analytics/overview.mdx", "docs/observability/features/alerts.mdx", "docs/observability/metrics-api/overview.mdx"] },
  ]},
  { id: "part-3", title: "第三篇 Prompt 与评估", chapters: [
    { file: "06-prompt-mgmt.md", chapter: 6, title: "Prompt 管理", sources: ["docs/prompt-management/overview.mdx", "docs/prompt-management/features/version-control.mdx", "docs/prompt-management/features/variables.mdx", "docs/prompt-management/features/playground.mdx", "docs/prompt-management/features/caching.mdx"] },
    { file: "07-datasets-scores.md", chapter: 7, title: "数据集与评分", sources: ["docs/evaluation/evaluation-methods/overview.mdx", "docs/evaluation/datasets.mdx", "docs/scores/overview.mdx", "docs/scores/annotation.mdx"] },
    { file: "08-experiments.md", chapter: 8, title: "实验与 A/B", sources: ["docs/evaluation/experiments/overview.mdx", "docs/evaluation/experiments/experiments-via-sdk.mdx", "docs/prompt-management/features/ab-testing.mdx", "docs/evaluation/experiments/compare-experiments.mdx"] },
    { file: "09-evals.md", chapter: 9, title: "自动化评估", sources: ["docs/evaluation/evaluation-methods/llm-judge.mdx", "docs/evaluation/evaluation-methods/code-evaluators.mdx", "docs/evaluation/evaluate-production.mdx"] },
  ]},
  { id: "part-4", title: "第四篇 生产与质量工程", chapters: [
    { file: "10-integrations.md", chapter: 10, title: "接入已有系统", sources: ["integrations/ragflow.md", "docs/integrations/openai.mdx", "docs/integrations/langchain.mdx", "docs/opentelemetry/overview.mdx", "docs/observability/sdk/migrate-custom-ingestion-to-v4.mdx"] },
    { file: "11-org-admin.md", chapter: 11, title: "多项目与团队管理", sources: ["docs/organisations/overview.mdx", "docs/rbac/overview.mdx", "docs/administration/auth.mdx"] },
    { file: "12-regression.md", chapter: 12, title: "Prompt 回归与质量门禁", sources: ["docs/evaluation/experiments/experiments-ci-cd.mdx", "docs/evaluation/experiments/compare-experiments.mdx"] },
    { file: "13-redteam.md", chapter: 13, title: "红队与安全评估", sources: ["原创(依据 OWASP LLM Top 10 与 Langfuse 评估能力)"] },
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
