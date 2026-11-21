# CopilotKit: Bringing an AI Agent into the Frontend

> Status: published (drafted on the day it was opened, 2026-10-31)

## What this book is

A copilot inside a frontend app, from components to an autonomous agent. This book is about **frontend AI integration**: using CopilotKit in a React app for streaming output, human in the loop (HITL), and a frontend that shows tool calls, so agent capabilities show up naturally in the product UI.

## Who it is for

- Frontend engineers: adding a copilot and an agent UI to a business system
- Full-stack engineers who connect that UI to a backend orchestration framework (the Runtime configuration)

## Where it sits on the platform gap map

The row below comes from [Appendix A of the design spec](../../../docs/superpowers/specs/2026-10-24-multi-book-restructure-design.md) (a multi-tenant agent platform for cross-border commerce; the technical gap map):

| Role | Technical area | What it covers | Coverage |
|------|----------------|----------------|----------|
| Development | Frontend AI integration | CopilotKit (React) | Soon: the copilotkit book |

## Chapters (8 chapters, 4 parts)

| Chapter | In one sentence | Weight |
|---------|-----------------|--------|
| [Chapter 1 Getting to know CopilotKit](chapters/01-overview.md) | Where it sits, the three-piece architecture, the journey of one message, the AG-UI protocol, and the open-source and cloud boundary | Medium |
| [Chapter 2 Quick start: a first copilot in twenty minutes](chapters/02-quick-start.md) | Two integration paths, Copilot Runtime and the built-in agent, key handling, and first-run troubleshooting | Medium |
| [Chapter 3 Built-in components and a custom chat UI](chapters/03-components-ui.md) | Three layouts, styling, session control, slots, and a headless UI you build yourself | Heavy |
| [Chapter 4 Shared state: let the agent see and operate your UI](chapters/04-shared-state.md) | Publishing context, two-way state sync, rendering inside the app, and streaming and predictive updates | Medium |
| [Chapter 5 Connecting a backend agent: Runtime and framework integration](chapters/05-backend-agents.md) | The agents registry, the LangGraph path, Agent Runner, message history, and a framework survey | Heavy |
| [Chapter 6 Frontend tools and generative UI](chapters/06-frontend-tools-generative-ui.md) | Frontend tools, rendering tool calls, components as tools, and state rendering versus tool rendering | Medium |
| [Chapter 7 Human in the loop: put the person back in the decision](chapters/07-hitl.md) | Tool-level approval, interrupt and resume, the LangGraph interrupt loop, and headless intervention | Medium |
| [Chapter 8 Multi-agent, protocols, and production](chapters/08-multi-agent-production.md) | Subagent routing, the three protocols, thread persistence, authentication, deployment, and troubleshooting | Heavy |

An early outline of 8 chapters (2026-10-24) was refined against the official v2 docs when writing started on 2026-10-31. Streaming output was folded into shared state (Chapter 4). Tool transparency became frontend tools and generative UI (Chapter 6). Autonomous agents and production became multi-agent, protocols, and production (Chapter 8). Our running example is Starfish Console (星帆工作台), a seller-operations console for cross-border commerce.

## Runnable demo and the hands-on baseline

- The project for our running example: [demo/starfish-console/](../demo/starfish-console/) (Vite + React; `?layout=` switches the three layouts)
- **Hands-on baseline**: `@copilotkit/react-core` / `@copilotkit/runtime` 1.83.0 (2026-10-31). The screenshots in Chapters 2, 3, 4, 6, and 7 were taken on a run of that version: the first conversation, the sidebar and popup layouts, an answer that uses page context, an order card as generative UI, and the price-change approval loop
- Chapters 5 and 8 (the LangGraph backend, multi-agent, and deployment) follow the official docs and were not confirmed in testing. See the review list in each chapter

The seven screenshots are cited from the English chapters with the same relative path as the Chinese chapters: `../assets/images/`. The files stay in `books/copilotkit/assets/images/`. This edition does not copy them. The site build mirrors `assets/` onto `/en/copilotkit/assets/`.

---

Book metadata (bookId / title / tagline) follows [`build/books/registry.mjs`](../../../build/books/registry.mjs).
