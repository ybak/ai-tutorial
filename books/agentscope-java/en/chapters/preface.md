---
title: Preface: AgentScope 2.0 and How to Use This Book
source: intro.md, docs/index.md
---

# Preface: AgentScope 2.0 and How to Use This Book

> Chapter guide: When you want a Java application to do more than "call a model once and return a block of text" — when you want an agent that can look up an order, update a ticket, and ask you to confirm in the middle of the work (an Agent: a program that calls models and tools on its own and keeps working until the task is done) — you need an agent framework. AgentScope 2.0, the open-source framework this book introduces, is built for that. This preface first places the framework. It then compares two ways to use it: AgentScope Harness (the SDK you embed in your own application) and AgentScope Service (the hosted service that runs agents for you). It ends with the shape of the book and reading routes by role. After this preface you can decide which chapter to open, and which way to connect the framework to your project.

## What AgentScope 2.0 is

AgentScope 2.0 is an open-source framework for agent applications. It helps you organize models, tools, and business data into an Agent that keeps working on a task. You can build a multi-turn assistant, or let an Agent retrieve material, handle files, run code, and delegate subtasks, waiting for a person to confirm when it needs to and then finishing the work. Take one concrete case. In a support assistant the user asks "where is my order?". The Agent has to call an order tool, may also update a ticket, and, when it is unsure, confirm with the user before finishing — instead of returning a fixed paragraph. That is the difference between "keep working on the task" and "call a model once".

This book covers the Java version. You can embed an Agent in an existing Java or Spring Boot application, start from one call, and add context management, a Workspace (a directory of files that holds the Agent's persona, knowledge, and skills), persistent sessions, and multi-agent collaboration. When you need one deployment and an API for other systems, you can also use AgentScope Service.

## Harness and Service: two ways to use it

AgentScope 2.0 offers two ways that stay independent and can be chosen or combined as needed: **AgentScope Harness** (the SDK, for building it yourself — the framework is a dependency in your project, and you customize the Agent in code) and **AgentScope Service** (the platform, a hosted service — the platform runs the Agent, and the business application uses it through an API). Choose the first when the Agent has to be customized deeply in application code. Choose the second when you want to focus on the business integration and let the platform run the Agent. A Managed Agent on Service (an Agent configured on the platform and run by the platform) is built on the AgentScope HarnessAgent kernel. Both ways share that execution kernel.

| Way | How you build | Who runs it | Who it fits |
| --- | --- | --- | --- |
| AgentScope Harness (SDK, build it yourself) | Embed the SDK in your own Java or Spring Boot application, combine context, workspace, and tool execution, and customize the Agent logic yourself | Your own application. You deploy and operate it | Teams that need the Agent inside a Java application and need custom runtime logic |
| AgentScope Service (platform, hosted) | Configure a Managed Agent on the platform, or connect an Agent you deploy yourself, or connect an existing Coding Agent. Agents that can take the work can also form a Team or join a Workflow | The Service platform runs the Agent. The business application submits work, reads results, receives events, and handles pending items through an API | Teams that want to focus on the business integration and avoid rebuilding the runtime |

The two ways do not have to be used together. You can develop and run your own Agent application with the Harness SDK only, or configure a Managed Agent in Service without first building an SDK application. An existing Harness application can also join Service as an External Agent (an agent whose process stays with you, registered with the platform). It keeps its own process and still uses the platform's publish and call capabilities.

> **Note:** AgentScope Service is a preview capability. A stable release has not shipped. Building and running an Agent with the Java SDK does not require deploying Service. Deployment and use of Service are in Chapters 29–34.

## How the book is organized, and how to read it

Once you have chosen a way to use the framework, the next step is a reading path. The book has seven parts and 44 chapters, plus two appendices. It is organized as core building blocks, then engineering capabilities, then ecosystem integrations, then platform hosting, then semantic judgment, then production practice. "Semantic judgment" means using a model to judge questions such as whether an answer is grounded and whether a tool choice fits. That is Part 6.

| Part | What it covers | Who it is for | Reading time |
| --- | --- | --- | --- |
| Part 1 Getting Started (Chapters 1–3) | Framework overview, quick start, core concept map | Every reader | about 1 hour |
| Part 2 Core Building Blocks (Chapters 4–10) | The Agent and the ReAct loop, messages and events, models, tools, context, middleware, the permission system | Developers who need to understand and customize Agent behavior | about 4 hours |
| Part 3 Harness Engineering (Chapters 11–20) | Harness architecture, workspace, context management, memory, skills, sub-agents, plan mode, sandbox, sessions, channels | Developers building long-running and production applications | about 6 hours |
| Part 4 Ecosystem and Integrations (Chapters 21–28) | Model providers, RAG, session storage and distributed deployment, IM channels, agent protocols, skill repositories, and related integrations | Integration material, read as needed | as needed |
| Part 5 The AgentScope Service Platform (Chapters 29–34) | Service deployment, managed agents, the Session API, Team and Workflow orchestration, operations | Platform builders and teams integrating a business | about 5 hours |
| Part 6 JEV Semantic Judgments (Chapters 35–38) | Why a separate judgment is needed, the life of a judgment, three judgment domains, evaluation and calibration | Readers who care about output quality and evaluation | about 3 hours |
| Part 7 Production Practice (Chapters 39–44) | How to build an Agent Harness, best practices, going to production, the cross-border commerce platform, FAQ | Teams preparing to go live | about 4 hours |
| Appendix | Release Notes and a glossary | Look up as needed | a reference |

Three reading routes, by the kind of reader:

- **Java application developers:** read Chapters 1–20 in order (Parts 1 through 3) and build the full in-application skill. Then add Chapter 22 as needed (RAG integration — RAG is retrieval-augmented generation: retrieve external material first, then have the model answer from it), Chapter 24 (session storage and distributed deployment), and Chapter 42 (going to production).
- **Platform builders:** read Chapters 1–3 for the concepts, then Chapters 29–34 (Part 5) for Service deployment, Managed Agent configuration, and orchestration. When you need the hosted kernel, go back to Chapters 11–20.
- **Readers focused on quality and evaluation:** after Chapters 1–3, go straight to Chapters 35–38 (Part 6).

### Before you start

Running the examples in this book takes JDK 17 or newer, Maven 3.9 or newer, and API credentials for the model you choose. Tools can run locally or in a configured sandbox (an execution environment isolated from the host). Setup is in Chapter 2. Readers upgrading from 1.x can use the Release Notes in Appendix A for what changed in each version.
