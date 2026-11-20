# RAGFlow: From First Steps to Production

> Status: **draft complete (2026-10-27)**. All 13 chapters are written, checked chapter by chapter against the official docs (v1.0.0-rc2, verified 2026-10-27), and have passed a whole-book consistency pass (names in the running example, chapter-level and section-level cross-references, Chinese-English terms, fullwidth punctuation). On 2026-11-04 our running example was taken through the whole path on a RAGFlow v1.0.0-rc2 instance deployed with Docker on this machine (deploy and upgrade, model channel, dataset, parsing, retrieval testing, chat assistant, Search, team sharing, Admin UI). 30 screenshots from the hands-on run were inserted into the chapters in the three-part form "lead-in sentence, figure, reading" (`assets/images/demo/`), and the related interface items on the review lists were closed out. Differences between the draft and that version (the custom Empty response copy did not take effect on rc2, the Artifacts dropdown does not contain To Skills, and there are actually 12 chunk templates) are marked as such in the readings of the figures.
>
> Shape debt: as with the MCP book, each chapter is a compact chapter with a complete skeleton (241-457 lines per chapter). Thickening them to the draft standard (at least 500 lines per chapter; see the [writing guide](../../../docs/book-writing-guide.md)) is debt for later. API and SDK call samples are still not verified hands-on, and the related review-list items stay open.

## What this book is

Hands-on work with a RAG engine, from standing up a knowledge base to production retrieval tuning. This book takes RAGFlow v1 as the main line. It covers the whole path from deployment and knowledge-base (dataset) construction through retrieval tuning, and it treats **knowledge-base operations** (chunk governance, the update flow, and quality inspection) as a first-class citizen. Bringing a RAG system online is only the start. Long-term quality depends on operations.

## Who it is for

- Backend engineers and platform engineers: stand up and operate RAGFlow, and provide knowledge-base capability to an agent platform
- Knowledge-base operations: chunk governance, the document update flow, and quality inspection
- Agent developers: bring knowledge capability into their own applications through Chat Assistant, the canvas Agent, and the API / MCP (the MCP book)

## Where it sits on the platform gap map

The rows below come from [Appendix A of the design spec](../../../docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md) (a multi-tenant agent platform for cross-border commerce; the technical gap map):

| Role | Technical area | What it covers | Coverage |
|------|----------------|----------------|----------|
| Development | RAG knowledge base | RagFlow, pgvector/Milvus | Soon: the ragflow book |
| Operations | Knowledge-base operations | RagFlow chunk governance and the update flow | Soon: chapters inside the ragflow book |

## Sources and the version baseline

- Source: the `docs/` directory of the official [infiniflow/ragflow](https://github.com/infiniflow/ragflow) repository (126 files, about 26,000 lines)
- Version baseline: **v1.0.0-rc2 (released 2026-10-16)**. Every external fact follows that version's docs. Verified 2026-10-27
- Each chapter's frontmatter `source`, and the `sources` field in the build config, record the matching official doc path, for tracing and a future `--check`

## Our running example

**After-sales Knowledge Base**: three kinds of documents from the after-sales domain of cross-border commerce, the after-sales policy manual (a 50-page PDF, with tables), the product FAQ (XLSX, about 200 rows), and the shipping-time notice (HTML plus email), become the dataset `after-sales-kb`. Parsing and chunk tuning turn them into knowledge that can be retrieved. The chat assistant "售后助手" (After-sales Assistant) and a canvas Agent then serve the support scene. MCP exposes that to the platform-side Agent (the after-sales domain of the platform in the MCP book). Team shares it with each shop's operations. Tracing sends it into the observability platform (the Langfuse book). Document names, the dataset name, and the assistant name stay the same throughout the book. Chapters do not invent a second set.

## Terms that stay fixed

- **Dataset**: the core object in v1. In the v0 era it was called a knowledge base. This book uses "dataset" for the core object. Narrative scenes may use "knowledge base" as the general word
- **Chunk**: the smallest retrieval unit produced by parsing. "Chunk method" is the official Chunk method
- **Ingestion Pipeline**: the custom parsing pipeline in v1, which lays out Parser / Chunker / Transformer / Indexer on a canvas
- **Knowledge Compilation / Artifact**: Wiki, navigation, a graph, and other processed products generated from a dataset
- **Agentic mode**: the new orchestration in the v1.0.0-rc2 chat assistant, replacing the old Low / Medium / High / Ultra thinking levels

## Chapters (13 chapters, 4 parts)

| Chapter | In one sentence | Weight |
|---------|-----------------|--------|
| [Chapter 1 Getting to know RAGFlow](chapters/01-overview.md) | Why RAG, what RAGFlow is, and the tradeoff against building RAG yourself | Thin (the introduction to the book) |
| [Chapter 2 Deployment and model channels](chapters/02-deploy-models.md) | Docker deployment, the configuration system, online and local model access, and a check of the first path | Medium |
| [Chapter 3 Datasets: the carrier of a knowledge base](chapters/03-dataset-basics.md) | Creation and permissions, file management, data-source access and sync, metadata | Medium |
| [Chapter 4 Parsing and chunking: from documents to Chunk](chapters/04-parsing-chunking.md) | Choosing among 11 built-in parsing methods, Parser and vision models, Chunker parameters, table-column roles | Heavy |
| [Chapter 5 Retrieval enrichment and indexing](chapters/05-enrichment-indexing.md) | The Extractor set of four (keywords, questions, tags, context), Indexer index strategy (sub-chunks are in Chapter 4, Section 4.4.1) | Medium |
| [Chapter 6 Knowledge compilation and knowledge artifacts](chapters/06-knowledge-compilation.md) | Generating Wiki, navigation, and a graph; templates and their dedicated configuration; the relationship to the Agent context engine | Medium |
| [Chapter 7 Retrieval testing and tuning](chapters/07-retrieval-tuning.md) | Retrieval Testing, hybrid-retrieval weights, PageRank across datasets, a way to locate retrieval quality | Heavy |
| [Chapter 8 Chat assistants and sessions](chapters/08-chat-assistant.md) | Chat Assistant configuration, Agentic mode, prompts and parameters, session management | Medium |
| [Chapter 9 Search apps and access channels](chapters/09-search-channels.md) | The Search app, Chat Channel access, embedding in a web page | Thin |
| [Chapter 10 Agents and workflows](chapters/10-agent-workflow.md) | The canvas and the component families, Ingestion Pipeline, Memory access, a support Agent instance | Heavy |
| [Chapter 11 External integration: API and MCP](chapters/11-api-mcp.md) | A map of the HTTP and Python APIs, the API key, RAGFlow as an MCP server | Medium |
| [Chapter 12 Production operations](chapters/12-operations.md) | Production configuration, monitoring and tracing, backup and restore, the v0 to v1 upgrade, the CLI and Admin UI, Sandbox | Heavy |
| [Chapter 13 Team collaboration and knowledge-base operations](chapters/13-team-governance.md) | The permission system, Team / Me sharing, multi-tenant governance, the update flow, and the quality-inspection SOP | Heavy |

> The first 8-chapter plan (2026-10-24) was refined to 13 chapters against the surface of the official v1 docs: knowledge compilation, Agent and workflow, API / MCP integration, and team collaboration became four separate surfaces. The material for the original single "RAG evaluation" chapter was split into Chapter 7 (retrieval testing) and Chapter 13 (quality inspection).

## Cross-references to other books

- **MCP book**: RAGFlow, as an MCP server, is consumed by the platform Agent (Chapter 11, and Chapter 8 of the MCP book). The tool layer and the knowledge layer meet in the same after-sales domain
- **Langfuse book**: RAGFlow monitoring and tracing connect to the observability platform (Chapter 12)
- **AgentScope Java book**: the tradeoff between building RAG yourself and RAGFlow (Chapter 1); how a platform-side Agent framework consumes a knowledge service

---

Book metadata (bookId / title / tagline) follows [`build/books/registry.mjs`](../../../build/books/registry.mjs).
