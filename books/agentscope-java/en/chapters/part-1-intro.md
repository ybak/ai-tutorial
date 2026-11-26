---
title: Part 1 Getting Started
source: newly written
---

The first time you meet AgentScope, the names come in a string: ReActAgent (the base Agent that runs the loop "reason, call a tool, observe the result"), HarnessAgent (the recommended entry class that adds engineering capabilities on that same loop), and Service Managed Agent. When you cannot tell them apart, this part is the first three steps: get to know it, run it, then draw the map. Chapter 1 starts from real scenes such as support Q&A and multi-step tasks. It says what AgentScope can build, and the three dimensions Harness uses to keep an Agent working: a long-running task (a task that spans many reasoning steps and can stop and resume), context (everything one model call can see), and controlled execution (tool actions constrained by permission rules). Chapter 2 runs the first HarnessAgent: installing the dependency, a shared Builder (the object that holds the Agent configuration), the two call styles `call` (wait for the final reply) and `streamEvents` (emit an event stream while the work runs), and restoring a session across instances (continue the conversation with the same session identity). Chapter 3 gathers the concepts of the whole book onto one map and shows how the three layers stack.

This part is for every reader. Whether the later goal is to embed the SDK in your own Java application or to operate a managed Agent on the Service platform, start here. Readers who already know an agent framework can read only the concept map in Chapter 3 and then jump to the chapters they care about.

After this part, application developers go to Part 2 (Chapters 4–10) and take the core building blocks one by one, or jump to Chapter 11 for the whole Harness. Platform readers can go to Part 5 (from Chapter 29) after Chapter 3, but they should finish the hands-on work in Chapter 2 first.
