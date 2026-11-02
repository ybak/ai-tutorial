/**
 * fastgpt.mjs — 《FastGPT:从入门到进阶》书配置
 *
 * 第四本 published 书(书架第四格,2026-11-01 立项)。结构与 ragflow.mjs 一致:
 * - book:书级元数据 + 渲染层文案字段 + chaptersDir/assetsDir 等路径约定
 * - book.PARTS:4 篇 13 章(基于官方文档撰写的对照书,sources 记录各章
 *   对应的官方仓库 document/content/ 路径,供溯源与未来 --check 用)
 * - book.buildLinkMap():无源文档链接映射,返回空 Map
 * - book.EXCLUDED_SOURCES:空
 * - legacyRootChapters: false(本仓库新增的书,不拥有旧站点根 chapters/ 路径)
 *
 * 版本基线:官方 docs v4.17.3(2026-11-01 核实)。
 * 2026-11-02 成稿统检通过后翻 published 迁入 BUILDABLE_BOOKS(同 ragflow 流程)。
 */

export const book = {
  bookId: 'fastgpt',
  status: 'published',
  title: 'FastGPT:从入门到进阶',
  subtitle: '知识库与工作流,从搭建到生产运营',
  date: '2026-11-01',
  tagline: '知识库问答与工作流编排实战,从搭建到生产运营',
  sourceNote: '基于 FastGPT 官方仓库文档(v4.17.3)撰写,含运营实践视角;代码示例未实测',
  sourceDescription: 'FastGPT 官方仓库 labring/FastGPT 的 document/content/ 目录(v4.17.3)',
  licenseNote: 'FastGPT 以 Apache-2.0 附加条件许可发布;本书为学习整理稿,遵循本仓库整体许可证分发。',
  trademarkNote: 'FastGPT 及相关商标归其权利人所有;本书与 FastGPT 项目及 labring 官方无隶属关系。',
  chaptersDir: 'books/fastgpt/chapters',
  assetsDir: 'books/fastgpt/assets',
  demoGithubBase: 'https://github.com/ybak/ai-tutorial/blob/main/books/fastgpt/demo/',
  pdfFileName: 'FastGPT-从入门到进阶.pdf',
  legacyRootChapters: false,
};

const PARTS = [
  { id: "part-1", title: "第一篇 认识与上线", chapters: [
    { file: "01-overview.md", chapter: 1, title: "初识 FastGPT", sources: ["guide/index.mdx", "guide/getting-started/index.mdx", "guide/getting-started/quick-start.mdx", "guide/version/opensource/intro.mdx", "guide/version/commercial.mdx", "guide/version/cloud/intro.mdx"] },
    { file: "02-deploy-models.md", chapter: 2, title: "部署与模型通道", sources: ["self-host/index.mdx", "self-host/deploy/docker.mdx", "self-host/config/env.mdx", "self-host/config/model/intro.mdx", "self-host/custom-models/ollama.mdx", "self-host/config/root-password.mdx"] },
  ]},
  { id: "part-2", title: "第二篇 知识库构建", chapters: [
    { file: "03-dataset-basics.md", chapter: 3, title: "知识库:从文档到知识", sources: ["guide/dataset/rag.mdx", "guide/dataset/faq.mdx"] },
    { file: "04-retrieval-tuning.md", chapter: 4, title: "检索方案与调优", sources: ["guide/dataset/dataset_engine.mdx", "self-host/milvus-bm25.mdx", "guide/dataset/faq.mdx"] },
    { file: "05-dataset-advanced.md", chapter: 5, title: "知识库进阶:同步、标签与权限", sources: ["guide/dataset/websync.mdx", "guide/dataset/collection_tags.mdx", "guide/dataset/collection_permission.mdx", "guide/dataset/third-party/api_dataset.mdx", "guide/dataset/third-party/dingtalk_dataset.mdx", "guide/dataset/third-party/lark_dataset.mdx", "guide/dataset/third-party/yuque_dataset.mdx", "guide/dataset/third-party/third_dataset.mdx"] },
  ]},
  { id: "part-3", title: "第三篇 应用构建与消费", chapters: [
    { file: "06-apps-agents.md", chapter: 6, title: "应用与对话 Agent", sources: ["guide/build/general/ai_settings.mdx", "guide/build/general/welcomeText.mdx", "guide/build/general/chat_input_guide.mdx", "guide/build/general/fileInput.mdx", "guide/build/general/voiceInput.mdx", "guide/build/agentv2/settings.mdx", "guide/build/agentv2/debug.mdx", "guide/build/agentv2/vm.mdx"] },
    { file: "07-workflow.md", chapter: 7, title: "工作流编排", sources: ["guide/build/workflow/intro.mdx", "guide/build/workflow/rules.mdx", "guide/build/workflow/assisted-generation.mdx", "guide/build/workflow/nodes/ai_chat.mdx", "guide/build/workflow/nodes/dataset_search.mdx", "guide/build/workflow/nodes/question_classify.mdx", "guide/build/workflow/nodes/tfswitch.mdx", "guide/build/workflow/nodes/http.mdx", "guide/build/workflow/nodes/loop.mdx", "guide/build/workflow/nodes/form_input.mdx", "guide/build/workflow/nodes/reply.mdx", "guide/build/workflow/nodes/text_editor.mdx", "guide/build/workflow/nodes/variable_update.mdx"] },
    { file: "08-tools-skills.md", chapter: 8, title: "工具与技能", sources: ["guide/build/tools/mcp_tools.mdx", "guide/build/skill/intro.mdx", "guide/build/skill/initialization.mdx", "guide/build/skill/development.mdx", "guide/build/skill/integration.mdx", "guide/build/skill/version.mdx", "plugin/index.mdx", "plugin/intro.mdx", "plugin/team-installation.mdx", "plugin/system-tool-development.mdx"] },
    { file: "09-publish-channels.md", chapter: 9, title: "应用发布与渠道", sources: ["guide/build/publish/link.mdx", "guide/build/publish/dingtalk.mdx", "guide/build/publish/feishu.mdx", "guide/build/publish/wecom.mdx", "guide/build/publish/wechat.mdx", "guide/build/publish/official_account.mdx", "guide/build/publish/mcp_server.mdx"] },
    { file: "10-openapi.md", chapter: 10, title: "对外集成:OpenAPI", sources: ["openapi/intro.mdx", "openapi/app.mdx", "openapi/chat.mdx", "openapi/dataset.mdx", "guide/build/publish/openapi.mdx"] },
  ]},
  { id: "part-4", title: "第四篇 生产与运营", chapters: [
    { file: "11-operations.md", chapter: 11, title: "生产运维", sources: ["self-host/config/object-storage.mdx", "self-host/config/sandbox/opensandbox.mdx", "self-host/config/signoz.mdx", "self-host/config/remote-debug-suite.mdx", "self-host/migration/docker_db.mdx", "self-host/migration/docker_mongo.mdx", "self-host/troubleshooting/attention.mdx", "self-host/troubleshooting/faq.mdx", "self-host/troubleshooting/methods.mdx", "self-host/troubleshooting/model-errors.mdx", "self-host/upgrading/4-17/4173.mdx"] },
    { file: "12-team-governance.md", chapter: 12, title: "团队协作与权限治理", sources: ["guide/workspace/team/team_roles_permissions.mdx", "guide/workspace/team/invitation_link.mdx", "guide/admin/sso.mdx", "guide/admin/teamMode.mdx"] },
    { file: "13-chat-operations-eval.md", chapter: 13, title: "对话运营与评测", sources: ["guide/chat/quoteList.mdx", "guide/chat/html.mdx", "guide/chat/htmlRendering.mdx", "guide/build/evaluation.mdx", "guide/build/faq.mdx", "faq/chat.mdx"] },
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
