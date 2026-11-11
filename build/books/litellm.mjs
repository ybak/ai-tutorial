/**
 * litellm.mjs — 《LiteLLM：多模型网关、配额与降级》书配置
 *
 * 2026-11-12 用官方镜像 main-stable 登录 Admin UI 后修订。
 * 开源核心（MIT）为主线，enterprise/ 不进必做步骤，不设置 LITELLM_LICENSE。
 * 侧栏显示 v1.169.0；同一次成功响应头 x-litellm-version 为 1.109.0。
 * 2026-11-11 的 pip 安装另记为 1.109.0。不要把这两个读数合成一个版本。
 * legacyRootChapters: false
 */

export const book = {
  bookId: 'litellm',
  status: 'published',
  title: 'LiteLLM：多模型网关、配额与降级',
  subtitle: '虚拟密钥、租户配额与降级，把现有 Java 客户端接到同一网关',
  date: '2026-11-12',
  tagline: '多模型路由、虚拟密钥与租户配额，把 AgentScope / Spring AI / Langfuse 接到同一网关',
  sourceNote: '基于 LiteLLM 官方文档，以及 2026-11-12 官方镜像 main-stable 的 Admin UI 实测（模拟上游、PostgreSQL 16，无厂商密钥）。侧栏显示 v1.169.0，同一次成功响应头为 x-litellm-version: 1.109.0',
  sourceDescription: 'LiteLLM 文档 docs.litellm.ai 与 BerriAI/litellm 仓库（核心 MIT，enterprise/ 另议）。界面核实 2026-11-12；pip 路径的状态码核实 2026-11-11',
  licenseNote: 'LiteLLM 核心以 MIT 许可发布；enterprise/ 目录为商业许可，不在本书必做步骤内。本书为学习整理稿，遵循本仓库整体许可证分发。',
  trademarkNote: 'LiteLLM 及相关商标归 BerriAI 所有；New API 归其权利人所有。本书与上述项目官方无隶属关系。',
  chaptersDir: 'books/litellm/chapters',
  assetsDir: 'books/litellm/assets',
  demoGithubBase: 'https://github.com/ybak/ai-tutorial/blob/main/books/litellm/demo/',
  pdfFileName: 'LiteLLM-多模型网关配额与降级.pdf',
  legacyRootChapters: false,
};

const PARTS = [
  { id: 'part-1', title: '第一篇 为什么平台需要网关', chapters: [
    { file: '01-keys-stay-out.md', chapter: 1, title: '业务服务里不该直接握着模型密钥', sources: ['docs/proxy/quick_start.md', 'docs/proxy/virtual_keys.md'] },
    { file: '02-run-the-proxy.md', chapter: 2, title: '把 LiteLLM Proxy 跑起来', sources: ['docs/proxy/quick_start.md', 'docs/proxy/docker_quick_start.md'] },
  ]},
  { id: 'part-2', title: '第二篇 密钥、配额与租户', chapters: [
    { file: '03-virtual-keys.md', chapter: 3, title: '虚拟密钥', sources: ['docs/proxy/virtual_keys.md'] },
    { file: '04-budgets-and-limits.md', chapter: 4, title: '团队预算与限流', sources: ['docs/proxy/team_budgets.md', 'docs/proxy/config_settings.md'] },
    { file: '05-tenant-on-the-gateway.md', chapter: 5, title: '租户隔离停在网关的哪一层', sources: ['docs/proxy/virtual_keys.md'] },
  ]},
  { id: 'part-3', title: '第三篇 路由与韧性', chapters: [
    { file: '06-model-alias.md', chapter: 6, title: '别名、部署和业务看见的模型名', sources: ['docs/proxy/configs.md', 'docs/proxy/load_balancing.md'] },
    { file: '07-fallback.md', chapter: 7, title: '降级、重试和负载', sources: ['docs/proxy/reliability.md', 'docs/proxy/load_balancing.md', 'docs/routing.md'] },
  ]},
  { id: 'part-4', title: '第四篇 接到现有平台', chapters: [
    { file: '08-java-clients.md', chapter: 8, title: '把 AgentScope 和 Spring AI 接到同一入口', sources: ['原创（对齐书架 AgentScope 第 6 章与 Spring AI OpenAI 参考文档）'] },
    { file: '09-langfuse.md', chapter: 9, title: '把调用轨迹接到 Langfuse', sources: ['docs/proxy/logging.md', 'docs/observability/langfuse_integration.md'] },
    { file: '10-boundaries.md', chapter: 10, title: '生产边界', sources: ['LICENSE', 'enterprise/LICENSE.md', 'docs/enterprise.md'] },
  ]},
];

function buildLinkMap() {
  return new Map();
}

Object.assign(book, { PARTS, EXCLUDED_SOURCES: [], buildLinkMap });
