# LangChain 与 LangGraph：把一次售后写成链，再写成图

> 状态：**成稿（2026-11-27）**。8 章。Python 主线。2026-11-27 在本环境用 Python 3.12 安装 `langchain==1.5.2`、`langgraph==1.2.24`、`langchain-core==1.8.5`、`langgraph-checkpoint-sqlite==3.1.3`，并跑通 [demo/](demo/README.md) 的 `python run_all.py`。没有厂商密钥，没有安装 `langchain-openai`，没有向任何模型供应商发请求。链和 `create_agent` 用假模型；分类、查单、条件边、检查点、人工确认是确定性 Python。章内命令输出来自这次运行。接到 LiteLLM 或 Langfuse 的片段只给形状，没有发出调用。没有界面截图。

署名只用虚构名林舟。不要在书稿、配置或示例组织名里写真实作者姓名。

bookId 用 `langchain`，不用 `langgraph`。书架上的书都按一个产品名占一条 URL。这本同时写组合（LangChain）和图运行时（LangGraph），读者检索时先碰到的是 LangChain；LangGraph 是后四章的主体，不另开一本。站点路径是 `/langchain/`。

## 定位

星帆出海已经有 Java 侧的客服 Agent 小帆（→ agentscope-java 书），也有模型网关（→ litellm 书）。有些编排会写在 Python 里：先把一句话分成「物流延误 / 退款 / 其他」，再查订单 `OD-2049`，延误成立才起草工单，工单要人点头才算开出。

LangChain 负责把一次模型调用写成链：提示词、模型、解析器，以及工具契约。LangGraph 负责把会绕回来的流程写成图：状态、节点、条件边、检查点、人工介入（Human-in-the-Loop）。`create_agent` 在 LangChain 1.x 里返回的就是一张编译好的 LangGraph。

这本书不替代 AgentScope Java，也不替代 MCP、LiteLLM、Langfuse。它只回答：这张售后单如果用 Python 编排，链写到哪一步该停，图从哪一步开始。

## 读者

要在业务代码里接大模型的 Python 开发者。你写过函数和类型注解，还没把「Agent」拆成链和图。Java 中台可以只读第 1 章和第 8 章，看同一张订单在 Python 侧停在哪里。测试可以按 demo 的 `run_all.py` 复跑无密钥路径。

## 贯穿案例

名称、单号、工单句与 [AgentScope Java 书](../agentscope-java/README.md)、[LiteLLM 书](../litellm/README.md) 对齐。各章不得另起一套。固定值在 [demo/xiaofan_graph/orders.py](demo/xiaofan_graph/orders.py)。

| 项 | 值 | 出处 |
| --- | --- | --- |
| 平台 | 星帆出海 | agentscope-java 第 2、4 章 |
| 客服 Agent | 小帆 | 同上 |
| 工程师 | 林舟 | 与 super-agent、litellm 书同一虚构人物 |
| 商家 | 海岸优品，namespace `seashore-main` | litellm 书 |
| 订单 | `OD-2049` | 同上 |
| 承运与运单 | 云途，`YT-2049-88`，2026-11-18 发出 | 本书为这条订单补的物流字段，全书只用这一组 |
| 时效 | 承诺 7 天，已过 9 天，`delayed=true` | 同上 |
| 工单 | 「售后升级：订单 OD-2049 客户投诉物流延迟」 | agentscope-java 第 43 章的工单句 |
| 团队 | `xbd-seashore-cs-team` | 同上 |
| 模型网关域名 | `llm.example.com` | litellm 书；本书不发起请求 |
| 三条客户话 | 「订单 OD-2049 物流延迟，请处理」；「订单 OD-2049 我要退款」；「你们周末上班吗」 | 本书固定，demo 与各章共用 |

物流字段（承运、运单、日期）是这本书为了让查单工具有稳定返回值而补上的，不表示这些字段已经写进 AgentScope 或 LiteLLM 的章节。工单句和订单号没有改。

## 章节

| 章 | 一篇话 | 文件 |
| --- | --- | --- |
| 1 | 一次调用写成链，会绕回来的流程写成图 | [chapters/01-chain-or-graph.md](chapters/01-chain-or-graph.md) |
| 2 | 没有厂商密钥，用假模型跑通第一条链 | [chapters/02-first-chain.md](chapters/02-first-chain.md) |
| 3 | 工具契约、手写循环，以及 `create_agent` | [chapters/03-tools-and-agent.md](chapters/03-tools-and-agent.md) |
| 4 | 状态、节点、直线边 | [chapters/04-state-nodes-edges.md](chapters/04-state-nodes-edges.md) |
| 5 | 条件边、有界循环、递归上限 | [chapters/05-conditional-and-cycles.md](chapters/05-conditional-and-cycles.md) |
| 6 | 线程、内存检查点、SQLite 跨进程 | [chapters/06-checkpoints.md](chapters/06-checkpoints.md) |
| 7 | 开单前 `interrupt`，用 `Command` 恢复 | [chapters/07-human-in-the-loop.md](chapters/07-human-in-the-loop.md) |
| 8 | 三条客户话走同一张图，并标出没跑的边界 | [chapters/08-xiaofan-graph.md](chapters/08-xiaofan-graph.md) |

本地复跑见 [demo/README.md](demo/README.md)。

## 许可

- LangChain 与 LangGraph 的仓库以 MIT 许可发布。本书不随仓库分发它们的源码，只写学习用的调用代码。
- 本书正文是学习整理，随本仓库 Apache-2.0 分发。与 LangChain 项目方无隶属关系。
- 假模型来自 `langchain_core` 的测试用类，官方说明见单元测试文档（2026-11-27 对照）：https://docs.langchain.com/oss/python/langchain/test/unit-testing

## 和其他书

- [AgentScope Java](../agentscope-java/README.md)：小帆、`OD-2049`、同一句工单。那边是 Java 平台，这边是 Python 编排。
- [LiteLLM](../litellm/README.md)：模型入口。第 2 章只记录「未安装 provider 包时 `init_chat_model` 抛出的 `ImportError`」，不把请求打到 `llm.example.com`。
- [Langfuse](../langfuse/README.md)：轨迹怎么读。第 8 章不初始化 Langfuse SDK。
- [MCP](../mcp/README.md)：工具协议。本书的 `lookup_order` 是进程内函数，不是 MCP Server。
- [CopilotKit](../copilotkit/README.md)：第 5 章把 LangGraph 接到前端运行时。本书把那张图本身写清楚，不重复前端。

元数据（bookId / title / tagline）以 [`build/books/registry.mjs`](../../build/books/registry.mjs) 为准。
