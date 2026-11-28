"""Chapter 8: the same graph as chapter 7, three customer messages, one entry point."""

from xiaofan_graph.hitl import build_hitl, finish, pause
from xiaofan_graph.orders import OTHER_TEXT, REFUND_TEXT, SHIPPING_TEXT, TICKET


def main() -> None:
    graph = build_hitl()
    shipping = pause(graph, "thread-shipping", SHIPPING_TEXT)
    shipping_done = finish(graph, "thread-shipping", {"approved": True, "note": "林舟确认开单"})
    print("e2e_shipping_ticket", shipping["ticket"])
    print("e2e_shipping_opened", shipping_done["ticket"] == TICKET)

    refund_graph = build_hitl()
    pause(refund_graph, "thread-refund", REFUND_TEXT)
    refund_done = finish(refund_graph, "thread-refund", {"approved": False, "note": "先安抚，不退款"})
    print("e2e_refund_decision", refund_done["decision"])
    print("e2e_refund_ticket_empty", refund_done["ticket"] == "")

    other = build_hitl().invoke(
        {"text": OTHER_TEXT},
        {"configurable": {"thread_id": "thread-other"}},
    )
    print("e2e_other_intent", other["intent"])
    print("e2e_other_interrupted", "__interrupt__" in other)


if __name__ == "__main__":
    main()
