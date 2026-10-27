/**
 * registry.mjs — 多书注册表（Task 1）
 *
 * 单一职责：数据。汇总全部书条目，供书架页与后续多书构建任务遍历：
 * - BUILDABLE_BOOKS：status 为 'published'、可参与构建的书配置对象
 *   （自各书的配置模块导入，如 books/agentscope-java.mjs 的 book）。
 * - PLANNED_BOOKS：status 为 'planned' 的规划中书元数据（内联于此，
 *   各书立项后再拆出独立配置模块）。仅含 bookId/title/tagline/status，
 *   不含构建字段，也不含 legacyRootChapters 之类的书专用所有权标记。
 * - ALL_BOOKS：两者拼接，全量书目。
 */

import { book as agentscopeJava } from './agentscope-java.mjs';
import { book as mcp } from './mcp.mjs';

/** 可构建书（status: 'published'） */
export const BUILDABLE_BOOKS = [agentscopeJava, mcp];

/** 规划中书（status: 'planned'），仅元数据，不参与构建 */
export const PLANNED_BOOKS = [
  {
    bookId: 'ragflow',
    status: 'planned',
    title: 'RAGFlow:从入门到进阶',
    tagline: 'RAG 引擎实战,从搭建知识库到生产级检索调优',
  },
  {
    bookId: 'copilotkit',
    status: 'planned',
    title: 'CopilotKit:从前端接入 AI Agent',
    tagline: '在前端应用中植入 copilot 体验,从组件到自治 Agent',
  },
  {
    bookId: 'langfuse',
    status: 'planned',
    title: 'Langfuse:LLM 可观测与评估',
    tagline: 'LLM 应用的追踪、评估与 Prompt 管理',
  },
  {
    bookId: 'cli',
    status: 'planned',
    title: 'AI CLI:编程助手团队实战',
    tagline: 'Claude Code 等 AI 编程 CLI 在团队工作流中的配置、技能与治理',
  },
];

/** 全量书目（构建中 + 规划中） */
export const ALL_BOOKS = [...BUILDABLE_BOOKS, ...PLANNED_BOOKS];
