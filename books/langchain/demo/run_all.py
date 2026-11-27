"""Run every chapter's local check. No vendor API key is read or required."""

import importlib

STEPS = [
    "xiaofan_graph.chain",
    "xiaofan_graph.tools_agent",
    "xiaofan_graph.linear",
    "xiaofan_graph.routing",
    "xiaofan_graph.checkpoint",
    "xiaofan_graph.hitl",
    "xiaofan_graph.app",
]


def main() -> None:
    for name in STEPS:
        print(f"## {name}")
        importlib.import_module(name).main()


if __name__ == "__main__":
    main()
