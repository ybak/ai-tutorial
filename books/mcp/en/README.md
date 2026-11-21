# MCP: A Cross-Framework Tool Protocol

> Status: **revised draft (2026-10-27)**. Rewritten chapter by chapter against the official spec ([modelcontextprotocol/modelcontextprotocol](https://github.com/modelcontextprotocol/modelcontextprotocol), 2026-07-28). Both ends were verified hands-on with TS SDK v2.4.0. All 12 chapters are drafted and have passed a whole-book consistency pass (section numbers X.Y inside chapters, cross-references put back in place, fullwidth punctuation and voice made consistent). The book is in the site build with `status: 'published'`.
>
> Shape debt: most chapters are still the compact form "spec comparison + a hands-on record" (about 100-370 lines per chapter) and have **not yet reached the draft standard** (at least 500 lines per chapter; the skeleton is in the [writing guide](../../../docs/book-writing-guide.md)). Later work: thicken each chapter toward the agentscope-java book. After that, close the review list in each chapter.

## What this book is

Model Context Protocol, the cross-framework standard for connecting tools once. This book covers two things: **the protocol itself** (core concepts, version history, capability modeling, and security) and **adoption at scale** (turning thousands of business-platform APIs into MCP, governance, and an enterprise path). The same tool capabilities can be reused by different orchestration frameworks, and the book gives a complete engineering path for a platform scenario, from a pilot to scale.

## Who it is for

- Backend engineers (the main implementers): building a Server, and the engineering of mapping APIs to tools
- Platform and architecture: gateway aggregation, multi-tenant tool governance, versions, and security policy
- Integrators: connecting each framework (agentscope-java / ragflow / copilotkit / an AI CLI). See the cross-references in each book

## Where it sits on the platform gap map

The rows below come from [Appendix A of the design spec](../../../docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md) (a multi-tenant agent platform for cross-border commerce; the technical gap map):

| Role | Technical area | What it covers | Coverage |
|------|----------------|----------------|----------|
| Development | Protocol | MCP tool access | Soon: the mcp book |

## Our running example

**A scaled slice of the platform's after-sales domain**: about 20 REST APIs in one domain of the business platform are aggregated by task semantics into 6 MCP tools, exposed through a Gateway, and consumed at the same time by an agentscope-java backend Agent and a frontend app. Chapter 4 sets it up. Chapter 6 works on tool quality. Chapter 7 walks the whole method for going to scale. Chapter 8 closes it across frameworks.

## Chapters (draft)

| Chapter | In one sentence | Weight |
|---------|-----------------|--------|
| [Chapter 1 Getting to Know MCP](chapters/01-overview.md) | The problem, the ecosystem, and three era judgments | Thin (the introduction to the book) |
| [Chapter 2 Core Protocol Concepts](chapters/02-core-concepts.md) | The stateless model, resultType, `_meta`, error-code ranges, discover, and MRTR | Medium |
| [Chapter 3 Spec Versions and Compatibility](chapters/03-spec-versions.md) | The five-version line, nine major changes, the official seven-cell matrix, and the eight migration steps | Medium |
| [Chapter 4 Quick Start](chapters/04-quickstart.md) | Choosing an SDK, a minimal Server, four hands-on behaviors, and the skeleton of our running example | Medium |
| [Chapter 5 Building a Complete Server](chapters/05-build-server.md) | A real API dependency, a degradation path, the logging red line, and Host testing | Medium |
| [Chapter 6 Tool Authoring in Practice](chapters/06-tool-authoring.md) | Schema, description quality, two kinds of errors, the handle pattern, and the MRTR flow | Heavy |
| [Chapter 7 At Scale: MCP for a Business Platform](chapters/07-mcp-at-scale.md) | An API is not a tool; the generation pipeline; domain split plus Gateway; retrieval and discovery; catalog governance | Heaviest |
| [Chapter 8 Cross-Framework Client Integration](chapters/08-client-integrations.md) | The support matrix, a hands-on run on both ends, and the effect of deprecated client capabilities | Medium |
| [Chapter 9 Debugging and the Inspector](chapters/09-debugging.md) | The official debugging toolbox: Inspector web, TUI, and CLI; protocol eras; a security pass | Medium |
| [Chapter 10 Deployment and Security](chapters/10-deploy-security.md) | The header set, the OAuth stack, multi-tenancy, the threat list, and the deployment list | Heavy |
| [Chapter 11 Agent Skills and the Extension Ecosystem](chapters/11-extensions.md) | build-with-agent-skills; four extension lines: apps, auth, skills, and tasks | Medium |
| [Chapter 12 An Enterprise Adoption Roadmap](chapters/12-adoption-roadmap.md) | Four stages, how the teams split the work, a cost model, anti-patterns, and a decision tree | Medium |

> All 12 chapters are drafted (drafted 2026-10-24, whole-book revision 2026-10-27). Remaining debt is in the status line at the top.

The Chinese chapters do not include local screenshots, and this edition does not add any. If a later chapter cites a figure, the English file uses the same relative path as the Chinese file, `../assets/images/`, and the file stays in `books/mcp/assets/`. This edition does not copy image files.

## Cross-references to other books

- **AgentScope Java book**: the Host that consumes the after-sales Server (Chapter 8, and Chapter 26 of that book)
- **RAGFlow book** and **FastGPT book**: knowledge-base products that also speak MCP. This book owns the protocol. Those books own the product surface
- **CopilotKit book**: a frontend Host. The support matrix is in Chapter 8

---

Book metadata (bookId / title / tagline) follows [`build/books/registry.mjs`](../../../build/books/registry.mjs).
