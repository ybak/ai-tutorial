/**
 * ragflow.mjs — 《RAGFlow:从入门到进阶》书配置
 *
 * 第三本 published 书(书架第三格,2026-10-27 立项并成稿)。结构与 mcp.mjs 一致:
 * - book:书级元数据 + 渲染层文案字段 + chaptersDir/assetsDir 等路径约定
 * - book.PARTS:4 篇 13 章(基于官方文档撰写的对照书,sources 记录各章
 *   对应的官方仓库 docs/ 路径,供溯源与未来 --check 用)
 * - book.buildLinkMap():无源文档链接映射,返回空 Map
 * - book.EXCLUDED_SOURCES:空
 * - legacyRootChapters: false(本仓库新增的书,不拥有旧站点根 chapters/ 路径)
 *
 * 版本基线:官方 docs v1.0.0-rc2(2026-10-16),核实日期 2026-10-27。
 */

export const book = {
  bookId: 'ragflow',
  status: 'published',
  title: 'RAGFlow:从入门到进阶',
  subtitle: '从搭建知识库到生产级检索调优',
  date: '2026-10-27',
  tagline: 'RAG 引擎实战,从搭建知识库到生产级检索调优',
  sourceNote: '基于 RAGFlow 官方仓库文档(v1.0.0-rc2,2026-10-16)撰写,含运营实践视角;代码示例未实测',
  sourceDescription: 'RAGFlow 官方仓库 infiniflow/ragflow 的 docs/ 目录(v1.0.0-rc2)',
  licenseNote: 'RAGFlow 文档以 Apache-2.0 许可发布;本书为学习整理稿,遵循本仓库整体许可证分发。',
  trademarkNote: 'RAGFlow 及相关商标归其权利人所有;本书与 RAGFlow 项目及 InfiniFlow 官方无隶属关系。',
  chaptersDir: 'books/ragflow/chapters',
  assetsDir: 'books/ragflow/assets',
  demoGithubBase: 'https://github.com/ybak/ai-tutorial/blob/main/books/ragflow/demo/',
  pdfFileName: 'RAGFlow-从入门到进阶.pdf',
  legacyRootChapters: false,
};

const PARTS = [
  { id: "part-1", title: "第一篇 认识与上线", chapters: [
    { file: "01-overview.md", chapter: 1, title: "初识 RAGFlow", sources: ["docs/basics/rag.md", "docs/quickstart.mdx", "docs/references/glossary.mdx"] },
    { file: "02-deploy-models.md", chapter: 2, title: "部署与模型通道", sources: ["docs/quickstart.mdx", "docs/administrator/setup/configuration.md", "docs/guides/models/llm_api_key_setup.md", "docs/guides/models/deploy_local_llm.mdx", "docs/develop/launch_ragflow_from_source.md"] },
  ]},
  { id: "part-2", title: "第二篇 知识库构建", chapters: [
    { file: "03-dataset-basics.md", chapter: 3, title: "数据集:知识库的载体", sources: ["docs/guides/dataset/dataset_overview.md", "docs/guides/dataset/dataset_list_and_creation.md", "docs/guides/dataset/files_dataset_document_management.md", "docs/guides/dataset/metadata_management.md", "docs/guides/file/file.md", "docs/guides/data_source/overview_and_page_management.md", "docs/guides/data_source/add_to_knowledge_base_and_sync.md"] },
    { file: "04-parsing-chunking.md", chapter: 4, title: "解析与切片:从文档到 Chunk", sources: ["docs/guides/dataset/configuration.md", "docs/guides/dataset/chunk_parsing_results_and_knowledge_fragment_management.md", "docs/guides/dataset/notes_and_faqs.md"] },
    { file: "05-enrichment-indexing.md", chapter: 5, title: "检索增强与索引", sources: ["docs/guides/dataset/configuration.md", "docs/guides/dataset/retrieval_testing.md"] },
    { file: "06-knowledge-compilation.md", chapter: 6, title: "知识编译与知识工件", sources: ["docs/guides/knowledge_compilation/overview.md", "docs/guides/knowledge_compilation/built_in_templates_and_dedicated_configuration.md", "docs/guides/knowledge_compilation/apply_knowledge_compilation_template.md", "docs/guides/knowledge_compilation/basic_information_configuration.md", "docs/guides/knowledge_compilation/faq.md", "docs/guides/dataset/artifacts_knowledge_artifact_generation_and_management.md", "docs/basics/agent_context_engine.md"] },
    { file: "07-retrieval-tuning.md", chapter: 7, title: "检索测试与调优", sources: ["docs/guides/dataset/retrieval_testing.md", "docs/guides/search/search_settings.md", "docs/guides/dataset/configuration.md"] },
  ]},
  { id: "part-3", title: "第三篇 消费与集成", chapters: [
    { file: "08-chat-assistant.md", chapter: 8, title: "聊天助手与会话", sources: ["docs/guides/chat/feature_overview_and_creation.md", "docs/guides/chat/chat_configuration.md", "docs/guides/chat/using_chat_sessions.md"] },
    { file: "09-search-channels.md", chapter: 9, title: "搜索应用与接入渠道", sources: ["docs/guides/search/create_search.md", "docs/guides/chatchannel/chat_channels_overview.md", "docs/guides/chatchannel/connect_chat.md", "docs/guides/chatchannel/channel_access_and_configuration.md", "docs/guides/agent/embed_into_web_pages.md"] },
    { file: "10-agent-workflow.md", chapter: 10, title: "Agent 与工作流", sources: ["docs/guides/agent/agent_overview.md", "docs/guides/agent/understand_the_canvas.md", "docs/guides/agent/creation_and_management.md", "docs/guides/agent/agent_workflow/basic_component.md", "docs/guides/agent/agent_workflow/tool_components.md", "docs/guides/agent/ingestion_pipeline/create_ingestion_pipeline.md", "docs/guides/memory/create_memory.md", "docs/guides/memory/connect_to_an_agent.md", "docs/guides/agent/quickstarts/build_customer_support_agent.md"] },
    { file: "11-api-mcp.md", chapter: 11, title: "对外集成:API 与 MCP", sources: ["docs/references/http_api_reference.md", "docs/references/python_api_reference.md", "docs/develop/acquire_ragflow_api_key.md", "docs/develop/mcp/overview.md", "docs/develop/mcp/use_ragflow_as_mcp_server.md", "docs/develop/mcp/connect_external_mcp_servers.md"] },
  ]},
  { id: "part-4", title: "第四篇 生产与运营", chapters: [
    { file: "12-operations.md", chapter: 12, title: "生产运维", sources: ["docs/administrator/setup/configuration.md", "docs/administrator/monitoring/tracing.mdx", "docs/administrator/upgrade_and_migration/start_here.md", "docs/administrator/upgrade_and_migration/upgrade_from_v0_to_v1.md", "docs/administrator/upgrade_and_migration/backup_and_restore_v1.md", "docs/administrator/management/ragflow_cli.md", "docs/administrator/management/admin_ui/before_you_begin.md", "docs/administrator/sandbox/overview.md", "docs/administrator/setup/configure_ssl_certificates.md"] },
    { file: "13-team-governance.md", chapter: 13, title: "团队协作与知识库运营", sources: ["docs/guides/team/permission_system_overview/index.md", "docs/guides/team/permission_system_overview/permission_effective_rules.md", "docs/guides/team/permission_system_overview/team_and_resource_permissions.md", "docs/guides/team/sharing_scope_configuration/open_source_edition_sharing_scope_configuration.md", "docs/guides/team/sharing_scope_configuration/share_knowledge_bases.md", "docs/guides/dataset/logs.md", "docs/faq.mdx"] },
  ]},
];

/**
 * 无源文档链接映射,返回空 Map(接口与 agentscope-java.book.buildLinkMap 对齐)。
 * @returns {Map<string, string>} 空 Map
 */
function buildLinkMap() {
  return new Map();
}

// 构建映射类字段收敛为 book 字段(与 agentscope-java.mjs / mcp.mjs 同款,所有消费方从 book 出发)
Object.assign(book, { PARTS, EXCLUDED_SOURCES: [], buildLinkMap });
