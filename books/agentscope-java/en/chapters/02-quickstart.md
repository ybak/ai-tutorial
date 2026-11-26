---
chapter: 2
title: Quick Start
source: docs/quickstart.md
---

# Chapter 2 Quick Start

> Chapter guide: When you want to run a first AgentScope application in a Java project — not only remember the concepts — this chapter takes you from nothing: install the dependency, create an agent that remembers the conversation, and talk to it both synchronously and as a stream. This application is the seed of Xiaofan, the Xingfan (星帆出海) support Agent that runs through the book. From Chapter 4 it grows tools, permissions, and a platform shape. By the end you have a minimal example that can restore a session across instances, and you know when to bring in `AgentSession`.

## When you need it

What this chapter runs is the smallest closed loop of the Harness capability from Chapter 1: embed a `HarnessAgent` in your own application and finish a conversation. Three common starting points:

- **Add an assistant that can do work to an existing Java or Spring Boot service.** For example, a user asks "where is my order?". The backend should not only return a paragraph. It should let the Agent call the order API and, when needed, confirm with you and continue. That is the Q&A and assistant scene from Chapter 1.
- **Make the model's work visible while it runs.** Watching progress on the command line, or showing the answer word by word on a page, needs streaming output, not one return of the final result.
- **You expect the task to grow long and to be interrupted.** The task still has to continue after the user closes the page. That means learning session persistence and `AgentSession` ahead of time. A later subsection in this chapter covers it.

If you only want to check that the framework works, this chapter is also a minimal check: one Maven dependency and one class complete two turns of Q&A with memory.

How this sits with what you already read: Chapter 1 gave three dimensions at the scene level. In this minimal example you touch two of the foundations — passing a session identity on every call, and a state snapshot that is saved automatically. Permissions and the sandbox, which belong to controlled execution, are not configured here. They wait for Chapters 7, 10, and 18.

## Install

Prepare the environment first. AgentScope Java needs JDK 17 or newer. The recommended build tool is Maven 3.9 or newer.

### The Maven dependency

`HarnessAgent` is the recommended entry. It packs workspace, long-term memory, session persistence, sub-agents, the sandbox, and other engineering capabilities into one builder. Depending on `agentscope-harness` also pulls in the core `agentscope-core`:

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-harness</artifactId>
    <version>${agentscope.version}</version>
</dependency>
```

> **Note:** Replace `${agentscope.version}` with the latest version. The latest version is in Appendix A (Release Notes).

If you only need the reasoning, tool, and context APIs of `ReActAgent`, and you will assemble the capabilities the application needs yourself, `agentscope-core` is enough for the agent itself. A specific model provider is separate. The Chat Model and formatter for a given provider (the component that turns conversation messages into that model's request format) live in their own `agentscope-extensions-model-*` extension module. The difference between `ReActAgent` and `HarnessAgent` is in Chapter 3 and Chapter 11.

The quickstart below uses DashScope through `.model("dashscope:qwen-plus")`, so it also needs that model extension:

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-extensions-model-dashscope</artifactId>
    <version>${agentscope.version}</version>
</dependency>
```

MCP integration needs the official MCP SDK. See `agentscope-examples/documentation/pom.xml`.

## The first agent

Define a shared Builder when the application starts. On each request, `builder.build()` creates a new Agent, and you close it when the call finishes. The Builder holds the shared configuration. The request identity goes in a separate `RuntimeContext` (the user and session identity carried on one call). A new instance does not change the session identity. In other words, session memory does not belong to an Agent instance. It hangs on the pair `userId` and `sessionId`. The instance is discarded when the call ends. The conversation is found again by identity. The sample below uses two instances for two turns of the same session. Set the model credential before you run:

```bash
export DASHSCOPE_API_KEY=your_api_key
```

```java
import io.agentscope.core.agent.RuntimeContext;
import io.agentscope.core.message.Msg;
import io.agentscope.core.message.UserMessage;
import io.agentscope.harness.agent.HarnessAgent;
import java.nio.file.Path;

public class FirstAgent {
    // Configured once when the application starts. After that, only build() is called.
    private static final HarnessAgent.Builder AGENT_BUILDER = HarnessAgent.builder()
            .name("xingfan-support")
            .agentId("xingfan-support")
            .sysPrompt("你是星帆出海的客服小帆，语气友好，只基于事实回答。")
            .model("dashscope:qwen-plus")
            .workspace(Path.of(".agentscope/workspace"));

    public static void main(String[] args) {
        try (HarnessAgent agent = AGENT_BUILDER.build()) {
            RuntimeContext ctx = RuntimeContext.builder()
                    .userId("alice").sessionId("demo-session").build();
            agent.call(new UserMessage("我叫天宇，订单 OD-2049 三天了还没到，想问问情况。"), ctx).block();
        }

        // The next request uses a new instance. The same session identity restores context from the persistent log.
        try (HarnessAgent agent = AGENT_BUILDER.build()) {
            RuntimeContext ctx = RuntimeContext.builder()
                    .userId("alice").sessionId("demo-session").build();
            Msg reply = agent.call(new UserMessage("我叫什么？我的订单出了什么问题？"), ctx).block();
            System.out.println(reply.getTextContent());
        }
    }
}
```

The system prompt says the agent is Xiaofan, support for Xingfan, friendly, and answering only from facts ("你是星帆出海的客服小帆，语气友好，只基于事实回答。"). The first user message says the speaker is Tianyu and that order `OD-2049` has not arrived after three days ("我叫天宇，订单 OD-2049 三天了还没到，想问问情况。"). The second asks for the speaker's name and what went wrong with the order ("我叫什么？我的订单出了什么问题？").

`call` returns `Mono<Msg>` — Reactor's reactive type, an async computation that "runs only after it is subscribed, and finally produces one reply". `block()` here starts the work and waits for the reply. That fits a command-line example. One call can reason and run tools more than once. The next call with the same `userId` and `sessionId` uses the context of that same session.

The second turn can answer "我叫天宇" ("My name is Tianyu") not because the instance still remembers, but because of the persisted session log. By default, Harness automatically saves the execution log and the checkpoint used to continue the conversation. On restart, keep the same `agentId`, user, session identity, and storage configuration, and the conversation continues. That does not require creating an `AgentSession`.

The native log of this local example is under `.agentscope-runtime/` in the root the Workspace Filesystem resolves for the current identity. The Workspace Filesystem is the pluggable layer every Agent file read and write goes through. It can point at a local directory, shared storage, or a sandbox. After you configure an isolated directory or a distributed Filesystem, the real location follows that root or namespace. When you need to inspect the record or change the backend, see the section "Storage location and backend configuration" in Chapter 19.

### Watch reasoning and tool calls as a stream

When the text should appear as it is generated, start the request with `streamEvents`. Add the imports below at the top of the file, and create a new instance in `main` for this request:

```java
import io.agentscope.core.event.AgentEventType;
import io.agentscope.core.event.TextBlockDeltaEvent;
import io.agentscope.core.event.ToolCallStartEvent;

try (HarnessAgent agent = AGENT_BUILDER.build()) {
    RuntimeContext ctx = RuntimeContext.builder()
            .userId("alice").sessionId("demo-session").build();
    agent.streamEvents(new UserMessage("帮我把催问订单前需要确认的信息列成三条。"), ctx)
            .doOnNext(event -> {
                if (event.getType() == AgentEventType.TEXT_BLOCK_DELTA) {
                    System.out.print(((TextBlockDeltaEvent) event).getDelta());
                } else if (event.getType() == AgentEventType.TOOL_CALL_START) {
                    System.out.println("\n[tool] " + ((ToolCallStartEvent) event).getToolCallName());
                }
            })
            .blockLast();
}
```

The user message asks for three items to confirm before chasing the order ("帮我把催问订单前需要确认的信息列成三条。").

`streamEvents` returns `Flux<AgentEvent>` — Reactor's event-stream type. After it is subscribed, events arrive one after another. `blockLast()` here waits until the stream ends. It uses the same Agent capabilities and persistence configuration as `call`.

Pick `call` or `streamEvents` for the same request according to how you want the output. If you `call` first and then call `streamEvents` with the same input, the request runs again.

The event dispatch above, running in a real conversation, looks like this. The screenshot was taken on 2026-10-31 in BasicChatExample of the agentscope-examples documentation module, model glm-5.3-flash, connected through an OpenAI-compatible gateway, and confirmed in testing:

![Streaming chat confirmed in testing: in BasicChatExample the Assistant introduces itself in Chinese and gives a quote of the day, with text appearing as it is generated](../assets/images/demo/fw-02-quickstart.png)

The Assistant's introduction and the "今日金句" ("quote of the day") both appear as they are generated. The text deltas that `streamEvents` emits land on the terminal as that continuous run of text. After the input `exit`, the program exits normally.

### Use it in a web request

In the command-line example the instance is created when it is needed. Inside a web service, the instance lifetime has to line up with one request. In WebFlux, `Mono.using` manages the instance: it builds the Agent from the shared Builder when the chain is subscribed, and closes it when the work finishes, fails, or is cancelled. Do not return a `Mono` that has not been subscribed from inside a `try` block, or the Agent closes too early. The call expression in a handler:

```java
import reactor.core.publisher.Mono;

RuntimeContext ctx = RuntimeContext.builder()
        .userId(userId).sessionId(sessionId).build();
return Mono.using(
        AGENT_BUILDER::build,
        agent -> agent.call(new UserMessage(userInput), ctx),
        HarnessAgent::close);
```

`userId` should come from an authenticated identity. `sessionId` should be checked for access. After the Builder is configured, do not call setters during a request. Shared models, tools, and middleware still have to be safe for concurrent use. Different sessions can run in parallel. Requests for the same session across instances should be scheduled in order by the application. Isolating log writes is not the same as an automatic queue. Lifetime and concurrency rules are in the section "Instance lifetime" in Chapter 4.

### When to use AgentSession

Everyday Q&A, a workflow node, and a streaming UI that finishes with the current request can keep using `call` / `streamEvents`. When the execution stream is the HTTP response itself, a client disconnect can cancel that run.

When the product needs "keep running after the page closes", "accept and save the next task while busy", "add a requirement during the run", or "continue the original task after an interrupt", use the `AgentSession` from `agent.session(ctx)`. It accepts tasks and schedules background execution. The front end reads the snapshot and the persisted events on its own.

The Agent for a background task is held by the application's session manager or task worker, and closed when the task stops or the application exits. Do not close it when the HTTP request that submitted the task returns. The lifetime here covers the whole background run, not only the one submit request.

Next, read Chapter 19 (session logs and recovery), or the resumable chat example in Chapter 40. An application that uses a hosted Agent over HTTP should go straight to Chapter 31.

## What comes next

You have now run a HarnessAgent that is small and complete: the dependency, a shared Builder, `call` and `streamEvents`, and session restore across instances. The next chapter, Chapter 3, is the core concept map of the book. It shows how the three layers — ReActAgent, HarnessAgent, and Service Managed Agent — stack, so you have the whole picture before the details. Chapter 4 then goes into the Agent itself: instance lifetime, concurrency rules, structured output, and human intervention. The workspace (Chapter 12), context management, and long-term memory (Chapters 13 and 14) can be read from the contents when you need them.
