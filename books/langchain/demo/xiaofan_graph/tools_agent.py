"""Chapter 3: a tool, a hand-written loop, and create_agent. No vendor key."""

from langchain.agents import create_agent
from langchain.messages import AIMessage, HumanMessage, ToolCall, ToolMessage
from langchain.tools import tool
from langchain_core.language_models.fake_chat_models import GenericFakeChatModel

from xiaofan_graph.orders import ORDER_ID, lookup_order_record, record_as_text


class FakeToolCallingModel(GenericFakeChatModel):
    """create_agent calls bind_tools. The stock fake model does not implement it."""

    def bind_tools(self, tools, **kwargs):
        return self


@tool
def lookup_order(order_id: str) -> str:
    """按订单号查询星帆出海的订单。未知订单号返回 NOT_FOUND，不要编造。"""
    record = lookup_order_record(order_id)
    if record is None:
        return "NOT_FOUND"
    return record_as_text(record)


def scripted_model() -> FakeToolCallingModel:
    return FakeToolCallingModel(messages=iter([
        AIMessage(
            content="",
            tool_calls=[ToolCall(
                name="lookup_order",
                args={"order_id": ORDER_ID},
                id="call_od_2049",
            )],
        ),
        AIMessage(content="订单 OD-2049 已延误。运单 YT-2049-88，已过 9 天。"),
    ]))


def run_manual_loop() -> list:
    model = scripted_model().bind_tools([lookup_order])
    messages = [HumanMessage(content="查一下订单 OD-2049 的物流")]
    ai = model.invoke(messages)
    messages.append(ai)
    for call in ai.tool_calls:
        messages.append(ToolMessage(
            content=lookup_order.invoke(call["args"]),
            tool_call_id=call["id"],
        ))
    messages.append(model.invoke(messages))
    return messages


def run_create_agent() -> dict:
    agent = create_agent(
        scripted_model(),
        tools=[lookup_order],
        system_prompt="你是星帆出海客服小帆。只根据工具结果回答，不要编造运单。",
    )
    return agent.invoke({
        "messages": [HumanMessage(content="查一下订单 OD-2049 的物流")],
    })


def main() -> None:
    print("tool_missing", lookup_order.invoke({"order_id": "OD-0000"}))
    manual = run_manual_loop()
    print("manual_types", [type(m).__name__ for m in manual])
    print("manual_tool", manual[2].content)
    print("manual_final", manual[3].content)
    result = run_create_agent()
    names = [type(m).__name__ for m in result["messages"]]
    print("agent_types", names)
    print("agent_final", result["messages"][-1].content)
    agent = create_agent(scripted_model(), tools=[lookup_order])
    print("agent_nodes", list(agent.get_graph().nodes))


if __name__ == "__main__":
    main()
