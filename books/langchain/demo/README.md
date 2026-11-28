# 小帆售后图（本地演示）

English: this directory is the runnable half of the LangChain / LangGraph book. It does not call a model vendor. Install the pins below and run `run_all.py`. Customer text, order `OD-2049`, and the ticket sentence stay in Chinese because those strings are the shelf's fixed case.

没有厂商密钥。链和 Agent 用 `FakeListChatModel` / `GenericFakeChatModel`。图的分类、查单、条件边、检查点和人工确认是确定性 Python，不经过模型。

核实日期：2026-11-27。当时装上的版本是 `langchain==1.5.2`、`langgraph==1.2.24`、`langgraph-checkpoint-sqlite==3.1.3`（Python 3.12）。`langchain-openai` 故意不在依赖里。

```bash
cd books/langchain/demo
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python run_all.py
```

`run_all.py` 按章调用 `xiaofan_graph` 里的 `main()`。SQLite 文件写在临时目录，进程结束即删。不要把 `.venv/` 或任何密钥文件交进仓库。

| 模块 | 对应章 | 它证明什么 |
| --- | --- | --- |
| `xiaofan_graph/chain.py` | 2 | `prompt \| model \| parser` 在假模型上返回 `shipping_delay` |
| `xiaofan_graph/tools_agent.py` | 3 | 手写工具循环和 `create_agent` 都走到 `lookup_order` |
| `xiaofan_graph/linear.py` | 4 | `classify → lookup → draft` 直线图 |
| `xiaofan_graph/routing.py` | 5 | 条件边，以及 `recursion_limit` 触发 `GraphRecursionError` |
| `xiaofan_graph/checkpoint.py` | 6 | `InMemorySaver is MemorySaver`；SQLite 在第二个进程里接着加一 |
| `xiaofan_graph/hitl.py` | 7 | `interrupt` 停在开单前，`Command(resume=...)` 决定开或不开 |
| `xiaofan_graph/app.py` | 8 | 三条客户话走同一张图 |

订单、工单、团队名与书架其他书一致，定义在 `xiaofan_graph/orders.py`，不要在别的文件再写一套。
