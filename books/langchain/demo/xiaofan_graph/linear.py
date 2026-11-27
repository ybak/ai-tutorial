"""Chapter 4: one straight graph. Classify, look up, draft. No branch, no model call."""

from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from xiaofan_graph.orders import ORDER, ORDER_ID, SHIPPING_TEXT, TEAM, TICKET


class SupportState(TypedDict, total=False):
    text: str
    order_id: str
    intent: str
    delayed: bool
    draft: str


def classify(state: SupportState) -> dict:
    text = state.get("text", "")
    if "退款" in text:
        intent = "refund"
    elif ORDER_ID in text or "物流" in text:
        intent = "shipping_delay"
    else:
        intent = "other"
    order_id = ORDER_ID if ORDER_ID in text else ""
    return {"intent": intent, "order_id": order_id}


def lookup(state: SupportState) -> dict:
    if state.get("order_id") != ORDER_ID:
        return {"delayed": False}
    return {"delayed": bool(ORDER["delayed"])}


def draft(state: SupportState) -> dict:
    intent = state.get("intent")
    if intent == "shipping_delay" and state.get("delayed"):
        text = (
            f"订单 {ORDER_ID} 由{ORDER['carrier']}承运，运单 {ORDER['tracking']}，"
            f"{ORDER['shipped_at']} 发出，已过 {ORDER['elapsed_days']} 天，"
            f"超过承诺的 {ORDER['promised_days']} 天。"
            f"拟开立工单：{TICKET}。团队 {TEAM}。"
        )
    elif intent == "refund":
        text = f"拟为订单 {ORDER_ID} 登记退款申请。退款不会自动执行。"
    elif intent == "shipping_delay":
        text = "未查到可判定延误的订单，请核对订单号。"
    else:
        text = "已记下。请给出订单号，或说明是物流还是退款。"
    return {"draft": text}


def build_linear():
    builder = StateGraph(SupportState)
    builder.add_node("classify", classify)
    builder.add_node("lookup", lookup)
    builder.add_node("draft", draft)
    builder.add_edge(START, "classify")
    builder.add_edge("classify", "lookup")
    builder.add_edge("lookup", "draft")
    builder.add_edge("draft", END)
    return builder.compile()


def main() -> None:
    graph = build_linear()
    out = graph.invoke({"text": SHIPPING_TEXT})
    print("linear_intent", out["intent"])
    print("linear_order", out["order_id"])
    print("linear_delayed", out["delayed"])
    print("linear_draft", out["draft"])
    print("linear_mermaid_has_classify", "classify" in graph.get_graph().draw_mermaid())


if __name__ == "__main__":
    main()
