# Langfuse: LLM Observability and Evaluation

> Status: **draft complete (2026-11-08)**. All 13 chapters, 7033 lines, are done. Written from the official docs (v4.76.0 + Python SDK 5.2.0, verified 2026-11-08) and from a Docker self-hosted instance on a local machine. The hands-on prerequisites (the deploy stack, admin initialization, the demo path end to end, prompts, datasets, experiments, and cost, then the RAGFlow connection) were finished before the draft. Every interface fact comes from that real instance. 30 screenshots from the hands-on run are inserted in the chapters in the three-part form "lead-in sentence, figure, reading" (`assets/images/`). Differences between what was confirmed in testing and the docs are marked as such (SDK v5 does not fully project the old API, the legacy UI list empty state, two demo fixes for label and double curly braces, and the tenant_model bitmask 1=chat 2=embedding). Compatibility was confirmed in testing: RAGFlow rc2 (v2 single-event ingestion) and Langfuse v4 (the old endpoint has been removed) are not compatible, and dual migration mode only brings the v3 batch path back. The behavior table in Section 12.3 of the ragflow book needs a note back to this result. Items not confirmed in testing (end-to-end alerts, the full annotation-queue flow, the CI workflow, and the OTel bridge) are left open on the review list in each chapter.

## What this book is

Tracing, evaluation, and prompt management for LLM applications. This book takes Langfuse as the way in. It covers traces and cost monitoring, evaluation datasets and scores, and prompt versions and A/B experiments. Testing, operations, and product ops share one handbook. It also adds LLM quality-engineering topics: prompt regression, hallucination checks, and red teaming.

## Who it is for

- Test engineers: build evaluation datasets and a scoring system, and run prompt regression and quality engineering
- Operations engineers: trace collection, cost monitoring, and production quality dashboards
- Product ops: prompt versions, A/B experiments, and bad-case operations

## Sources and the version baseline

- Source: the official docs (langfuse.com/docs) and the self-hosting guide in [langfuse/langfuse](https://github.com/langfuse/langfuse)
- Version baseline: **Langfuse v4.76.0 (released 2026-11-05) + Python SDK 5.2.0**, verified 2026-11-08
- Each chapter's frontmatter `source`, and the `sources` field in the build config, record the matching official doc path, for tracing and a future `--check`
- Hands-on baseline: a six-container Docker self-hosted stack on a local machine (web, worker, clickhouse, minio, redis, postgres). Every fact in our running example comes from that real instance

## Our running example

**The observability base for after-sales support**, continuing the cross-border commerce after-sales domain on this shelf. A Python demo app, "售后助手" ("After-sales Assistant") (keyword retrieval, then a Langfuse-managed prompt, then Zhipu glm-5.3-flash, then the answer, then a score), is instrumented with the Langfuse Python SDK and grows with the chapters: the first trace in Chapter 3, sessions tied together in Chapter 4, the prompt brought under management in Chapter 6, the evaluation dataset `after-sales-qa` and experiments in Chapters 7–9, the regression gate in Chapter 12, and the red-team dataset in Chapter 13. Chapter 10 points tracing for the "售后助手" ("After-sales Assistant") in the ragflow book (the RAGFlow instance) at the same Langfuse, and records the compatibility result for rc2 and v4 as it was confirmed in testing. The project name `after-sales`, the prompt `after-sales-answer`, and the dataset `after-sales-qa` stay the same throughout the book. Chapters do not invent a second set.

## Terms that stay fixed

- **trace**: the full chain of one request. **observation**: a node on that chain, one of span, generation, or event
- **experiment**: the v4 UI name for one dataset run. This book follows the UI term
- **prompt label**: the three release slots production, staging, and experimental. **playground**: the debugging surface
- **v4 migration write modes**: events_only (the default), dual, and legacy. The hands-on connection in Chapter 10 uses these

## Chapters (13 chapters, 4 parts)

| Chapter | In one sentence | Weight |
|---------|-----------------|--------|
| [Chapter 1 Getting to know Langfuse](chapters/01-overview.md) | The LLM observability map, four capability surfaces, and the boundary between the open-source core and Enterprise Edition | Thin |
| [Chapter 2 Local deployment](chapters/02-deploy.md) | Docker Compose with six containers, initialization, upgrade, and a troubleshooting record | Medium |
| [Chapter 3 Quick start](chapters/03-quickstart.md) | Python SDK setup, the first trace, and two instrumentation styles | Medium |
| [Chapter 4 The trace model and tracing](chapters/04-tracing.md) | The data-model hierarchy, tying sessions together, collection rules, and filtered views | Heavy |
| [Chapter 5 Cost and performance monitoring](chapters/05-cost-metrics.md) | Model pricing, cost accounting, dashboards, latency analysis, and alerts | Medium |
| [Chapter 6 Prompt management](chapters/06-prompt-mgmt.md) | Versions and labels, variable compilation, Playground, and linking a prompt to a trace | Heavy |
| [Chapter 7 Datasets and scores](chapters/07-datasets-scores.md) | Building datasets, the three sources of a score, and annotation queues | Heavy |
| [Chapter 8 Experiments and A/B tests](chapters/08-experiments.md) | Dataset experiments, comparing runs, and splitting prompt A/B traffic | Medium |
| [Chapter 9 Automated evaluation](chapters/09-evals.md) | LLM-as-judge, continuous evaluation, and an introduction to hallucination checks | Medium |
| [Chapter 10 Connecting existing systems](chapters/10-integrations.md) | The RAGFlow connection, confirmed in testing, including compatibility, the OpenAI wrapper, and an integration list | Medium |
| [Chapter 11 Multi-project and team administration](chapters/11-org-admin.md) | Organization, project, and environment isolation, member roles, and the EE boundary | Thin |
| [Chapter 12 Prompt regression and quality gates](chapters/12-regression.md) | The three-piece regression kit, the gate script, and how to think about CI | Heavy |
| [Chapter 13 Red teaming and security evaluation](chapters/13-redteam.md) | Adversarial datasets, security scores, and the bad-case operations loop | Medium |

An early outline of 8 chapters (the planning draft of the README) was refined to 13 chapters against the hands-on material: deployment became its own chapter, the original "datasets and scores" split into Chapters 7, 8, and 9, Chapter 10 was added for the shelf connection, and the original "LLM quality engineering" split into Chapters 12 and 13.

The 30 screenshots are cited from the English chapters with the same relative path as the Chinese chapters: `../assets/images/`. The files stay in `books/langfuse/assets/images/`. This edition does not copy them.

## Cross-references to other books

- **RAGFlow book**: Section 12.3 of the ragflow book reserved a cross-reference for sending "售后助手" ("After-sales Assistant") tracing into Langfuse. Chapter 10 of this book connects that path and records the version-compatibility result (the note in Section 12.3 of the ragflow book needs to be updated to match)
- **FastGPT book**: the same locally deployed, hands-on route. Conversation operations and evaluation (Chapter 13 there) can be read next to Chapters 7–9 here
- **MCP book**: tracing tool-call chains for an Agent (Chapter 4) meets the platform after-sales view in that book

---

Book metadata (bookId / title / tagline) follows [`build/books/registry.mjs`](../../../build/books/registry.mjs).
