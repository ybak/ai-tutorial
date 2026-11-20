# FastGPT: From First Steps to Production

> Status: **draft complete (2026-11-02)**. All 13 chapters are done, written chapter by chapter against the official docs (v4.17.3, verified 2026-11-01), and have passed a whole-book consistency pass (names in our running example, chapter-level and section-level cross-references, Chinese-English terms, fullwidth punctuation). Key screens and the main path were verified hands-on and illustrated (2026-11-03, 15 screenshots covering 9 chapters).
>
> Shape debt: as with the MCP and RAGFlow books, each chapter is a compact chapter with a complete skeleton. Thickening them to the draft standard (at least 500 lines per chapter; see the [writing guide](../../../docs/book-writing-guide.md)) is debt for later. Some advanced items remain open (the workflow HTTP branch, channel access, and others). See the review list in each chapter.

## What this book is

Hands-on knowledge-base question answering and workflow orchestration. This book takes FastGPT v4.17 as the main line. It covers the whole path from deployment and knowledge-base construction through app orchestration (a conversational agent and a workflow) to publish channels, OpenAPI integration, and production operations. FastGPT's strength is packing a RAG knowledge base and a visual workflow into one platform that works out of the box. This book covers how to configure it, how to choose, and how to operate it.

## Who it is for

- Backend engineers and platform engineers: deploy and operate FastGPT, and give the team knowledge-base question answering and app hosting
- Knowledge-base operations: document ingestion, retrieval tuning, and conversation-quality inspection
- Agent developers: orchestrate business flows with workflows, tools, and skills, and connect platform-side apps through OpenAPI and MCP (the MCP book)

## Where it sits on the platform gap map

The rows below come from [Appendix A of the design spec](../../../docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md) (a multi-tenant agent platform for cross-border commerce; the technical gap map):

| Role | Technical area | What it covers | Coverage |
|------|----------------|----------------|----------|
| Development | RAG knowledge base + low-code orchestration | FastGPT knowledge bases, workflows, and agent orchestration | Covered by the fastgpt book |
| Operations | Knowledge-base operations | Document sync, conversation quality checks, and evaluation loops | Covered by chapters in the fastgpt book |

## Sources and the version baseline

- Source: the `document/content/` directory of the official [labring/FastGPT](https://github.com/labring/FastGPT) repository (five areas: guide, openapi, plugin, self-host, and faq)
- Version baseline: **v4.17.3 (the latest tag verified on 2026-11-01)**. Every external fact follows that version's docs
- Each chapter's frontmatter `source`, and the `sources` field in the build config, record the matching official doc path, for tracing and a future `--check`

## Our running example

**After-sales support**: three kinds of documents from the after-sales domain of cross-border commerce, the after-sales policy manual (a 50-page PDF, with tables), the product FAQ (XLSX, about 200 rows), and the shipping-time notice (HTML plus email), become the knowledge base `after-sales-kb`. Retrieval tuning turns them into knowledge that can be questioned. They are then orchestrated as the workflow app "售后客服" ("After-sales Support"): knowledge-base search, plus question classification, plus an HTTP tool that looks up tickets (the after-sales domain of the platform in the MCP book). It is published as a login-free share link and a DingTalk channel, consumed on the platform side through OpenAPI, exposed to the platform Agent as an MCP Server, and sent into observability through SignOz and call logs (the Langfuse book). Document names, the knowledge-base name, and the app name stay the same throughout the book. Chapters do not invent a second set.

## Terms that stay fixed

- **Knowledge base**: FastGPT's RAG carrier. The hierarchy is knowledge base, then collection, then data (Chunk). It is the same domain as "dataset" in the RAGFlow book, under a different official name. Each book follows the name its own product uses
- **App**: four forms, simple configuration, workflow, plugin, and Agent V2
- **Workflow**: node orchestration on a canvas. A node is the smallest execution unit
- **Skill**: a versioned "document + code" capability pack, bound to an agent, executed in a sandbox, and published with versions
- **MCP tool**: an external tool set connected through the MCP protocol. A FastGPT app can also be published as an MCP Server

## Chapters (13 chapters, 4 parts)

| Chapter | In one sentence | Weight |
|---------|-----------------|--------|
| [Chapter 1 Getting to know FastGPT](chapters/01-overview.md) | Where it fits, the three forms (cloud, commercial, community), and the tradeoff against building RAG yourself and against RAGFlow | Thin (the introduction to the book) |
| [Chapter 2 Deployment and model channels](chapters/02-deploy-models.md) | Docker deployment, env configuration, model access, a local model, and a check of the first question | Medium |
| [Chapter 3 Knowledge bases: from documents to knowledge](chapters/03-dataset-basics.md) | RAG principles, knowledge-base structure, import formats, QA splitting, and chunk management | Medium |
| [Chapter 4 Retrieval plans and tuning](chapters/04-retrieval-tuning.md) | Semantic, full-text, and hybrid retrieval, rerank, thresholds, and search tests | Heavy |
| [Chapter 5 Knowledge bases, further: sync, tags, and permissions](chapters/05-dataset-advanced.md) | Web sync, collection tags, file-level permissions, and API or third-party knowledge bases | Medium |
| [Chapter 6 Apps and conversational agents](chapters/06-apps-agents.md) | The four app forms, shared configuration, and Agent V2 settings and debugging | Medium |
| [Chapter 7 Workflow orchestration](chapters/07-workflow.md) | The canvas and the node families, orchestration rules, assisted generation, debug, and the after-sales workflow | Heavy |
| [Chapter 8 Tools and skills](chapters/08-tools-skills.md) | System tools, MCP tools, skill development and versions, and the plugin system | Medium |
| [Chapter 9 Publishing apps and channels](chapters/09-publish-channels.md) | Share links, iframe, DingTalk, Feishu, WeCom, Official Accounts, and publishing an MCP Server | Medium |
| [Chapter 10 External integration: OpenAPI](chapters/10-openapi.md) | API keys, the app, chat, and knowledge-base APIs, and the OpenAI-compatible interface | Medium |
| [Chapter 11 Production operations](chapters/11-operations.md) | The configuration map, object storage, the sandbox, SignOz observability, upgrade and migration, and troubleshooting | Heavy |
| [Chapter 12 Team collaboration and permission governance](chapters/12-team-governance.md) | Team space, role permissions, SSO, and team mode | Medium |
| [Chapter 13 Conversation operations and evaluation](chapters/13-chat-operations-eval.md) | Reading and annotating conversation records, the citation reader, app evaluation, and quality inspection | Medium |

The 15 screenshots are cited from the English chapters with the same relative path as the Chinese chapters: `../assets/images/`. The files stay in `books/fastgpt/assets/images/`. This edition does not copy them.

## Cross-references to other books

- **MCP book**: the HTTP tool and ticket lookup meet the platform's after-sales domain (Chapter 8, and the tool layer of the MCP book). An app published as an MCP Server is consumed by the platform Agent (Chapter 9, and Chapter 8 of the MCP book)
- **RAGFlow book**: both are knowledge-base platforms. The selection comparison is in Chapter 1. Chunk governance and the quality-inspection method are shared (Chapter 13, and Chapter 13 of the RAGFlow book)
- **Langfuse book**: SignOz and call logs connect to observability (Chapter 11)
- **AgentScope Java book**: the tradeoff between building RAG yourself and a platform knowledge base (Chapter 1)

---

Book metadata (bookId / title / tagline) follows [`build/books/registry.mjs`](../../../build/books/registry.mjs).
