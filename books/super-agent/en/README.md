# Super-agent Design, Explored through Grok Bot

> **Status: published** (drafted 2026-11-07, added to the buildable shelf 2026-11-08, Asia/Hong_Kong).
> Turns the DeepSeek Harness team's architecture article into a one-day working method a platform engineer can follow and use.
> **Stance: this is not a DeepSeek product manual.** Grok Bot is the comparison instance. It is not a replica of the paper.
> Chapters follow the [book-writing guide](../../../docs/book-writing-guide.md). The voice stays concrete.

Lin Zhou (林舟) is a fictional character. Do not put a real author's name in the chapters, config, or sample org names.

## One-sentence poster

> An assistant should not make you the switchboard.
> Continuous means it still feels like the same person. Efficient means it talks while it works. Proactive means it rings the doorbell when something matters and stays quiet when it does not. Persistent means the main line is still there after the laptop lid closes.

## What you take with you

| Who you are | What you take |
| --- | --- |
| Platform engineer | How to seat an assistant in a multi-channel engineering day, instead of a one-shot question window |
| Architect / tech lead | The gap versus a coding agent and a personal assistant, and where Watchdog is still missing |
| Someone already using Grok Bot | One comparison table and a gate agreement you can take into a meeting |

## How to read (a map of three chapters)

| Chapter | The plain line | Open |
| --- | --- | --- |
| Chapter 1 | Why it hurts (the attention ceiling) → one counterexample and one example for each of the four traits → the sidebar and the same chat | [chapters/01-problem-and-four-traits.md](chapters/01-problem-and-four-traits.md) |
| Chapter 2 | Front desk / back-office specialist → the doorbell and group-chat noise → why pass-through and batching save work | [chapters/02-router-worker-and-events.md](chapters/02-router-worker-and-events.md) |
| Chapter 3 | Talking while working → how each channel speaks → three places kept apart → who calls a stop when it is stuck | [chapters/03-async-persistence-watchdog.md](chapters/03-async-persistence-watchdog.md) |

> **This README is the poster, not Chapter 1.** Scan this page, then open the chapters.

## How the source is used

- **Source:** [Super-agent Design Exploration: Toward a More Autonomous Agent System](https://mp.weixin.qq.com/s/zoS7GlReWPhfCjENGxXCdg) (DeepSeek Harness team, checked 2026-11-07)
- **What the source says about itself:** it is a discussion of engineering ideas. It is **not** an introduction to existing product features.
- **How this book splits the work:** the source owns "why the split looks like this." This book owns visible Grok Bot behavior, confirmed in testing, plus conventions you can execute. Implementation logic is marked **Inferred** throughout. The Routines panel is not illustrated until that panel is open and confirmed in testing.

## Running example (fixed for the whole book)

**Xingfan (星帆出海) · order-domain adaptation in `open-api-platform`**

Lin Zhou, a fictional platform engineer, spends one day connecting a channel's orders, writing an adaptation layer, and following the PR, CI, and the group discussion. He uses the same Grok Bot to practice "the main chat coordinates, the background executes, Routines watch, and a person confirms."

| Item | Value |
| --- | --- |
| Company / product | Xingfan (星帆出海) |
| Person | Lin Zhou (林舟). Chapters do not rename him |
| Repo / domain | Order-domain adaptation in `open-api-platform` |
| Interface anchor | `OrderGateway`. The idempotency key moves from `channel order number + shop ID` to `channel + out_trade_no` |
| Time zone | Asia/Hong_Kong (UTC+8) |
| Assistant | Grok Bot (the comparison instance) |

## How to read the figures

Prefer **analogy figures and crops**. Do not paste the same full-window chat into all three chapters.

| File | What it shows | Where it appears |
| --- | --- | --- |
| `21-four-traits-analogy.jpg` | The four traits as everyday feelings | Main figure of Chapter 1 |
| `22-router-analogy.jpg` | Front desk / back-office specialist | Main figure of Chapter 2 |
| `23-three-places-analogy.jpg` | Cloud / Bot computer / the user's machine | Main figure of Chapter 3 |
| `30-crop-sidebar-only.png` | The boundary between several assistants (continuous) | Chapter 1 |
| `31-crop-chat-body.png` | Continuous interaction in the chat body | Chapter 1 |
| `02-router-worker.jpg` | A sketch of the two-layer architecture | Once, in Chapter 2 |
| `03-event-compute-split.jpg` | A sketch of how events split | Once, in Chapter 2 |
| `14-main-chat-clean.png` | The full window as the coordination entry | **At most once in the book** (Chapter 1) |

The repeated full-window shots `01`, `04`, `05`, `10`, `11`, and `12` are not cited to pad the count. `40-agent-info-routines-panel.png` is not used as a Routines screenshot until that panel is open and confirmed in testing.

The eight figures cited from the English chapters use the same relative path as the Chinese chapters: `../assets/images/`. The files stay in `books/super-agent/assets/images/`. This edition does not copy them. The site build mirrors `assets/` onto `/en/super-agent/assets/`.

## Five modules (named here, opened later)

| In plain words | The article's term | Chapter |
| --- | --- | --- |
| Front desk + back-office specialist | Router / Worker | Chapter 2 |
| Doorbell, filter, pass-through | Event-driven | Chapter 2 |
| Talking while working, and matching the channel | Async, multi-channel | Chapter 3 |
| Cloud / Bot computer / the user's machine | Compute, state, and environment kept apart | Chapter 3 |
| Who calls a stop when it is stuck | Watchdog | Chapter 3 |

## Status

| Item | Value |
| --- | --- |
| Status | Published (three-chapter plain-language rewrite) |
| bookId | `super-agent` (see `build/books/registry.mjs`) |
| Old single chapter | The original `01-super-agent-with-grokbot.md` was split into the three chapters and deleted |

Book metadata (title / the one-line description) follows [`build/books/registry.mjs`](../../../build/books/registry.mjs) as the single source.
