"""Chapter 7: interrupt before opening a ticket. Resume with Command."""

from typing import Literal, TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

from xiaofan_graph.orders import ORDER, ORDER_ID, OTHER_TEXT, REFUND_TEXT, SHIPPING_TEXT, TEAM, TICKET


class HitlState(TypedDict, total=False):
    text: str
    order_id: str
    intent: str
    delayed: bool
    draft: str
    decision: str
    ticket: str


def classify(state: HitlState) -> dict:
    text = state.get("text", "")
    if "退款" in text:
        intent = "refund"
    elif ORDER_ID in text or "物流" in text:
        intent = "shipping_delay"
    else:
        intent = "other"
    order_id = ORDER_ID if ORDER_ID in text else ""
    return {"intent": intent, "order_id": order_id}


def lookup(state: HitlState) -> dict:
    delayed = state.get("order_id") == ORDER_ID and bool(ORDER["delayed"])
    return {"delayed": delayed}


def draft(state: HitlState) -> dict:
    intent = state.get("intent")
    if intent == "refund":
        text = f"拟为订单 {ORDER_ID} 登记退款申请。退款不会自动执行，需要人工确认。"
    elif intent == "shipping_delay" and state.get("delayed"):
        text = (
            f"订单 {ORDER_ID} 由{ORDER['carrier']}承运，运单 {ORDER['tracking']}，"
            f"{ORDER['shipped_at']} 发出，已过 {ORDER['elapsed_days']} 天，"
            f"超过承诺的 {ORDER['promised_days']} 天。"
            f"拟开立工单：{TICKET}。团队 {TEAM}。"
        )
    elif intent == "shipping_delay":
        text = "未查到可判定延误的订单，请核对订单号。"
    else:
        text = "已记下。请给出订单号，或说明是物流还是退款。"
    return {"draft": text}


def gate(state: HitlState) -> dict:
    # This node restarts from the top on resume. Keep side effects after interrupt.
    decision = interrupt({
        "order_id": state.get("order_id", ""),
        "intent": state.get("intent", ""),
        "draft": state.get("draft", ""),
        "ticket": TICKET,
    })
    approved = bool(decision.get("approved"))
    note = decision.get("note") or ""
    ticket = TICKET if approved and state.get("intent") in {"shipping_delay", "refund"} else ""
    draft_text = state.get("draft", "")
    if note:
        draft_text = f"{draft_text} 备注：{note}"
    return {
        "decision": "approved" if approved else "rejected",
        "ticket": ticket,
        "draft": draft_text,
    }


def route_after_classify(state: HitlState) -> Literal["lookup", "draft"]:
    if state.get("intent") == "shipping_delay" and state.get("order_id"):
        return "lookup"
    return "draft"


def route_after_draft(state: HitlState) -> Literal["gate", "end"]:
    if state.get("intent") == "refund":
        return "gate"
    if state.get("intent") == "shipping_delay" and state.get("delayed"):
        return "gate"
    return "end"


def build_hitl(checkpointer=None):
    builder = StateGraph(HitlState)
    builder.add_node("classify", classify)
    builder.add_node("lookup", lookup)
    builder.add_node("draft", draft)
    builder.add_node("gate", gate)
    builder.add_edge(START, "classify")
    builder.add_conditional_edges(
        "classify",
        route_after_classify,
        {"lookup": "lookup", "draft": "draft"},
    )
    builder.add_edge("lookup", "draft")
    builder.add_conditional_edges(
        "draft",
        route_after_draft,
        {"gate": "gate", "end": END},
    )
    builder.add_edge("gate", END)
    return builder.compile(checkpointer=checkpointer or InMemorySaver())


def pause(graph, thread_id: str, text: str) -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    out = graph.invoke({"text": text}, config)
    payload = out["__interrupt__"][0].value
    return payload


def finish(graph, thread_id: str, resume: dict) -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    return graph.invoke(Command(resume=resume), config)


def main() -> None:
    graph = build_hitl()
    payload = pause(graph, "xiaofan-OD-2049", SHIPPING_TEXT)
    print("pause_order", payload["order_id"])
    print("pause_intent", payload["intent"])
    print("pause_ticket", payload["ticket"])
    print("pause_draft_has_tracking", "YT-2049-88" in payload["draft"])
    done = finish(graph, "xiaofan-OD-2049", {"approved": True, "note": "林舟确认开单"})
    print("approved_decision", done["decision"])
    print("approved_ticket", done["ticket"])
    print("approved_note", "林舟确认开单" in done["draft"])

    graph_r = build_hitl()
    pause(graph_r, "xiaofan-OD-2049-reject", REFUND_TEXT)
    rejected = finish(graph_r, "xiaofan-OD-2049-reject", {"approved": False, "note": "先安抚，不退款"})
    print("rejected_decision", rejected["decision"])
    print("rejected_ticket_empty", rejected["ticket"] == "")

    other = build_hitl().invoke(
        {"text": OTHER_TEXT},
        {"configurable": {"thread_id": "xiaofan-other"}},
    )
    print("other_intent", other["intent"])
    print("other_interrupted", "__interrupt__" in other)
    print("other_draft", other["draft"])


if __name__ == "__main__":
    main()
