# LangChain and LangGraph: From One Chain to a Support Graph

> Status: **draft complete (2026-11-27)**. 8 chapters. Python is the main line. On 2026-11-27 this environment, with Python 3.12, installed `langchain==1.5.2`, `langgraph==1.2.24`, `langchain-core==1.8.5`, and `langgraph-checkpoint-sqlite==3.1.3`, and ran `python run_all.py` in [../demo/](../demo/README.md). There is no vendor key, `langchain-openai` is not installed, and no request was sent to a model vendor. Chains and `create_agent` use a fake model. Classification, lookup, conditional edges, checkpoints, and human approval are deterministic Python. Command output in the chapters comes from that run. Snippets that point at LiteLLM or Langfuse are shapes only. Nothing was called. There are no screenshots.

Lin Zhou is a fictional character. Do not put a real author's name in the chapters, config, or sample org names.

The bookId is `langchain`, not `langgraph`. Books on this shelf take one product name and one URL. This book covers composition (LangChain) and the graph runtime (LangGraph). Readers search for LangChain first. LangGraph is the subject of the last four chapters, not a second book. The site path is `/langchain/`.

## What this book is

Xingfan already has the Java support agent Xiaofan (the AgentScope Java book) and a model gateway (the LiteLLM book). Some orchestration is written in Python: label one sentence as shipping delay, refund, or other; look up order `OD-2049`; draft a ticket only when the delay is real; open the ticket only after a person agrees.

LangChain turns one model call into a chain: prompt, model, parser, and the tool contract. LangGraph turns a process that loops or stops into a graph: state, nodes, conditional edges, checkpoints, and human-in-the-loop. In LangChain 1.x, `create_agent` returns a compiled LangGraph.

This book does not replace AgentScope Java, MCP, LiteLLM, or Langfuse. It answers where a chain should stop and a graph should start when this ticket is orchestrated in Python.

## Who it is for

Python developers who are wiring a model into business code. You can read a function and a type annotation, and you have not yet split "agent" into a chain and a graph. A Java platform team can read chapters 1 and 8 only, to see where the same order stops on the Python side. Testing can re-run `run_all.py` in the demo. That path needs no vendor key.

## Names that stay fixed

These names line up with the [AgentScope Java book](../../agentscope-java/README.md) and the [LiteLLM book](../../litellm/README.md). Chapters do not invent a second set. The values live in [../demo/xiaofan_graph/orders.py](../demo/xiaofan_graph/orders.py).

| Item | Value |
| --- | --- |
| Platform | Xingfan (星帆) |
| Support agent | Xiaofan (小帆) |
| Engineer | Lin Zhou (林舟), the same fictional character as in the super-agent and LiteLLM books |
| Merchant | Seashore Select (海岸优品), namespace `seashore-main` |
| Order | `OD-2049` |
| Carrier and tracking | 云途, `YT-2049-88`, shipped 2026-11-18 |
| Timing | Promised 7 days, 9 days elapsed, `delayed=true` |
| Ticket | 售后升级：订单 OD-2049 客户投诉物流延迟 |
| Team | `xbd-seashore-cs-team` |
| Gateway hostname | `llm.example.com` (LiteLLM book). This book does not send a request |
| Three customer lines | 订单 OD-2049 物流延迟，请处理 / 订单 OD-2049 我要退款 / 你们周末上班吗 |

The carrier, tracking number, and ship date are extra fields this book adds so the lookup tool has a stable return value. They are not claimed to already appear in the AgentScope or LiteLLM chapters. The ticket sentence and the order id are unchanged. Customer lines stay in Chinese in the English chapters, because they are the fixed case strings.

## Chapters

| Chapter | In one sentence | File |
| --- | --- | --- |
| 1 | One call is a chain. A process that loops or waits is a graph | [chapters/01-chain-or-graph.md](chapters/01-chain-or-graph.md) |
| 2 | Run the first chain on a fake model, with no vendor key | [chapters/02-first-chain.md](chapters/02-first-chain.md) |
| 3 | A tool contract, a hand-written loop, and `create_agent` | [chapters/03-tools-and-agent.md](chapters/03-tools-and-agent.md) |
| 4 | State, nodes, and straight edges | [chapters/04-state-nodes-edges.md](chapters/04-state-nodes-edges.md) |
| 5 | Conditional edges, a bounded cycle, and the recursion limit | [chapters/05-conditional-and-cycles.md](chapters/05-conditional-and-cycles.md) |
| 6 | Threads, an in-memory checkpoint, and SQLite across processes | [chapters/06-checkpoints.md](chapters/06-checkpoints.md) |
| 7 | `interrupt` before opening a ticket, then `Command` to resume | [chapters/07-human-in-the-loop.md](chapters/07-human-in-the-loop.md) |
| 8 | Three customer lines on one graph, and the boundaries that were not run | [chapters/08-xiaofan-graph.md](chapters/08-xiaofan-graph.md) |

Re-run locally from [../demo/README.md](../demo/README.md).

## License

LangChain and LangGraph are published under the MIT license. This book does not redistribute their source. The text is study notes and follows this repository's Apache-2.0 license. There is no affiliation with the LangChain project.

The fake models are test helpers in `langchain_core`. The unit-testing page checked on 2026-11-27 is https://docs.langchain.com/oss/python/langchain/test/unit-testing .

## Other books on this shelf

- [AgentScope Java](../../agentscope-java/README.md): Xiaofan, `OD-2049`, and the same ticket sentence. That book is the Java platform. This one is the Python orchestration.
- [LiteLLM](../../litellm/README.md): the model entry. Chapter 2 only records the `ImportError` from `init_chat_model` when the provider package is missing. It does not call `llm.example.com`.
- [Langfuse](../../langfuse/README.md): how to read a trace. Chapter 8 does not initialize the Langfuse SDK.
- [MCP](../../mcp/README.md): the tool protocol. `lookup_order` here is an in-process function, not an MCP server.
- [CopilotKit](../../copilotkit/README.md): chapter 5 there attaches a LangGraph to a frontend runtime. This book explains the graph. It does not repeat the frontend.

Metadata (`bookId` / title / tagline) comes from [`build/books/registry.mjs`](../../../build/books/registry.mjs).
