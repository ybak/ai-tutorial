# LiteLLM 本地实验

给《LiteLLM：多模型网关、配额与降级》配的可运行配置。默认用 Docker Compose 拉起官方镜像、Postgres 16 和两个模拟上游。不需要厂商密钥，也不设置 `LITELLM_LICENSE`。

2026-11-12 用镜像 `ghcr.io/berriai/litellm:main-stable` 跑过，并登录了 Admin UI。侧栏显示 LiteLLM **v1.169.0**。同一次运行里，成功的 Chat Completions 响应头是 `x-litellm-version: 1.109.0`。这两个数都保留，不要合成一个版本。镜像标签 `main-stable` 会浮动，发布时把侧栏和响应头一起记进说明。

2026-11-11 另有一次没有 Docker 的 pip 安装，`importlib.metadata` 与 PyPI 都是 **1.109.0**。那次的 403、422、429 和降级响应头仍然算数，但启动步骤以本节的 Compose 为准。那次的 `api_base` 是 `127.0.0.1`，`seashore-cs-fast` 的上游模型名是 `openai/mock-qwen-turbo`。现在这份 `config.yaml` 改成容器内的服务名，三个别名的上游模型名都是 `openai/mock-qwen-plus`。

## 固定名字

| 项 | 值 |
| --- | --- |
| 网关域名（书中生产形态） | `llm.example.com` |
| 本地管理界面 | http://127.0.0.1:4000/ui/ |
| 本地代理 | `http://127.0.0.1:4000` |
| UI 登录 | 用户名 `admin`，密码 `StarsailDemo#2026`（`UI_USERNAME` / `UI_PASSWORD`） |
| API 主密钥 | `sk-starsail-master`（`LITELLM_MASTER_KEY`）。这不是登录框里的密码 |
| 模拟上游钥匙 | `sk-mock-upstream`。模拟器不校验它 |
| 数据库 | 用户 `llmproxy`，库 `litellm`，口令 `dbpassword9090`。只给本机演示 |
| 海岸优品客服别名 | `seashore-cs`，部署 id `seashore-cs-primary`，容器内 `http://mock-primary:18001/v1` |
| 降级别名 | `seashore-cs-fast`，部署 id `seashore-cs-fast`，容器内 `http://mock-backup:18002/v1` |
| 极光数码客服别名 | `aurora-cs`，部署 id `aurora-cs-primary`，与海岸主模型共用 18001 |
| 订单 | `OD-2049` |

登录之后页面顶部有一条粉色提示：Environment-credential login is enabled。登录页上的 Login with SSO 这次没有使用。

## 启动

需要 Docker Compose。在本目录执行：

```bash
docker compose up
```

第一次会拉取 `ghcr.io/berriai/litellm:main-stable`、`postgres:16` 和 `python:3.12-slim`。`config.yaml` 与 `mock_upstream.py` 以只读卷挂进容器。不要把它们打进自定义镜像；那种做法只在宿主机的绑定挂载坏掉时才需要，不是这里的默认路径。

容器内部必须监听 `0.0.0.0`，否则宿主机的端口映射进不去。发布到宿主机的端口限定在 `127.0.0.1`：4000、5432、18001、18002。不要把这四行改成 `0.0.0.0` 再放到局域网里。模拟脚本自己也绑定 `0.0.0.0`，这样网关容器才能访问 `mock-primary` 和 `mock-backup`。改回 `127.0.0.1` 之后，网关会连不上上游。

另一终端：

```bash
export LITELLM_MASTER_KEY=sk-starsail-master
./smoke.sh
```

`/health/liveliness` 不需要密钥，成功时正文是 `"I'm alive!"`。`/health/readiness` 在带主密钥时返回 `{"status":"healthy","db":"connected"}`。

然后打开 http://127.0.0.1:4000/ui/ ，用 `admin` / `StarsailDemo#2026` 登录。密码里的 `#` 写进 shell 时要加引号；浏览器登录框里按字面输入。

模型别名来自 `config.yaml`，界面上标记为 Defined in config。团队和虚拟密钥不在配置文件里。空库上执行一次：

```bash
export LITELLM_MASTER_KEY=sk-starsail-master
./seed.sh
```

它创建：

| 对象 | 别名 | 预算 | 模型 | 限流 |
| --- | --- | --- | --- | --- |
| 团队 | `seashore-main`（海岸优品） | 50 美元 | `seashore-cs`、`seashore-cs-fast` | 未设置 |
| 团队 | `aurora-main`（极光数码） | 30 美元 | `aurora-cs` | 未设置 |
| 虚拟密钥 | `alice` | 10 美元 | 两个 seashore 别名 | rpm 30 |
| 虚拟密钥 | `bob` | 8 美元 | `aurora-cs` | rpm 20 |

`seed.sh` 不传 `budget_duration`。2026-11-12 的密钥表把 Budget Reset 显示为 Never。密钥原文只打印一次。截图里的 `team_id`（海岸 `fbc26c00-fd5e-4e75-af6b-43c91ed76712`，极光 `5d1e432d-fbb1-4496-8a51-bea176084366`）和末四位属于那次数据库，重跑对不上是正常的。脚本假定库还是空的，跑第二遍会再创建一组同名团队。

`STORE_MODEL_IN_DB=True` 在这次 compose 里开着。Models 页上的三行仍然标着 Defined in config。

## 和截图同一类的请求

把 `seed.sh` 打出来的钥匙放进环境变量，不要写回仓库。

```bash
# alice 调 seashore-cs：2026-11-12 为 HTTP 200。
# 正文以「[primary] 订单 OD-2049 仍在途。」开头。
# 响应头 x-litellm-model-id: seashore-cs-primary，x-litellm-attempted-fallbacks: 0。
# 费用约 0.000062 美元。成功响应头里还有 x-litellm-version: 1.109.0。
curl -sS http://127.0.0.1:4000/v1/chat/completions \
  -H "Authorization: Bearer $ALICE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"seashore-cs","messages":[{"role":"user","content":"查询订单 OD-2049 的物流状态"}]}'

# alice 调 aurora-cs：2026-11-12 为 HTTP 403，类型 key_model_access_denied。
curl -sS -o /tmp/alice-aurora.json -w '%{http_code}\n' \
  http://127.0.0.1:4000/v1/chat/completions \
  -H "Authorization: Bearer $ALICE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"aurora-cs","messages":[{"role":"user","content":"查询订单 OD-2049 的物流状态"}]}'

# bob 调 aurora-cs：2026-11-12 为 HTTP 200。
curl -sS http://127.0.0.1:4000/v1/chat/completions \
  -H "Authorization: Bearer $BOB_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"aurora-cs","messages":[{"role":"user","content":"查询订单 OD-2049 的物流状态"}]}'
```

Playground 用的是登录后的 Current UI session，不是 alice 的钥匙。模型选 `seashore-cs`，发送「查询订单 OD-2049 的物流状态」。这次运行里，开着 Stream response 的第一下会卡住；关掉 Stream response 之后才成功。Trace 上 Requested 与 Served by 都是 `seashore-cs`，API base 是 `http://mock-primary:18001/v1`，Fallbacks 0，Retries 0。

## 界面和账对不上的地方

这些是 2026-11-12 当时的界面，不要改成「完全一致」。

- Home 当时是 4 个请求（3 ok、1 failed）、120 token、平均延迟 12ms、成功率 75.0%。Spend 卡片是 $0.00，下面写着 No budget set。Leaderboard 上 aurora-cs 66.7%（80），seashore-cs 33.3%（40）。
- 随后的 Usage 是 6 个请求（5 ok、1 failed）、160 token、平均延迟 15ms、成功率 83.33%。Spend 卡片仍是 $0.00，小额被四舍五入。Provider 那一行是 Successful 4、Failed 1、160 token。Top models 上两个别名各 50%、$0.00。Top agents 上 curl 120 token，Mozilla 40 token。
- Request Logs 在 Last 24 Hours 里当时只列出 3 条：一次未认证的 `/health` 失败，alice 的 403，以及 alice 的一次成功（费用 $0.000062，40 token）。bob 的成功和后来的 Playground 成功当时不在这张列表里。不要写成日志和用量完全一致。
- Virtual Keys 默认列没有 RPM。alice 的团队名被截成 `seashore-m...`。两把钥匙的 Spend 显示为 $0.0001，比 Playground 和成功日志上的 $0.000062 少一位精度。
- Teams 页的模型列是数量（极光 1、海岸 2），不列出别名。团队花费显示为 `< $0.01`。
- Settings → Router Settings → Fallbacks 有一条 `seashore-cs` → `seashore-cs-fast`，标记来自 `config.yaml`。Loadbalancing 页可见 routing strategy `simple-shuffle`、retries 0。Models 页的 Auto-Routers 和 Model Group Alias 是空的，降级不在那里。
- Settings → Telemetry 的 Proxy requests 是 Off，各项都没勾选。没有向 LiteLLM 远端送用量，也没有向 Langfuse 投递。

## 降级怎么看

界面上的 Fallbacks 行只证明规则已经从配置载入。2026-11-12 没有在这套 compose 上再停一次主上游。

停掉主上游的样本在 2026-11-11：HTTP 200，响应头 `x-litellm-model-id: seashore-cs-fast`，`x-litellm-attempted-fallbacks: 1`，正文以 `[backup]` 开头。那天的 fast 上游模型名是 `openai/mock-qwen-turbo`，响应 JSON 的 `model` 变成了 `mock-qwen-turbo`。现在这份配置里 fast 也是 `openai/mock-qwen-plus`，不要指望再看到 `mock-qwen-turbo`。区分主备靠正文前缀、`api_base` 和 `x-litellm-model-id`。

同一天，一把 `max_budget` 只有 `0.01`、已经产生过花费的钥匙，在主上游断开时没有降级成功。错误类型是 `internal_server_error`，消息里写着 fallback 被跳过，原因是调用方对 `seashore-cs-fast` 超预算。事后 `/key/info` 的 spend 远小于 `0.01`。这把钥匙不是截图里的 alice（预算 10 美元）。

要在 compose 里重放「机器没了」，把 `mock-primary` 停掉，用预算足够大、且名单里同时有 `seashore-cs` 与 `seashore-cs-fast` 的钥匙再请求。看响应头，不要看 11 日那个上游模型字符串。

## 不用镜像时会遇到的两段失败

官方镜像自己做数据库初始化。2026-11-11 的 pip 路径先报 prisma CLI 不在，装了 `litellm[extra_proxy]` 之后又要在 `litellm/proxy` 里对 `schema.prisma` 执行 `prisma generate`。那条路径不再作为读者的默认步骤。生产同样优先用镜像，并把侧栏版本和 `x-litellm-version` 一起写进发布说明。

## 不在这里做的事

- 不连真实模型厂商。
- 不使用 `enterprise/` 目录里的代码，也不设置 `LITELLM_LICENSE`。
- 不把 Langfuse 回调打开。环境变量位留在 `.env.example`，第 9 章说明为什么没投递。Telemetry 页保持关闭。
- 不把官方仓库的 `docker-compose.quickstart.yml` 当作本书的启动文件。本书的 compose 只负责把官方镜像和本目录的两个文件拉起来。
