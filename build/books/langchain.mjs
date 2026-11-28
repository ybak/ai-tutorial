/**
 * langchain.mjs — 《LangChain 与 LangGraph：把一次售后写成链，再写成图》
 *
 * bookId 用 langchain，不用 langgraph：一本同时写组合和图运行时，URL 跟书架其他书一样只占一个产品名。
 * 2026-11-27：Python 3.12，langchain 1.5.2，langgraph 1.2.24，无厂商密钥。
 * legacyRootChapters: false
 */

export const book = {
  bookId: 'langchain',
  status: 'published',
  title: 'LangChain 与 LangGraph：把一次售后写成链，再写成图',
  subtitle: '提示词、工具、状态图、检查点与人工确认，无厂商密钥的可复跑路径',
  date: '2026-11-27',
  tagline: '用 LangChain 写一次调用，用 LangGraph 把查单、循环和人工确认写成可续跑的图',
  sourceNote: '依据 LangChain 1.5.2 与 LangGraph 1.2.24 的公开接口，以及 2026-11-27 无厂商密钥的 demo 运行。没有供应商回复，没有界面截图',
  sourceDescription: 'LangChain / LangGraph 文档（docs.langchain.com）与 2026-11-27 安装的 langchain 1.5.2、langgraph 1.2.24',
  licenseNote: 'LangChain 与 LangGraph 以 MIT 许可发布。本书为学习整理稿，不随仓库分发其源码，遵循本仓库整体许可证。',
  trademarkNote: 'LangChain、LangGraph 及相关商标归其权利人所有。本书与 LangChain 项目方无隶属关系。',
  chaptersDir: 'books/langchain/chapters',
  assetsDir: 'books/langchain/assets',
  demoGithubBase: 'https://github.com/ybak/ai-tutorial/blob/main/books/langchain/demo/',
  pdfFileName: 'LangChain与LangGraph-链与图.pdf',
  legacyRootChapters: false,
};

const PARTS = [
  { id: 'part-1', title: '第一篇 把一次调用写成链', chapters: [
    { file: '01-chain-or-graph.md', chapter: 1, title: '链和图各管什么', sources: ['原创（LangChain 与 LangGraph 概览，2026-11-27）'] },
    { file: '02-first-chain.md', chapter: 2, title: '第一条链', sources: ['docs.langchain.com/oss/python/langchain/test/unit-testing'] },
    { file: '03-tools-and-agent.md', chapter: 3, title: '工具与一轮代理', sources: ['reference.langchain.com/python/langchain/agents/create_agent'] },
  ]},
  { id: 'part-2', title: '第二篇 把循环写成图', chapters: [
    { file: '04-state-nodes-edges.md', chapter: 4, title: '状态、节点与边', sources: ['docs.langchain.com/oss/python/langgraph'] },
    { file: '05-conditional-and-cycles.md', chapter: 5, title: '条件边与循环', sources: ['docs.langchain.com/oss/python/langgraph'] },
  ]},
  { id: 'part-3', title: '第三篇 停得住、续得上', chapters: [
    { file: '06-checkpoints.md', chapter: 6, title: '检查点', sources: ['docs.langchain.com/oss/python/langgraph/checkpointers', 'docs.langchain.com/oss/python/langgraph/add-memory'] },
    { file: '07-human-in-the-loop.md', chapter: 7, title: '人工介入', sources: ['docs.langchain.com/oss/python/langgraph/interrupts'] },
  ]},
  { id: 'part-4', title: '第四篇 收成小帆的售后图', chapters: [
    { file: '08-xiaofan-graph.md', chapter: 8, title: '小帆的售后图', sources: ['原创（贯穿案例 OD-2049，2026-11-27 demo）'] },
  ]},
];

const EN_PARTS = [
  { id: 'part-1', title: 'Part 1 Write one call as a chain', chapters: [
    { file: '01-chain-or-graph.md', chapter: 1, title: 'What the chain does and what the graph does', sources: ['Original (LangChain and LangGraph overviews, 2026-11-27)'] },
    { file: '02-first-chain.md', chapter: 2, title: 'The first chain', sources: ['docs.langchain.com/oss/python/langchain/test/unit-testing'] },
    { file: '03-tools-and-agent.md', chapter: 3, title: 'Tools and one agent loop', sources: ['reference.langchain.com/python/langchain/agents/create_agent'] },
  ]},
  { id: 'part-2', title: 'Part 2 Write the loop as a graph', chapters: [
    { file: '04-state-nodes-edges.md', chapter: 4, title: 'State, nodes, and edges', sources: ['docs.langchain.com/oss/python/langgraph'] },
    { file: '05-conditional-and-cycles.md', chapter: 5, title: 'Conditional edges and cycles', sources: ['docs.langchain.com/oss/python/langgraph'] },
  ]},
  { id: 'part-3', title: 'Part 3 Stop, then continue', chapters: [
    { file: '06-checkpoints.md', chapter: 6, title: 'Checkpoints', sources: ['docs.langchain.com/oss/python/langgraph/checkpointers', 'docs.langchain.com/oss/python/langgraph/add-memory'] },
    { file: '07-human-in-the-loop.md', chapter: 7, title: 'Human-in-the-loop', sources: ['docs.langchain.com/oss/python/langgraph/interrupts'] },
  ]},
  { id: 'part-4', title: 'Part 4 Xiaofan\'s support graph', chapters: [
    { file: '08-xiaofan-graph.md', chapter: 8, title: 'Xiaofan\'s support graph', sources: ['Original (running case OD-2049, demo on 2026-11-27)'] },
  ]},
];

function buildLinkMap() {
  return new Map();
}

Object.assign(book, {
  PARTS,
  EXCLUDED_SOURCES: [],
  buildLinkMap,
  locales: {
    en: {
      title: 'LangChain and LangGraph: From One Chain to a Support Graph',
      subtitle: 'Prompts, tools, state graphs, checkpoints, and human approval, with a path that runs without a vendor key',
      tagline: 'Write one model call with LangChain, then a resumable graph for lookup, cycles, and human approval with LangGraph',
      sourceNote: 'Written from the LangChain 1.5.2 and LangGraph 1.2.24 public APIs, plus a no-vendor-key demo run on 2026-11-27. No vendor completions, no screenshots',
      date: '2026-11-27',
      chaptersDir: 'books/langchain/en/chapters',
      PARTS: EN_PARTS,
    },
  },
});
