---
chapter: 2
title: Run the LiteLLM Proxy
source: docs.litellm.ai/docs/proxy/quick_start, docs/proxy/docker_quick_start; local pip litellm 1.109.0 and a mock upstream, 2026-11-11
---

# Chapter 2 Run the LiteLLM Proxy

> Seashore Select's support agent is still waiting for one reply about OD-2049. The key has already been kept out of the repo. The next step is a process that can hear `https://llm.example.com`. This chapter runs the Proxy on a machine with no vendor key and no Docker, uses two mock upstreams in place of vendors, and puts New API in the comparison column instead of in the install steps.

```mermaid
flowchart LR
    A["Install extra_proxy<br/>and prisma generate"] --> B["Start two mock upstreams<br/>on 18001 / 18002"]
    B --> C["Write Postgres<br/>DATABASE_URL"]
    C --> D["litellm --config<br/>listen on 4000"]
    D --> E["liveliness<br/>I'm alive"]
    E --> F["/v1/models<br/>three aliases"]
    F --> G["Completion hits primary<br/>body mentions OD-2049"]
```

*Procedure for this chapter*

## The path this machine actually took

The official docs have two getting-started pages. Do not mix them into one command.

| Doc | Getting-started path as read on 2026-11-11 | Does this book use it |
| --- | --- | --- |
| CLI Quick Start | `uv tool install 'litellm[proxy]'`, then `litellm --model ...` or `--config` | This machine has no uv. Use a venv and pip instead. The database extras, which the doc mentions only in a later sentence, were installed as well |
| Docker Quickstart | `docker-compose.quickstart.yml` brings up the gateway and Postgres, and the browser opens `/ui` | This environment has no Docker. Postgres was started from the system package |

On PyPI, the `litellm` version on 2026-11-11 is **1.109.0**. The same day, `importlib.metadata.version("litellm")` was also 1.109.0. Errors and responses below come from this version. They are not extrapolated to other patch versions.

The CLI Quick Start says: from 1.84.0, Python 3.10 or newer is required. On an older interpreter, `pip install 'litellm[proxy]'` does not error. It silently resolves to a version that still allows that interpreter (the doc's example is 1.83.9). This machine is Python 3.12.3 and did not hit that. If the installed version suddenly stops at 1.83.x, look at `python --version` first. Do not suspect the package mirror first.

The Quick Start also gives a load-test number: "1.5k+ requests/second". This book did not reproduce that load test and does not treat it as Xingfan's capacity promise.

## Mock upstream

With no vendor key, do not invent a vendor's UI or response text. `demo/mock_upstream.py` is an HTTP service that listens only on this machine: any POST returns one OpenAI-shaped completion. The body starts with the process name and mentions order OD-2049. `MOCK_MODE=fail` returns HTTP 500. GET returns `{"status":"ok",...}`, used to confirm the port.

```bash
MOCK_NAME=primary MOCK_MODE=ok python3 mock_upstream.py 18001
MOCK_NAME=backup  MOCK_MODE=ok python3 mock_upstream.py 18002
```

After both processes are up:

```text
{"status": "ok", "name": "primary", "mode": "ok"}
{"status": "ok", "name": "backup", "mode": "ok"}
```

This is not Tongyi, and it is not OpenAI. `openai/mock-qwen-plus` in the config only tells LiteLLM "talk to this `api_base` with the OpenAI-compatible protocol". The model id `mock-qwen-plus` is an experiment name. It must not appear in business code. Business code writes only `seashore-cs`, `seashore-cs-fast`, and `aurora-cs`.

## What each block of the config file is for

The full file is `books/litellm/demo/config.yaml`. The blocks below are explained so you do not copy the experiment unit price into a production quote.

One entry in `model_list` is one deployment, not one business name. Several entries with the same `model_name` become load balancing in chapters 6 and 7. In this book's config, each `model_name` has one entry. Fallback uses another name.

| Field | Experiment value | Role |
| --- | --- | --- |
| `model_name` | `seashore-cs` and the others | The `model` in the client request body |
| `litellm_params.model` | `openai/mock-qwen-plus` | Protocol prefix plus the upstream model id |
| `api_base` | `http://127.0.0.1:18001/v1` | The mock upstream. In production, replace it with the vendor address, and still do not write that into the business repo |
| `api_key` | `os.environ/MOCK_UPSTREAM_KEY` | The literal `os.environ/...` is LiteLLM's way of reading an environment variable, not a shell |
| `input_cost_per_token` | `0.000001` | Experiment unit price, so spend is not 0 |
| `model_info.id` | `seashore-cs-primary` | The response header `x-litellm-model-id` uses it to tell deployments apart |

`routing_strategy: simple-shuffle` in `router_settings` is the default strategy the docs record. `num_retries: 0` is an experiment choice: a primary-upstream failure goes straight into fallback, so it is not stacked with retries and hard to read. Whether production should retry is decided in chapter 7. `fallbacks` says that after `seashore-cs` fails, try `seashore-cs-fast`. `aurora-cs` has no fallback. Aurora Digital's support agent does not get Seashore's fallback in this experiment config. That is intentional, so chapter 5 can show that model lists are not shared automatically.

`general_settings.master_key` and `database_url` are both read from the environment. The master key is also the password for the admin API. The Docker Quickstart says it is also the Admin UI password by default, and the username is `admin`. This machine did not log into the UI. It only confirmed that the page returns HTML.

`litellm_settings.drop_params: true` drops parameters the upstream does not know, instead of returning 400 immediately. The mock upstream ignores extra fields. This switch was not separately verified in this experiment as "turn it off and the call fails". It stays because Java clients will later send temperature, tool choice, and similar fields, and the simulator should not be the only client that can get through.

## Database

The Virtual Keys page says: you need Postgres, you need `DATABASE_URL`, and you need a master key. The Docker Quickstart brings the database and the gateway up together. This machine uses PostgreSQL 16, database name `litellm`. The password stays only on that machine. `.env.example` in the repo is `replace-me`.

```bash
export DATABASE_URL='postgresql://litellm:replace-me@127.0.0.1:5432/litellm'
export LITELLM_MASTER_KEY='sk-replace-me'
export LITELLM_SALT_KEY='sk-replace-me'
export MOCK_UPSTREAM_KEY='sk-replace-me'
```

In the Docker Quickstart, `LITELLM_SALT_KEY` encrypts "vendor keys written into the database from the UI". If you change it, vendor keys already stored cannot be decrypted, and there is no in-place rotation. This experiment's upstream key comes from an environment variable in the config and does not pass through this salt. Still set it from day one: once someone pastes a vendor key into the UI, a database without the salt becomes unreadable when the salt is added later. This book did not run the comparison "set no salt, then add a salt".

## Two failed starts

The first:

```text
LiteLLM Proxy: a database URL is set but the prisma CLI is neither on PATH nor importable as a package, so the database cannot be set up. Install it with `pip install 'litellm[extra_proxy]'` or run a shipped LiteLLM image.
```

`litellm[proxy]` is not enough. After installing `litellm[extra_proxy]`, the `prisma` command appears in the venv `bin`, version 5.17.0. The process still does not start:

```text
Exception: Unable to find Prisma binaries. Please run 'prisma generate' first.
```

`from prisma import Prisma` inside Python makes the original message clearer: the client has not been generated. Run this in the `litellm/proxy` directory:

```bash
prisma generate --schema schema.prisma
```

The generator prints Prisma Client Python v0.15.0 and warns that `binaryTargets` is not an officially supported item of Prisma Client Python. The warning did not stop the later start. The schema has `provider = "postgresql"`, so SQLite is not an option on this path. Do not edit the schema to save a database.

The third start succeeded. The log has one sentence about the connection budget:

```text
Postgres connection budget per pod = 1 worker(s) x writer connection_limit 10 = up to 10 connections; keep pods x that figure under max_connections minus superuser_reserved_connections
```

A single-process experiment cannot show whether several replicas would fill `max_connections`. Before adding replicas, count this sentence into Postgres's connection cap. The same log also warns that `trusted_proxy_ranges` is unset, so the admin UI's failed-login limit is only source address plus username. The local client connects directly. There is no reverse proxy. If a reverse proxy is placed in front of `llm.example.com`, set this from that warning, or the limit collapses into one bucket at the proxy address. This book did not configure this item and did not run a failed-login experiment.

There is also a warning about price: `openai/mock-qwen-plus` has a custom unit price but is not in the built-in price table, so the cached-token unit price defaults to 0. Input and output unit prices are unaffected. The experiment did not send a cache field. This is recorded only. It is not "fixed" into "you must fill a cache price".

## Health check and the first completion

`/health/liveliness` takes no key, returns HTTP 200, and the body is:

```text
"I'm alive!"
```

Note the path spelling is liveliness, not liveness. When writing a probe, copy the official path. Do not "correct" the spelling.

`/health/readiness` with the master key:

```json
{"status":"healthy","db":"connected"}
```

`/v1/models` returns three ids: `seashore-cs`, `seashore-cs-fast`, and `aurora-cs`. The `owned_by` field is `openai`. That is the response shape. It does not mean the request went to OpenAI.

The completion request:

```bash
curl -sS http://127.0.0.1:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"seashore-cs","messages":[{"role":"user","content":"订单 OD-2049 为什么还没到？"}]}'
```

Excerpt of the response on 2026-11-11:

```json
{
  "id": "chatcmpl-primary",
  "model": "seashore-cs",
  "choices": [
    {
      "finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "[primary] 订单 OD-2049 仍在途。请核对运单后再答复客户。"
      }
    }
  ],
  "usage": {"completion_tokens": 22, "prompt_tokens": 18, "total_tokens": 40}
}
```

`[primary]` proves the hit was 18001, not 18002. `model` is still the alias the client requested. When fallback succeeds in chapter 7, this field becomes the upstream's `mock-qwen-turbo`. Do not assume in this chapter that it always equals `model_name`.

`/v1/models` with no key:

```json
{"error":{"message":"Authentication Error, No api key passed in.","type":"auth_error","code":"401"}}
```

The master key can complete a call directly. The Docker Quickstart calls this "the only credential when there is no database". We have a database, and the master key can still hit the model. That is convenient for debugging. It does not belong in `xbd-seashore-cs-agent`. Business processes use the virtual keys issued in chapter 3.

`GET /` and `GET /ui` are both HTTP 200, `Content-Type: text/html`. There was no login, no click on Models or Virtual Keys, and no screenshot. Test Connect, Playground, and "the key is shown only once" in the official Quickstart are all marked as not tested.

## Do not expect budgets without a database

The Docker Quickstart has a section "Running without a database". The points of the text as read on 2026-11-11 are:

- You can serve an OpenAI-compatible API from the config file alone.
- Virtual keys fail, with the message `No connected db.`
- `litellm_settings.max_budget` is not a spend cap on this path. With no database client, cumulative spend stays unknown, and the global budget check does not fire. Even with `max_budget: 100`, service continues after 100 dollars, with no per-request error and no budget alert.
- If a budget is configured at startup and there is no database, one warning is printed once. That is the only signal you get.
- The master key itself has no budget.

This machine did not start a second process without a database to repeat those sentences. Xingfan wants quotas, so the experiment had Postgres from day one. If you first use the no-database mode on a laptop to see a completion go through, do not write that process's address as `llm.example.com`.

## New API stays in the comparison column

[QuantumNous/new-api](https://github.com/QuantumNous/new-api) is another gateway aimed at relays and tokens. Its README says it is a further development of One API (MIT). The project itself is AGPL-3.0, and under section 7 it adds UI attribution and a link to the original project. When Xingfan's platform embeds it into a page that merchants can open, whether the modified network service must offer corresponding source, and whether the UI must keep the specified attribution, is a legal question. A feature list cannot answer it.

| Question | LiteLLM Proxy (this book's main line) | New API (comparison only, not installed) |
| --- | --- | --- |
| License | Core MIT; `enterprise/` is a commercial license | AGPL-3.0 plus section 7 attribution |
| Config shape | `config.yaml` can go into Git | The community commonly clicks config in an admin console. This book did not verify whether it has an exportable channel definition |
| Relation to Java clients | OpenAI-compatible `/v1/chat/completions` | Also leads with compatibility. The range is its own docs. This book did not test it |
| Why Xingfan does not use it as the base | See chapter 10 | The license duty comes before the features |

This chapter does not give install commands for New API. The comparison table exists so that when someone asks in review "why not New API", the answer is the license and config-in-Git, not "never heard of it".

## Ports and processes

| Port | Process | What happens if it dies |
| --- | --- | --- |
| 18001 | Mock upstream primary | The deployments of `seashore-cs` and `aurora-cs` fail. If Seashore allows fast, it can fall back to 18002. Aurora has no standby |
| 18002 | Mock upstream backup | Affects only `seashore-cs-fast`. The primary path is still on 18001 |
| 4000 | LiteLLM | Model calls for every merchant fail. AgentScope's namespace isolation is still there. It just cannot answer |
| 5432 | PostgreSQL | The proxy fails to start, or a readiness check during the run is no longer `db: connected`. This machine did not kill the database in the middle of a run |

All four ports bind only to the loopback address. Experiment commands use `127.0.0.1`, not `0.0.0.0`. Example logs in the Quick Start often write `http://0.0.0.0:4000`. That is the form that listens on every interface. Listening that way on a laptop exposes a misconfiguration with no auth to the LAN. In production a reverse proxy terminates TLS, and the process behind it can listen only on the internal network.

The certificate, DNS, and proxy timeout for `llm.example.com` are not in this machine's experiment. If the reverse proxy's timeout is shorter than the gateway's `timeout: 8`, the client sees 504 first while the gateway is still waiting on the upstream. Write both timeouts into the change note together. This machine has no reverse proxy and no 504 sample.

## Paths that were actually called

| Method and path | Key | Result |
| --- | --- | --- |
| `GET /health/liveliness` | none | 200, body `"I'm alive!"` |
| `GET /health/readiness` | master key | 200, `db` is `connected` |
| `GET /health` | none | 401, `auth_error` |
| `GET /health` | master key, and 18001 already stopped | 200, endpoints listed as healthy and unhealthy |
| `GET /v1/models` | master key | three aliases |
| `GET /v1/models` | Seashore virtual key | two seashore aliases |
| `GET /v1/models` | none | 401, `No api key passed in.` |
| `POST /v1/chat/completions` | master key | 200, `model` is `seashore-cs`, body `[primary]` (18001 was still alive then) |
| `POST /chat/completions` | master key, 18001 already stopped | 200, body `[backup]`, response `model` is `mock-qwen-turbo` |
| `POST /v1/chat/completions` model `qwen-plus` | master key | 400, `invalid_request_error` |
| `GET /` and `GET /ui` | none | 200, `text/html` |

On this proxy version, both `/chat/completions` and `/v1/chat/completions` enter the router. Business clients still use `/v1/...` uniformly, matching Step 13's `XBD_MODEL_ENDPOINT_PATH`. A path written as `/chat/completions` in an error message cannot be used to infer the client's URL.

## Sentences worth keeping from the startup log

On a successful start, the model list is printed as:

```text
LiteLLM: Proxy initialized with Config, Set models:
    seashore-cs
    seashore-cs-fast
    aurora-cs
```

If an alias is missing here, look at the yaml indentation first, then at whether the process read this file. On this machine, a Prisma failure never reached this line.

Then come the price warnings, once per model with a custom unit price. `aurora-cs` and `seashore-cs` both point at `openai/mock-qwen-plus`, so the warning for that model name appears twice. A warning is not a failure.

After the Prisma connection there is another sentence: `'Prisma' object has no attribute '_Prisma__engine'`. The process still prints `Application startup complete`, and `/key/generate` can write into the database. This sentence did not stop the experiment. Treat it as a record that "this prisma-client-py 0.15.0 does not fully match the proxy's internal check", not as "the database is unavailable". If your version exits after this sentence, do not reuse this book's "it can be ignored".

The index-build log mentions a concurrent index on `LiteLLM_SpendLogs`. The spend table exists and matches later `/key/info`. The database client was not opened to read the table structure, and column names are not frozen here.

## What `smoke.sh` covers

The script requires `LITELLM_MASTER_KEY`, optionally `LITELLM_BASE`, default `http://127.0.0.1:4000`. It requests liveliness, readiness, and the model list, then sends the sentence "订单 OD-2049 为什么还没到？". It uses the master key. So what it proves is "the gateway and the primary upstream are alive", not "the virtual key's model list is correct". The latter is an assertion of chapter 3. Do not stuff it into the smoke test of every deploy, or the smoke script would hold a business key in addition to the right to issue keys, and the master key would stay in a CI variable.

If CI runs smoke, use a virtual key that contains only `seashore-cs`, with a very small budget and a very short lifetime, and revoke it when the run finishes. The master key does not enter CI.

## How config loading fails

This machine did not deliberately break the yaml. The two Prisma failures are enough to order the debugging, so you do not reinstall first:

| What you see | Look here first |
| --- | --- |
| The process exits, and the log says the prisma CLI is missing | Install `litellm[extra_proxy]`, and put the venv `bin` on `PATH` |
| The log says `prisma generate` | Generate the client for `schema.prisma` in the `litellm/proxy` directory |
| The generator says `prisma-client-py: not found` | `PATH` has no venv. The generator needs that executable, not only the Python package |
| Connection refused on the port | The process has already exited. Read the three rows above first. Do not change the business URL first |
| liveliness 200 but completion 500 | The upstream port. curl 18001 and 18002 first |
| Completion 401 | The key was not sent, or it is not a key in this database |
| Completion 400 and it names the model | The alias is not in `model_list`, or the client sent back the upstream id from a response |

The data source in the schema is PostgreSQL. Do not replace `DATABASE_URL` with SQLite and expect the same client to work. The Quickstart chooses Postgres. The experiment is also Postgres 16.

## Differences from the official image belong in the runbook

The official image initializes the database itself when `DATABASE_URL` is set. The pip path on this machine has to generate the Prisma client extra. If the runbook only copies the Quick Start's `uv tool install 'litellm[proxy]'`, it stops at the first error on this machine. Xingfan's production is more likely to use an image than this machine's venv. Pin the image tag. Do not treat a floating `latest` as the same as 1.109.0. This book did not pull `docker.litellm.ai/berriai/litellm` and does not know whether the version inside the image equals PyPI 1.109.0. Before production, print the version inside the image and compare it with this book's baseline. If it differs, rerun the four assertions of chapters 3, 4, and 7: 403, 422, 429, and the fallback response header.

## Review for this chapter

Seen on 1.109.0: the two Prisma failures and the start after the client was generated, the liveliness body, readiness `db: connected`, the three model ids, the completion with `[primary]`, the no-key 401, and HTML 200 from `/ui`.

Not done: Docker Compose Quickstart, Admin UI login and Test Connect, the original text of the no-database budget warning, `uv tool install`, any real vendor, and running New API.

`demo/smoke.sh` only reads the health checks, the model list, and one `seashore-cs` completion. It does not create keys. Keys are the next chapter.

## Read next

- Chapter 3 uses the master key to issue virtual keys for Seashore Select and Aurora Digital, and explains why a key issued by an admin has no owner.
- The probe in AgentScope Java demo Step 13 is "the terminal calls the gateway directly". The curl in this chapter is the same kind of evidence: it proves the gateway itself is alive. It does not prove the Dataplane has been redirected.
- Building this book does not depend on this chapter's process. The reader has no remote images embedded.
