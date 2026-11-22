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

const EN_PARTS = [
  { id: 'part-1', title: 'Part 1 The Problem and the Shape', chapters: [
    { file: '01-problem-and-four-traits.md', chapter: 1, title: 'The problem and the four traits: from a single session to a continuous entity', sources: [] },
  ]},
  { id: 'part-2', title: 'Part 2 Two Layers and Events', chapters: [
    { file: '02-router-worker-and-events.md', chapter: 2, title: 'Two-layer Router/Worker and event-driven design', sources: [] },
  ]},
  { id: 'part-3', title: 'Part 3 Async, Persistence, and Self-healing', chapters: [
    { file: '03-async-persistence-watchdog.md', chapter: 3, title: 'Async multi-channel, keeping compute and state apart, and Watchdog', sources: [] },
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
      title: 'Super-agent Design, Explored through Grok Bot',
      subtitle: 'Four traits and Router/Worker: from the article to one workday on a platform team',
      tagline: 'The four traits and five modules, with Grok Bot as the comparison for a continuous, efficient, proactive, persistent assistant',
      sourceNote: 'Rewritten from the problem domain and architecture of the DeepSeek Harness team WeChat article "Super-agent Design Exploration" (checked 2026-11-07). Grok Bot is the comparison instance: visible behavior was confirmed in testing, and the conventions are written so a platform team can execute them. Implementation-logic paragraphs are marked as inference throughout, and are not an official disclosure. The Routines panel is not illustrated until that panel is open and confirmed in testing',
      sourceDescription: 'The DeepSeek Harness team public WeChat article "Super-agent Design Exploration: Toward a More Autonomous Agent System" (checked 2026-11-07)',
      licenseNote: 'This book is study notes and a comparison exploration, distributed under this repository\'s license. It is not an official description of a DeepSeek or Grok Bot product.',
      trademarkNote: 'DeepSeek, Grok Bot, and related trademarks belong to their owners. This book is not affiliated with those projects.',
      date: '2026-11-07',
      chaptersDir: 'books/super-agent/en/chapters',
      PARTS: EN_PARTS,
    },
  },
});
