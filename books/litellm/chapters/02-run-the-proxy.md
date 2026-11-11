---
chapter: 2
title: 把 LiteLLM Proxy 跑起来
source: docs.litellm.ai/docs/proxy/quick_start、docs/proxy/docker_quick_start；本机 pip litellm 1.109.0 与模拟上游，2026-11-11
---

# 第 2 章 把 LiteLLM Proxy 跑起来

> 海岸优品的客服还在等 OD-2049 的一句答复。密钥已经决定不进仓库，下一步是有一个听得见 `https://llm.example.com` 的进程。这一章在没有厂商密钥、没有 Docker 的机器上把 Proxy 跑起来，用两个模拟上游代替供应商，并说明 New API 放在对照栏而不是安装步骤里。

```mermaid
flowchart LR
    A["装 extra_proxy<br/>并 prisma generate"] --> B["起 18001 / 18002<br/>两个模拟上游"]
    B --> C["Postgres 写入<br/>DATABASE_URL"]
    C --> D["litellm --config<br/>监听 4000"]
    D --> E["liveliness<br/>I'm alive"]
    E --> F["/v1/models<br/>三个别名"]
    F --> G["补全打到 primary<br/>正文带 OD-2049"]
```

*本章操作流程图*

## 本机实际走的路径

官方有两条起步文档，不要混成一条命令。

| 文档 | 2026-11-11 读到的起步方式 | 本书用不用 |
| --- | --- | --- |
| CLI Quick Start | `uv tool install 'litellm[proxy]'`，然后 `litellm --model ...` 或 `--config` | 机器上没有 uv。改用 venv + pip。额外装了文档后半句才提到的数据库能力 |
| Docker Quickstart | `docker-compose.quickstart.yml` 拉起网关和 Postgres，浏览器打开 `/ui` | 这台环境没有 Docker。Postgres 用系统包自己起 |

PyPI 上 `litellm` 的版本号在 2026-11-11 是 **1.109.0**。同一天 `importlib.metadata.version("litellm")` 也是 1.109.0。下文的报错和响应都来自这个版本，不外推到别的小版本。

CLI Quick Start 写明：1.84.0 起要求 Python 3.10 以上。在更老的解释器上，`pip install 'litellm[proxy]'` 不会报错，只会静默解析到仍允许那个解释器的那一版（文档举例是 1.83.9）。本机是 Python 3.12.3，没有踩到这条。你如果看到装出来的版本突然停在 1.83.x，先看 `python --version`，不要先怀疑镜像源。

Quick Start 还写了一句负载测试数字：「1.5k+ requests/second」。本书没有复现这组压测，不把它当成星帆的容量承诺。

## 模拟上游

没有厂商密钥就不编造供应商的界面和正文。`demo/mock_upstream.py` 实现了一个只听本机的 HTTP 服务：任何 POST 都回一条 OpenAI 形状的补全，正文以进程名开头，并提到订单 OD-2049。`MOCK_MODE=fail` 时回 HTTP 500。GET 回 `{"status":"ok",...}`，用来确认端口。

```bash
MOCK_NAME=primary MOCK_MODE=ok python3 mock_upstream.py 18001
MOCK_NAME=backup  MOCK_MODE=ok python3 mock_upstream.py 18002
```

两个进程都起来之后：

```text
{"status": "ok", "name": "primary", "mode": "ok"}
{"status": "ok", "name": "backup", "mode": "ok"}
```

这不是通义、也不是 OpenAI。配置里的 `openai/mock-qwen-plus` 只是告诉 LiteLLM「按 OpenAI 兼容协议去访问这个 `api_base`」。`mock-qwen-plus` 这个模型 id 是实验名。业务代码里不要出现它。业务只写 `seashore-cs`、`seashore-cs-fast`、`aurora-cs`。

## 配置文件里每一块是干什么的

完整文件在 `books/litellm/demo/config.yaml`。下面按块说明，避免你把实验单价抄成生产报价。

`model_list` 的一条是一个部署，不是一个业务名字。`model_name` 相同的多条会在第 6、7 章变成负载均衡。本书这份配置里，每个 `model_name` 只有一条，降级靠的是另一个名字。

| 字段 | 实验值 | 作用 |
| --- | --- | --- |
| `model_name` | `seashore-cs` 等 | 客户端请求体里的 `model` |
| `litellm_params.model` | `openai/mock-qwen-plus` | 协议前缀 + 上游模型 id |
| `api_base` | `http://127.0.0.1:18001/v1` | 模拟上游。生产换成供应商地址，仍不要写进业务仓 |
| `api_key` | `os.environ/MOCK_UPSTREAM_KEY` | 字面量 `os.environ/...` 是 LiteLLM 的读环境变量写法，不是 shell |
| `input_cost_per_token` | `0.000001` | 实验单价，让花费不为 0 |
| `model_info.id` | `seashore-cs-primary` | 响应头 `x-litellm-model-id` 用它区分部署 |

`router_settings` 里 `routing_strategy: simple-shuffle` 是文档记载的默认策略。`num_retries: 0` 是实验选择：主上游一失败就进入 fallback，避免和重试叠在一起看不清。生产要不要重试，第 7 章再定。`fallbacks` 写成 `seashore-cs` 失败后改试 `seashore-cs-fast`。`aurora-cs` 没有 fallback。极光数码的客服在这份实验配置里不享受海岸的降级，这是故意的，用来在第 5 章证明模型名单不会自动共享。

`general_settings.master_key` 与 `database_url` 都从环境变量读。主密钥同时是管理接口的口令。Docker Quickstart 写：它默认也是 Admin UI 的密码，用户名是 `admin`。本机没有登录 UI，只确认了页面能返回 HTML。

`litellm_settings.drop_params: true` 让上游不认识的参数被丢掉，而不是直接 400。模拟上游会忽略多余字段，这个开关在本实验里没有被单独验证成「去掉它就失败」。留着是因为 Java 客户端以后会带温度、工具选择等字段，模拟器不该成为唯一能跑通的客户端。

## 数据库

Virtual Keys 页写明：要 Postgres，要 `DATABASE_URL`，要主密钥。Docker Quickstart 把库和网关一起拉起。本机用 PostgreSQL 16，库名 `litellm`。口令只留在那台机器上，仓库里的 `.env.example` 是 `replace-me`。

```bash
export DATABASE_URL='postgresql://litellm:replace-me@127.0.0.1:5432/litellm'
export LITELLM_MASTER_KEY='sk-replace-me'
export LITELLM_SALT_KEY='sk-replace-me'
export MOCK_UPSTREAM_KEY='sk-replace-me'
```

`LITELLM_SALT_KEY` 在 Docker Quickstart 里用于加密「从 UI 写入数据库的供应商密钥」。改了它，已经存进去的供应商密钥无法解密，没有原地轮换。本实验的上游密钥来自配置里的环境变量，不经过这把盐。仍然建议从第一天就设置它：一旦有人在 UI 里粘贴供应商密钥，没有盐的库会在之后补盐时变成不可读。本书没有做「先不设盐、再补盐」的对照实验。

## 两次启动失败

第一次：

```text
LiteLLM Proxy: a database URL is set but the prisma CLI is neither on PATH nor importable as a package, so the database cannot be set up. Install it with `pip install 'litellm[extra_proxy]'` or run a shipped LiteLLM image.
```

`litellm[proxy]` 不够。装 `litellm[extra_proxy]` 之后，`prisma` 命令出现在 venv 的 `bin` 里，版本 5.17.0。进程仍起不来：

```text
Exception: Unable to find Prisma binaries. Please run 'prisma generate' first.
```

直接在 Python 里 `from prisma import Prisma` 得到的原文更清楚：客户端还没生成。在 `litellm/proxy` 目录执行：

```bash
prisma generate --schema schema.prisma
```

生成器打印 Prisma Client Python v0.15.0，并警告 `binaryTargets` 不是 Prisma Client Python 的官方支持项。警告没有阻止后续启动。schema 里 `provider = "postgresql"`，所以 SQLite 不是这条路径的选项。不要为了省一个数据库去改 schema。

第三次启动成功。日志里有一句连接预算：

```text
Postgres connection budget per pod = 1 worker(s) x writer connection_limit 10 = up to 10 connections; keep pods x that figure under max_connections minus superuser_reserved_connections
```

单进程实验看不出多副本会不会把 `max_connections` 打满。上多副本之前把这句算进 Postgres 的连接上限。同一段日志还警告 `trusted_proxy_ranges` 未设置，管理界面的登录失败限制只按源地址加用户名。本机客户端直连，没有反代。放到 `llm.example.com` 前面若有反向代理，要按那句警告去设，否则限流会被代理地址聚成一个桶。本书没有配置这项，也没有做登录失败的实验。

还有一条和价格有关的警告：`openai/mock-qwen-plus` 有自定义单价，但不在内置价格表里，缓存 token 的单价会默认成 0，输入输出单价不受影响。实验没有发送缓存字段，这条只记录，不把它修成「必须补缓存价」。

## 健康检查和第一次补全

`/health/liveliness` 不带密钥，HTTP 200，正文是：

```text
"I'm alive!"
```

注意路径拼写是 liveliness，不是 liveness。写探针时抄官方路径，不要「更正」拼写。

带主密钥访问 `/health/readiness`：

```json
{"status":"healthy","db":"connected"}
```

`/v1/models` 返回三个 id：`seashore-cs`、`seashore-cs-fast`、`aurora-cs`。`owned_by` 字段是 `openai`。那是响应形状，不表示请求去了 OpenAI。

补全请求：

```bash
curl -sS http://127.0.0.1:4000/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"seashore-cs","messages":[{"role":"user","content":"订单 OD-2049 为什么还没到？"}]}'
```

2026-11-11 的响应摘录：

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

`[primary]` 证明命中 18001，不是 18002。`model` 此时仍是客户端请求的别名。第 7 章降级成功时，这个字段会变成上游的 `mock-qwen-turbo`。不要在本章就假定它永远等于 `model_name`。

不带密钥访问 `/v1/models`：

```json
{"error":{"message":"Authentication Error, No api key passed in.","type":"auth_error","code":"401"}}
```

主密钥能直接做补全。Docker Quickstart 把这称为「没有数据库时的唯一凭证」。我们有数据库，主密钥仍然能打模型。这方便排障，不适合放进 `xbd-seashore-cs-agent`。业务进程用第 3 章签发的虚拟密钥。

`GET /` 与 `GET /ui` 都是 HTTP 200，`Content-Type: text/html`。没有登录，没有点 Models 或 Virtual Keys，没有截图。官方 Quickstart 里的 Test Connect、Playground、密钥只显示一次，都标成未实测。

## 没有数据库时不要指望预算

Docker Quickstart 有一节「Running without a database」。2026-11-11 的原文要点是：

- 可以只用配置文件提供 OpenAI 兼容 API。
- 虚拟密钥会失败，消息是 `No connected db.`
- `litellm_settings.max_budget` 不是这条路径上的花费上限。没有数据库客户端时，累计花费保持未知，全局预算检查不会触发。配置了 `max_budget: 100` 也会在超过 100 美元后继续服务，没有逐请求错误，也没有预算告警。
- 启动时若配置了预算却没有数据库，会打一条一次性警告。那是你能得到的唯一信号。
- 主密钥本身没有预算。

本机没有另起一个无库进程去复读这些句子。星帆要配额，所以实验从第一天就带 Postgres。你若在笔记本上先用无库模式看通补全，不要把那个进程的地址写成 `llm.example.com`。

## New API 放在对照栏

[QuantumNous/new-api](https://github.com/QuantumNous/new-api) 是面向中转和令牌的另一套网关，README 写明基于 One API（MIT）二次开发，项目本身是 AGPL-3.0，并按第 7 条附加了界面署名和原项目链接。星帆的中台要把它嵌进对商家开放的页面时，修改后的网络服务是否要提供对应源码、界面是否保留指定署名，是法务问题，不是功能清单能代答的。

| 问题 | LiteLLM Proxy（本书主线） | New API（只对照，不安装） |
| --- | --- | --- |
| 许可 | 核心 MIT；`enterprise/` 商业许可 | AGPL-3.0 + 第 7 条署名 |
| 配置形态 | `config.yaml` 可进 Git | 社区常用管理台点击配置。本书未验证它有没有可导出的渠道定义 |
| 与 Java 客户端的关系 | OpenAI 兼容的 `/v1/chat/completions` | 同样主打兼容。兼容范围以它自己的文档为准，本书未测 |
| 星帆为什么不拿它当底座 | 见第 10 章 | 许可义务先于功能 |

本章不提供 New API 的安装命令。对照表的目的是让评审时有人问「为什么不用 New API」时，答案是许可和配置进 Git，而不是「没听说过」。

## 端口和进程

| 端口 | 进程 | 死了会怎样 |
| --- | --- | --- |
| 18001 | 模拟上游 primary | `seashore-cs` 与 `aurora-cs` 的部署失败。海岸若允许 fast，可降级到 18002。极光没有备用 |
| 18002 | 模拟上游 backup | 只影响 `seashore-cs-fast`。主路径仍在 18001 |
| 4000 | LiteLLM | 全部商家的模型调用失败。AgentScope 的 namespace 隔离还在，只是答不出话 |
| 5432 | PostgreSQL | 代理启动失败，或运行中就绪检查不再是 `db: connected`。本机没有在运行中途杀掉数据库 |

四个端口都只绑在回环地址上。实验命令写的是 `127.0.0.1`，不是 `0.0.0.0`。Quick Start 的示例日志常常写 `http://0.0.0.0:4000`，那是监听所有网卡的写法。笔记本上这样监听会把没有鉴权的误配暴露到局域网。生产由反向代理终结 TLS，代理后面的进程可以只听内网。

`llm.example.com` 的证书、DNS 和代理超时不在本机实验里。反向代理的超时如果短于网关的 `timeout: 8`，客户端会先看到 504，网关却还在等上游。两边的超时要一起写进变更说明。本机没有反向代理，没有 504 样本。

## 实际打过的路径

| 方法与路径 | 密钥 | 结果 |
| --- | --- | --- |
| `GET /health/liveliness` | 无 | 200，正文 `"I'm alive!"` |
| `GET /health/readiness` | 主密钥 | 200，`db` 为 `connected` |
| `GET /health` | 无 | 401，`auth_error` |
| `GET /health` | 主密钥，且 18001 已停 | 200，端点分列健康与不健康 |
| `GET /v1/models` | 主密钥 | 三个别名 |
| `GET /v1/models` | 海岸虚拟密钥 | 两个 seashore 别名 |
| `GET /v1/models` | 无 | 401，`No api key passed in.` |
| `POST /v1/chat/completions` | 主密钥 | 200，`model` 为 `seashore-cs`，正文 `[primary]`（当时 18001 还活着） |
| `POST /chat/completions` | 主密钥，18001 已停 | 200，正文 `[backup]`，响应 `model` 为 `mock-qwen-turbo` |
| `POST /v1/chat/completions` 模型 `qwen-plus` | 主密钥 | 400，`invalid_request_error` |
| `GET /` 与 `GET /ui` | 无 | 200，`text/html` |

`/chat/completions` 与 `/v1/chat/completions` 在这版代理上都能进路由。业务客户端仍统一走 `/v1/...`，和 Step 13 的 `XBD_MODEL_ENDPOINT_PATH` 一致。错误消息里写 `/chat/completions` 不能用来反推客户端的 URL。

## 启动日志里值得留下的句子

成功启动时，模型列表打印为：

```text
LiteLLM: Proxy initialized with Config, Set models:
    seashore-cs
    seashore-cs-fast
    aurora-cs
```

若这里缺一个别名，先看 yaml 缩进，再看进程读的是不是这份文件。本机曾经在 Prisma 失败时根本走不到这行。

随后是价格警告，每个自定义单价的模型一次。`aurora-cs` 和 `seashore-cs` 都指向 `openai/mock-qwen-plus`，所以这条模型名的警告出现两次。警告不是失败。

Prisma 连接后又有一句：`'Prisma' object has no attribute '_Prisma__engine'`。进程仍打印 `Application startup complete`，并且 `/key/generate` 能写进库。这句没有阻止实验。把它当成「这版 prisma-client-py 0.15.0 与代理内部检查不完全合拍」的记录，而不是当成数据库不可用。若你的版本在这句之后退出，就不要沿用本书的「可以忽略」。

索引构建的日志提到 `LiteLLM_SpendLogs` 上的并发索引。花费表存在，和 later 的 `/key/info` 对得上。没有打开数据库客户端去读表结构，不把列名写死。

## `smoke.sh` 覆盖什么

脚本要求 `LITELLM_MASTER_KEY`，可选 `LITELLM_BASE`，默认 `http://127.0.0.1:4000`。它请求 liveliness、readiness、模型列表，再发一句「订单 OD-2049 为什么还没到？」。它用主密钥。所以它证明的是「网关和主上游活着」，不是「虚拟密钥的名单正确」。后者是第 3 章的断言，不要塞进每次部署的冒烟，以免冒烟脚本除了签发权之外还去持有业务钥匙，把主密钥留在 CI 变量里。

CI 若要跑烟，用一把只含 `seashore-cs`、预算极小、有效期极短的虚拟密钥，跑完就作废。主密钥不进 CI。

## 配置加载的失败方式

本机没有故意写坏 yaml。从 Prisma 两次失败可以归纳排障顺序，避免一上来重装：

| 现象 | 先看 |
| --- | --- |
| 进程退出，日志说 prisma CLI 不在 | 安装 `litellm[extra_proxy]`，并把 venv 的 `bin` 放进 `PATH` |
| 日志说 `prisma generate` | 在 `litellm/proxy` 目录对 `schema.prisma` 生成客户端 |
| 生成器说 `prisma-client-py: not found` | `PATH` 里没有 venv。生成器要这个可执行文件，不只是 Python 包 |
| 端口拒绝连接 | 进程已退出。先看上面三行，不要先改业务 URL |
| liveliness 200 但补全 500 | 上游端口。先 curl 18001 和 18002 |
| 补全 401 | 密钥没有带上，或不是这套库里的钥匙 |
| 补全 400 且点名模型 | 别名没进 `model_list`，或客户端把响应里的上游 id 送了回来 |

schema 里数据源写的是 PostgreSQL。不要把 `DATABASE_URL` 换成 SQLite 再期待同一份客户端工作。Quickstart 选择 Postgres，实验也是 Postgres 16。

## 和官方镜像的差别要写进运行手册

官方镜像在设置了 `DATABASE_URL` 时自己做数据库初始化。本机的 pip 路径要额外生成 Prisma 客户端。运行手册如果只抄 Quick Start 的 `uv tool install 'litellm[proxy]'`，在这台机器上会停在第一段错误。星帆的生产更可能用镜像而不是这台机器的 venv。镜像的标签要钉死，不要用浮动的 `latest` 当作和 1.109.0 相同。本书没有拉取 `docker.litellm.ai/berriai/litellm`，不知道镜像内的版本是否等于 PyPI 的 1.109.0。上生产前在镜像里打印版本，和这本书的基线比较，不同就重跑第 3、4、7 章的四条断言：403、422、429、降级响应头。

## 这一章的复核

已在 1.109.0 上看到：Prisma 的两段失败与生成客户端后的启动、liveliness 正文、readiness 的 `db: connected`、三个模型 id、带 `[primary]` 的补全、无密钥 401、`/ui` 的 HTML 200。

未做：Docker Compose Quickstart、Admin UI 登录与 Test Connect、无库模式的预算警告原文、`uv tool install`、任何真实供应商、New API 的运行。

`demo/smoke.sh` 只读健康检查、模型列表和一次 `seashore-cs` 补全。它不创建密钥。密钥是下一章的事。

## 接着读

- 第 3 章用主密钥签发海岸优品和极光数码的虚拟密钥，并解释管理员签发的钥匙为什么没有主人。
- AgentScope Java demo Step 13 的探针是「终端直连网关」。本章的 curl 是同一类证据：证明网关自己活着，不证明 Dataplane 已经改道。
- 构建这本书不依赖本章的进程。阅读器里没有嵌入远程图片。
