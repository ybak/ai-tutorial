# LiteLLM 本地实验

给《LiteLLM：多模型网关、配额与降级》配的可运行配置。上游是同目录的模拟进程，不需要厂商密钥。

2026-11-11 在一台 Linux 上用 PyPI `litellm` **1.109.0**（`importlib.metadata` 与 PyPI 版本一致）加本机 PostgreSQL 16 跑通过。没有 Docker。Admin UI 只确认 `GET /ui` 返回 HTML，没有登录，也没有截图。

## 固定名字

| 项 | 值 |
| --- | --- |
| 网关域名（书中生产形态） | `llm.example.com` |
| 本地代理 | `http://127.0.0.1:4000` |
| 海岸优品客服别名 | `seashore-cs`，部署 id `seashore-cs-primary`，模拟端口 18001 |
| 降级别名 | `seashore-cs-fast`，部署 id `seashore-cs-fast`，模拟端口 18002 |
| 极光数码客服别名 | `aurora-cs`，部署 id `aurora-cs-primary` |
| 订单 | `OD-2049` |

## 依赖

- Python 3.10 及以上。1.84.0 起官方要求这个下限；1.109.0 在 3.12 上实测可导入。
- PostgreSQL。虚拟密钥、团队和花费都要数据库。官方 Quickstart 用 Docker Compose 带起 Postgres；本目录改成你自己的库。
- `pip install 'litellm[proxy]'` 在本机不够。启动日志原文是：数据库 URL 已设置，但 prisma CLI 既不在 PATH 上，也不能作为包导入，请安装 `litellm[extra_proxy]` 或改用官方镜像。装完 extra 之后，还要在安装目录的 `litellm/proxy` 下执行 `prisma generate`，否则导入 `prisma.Prisma` 会报客户端还没生成。官方 Docker 镜像不走这条弯路。

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install 'litellm[extra_proxy]'
# 把 .venv/bin 放进 PATH，否则 prisma generate 找不到 prisma-client-py
cd "$(python -c 'import litellm, pathlib; print(pathlib.Path(litellm.__file__).parent / "proxy")')"
prisma generate --schema schema.prisma
```

## 启动

```bash
cp .env.example .env
# 编辑 .env。数据库用户自己建，不要把口令写回仓库。
set -a; . ./.env; set +a

MOCK_NAME=primary MOCK_MODE=ok python3 mock_upstream.py 18001 &
MOCK_NAME=backup MOCK_MODE=ok python3 mock_upstream.py 18002 &

litellm --config config.yaml --host 127.0.0.1 --port 4000
```

另一终端：

```bash
set -a; . ./.env; set +a
./smoke.sh
```

`/health/liveliness` 不需要密钥，成功时正文是 `"I'm alive!"`。`/health/readiness` 在带主密钥时返回 `{"status":"healthy","db":"connected"}`。主模拟进程关掉之后，`/health` 会把 `18001` 放进 `unhealthy_endpoints`，`18002` 仍在 `healthy_endpoints`。

## 降级怎么看

停掉 18001 上的进程，用一把 `max_budget` 足够大、且模型名单同时包含 `seashore-cs` 与 `seashore-cs-fast` 的虚拟密钥请求 `model=seashore-cs`。2026-11-11 的一次结果：HTTP 200，响应头 `x-litellm-model-id: seashore-cs-fast`，`x-litellm-attempted-fallbacks: 1`，正文以 `[backup]` 开头。响应 JSON 的 `model` 字段变成了 `mock-qwen-turbo`，不再是客户端请求的别名。

同一天，一把 `max_budget` 只有 `0.01`、已经产生过花费的钥匙，在主上游断开时没有降级成功。错误类型是 `internal_server_error`，消息里写着 fallback 被跳过，原因是调用方对 `seashore-cs-fast` 超预算。事后 `/key/info` 的 spend 远小于 `0.01`。预算预检和入账数字会打架，第 7 章按这次响应写，不把它收成一条干净规则。

## 不在这里做的事

- 不连真实模型厂商。
- 不演示 Admin UI 点选。
- 不把 Langfuse 回调打开。环境变量位留在 `.env.example`，第 9 章说明为什么没投递。
- 不使用 `enterprise/` 目录里的代码，也不设置 `LITELLM_LICENSE`。
