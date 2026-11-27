"""Chapter 5: conditional edges, a bounded cycle, and a recursion limit."""

from typing import Literal, TypedDict

from langgraph.errors import GraphRecursionError
from langgraph.graph import END, START, StateGraph

from xiaofan_graph.linear import SupportState, classify, draft, lookup
from xiaofan_graph.orders import OTHER_TEXT, REFUND_TEXT, SHIPPING_TEXT, TICKET


def route_after_classify(state: SupportState) -> Literal["lookup", "draft"]:
    if state.get("intent") == "shipping_delay" and state.get("order_id"):
        return "lookup"
    return "draft"


def build_router():
    builder = StateGraph(SupportState)
    builder.add_node("classify", classify)
    builder.add_node("lookup", lookup)
    builder.add_node("draft", draft)
    builder.add_edge(START, "classify")
    builder.add_conditional_edges(
        "classify",
        route_after_classify,
        {"lookup": "lookup", "draft": "draft"},
    )
    builder.add_edge("lookup", "draft")
    builder.add_edge("draft", END)
    return builder.compile()


class CountState(TypedDict):
    n: int


def increment(state: CountState) -> dict:
    return {"n": state["n"] + 1}


def continue_until_three(state: CountState) -> Literal["increment", "end"]:
    if state["n"] < 3:
        return "increment"
    return "end"


def build_cycle(limit_always: bool = False):
    builder = StateGraph(CountState)
    builder.add_node("increment", increment)
    builder.add_edge(START, "increment")
    if limit_always:
        builder.add_conditional_edges(
            "increment",
            lambda state: "increment",
            {"increment": "increment"},
        )
    else:
        builder.add_conditional_edges(
            "increment",
            continue_until_three,
            {"increment": "increment", "end": END},
        )
    return builder.compile()


def main() -> None:
    graph = build_router()
    for label, text in (
        ("shipping", SHIPPING_TEXT),
        ("refund", REFUND_TEXT),
        ("other", OTHER_TEXT),
    ):
        out = graph.invoke({"text": text})
        print(
            "route",
            label,
            out["intent"],
            "delayed",
            out.get("delayed"),
            "mentions_ticket",
            TICKET in out["draft"],
        )
    print("cycle", build_cycle().invoke({"n": 0}))
    try:
        build_cycle(limit_always=True).invoke({"n": 0}, {"recursion_limit": 4})
    except GraphRecursionError as exc:
        print("recursion_error", type(exc).__name__)
        print("recursion_limit_in_message", "Recursion limit of 4" in str(exc))


if __name__ == "__main__":
    main()
