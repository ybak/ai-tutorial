"""Chapter 2: one chain, no vendor key."""

from langchain_core.language_models import FakeListChatModel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from xiaofan_graph.orders import SHIPPING_TEXT

SYSTEM = "只输出一个标签：shipping_delay、refund、other。"


def build_chain():
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM),
        ("human", "{text}"),
    ])
    # Cycles: a second invoke returns the same string. It does not read the prompt.
    model = FakeListChatModel(responses=["shipping_delay"])
    return prompt | model | StrOutputParser()


def main() -> None:
    chain = build_chain()
    label = chain.invoke({"text": SHIPPING_TEXT})
    again = chain.invoke({"text": "这段输入假模型不会看"})
    print("chain_label", label)
    print("chain_again", again)
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM),
        ("human", "{text}"),
    ])
    formatted = prompt.invoke({"text": SHIPPING_TEXT})
    print("prompt_roles", [type(m).__name__ for m in formatted.messages])
    print("prompt_human", formatted.messages[1].content)
    model = FakeListChatModel(responses=["shipping_delay"])
    try:
        model.with_structured_output(dict)
    except NotImplementedError as exc:
        print("structured_error", type(exc).__name__)
        print("structured_message", str(exc))
    from langchain.chat_models import init_chat_model
    try:
        init_chat_model("openai:gpt-4o-mini")
    except ImportError as exc:
        print("init_error", type(exc).__name__)
        print("init_message", str(exc))


if __name__ == "__main__":
    main()
