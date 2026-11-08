/**
 * super-agent.mjs — 《Super-agent 设计探索——以 Grok Bot 为例深度探索》书配置
 *
 * 第六本 published 书（2026-11-07 成稿，2026-11-08 迁入 BUILDABLE_BOOKS）。
 * 原创对照书：解读 DeepSeek Harness 团队「Super-agent」思路，以 Grok Bot 为可见行为对照；
 * 无上游源文档映射，sources 为空数组。
 * legacyRootChapters: false
 */

export const book = {
  bookId: 'super-agent',
  status: 'published',
  title: 'Super-agent 设计探索——以 Grok Bot 为例深度探索',
  subtitle: '四特征与 Router/Worker：从文章到中台一天工作法',
  date: '2026-11-07',
  tagline: '解读四特征五模块，并以 Grok Bot 对照落地连续、高效、主动、持久的助手形态',
  sourceNote: '依据 DeepSeek Harness 团队微信文《Super-agent 设计探索》问题域与架构思路改写；Grok Bot 为对照实例。实现逻辑段落一律标成推测，非官方实现披露。',
  sourceDescription: 'DeepSeek Harness 团队公开微信文《Super-agent 设计探索：迈向更自主的 Agent 系统》（核实 2026-11-07）',
  licenseNote: '本书为学习整理与对照探索稿，遵循本仓库整体许可证分发；不构成对 DeepSeek 或 Grok Bot 产品的官方说明。',
  trademarkNote: 'DeepSeek、Grok Bot 及相关商标归其权利人所有；本书与上述项目及官方无隶属关系。',
  chaptersDir: 'books/super-agent/chapters',
  assetsDir: 'books/super-agent/assets',
  demoGithubBase: 'https://github.com/ybak/ai-tutorial/blob/main/books/super-agent/',
  pdfFileName: 'Super-agent-设计探索-以Grok-Bot为例.pdf',
  legacyRootChapters: false,
};

const PARTS = [
  { id: 'part-1', title: '第一篇 问题与形态', chapters: [
    { file: '01-problem-and-four-traits.md', chapter: 1, title: '问题域与四特征：从单 Session 到连续实体', sources: [] },
  ]},
  { id: 'part-2', title: '第二篇 双层与事件', chapters: [
    { file: '02-router-worker-and-events.md', chapter: 2, title: '双层 Router/Worker 与事件驱动', sources: [] },
  ]},
  { id: 'part-3', title: '第三篇 异步、持久与自愈', chapters: [
    { file: '03-async-persistence-watchdog.md', chapter: 3, title: '异步多信道、存算分离与 Watchdog', sources: [] },
  ]},
];

function buildLinkMap() {
  return new Map();
}

Object.assign(book, { PARTS, EXCLUDED_SOURCES: [], buildLinkMap });
