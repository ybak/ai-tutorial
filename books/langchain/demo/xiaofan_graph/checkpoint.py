"""Chapter 6: InMemorySaver is MemorySaver. SqliteSaver survives a second process."""

import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver, MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph


class CountState(TypedDict):
    n: int


def increment(state: CountState) -> dict:
    return {"n": state["n"] + 1}


def build_counter(checkpointer):
    builder = StateGraph(CountState)
    builder.add_node("increment", increment)
    builder.add_edge(START, "increment")
    builder.add_edge("increment", END)
    return builder.compile(checkpointer=checkpointer)


def resume_sqlite(path: str) -> None:
    """Second process: read the checkpoint written by the parent."""
    config = {"configurable": {"thread_id": "xiaofan-OD-2049"}}
    with SqliteSaver.from_conn_string(path) as saver:
        graph = build_counter(saver)
        snap = graph.get_state(config)
        print("sqlite_reopen_n", snap.values.get("n"))
        nxt = snap.next
        print("sqlite_reopen_next", ",".join(nxt) if nxt else "")
        out = graph.invoke({"n": snap.values["n"]}, config)
        print("sqlite_second_step", out["n"])


def main() -> None:
    print("saver_is_same_class", InMemorySaver is MemorySaver)
    graph = build_counter(InMemorySaver())
    config = {"configurable": {"thread_id": "xiaofan-OD-2049"}}
    first = graph.invoke({"n": 0}, config)
    second = graph.invoke({"n": first["n"]}, config)
    print("memory_first", first["n"])
    print("memory_second", second["n"])
    history = list(graph.get_state_history(config))
    print("memory_history_len", len(history))

    with tempfile.TemporaryDirectory() as directory:
        path = str(Path(directory) / "xiaofan.sqlite")
        config = {"configurable": {"thread_id": "xiaofan-OD-2049"}}
        with SqliteSaver.from_conn_string(path) as saver:
            graph = build_counter(saver)
            graph.invoke({"n": 0}, config)
        demo_root = Path(__file__).resolve().parents[1]
        env = os.environ.copy()
        env["PYTHONPATH"] = str(demo_root) + os.pathsep + env.get("PYTHONPATH", "")
        proc = subprocess.run(
            [sys.executable, "-m", "xiaofan_graph.checkpoint", "--resume", path],
            check=True,
            capture_output=True,
            text=True,
            cwd=str(demo_root),
            env=env,
        )
        print(proc.stdout, end="")


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--resume":
        resume_sqlite(sys.argv[2])
    else:
        main()
