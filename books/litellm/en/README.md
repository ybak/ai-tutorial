# LiteLLM: Multi-Model Gateway, Quotas, and Fallback

> Status: **draft complete (revised 2026-11-12)**. 10 chapters. The main line is only the LiteLLM open-source core (the repository-root `LICENSE` is MIT; `enterprise/` has a separate commercial license, is not a required step, and `LITELLM_LICENSE` is not set). On 2026-11-12 the Admin UI was started and logged into with the official image `ghcr.io/berriai/litellm:main-stable`, Postgres 16, and two local mock upstreams. The sidebar shows LiteLLM **v1.169.0**. The Chat Completions success header from the same run is `x-litellm-version: 1.109.0`. Both numbers are kept. The pip install on 2026-11-11 is a separate **1.109.0**. That day tested virtual keys, team budgets, cross-model refusal, the per-minute request cap, and fallback after the primary upstream was disconnected. There is no vendor key, and nothing was delivered to Langfuse. Screenshots are in `assets/images/`. Captions follow what was on screen that day. Spring AI and AgentScope Java client snippets follow each project's docs and the existing chapters on this shelf. Those processes were not started in this book's environment, and the chapters mark a review list.

Lin Zhou is a fictional character; do not put real author names in chapters, config, or sample org names.

Xingfan (星帆, "Starsail" in the demo credentials) is the platform in the running example. The demo password and the master key use the Starsail spelling. The prose uses Xingfan.

## What this book is

Xingfan's Java platform already has the support Agent Xiaofan, and two merchants: Seashore Select and Aurora Digital. A chase on order `OD-2049` hits a model. The upstream key should not enter the business repo. The two merchants' quotas should not share one key. When the primary model drops, support should not stop.

LiteLLM Proxy is the open-source gateway for that: OpenAI-compatible Chat Completions on the outside, upstream keys and virtual keys and per-team accounting on the inside, and a switch to another alias when a deployment fails. New API ([QuantumNous/new-api](https://github.com/QuantumNous/new-api), AGPL-3.0, plus a section 7 attribution) is only a comparison in chapters 2 and 10. It is not the base of the text.

This book is the "gateway / quota" slice of the **ai-platform** candidate. It is not the whole ai-platform book. Tenant-isolation policy, a billing product, and the merchant console stay in the candidate pool.

## Who it is for

A Java platform team building a multi-tenant agent platform for cross-border commerce. You have changed the order domain in `open-api-platform`, or you are about to pull the AgentScope Service model channel in from "one upstream key inside the process" to a company gateway. Testing and operations can read only chapters 2, 4, 7, and 9.

## Names that stay fixed

These names line up with the [AgentScope Java book](../../agentscope-java/README.md). Chapters do not invent a second set. Credential values below are the local demo. They are not production secrets.

| Item | Value |
| --- | --- |
| Platform | Xingfan (星帆). Demo credentials use Starsail |
| Support Agent | Xiaofan, `xingfan-support`; hosted form `xbd-seashore-cs-agent` |
| Engineer | Lin Zhou, the same fictional character as in the super-agent book |
| Seashore Select | namespace `seashore-main`, shop owner alice |
| Aurora Digital | namespace `aurora-main`, shop owner bob |
| Order | `OD-2049` |
| Ticket | "After-sales escalation: order OD-2049, the customer complains about a shipping delay", team `xbd-seashore-cs-team` |
| Platform hostname | `agentscope.example.com` |
| Gateway hostname (the production shape in the book) | `llm.example.com` |
| Platform teaching alias | `merchant-gateway`. It means "send this to the company gateway". It is not an upstream model name |
| Local admin UI | http://127.0.0.1:4000/ui/ |
| Local proxy | `http://127.0.0.1:4000` |
| UI login | username `admin`, password `StarsailDemo#2026` (`UI_USERNAME` / `UI_PASSWORD`) |
| API master key | `sk-starsail-master` (`LITELLM_MASTER_KEY`). This is not the password in the login form |
| Mock upstream key | `sk-mock-upstream`. The simulator does not check it |
| Database | user `llmproxy`, database `litellm`, password `dbpassword9090`. Local demo only |
| Seashore support alias | `seashore-cs`, deployment id `seashore-cs-primary`, in-container `http://mock-primary:18001/v1` |
| Fallback alias | `seashore-cs-fast`, deployment id `seashore-cs-fast`, in-container `http://mock-backup:18002/v1` |
| Aurora support alias | `aurora-cs`, deployment id `aurora-cs-primary`, shares port 18001 with Seashore's primary |
| Gateway model aliases | `seashore-cs`, `seashore-cs-fast`, `aurora-cs`. These three only |

The local experiment starts from [../demo/README.md](../demo/README.md) with Docker Compose: the official image, Postgres 16, two mock upstreams, config mounted by volume. Log into the admin UI with `UI_USERNAME` / `UI_PASSWORD`. Call the API with the master key. The production hostname stays `llm.example.com`. Do not write `127.0.0.1:4000` into the business repo.

After login, the top of the page has a pink banner: Environment-credential login is enabled. Login with SSO on the login page was not used. The password contains `#`: quote it in a shell, and type it literally in the browser. `sk-starsail-master` is for API calls, `seed.sh`, and `smoke.sh`. It does not go in the login form, and the UI password is not a Bearer token.

On 2026-11-11 there was a separate pip install without Docker. `importlib.metadata` and PyPI were both **1.109.0**. The 403, 422, 429, and fallback headers from that day still count, but the startup steps are the Compose path. That day's `api_base` was `127.0.0.1`, and `seashore-cs-fast`'s upstream model name was `openai/mock-qwen-turbo` (the 2026-11-11 pip config). The current `config.yaml` uses in-container service names, and all three aliases use `openai/mock-qwen-plus`.

`main-stable` is a floating tag. This book did not pin a digest. Release notes record the sidebar string and `x-litellm-version` together.

## Start

Docker Compose is required. From `books/litellm/demo`:

```bash
docker compose up
```

The first run pulls `ghcr.io/berriai/litellm:main-stable`, `postgres:16`, and `python:3.12-slim`. Then open http://127.0.0.1:4000/ui/ and log in with `admin` / `StarsailDemo#2026`.

Model aliases come from `config.yaml` and are marked Defined in config. Teams and virtual keys are not in the config file. On an empty database, once:

```bash
export LITELLM_MASTER_KEY=sk-starsail-master
./seed.sh
```

That creates team `seashore-main` ($50, `seashore-cs` and `seashore-cs-fast`), team `aurora-main` ($30, `aurora-cs`), key `alice` ($10, rpm 30), and key `bob` ($8, rpm 20). The script does not pass `budget_duration`. The key table on 2026-11-12 shows Budget Reset as Never. Key plaintext is printed once. The `team_id` values in the screenshots belong to that database. A rerun will not match them, and a second run on a database that is no longer empty creates another pair of teams with the same names.

## Chapters

| Chapter | In one sentence | File |
| --- | --- | --- |
| 1 | Why the upstream key cannot enter the business repo | [chapters/01-keys-stay-out.md](chapters/01-keys-stay-out.md) |
| 2 | Run the Proxy with Compose, log into the Admin UI, and read Home | [chapters/02-run-the-proxy.md](chapters/02-run-the-proxy.md) |
| 3 | Virtual keys: the upstream key stays on the gateway | [chapters/03-virtual-keys.md](chapters/03-virtual-keys.md) |
| 4 | Team budgets and rate limits | [chapters/04-budgets-and-limits.md](chapters/04-budgets-and-limits.md) |
| 5 | Where tenant isolation stops, at the gateway | [chapters/05-tenant-on-the-gateway.md](chapters/05-tenant-on-the-gateway.md) |
| 6 | Aliases, deployment ids, and the model name the business sees | [chapters/06-model-alias.md](chapters/06-model-alias.md) |
| 7 | Fallback, retries, load, and one fallback cut off by the budget pre-check | [chapters/07-fallback.md](chapters/07-fallback.md) |
| 8 | Point AgentScope and Spring AI at the same entry | [chapters/08-java-clients.md](chapters/08-java-clients.md) |
| 9 | Hand the call trace to Langfuse | [chapters/09-langfuse.md](chapters/09-langfuse.md) |
| 10 | The license, the `enterprise/` directory, and the boundary with New API | [chapters/10-boundaries.md](chapters/10-boundaries.md) |

The 13 Admin UI screenshots are cited from the English chapters with the same relative path as the Chinese chapters: `../assets/images/`. Chapter 2 has the login page, Home, and the lower sidebar. Chapter 3 has Virtual Keys. Chapter 4 has Usage and Request Logs. Chapter 5 has Teams. Chapter 6 has Models and the Playground. Chapter 7 has Router Settings → Fallbacks.

Request Logs listed 3 rows at the time. Usage later showed more requests. That gap stays in chapter 4. It is not rewritten as "the logs and the usage match".

## License

- LiteLLM's root [`LICENSE`](https://github.com/BerriAI/litellm/blob/main/LICENSE), read on 2026-11-11: if `enterprise/` exists, that directory's own license applies; the rest is MIT, copyright Berri AI, 2023.
- [`enterprise/LICENSE.md`](https://github.com/BerriAI/litellm/blob/main/enterprise/LICENSE.md) is a commercial license. Production use of that directory's code needs a valid Enterprise subscription. Development and testing may copy and modify, and the rights stay with BerriAI. This book does not cite that directory's implementation, and it does not make SSO, audit logs, or key custody a required step.
- The official Enterprise page draws virtual keys, budgets, the admin UI, and load balancing on the open-source gateway layer, and also writes organization / project / tag budgets into a "turned on by the license" list. The two are not the same picture. Required steps follow only the proxy docs that do not require `LITELLM_LICENSE`: virtual keys, teams, budgets, routing, and fallback.
- New API is AGPL-3.0. The project README says that, under section 7, it keeps the UI attribution `Frontend design and development by New API contributors.` and a visible link to the original project. If Xingfan embeds the gateway into a console merchants can open, that duty and AGPL's network-distribution duty need a separate review. This book therefore does not use it as the base.
- This book's text is study notes, distributed with this repository under Apache-2.0. It is not affiliated with BerriAI or QuantumNous.

## Other books on this shelf

- [AgentScope Java](../../agentscope-java/README.md): Xiaofan, the two merchants, `llm.example.com`, and the model channel in Step 13. Chapter 8 attaches behind that channel.
- [Langfuse](../../langfuse/README.md): how to read a trace, and where prompts and datasets live. Chapter 9 only writes how the gateway sends one completion out. It does not reuse that book's organization names.
- [MCP](../../mcp/README.md): the tool protocol. The gateway does not replace MCP.
- [Super-agent](../../super-agent/README.md): another day for the character Lin Zhou. The order-domain repo name `open-api-platform` is carried over from there.

Book metadata (bookId / title / tagline) follows [`build/books/registry.mjs`](../../../build/books/registry.mjs).
