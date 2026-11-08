---
chapter: 2
title: 本地部署
source: self-hosting/index.mdx
---

# 第 2 章 本地部署

> 本章导读：第 1 章说清了 Langfuse 是什么、能为测试、运维、运营三个角色做什么，本章回答「怎么把它跑起来」。贯穿案例「售后助手」要产出 trace（追踪），第一步是有一个自己的 Langfuse 实例——本书选择 Docker Compose 自托管：六容器栈部署到本机，注册管理员，建组织 `yubing-org` 与项目 `after-sales`，拿到项目 API Key，为第 3 章的首条 trace 铺好路。本章沿四条线展开：架构——先建立「部署单位是六个容器」的地图；配置——compose 文件逐段走读与 `.env` 密钥清单；启动与验证——健康检查通过才算部署完成；初始化——从 UI 注册到 API Key 只显示一次的关键一分钟。所有操作与排障均来自 2026-11-08 本机部署 Langfuse v4.76.0 的实测。读完本章，你能：完成一次健康检查通过的六容器部署；说清三类数据各落在哪个容器；走完注册到 API Key 的全流程；对四个常见故障对号入座。

```mermaid
flowchart LR
    A["准备 Docker（2.2）<br/>Docker 与 Compose v2 就绪<br/>磁盘按 4-8 GB 首拉预留"] --> B["获取 compose（2.2）<br/>官方仓库 docker-compose.yml<br/>镜像源 docker.langfuse.com"]
    B --> C["配置 .env 密钥（2.2）<br/>三件密钥 openssl rand 生成<br/>DATABASE_URL 与 POSTGRES_PASSWORD 同值"]
    C --> D["启动六容器（2.3）<br/>docker compose up -d<br/>3000 被占顺延 3001"]
    D --> E["健康验证（2.3）<br/>GET /api/public/health<br/>返回 status OK 与版本号"]
    E --> F["UI 注册初始化（2.4）<br/>Sign up → Skip 订阅页<br/>注册建首个账号"]
    F --> G["建组织与项目（2.4）<br/>New Organization → 建项目<br/>落到项目 Traces 页"]
    G --> H["创建 API Key（2.4）<br/>Settings → API Keys<br/>pk-lf- / sk-lf- 只显示一次"]
```

*本章操作流程图*

## 你什么时候需要它

三种典型处境，对应本章三种用法。

**第一次在自己的机器上装 Langfuse**——按 2.1 建立容器地图，然后沿 2.2 → 2.3 → 2.4 的顺序走：获取 compose、配 `.env`、启动、验证、注册、建 Key。全程一条命令加几次页面点击，不需要编程背景。

**装到一半卡住了**——web 反复重启、curl 返回 502、`.env` 里配的初始化变量没生效、API Key 按钮点不动：这四个坑我们都踩过，直接去 2.6 排障实录对号入座，每条都按「现象 → 根因 → 解法」给出路。

**已经在跑，关心换端口、备份或升级**——换端口看 2.3.3 的预案；备份与升级（含降级风险）在 2.5；多栈并存的端口冲突经验也在 2.3.3。

前置：一台装好 Docker（含 Docker Compose v2）的机器。本书实测环境是 Windows 11 + Docker Desktop 的开发机；官方的硬件要求清单以 self-hosting 文档为准，本书立场：纯 Langfuse 栈 8 GB 内存机器即可起步，若同机还要跑书架的其他栈（如 ragflow 书的实例，见第 10 章），内存预算按 16 GB 起，并先读 2.3.3 的端口冲突经验。概念层面只需要第 1 章的四大能力面。

## 2.1 概述：部署单位是六个容器

先立一个贯穿本章的认知立场：**把 Langfuse 当作「一族协作的容器」来理解，而不是一个单体应用**。`docker compose up -d` 之后你得到的不是「一个 Langfuse」，而是两个业务容器加四个数据容器：

```mermaid
flowchart TB
    U["浏览器 / Python SDK<br/>UI 流量 · 摄取入口（OTel 端点）"] --> W["langfuse-web<br/>UI 与 API · :3000"]
    W -->|"摄取任务入队"| R[("Redis 7<br/>缓存与任务队列 · :6379")]
    R -->|"后台消费"| K["langfuse-worker<br/>异步摄取 · :3030"]
    W --> PG[("PostgreSQL 17<br/>事务数据 · :5432")]
    K -->|"写观测数据"| CH[("ClickHouse 26.3<br/>trace / observation / score<br/>:8123 HTTP · :9000 原生")]
    W -.->|"原始事件与多媒体"| MO[("MinIO（S3 兼容）<br/>:9090 API · :9091 控制台")]
    K -.-> MO
    G["langfuse-ai-gateway（可选，beta）<br/>LLM 网关 · :3031<br/>无 Service Key 时未配置态"] -.-> W
```

*Langfuse 自托管六容器部署架构（端口为宿主机侧端口；另有可选 beta 组件 langfuse-ai-gateway）*

组件与职责一览（镜像与端口均对照本机 2026-11-08 实测的 compose 文件）：

| 容器 | 镜像 | 职责 | 宿主机端口 | 数据落点（命名卷） |
|------|------|------|-----------|-------------------|
| langfuse-web | `docker.langfuse.com/langfuse/langfuse`（`${LANGFUSE_IMAGE_TAG}`） | UI 与 API：登录、页面、公开 API 与摄取（ingestion）入口（OTel 端点 `/api/public/otel/v1/traces`） | 3000 | — |
| langfuse-worker | `docker.langfuse.com/langfuse/langfuse-worker`（同 tag） | 异步摄取：消费队列里的摄取任务，写观测数据 | 127.0.0.1:3030 | — |
| postgres | `postgres:17` | 事务数据：组织、项目、用户等关系数据 | 127.0.0.1:5432 | `langfuse_postgres_data` |
| redis | `redis:7` | 缓存与任务队列（官方口径 Redis/Valkey 均可，本书实测栈用 redis:7） | 127.0.0.1:6379 | `langfuse_redis_data` |
| clickhouse | `clickhouse/clickhouse-server:26.3.62.3` | 观测数据：trace（追踪）/ observation（观测）/ score（评分） | 127.0.0.1:8123（HTTP）/ 9000（原生） | `langfuse_clickhouse_data` + `langfuse_clickhouse_logs` |
| minio | `cgr.dev/chainguard/minio` | S3 兼容对象存储：原始事件与多媒体 | 9090（API）/ 127.0.0.1:9091（控制台） | `langfuse_minio_data` |
| langfuse-ai-gateway（可选，beta） | `docker.langfuse.com/langfuse/ai-gateway`（同 tag） | LLM 网关；未配置 Service Key 时以「未配置态」启动，推理请求返回 503 | 3031 | — |

三条数据流帮你把这张图和表读活。SDK 埋点的**摄取流**：SDK 把 OTel 载荷发给 web 的公开端点，web 入队 Redis，worker 后台消费后把数据写进 ClickHouse——这就是「异步摄取」的含义，第 3 章讲 `flush()` 时会回到这条流。**事务数据**（你建的组织、项目、账号、Key）落 PostgreSQL。**原始事件与多媒体**（摄取载荷原件、trace 里的图片等）以对象存储形式落 MinIO。排障时先问一句「这个数据应该在哪类容器里」，方向就不会错。

关于图上那个虚线框：langfuse-ai-gateway 是 v4 引入的可选 beta 组件——LLM 网关。compose 默认会把它一起拉起；没有配置 Service Key 时它处于「未配置态」（推理请求返回 503），**不影响其余六容器工作**。本书贯穿案例的模型调用走智谱 OpenAI 兼容端点、由应用侧直连，不依赖这个网关，如实记录其存在即可。

最后看安全边界，compose 文件头部注释即是官方建议：**全部数据容器只绑定 127.0.0.1**，对宿主机之外的机器不可达；对外的只有三个口——web（3000）、MinIO（9090）与网关（3031）。若部署到多人可达的主机，建议在宿主机防火墙层面也只放行这三个端口，并把 2.2.4 的密钥清单全部换掉。

顺带交代本书的实测环境基线，本章与后续各章的版本事实都以此为锚：

| 项 | 值 | 核实日期 |
|----|-----|---------|
| Langfuse 服务器 | v4.76.0（web / worker / 网关同 tag） | 2026-11-08 |
| 部署形态 | 本机 Docker Compose 六容器 + 可选网关，七容器全部 healthy | 2026-11-08 |
| 数据组件版本 | ClickHouse 26.3.62.3 · PostgreSQL 17 · Redis 7 · MinIO（chainguard 镜像） | 2026-11-08 |
| 宿主机 | Windows 11 + Docker Desktop 开发机 | 2026-11-08 |
| Python SDK（第 3 章起） | langfuse 5.2.0（要求服务器 ≥ 4.59.0） | 2026-11-08 |

这张表也解释了本书的一个选型立场：**自托管是贯穿案例的地基**。Langfuse Cloud 免费档也能练手，但书架的操作章（改配置、备份卷、锁版本、看启动日志）只有在自己机器上才真正摸得到——这正是本章存在的意义。

## 2.2 获取 compose 与配置 .env

### 2.2.1 前置检查

```bash
docker --version          # Docker 24 以上较稳
docker compose version    # 需要 Compose v2（docker compose 子命令形式）
```

磁盘余量按首次拉镜像 4-8 GB 预留（2.3.1 会有耗时预期）。Windows 用户注意：Docker Desktop 的 WSL2 后端下，卷与镜像都在虚拟机里，宿主机磁盘要留的是虚拟磁盘的增长空间。

### 2.2.2 获取 compose 文件

官方路径是仓库主分支的 `docker-compose.yml`（本书实测于 2026-11-08 下载，仓库路径以 langfuse/langfuse 主分支为准）：

```bash
curl -O https://raw.githubusercontent.com/langfuse/langfuse/main/docker-compose.yml
```

不需要克隆整个仓库——一个 compose 文件加一个你马上要写的 `.env`，就是部署的全部家当。建议为这套栈单开一个工作目录，`.env` 与 compose 同目录，`docker compose` 命令都在这个目录里执行。

### 2.2.3 镜像源与版本锁定策略

compose 里三个 Langfuse 自有组件的镜像都来自**官方自有镜像源** `docker.langfuse.com`（而非 Docker Hub），且由同一个变量锁定版本：

```yaml
image: docker.langfuse.com/langfuse/langfuse:${LANGFUSE_IMAGE_TAG:-4}
```

注意默认值是 `4`——一个**浮动 tag**，会跟着大版本内更新走。而 v4 的发布节奏是**日更 1-2 版**（本书基线 v4.76.0 发布于 2026-11-05，2026-11-08 部署核实）。浮动 tag 意味着某天 `docker compose pull` 顺手一拉，你的实例就悄悄换了一个版本——对一台要长期产出观测数据、还要做版本对比的书（第 6 章看 Prompt 版本、第 8 章看实验对比）来说，这不可接受。**本书立场：`.env` 里显式锁定具体版本号**：

```bash
LANGFUSE_IMAGE_TAG=4.76.0
```

compose 头部注释还有一条值得照抄的提醒：web、worker、网关三者必须同 tag，且要新于 4.75.0——更旧的 web 镜像即使配了网关的两个 Key 也会把网关藏起来。网关镜像另有 `LANGFUSE_AI_GATEWAY_IMAGE_TAG` 可单独覆盖，仅在某个 release 缺网关镜像时才需要。

四个数据容器的镜像来自各自官方仓库（postgres、redis、clickhouse、chainguard 的 minio），版本由 compose 直接写死或以变量给默认值（如 `POSTGRES_VERSION` 默认 17），不需要你操心锁定。

### 2.2.4 CHANGEME 密钥清单

compose 里凡是标了 `# CHANGEME` 的默认值都必须在 `.env` 里覆盖——这些默认值（`mysecret`、`mysalt`、`postgres`、`miniosecret`……）是给「能起来」用的，不是给「能用」用的。全清单如下：

| 变量 | compose 默认值 | 生成 / 设置方式 |
|------|---------------|----------------|
| `NEXTAUTH_SECRET` | `mysecret` | `openssl rand -base64 32` |
| `SALT` | `mysalt` | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | 64 个 `0` | `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | `postgres` | 随机口令 |
| `DATABASE_URL` | `postgresql://postgres:postgres@postgres:5432/postgres` | **口令部分必须与 `POSTGRES_PASSWORD` 同值**（见下） |
| `CLICKHOUSE_PASSWORD` | `clickhouse` | 随机口令 |
| `MINIO_ROOT_PASSWORD` | `miniosecret` | 随机口令 |
| `LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY` | `miniosecret` | **与 `MINIO_ROOT_PASSWORD` 同值** |
| `LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY` | `miniosecret` | **与 `MINIO_ROOT_PASSWORD` 同值** |
| `LANGFUSE_S3_BATCH_EXPORT_SECRET_ACCESS_KEY` | `miniosecret` | **与 `MINIO_ROOT_PASSWORD` 同值** |
| `REDIS_AUTH` | `myredissecret` | 随机口令 |
| `NEXTAUTH_URL` | `http://localhost:3000` | 对外访问地址；改端口时同步改（2.3.3） |

生成密钥就是三条命令的事（Windows 下 Git Bash 自带 openssl；生成的值自己收好，不要进 git）：

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET、SALT 各来一次
openssl rand -hex 32      # ENCRYPTION_KEY
```

一份可直接抄的 `.env` 骨架（口令处一律占位符，**不要把真实值写进任何会提交的文件**）：

```bash
# .env —— 与 docker-compose.yml 同目录
LANGFUSE_IMAGE_TAG=4.76.0
NEXTAUTH_URL=http://localhost:3000

# 三件密钥：openssl rand 生成
NEXTAUTH_SECRET=<openssl rand -base64 32>
SALT=<openssl rand -base64 32>
ENCRYPTION_KEY=<openssl rand -hex 32>

# 数据库：两处口令必须一致——本章排障实录 #1 的坑
POSTGRES_PASSWORD=<随机口令>
DATABASE_URL=postgresql://postgres:<同 POSTGRES_PASSWORD>@postgres:5432/postgres

# 其余服务口令：同源随机
CLICKHOUSE_PASSWORD=<随机口令>
MINIO_ROOT_PASSWORD=<随机口令>
LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY=<同 MINIO_ROOT_PASSWORD>
LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY=<同 MINIO_ROOT_PASSWORD>
LANGFUSE_S3_BATCH_EXPORT_SECRET_ACCESS_KEY=<同 MINIO_ROOT_PASSWORD>
REDIS_AUTH=<随机口令>

# 以下 INIT 变量首次部署留空——适用场景见 2.4.4 与排障实录 #3
#LANGFUSE_INIT_ORG_ID=
#LANGFUSE_INIT_ORG_NAME=
#LANGFUSE_INIT_PROJECT_ID=
#LANGFUSE_INIT_PROJECT_NAME=
#LANGFUSE_INIT_PROJECT_PUBLIC_KEY=
#LANGFUSE_INIT_PROJECT_SECRET_KEY=
#LANGFUSE_INIT_USER_EMAIL=
#LANGFUSE_INIT_USER_NAME=
#LANGFUSE_INIT_USER_PASSWORD=
```

**`DATABASE_URL` 与 `POSTGRES_PASSWORD` 为什么必须同值？** compose 里 postgres 容器用 `POSTGRES_PASSWORD` 初始化数据库口令，而 web 与 worker 用 `DATABASE_URL` 这个完整连接串去连它。两处的默认值都是占位口令 `postgres`——如果你只在 `.env` 里改了 `POSTGRES_PASSWORD` 而没写 `DATABASE_URL`，数据库用的是新口令、连接方拿的是旧口令，认证失败。这是本机部署时踩到的第一个坑（排障实录 #1），症状是 web 起不来、日志报数据库认证错误（P1000）。

再强调一次 MinIO 的三项：S3 相关的三个 `*_SECRET_ACCESS_KEY` 与 `MINIO_ROOT_PASSWORD` 是同一把口令的四处出现——MinIO 用 root 口令起服务，web/worker 用 S3 Key 读写桶，两处不一致时摄取链路会在对象存储环节失败。

### 2.2.5 compose 结构走读

先给整份文件画一张分段地图，五个区块各管一件事：

| 区块 | 位置 | 管什么 | 你要不要动 |
|------|------|--------|-----------|
| 头部注释 | 文件最上方 | 安全建议（只放行 3000/9090/3031）与网关版本提醒 | 只读 |
| `services:` 两个业务容器 | `langfuse-worker` → `langfuse-web` → `langfuse-ai-gateway` | 镜像、端口、环境变量、依赖关系 | 一般不动（改端口是例外，2.3.3） |
| `services:` 四个数据容器 | `clickhouse` → `minio` → `redis` → `postgres` | 各自镜像、healthcheck、数据卷挂载 | 不动 |
| `volumes:` | 文件尾部 | 五个命名卷声明（2.5.1 展开） | 不动 |
| 环境变量锚点 | worker 的 `environment`（`&langfuse-worker-env`） | web 与 worker 共享的整套配置 | 不动，经 `.env` 覆盖 |

四个值得知道的写法，都在你刚下载的文件里：

**YAML 锚点共享环境变量。** compose 先在 `langfuse-worker` 上定义了一套完整的环境变量（锚点 `&langfuse-worker-env`），`langfuse-web` 用合并键 `<<: *langfuse-worker-env` 整套继承，再叠加自己独有的部分（`NEXTAUTH_SECRET`、INIT 变量、网关变量等）。这解释了一个现象：你在 web 的 environment 列表里找不到 `SALT`，但它确实生效——从 worker 的锚点继承来的。改 `.env` 时两边是同步的，不需要你改两处。

**启动顺序由健康检查（health check）驱动。** web 与 worker 的 `depends_on` 带着条件：postgres、minio、redis、clickhouse 四个依赖都要先过各自的 healthcheck（`pg_isready`、`mc ready local`、`redis-cli ping`、ClickHouse 的 `/ping`）才启动。所以 `up -d` 之后别急着开浏览器——先看 2.3 的健康验证。

**MinIO 自动建桶。** minio 容器的启动命令里先 `mkdir -p /data/langfuse` 再起服务——摄取要用的 `langfuse` 桶不需要你手工创建。

**`restart: always`。** 全部服务都带这个策略，宿主机重启后 Docker 守护进程起来时栈会自动回来。这对手边常开的开机即用很友好，也意味着「机器重启了 Langfuse 怎么没了」通常不是问题——先看 `docker compose ps`。

## 2.3 启动与健康验证

### 2.3.1 启动

```bash
docker compose up -d
```

第一次执行是**拉镜像时间，不是启动时间**。全栈首次拉取约 4-8 GB（Langfuse 双镜像 + ClickHouse + Postgres + Redis + MinIO；本书实测口径，具体体积随版本与网络有出入），带宽一般时请留出几分钟到半小时级的预期。拉取完成后容器依次起来，因为 2.2.5 说的健康检查门控，web 与 worker 会等四个数据容器全部 healthy 才启动——从 `up -d` 到 web 真正可访问有一两分钟的间隔是正常的。

从按下回车到可以打开浏览器，实际发生了什么，按时间线拆开：

| 阶段 | 大致耗时 | 发生什么 | 怎么确认 |
|------|---------|---------|---------|
| 拉镜像 | 几分钟到半小时级（视带宽，全栈约 4-8 GB） | 依次拉取 Langfuse 双镜像、ClickHouse、Postgres、Redis、MinIO | `docker compose ps` 里状态从 Created 走向 running |
| 数据容器就绪 | 十几秒到一两分钟 | 四个数据容器启动并跑各自的 healthcheck | `ps` 里四者先后变为 healthy |
| 业务容器启动 | 一两分钟 | web 与 worker 等四依赖 healthy 后启动；web 启动期执行数据库迁移 | web 日志里迁移输出，随后服务监听 3000 |
| 健康检查通过 | 迁移结束后数秒 | `/api/public/health` 可应答 | 2.3.2 的 curl 返回 `status: OK` |

哪个阶段卡住，就在哪个阶段定位：拉不动镜像看网络与代理；数据容器不 healthy 看各自日志；web 起不来先想起实录 #1 的 `DATABASE_URL`。观察就绪状态：

```bash
docker compose ps
```

六个（加上可选网关则七个）容器状态都应是 `healthy` 或 `running`。哪个没起来或反复重启，先看它的日志：

```bash
docker compose logs -f langfuse-web
```

日志过滤也值得学会：`docker compose logs langfuse-web 2>&1 | grep -iE 'error|migrat'` 一条命令把迁移与报错行捞出来——2.6 排障实录的四条里，三条的定位起点就是这一句。日志看什么：启动期看「All migrations have been successfully applied」与紧随其后的 Ready 标记，运行期关注持续出现的 warn/error。

### 2.3.2 健康验证

web 就绪后，用公开健康检查端点验证（这是唯一权威的「部署完成」判据）：

```bash
curl --noproxy '*' http://localhost:3000/api/public/health
```

本机实测（2026-11-08，v4.76.0）返回：

```json
{"status":"OK","version":"4.76.0"}
```

返回体里的版本号与你在 `.env` 锁的 `LANGFUSE_IMAGE_TAG` 一致——顺手核对一次，确认「锁版本」真的锁住了。两个提醒：其一，`--noproxy '*'` 不是装饰，本机开系统代理时它就是 502 的解药（排障实录 #2）；其二，健康检查通过后再打开浏览器，抢跑只会看到半初始化状态。

本节顺带把日后天天要用的几条 compose 命令一次收齐：

| 命令 | 做什么 | 什么时候用 |
|------|--------|-----------|
| `docker compose ps` | 看各容器状态与健康 | 一切排查的第一步 |
| `docker compose logs -f langfuse-web` | 跟看某个服务的日志 | 容器反复重启、页面异常时 |
| `docker compose restart langfuse-web` | 重启单个服务 | 改了该服务相关的 `.env` 变量 |
| `docker compose up -d` | 按当前配置重建有变化的服务 | 改 `.env` / compose 后生效（多数情况的「重启」） |
| `docker compose down` | 停栈并移除容器（**卷保留**） | 释放资源；数据不动 |
| `docker compose down -v` | 停栈并**连卷一起删** | 危险操作——等于清空全部数据，本书不推荐在保留数据时使用 |

注意「改 `.env` 后重启」的正确姿势是 `up -d` 而不是 `restart`：`restart` 不重新读环境文件，改了变量只 restart 会让你以为「没生效」。

### 2.3.3 端口冲突预案：3000 被占顺延 3001

web 的 3000 端口是最容易被占的——本机跑着别的 Node 开发服务、别的书架栈都可能撞上。预案两处一起改：

其一，compose 里 `langfuse-web` 的端口映射改为顺延端口：

```yaml
  langfuse-web:
    ports:
      - 3001:3000     # 原 3000:3000；容器内仍是 3000，只是宿主机侧换口
```

其二，`.env` 里同步改对外地址：

```bash
NEXTAUTH_URL=http://localhost:3001
```

这两处是联动的：端口映射决定浏览器从哪个口访问，`NEXTAUTH_URL` 是应用「自知的」对外地址，界面里生成的项目链接、SDK 要用的 host 都以它为准。只改映射不改 `NEXTAUTH_URL`，页面能开但里面的链接仍指向旧端口；只改 `NEXTAUTH_URL` 不改映射则压根访问不到。改完 `docker compose up -d` 重启生效，健康检查换 `http://localhost:3001/api/public/health` 再跑一遍。

多栈并存是另一类冲突，本书实测踩过三个，提前打招呼：Windows 上有一批被系统保留的端口段（Hyper-V 动态保留），落在里面的端口映射会静默失败或绑定报错，`netsh int ipv4 show excludedportrange protocol=tcp` 可以列出保留段（通用命令）；同机跑 ragflow 栈时，它的 Kvrocks 默认 6379 会撞 Langfuse 的 Redis、它的 MinIO 9000 会撞 ClickHouse 的 9000——**给后装的一侧让路**（本书做法：ragflow 侧改 16379 与 19000）。原则一句话：每台机器维护一张「谁占了哪个口」的清单，冲突时改 `.env` 或 override 文件，不动 compose 主文件的端口语义。

## 2.4 初始化：从注册到 API Key

部署验证通过，接下来五分钟在浏览器里完成初始化。这一节的每个界面事实都来自 2026-11-08 对 v4.76.0 的实测，截图同日实拍。先把全流程摊开成一张总览表，后面四个小节逐步展开：

| 步 | 页面 | 动作 | 产出 |
|----|------|------|------|
| ① | `/auth/sign-in` → Sign up | 填 Name / Email / Password 注册 | 管理员账号 |
| ② | `/onboarding` | 订阅推广页点 Skip 跳过 | （无） |
| ③ | 首页 Organizations | New Organization → 组织名 → 同页建项目名 | 组织 `yubing-org` + 项目 `after-sales` |
| ④ | 项目 Traces 页 | 确认落到空列表（等第 3 章首条 trace） | 可用的项目空间 |
| ⑤ | 项目 Settings → API Keys | Create new API keys → 填 Name → 创建 | `pk-lf-` / `sk-lf-` 各一次显示机会 |

### 2.4.1 注册首个账号

浏览器打开 `http://localhost:3000`，首次访问会跳到登录页 `/auth/sign-in`。这张截图摄于注册之前——账号还不存在，卡片底部留着 Sign up 入口：

![实测 Langfuse v4.76.0 登录页：居中卡片「Sign in to your account」，Email 与 Password 两个输入框，Password 旁有 forgot password 链接，下方灰色 Sign in 按钮，卡片底部一行「No account yet? Sign up」](../assets/images/lf-sign-in.png)

登录页本身很素：Email、Password，加一个忘记密码链接。此刻 Sign in 按钮是灰的（还没有可填的凭据），你要走的是底部那行「No account yet? Sign up」。**首次部署的正确路径就是从这里注册首个账号**——不要试图用环境变量「预先」建号（为什么，见 2.4.4 与排障实录 #3）。

点开 Sign up，进入注册页：

![实测注册页：标题「Create new account」，Name、Email、Password 三个输入框，黑色 Sign up 按钮，底部「Already have an account? Sign in」链接](../assets/images/lf-sign-up.png)

注册页三个字段：Name（界面里的显示名）、Email、Password。落到贯穿案例：本书的管理员取 `yubing@local.dev`（口令不入书稿，也不应入任何会提交的文件）。填完点 Sign up 即完成注册——**注册建的是账号**；接下来会经过一页订阅推广（onboarding，`/onboarding`），点 Skip 跳过即可，不影响功能。

### 2.4.2 建组织与项目

登录后的首页就是组织（organization）列表。此刻列表还是空的，页面给你一张 Get Started 引导卡：

![实测登录后首页 Organizations 列表页：左上版本标识 v4.76.0 OSS，主区 Get Started 卡片写「Create an organization to get started」，卡内 New Organization 黑色按钮与 Docs、Ask AI 并排，右上角也有 + New Organization 按钮，页面顶部有 AI coding agents 集成提示横幅，左下角显示当前用户 yubing@local.dev](../assets/images/lf-home-orgs.png)

三个信息值得留意。其一，**首页即组织列表**——Langfuse 的资源模型是组织 → 项目两层（第 11 章展开），你的所有数据都会挂在这个层级下面。其二，入口有两处：右上角与卡片里的 New Organization 是同一个动作。其三，顶部那条蓝色横幅在向你推销 AI coding agents 集成（Claude Code、Codex 等 Agent 经 MCP 接入）——与本书无关，关掉即可。

点 New Organization，进入 `/setup` 页：先给组织起名（本书取 `yubing-org`），同一页接着建项目（project，本书取 `after-sales`）。两步走完，页面落到项目 `after-sales` 的 Traces 页——一个空列表，等第 3 章的第一条 trace 来填。

### 2.4.3 创建 API Key

项目建好，去拿接入凭据。进项目 Settings → API Keys：

![实测项目 after-sales 的 Settings → API Keys 页：面包屑 yubing-org / after-sales，主区标题 Project API Keys 与右上 + Create new API keys 按钮，下方 .env 代码块展示 LANGFUSE_SECRET_KEY、LANGFUSE_PUBLIC_KEY、LANGFUSE_BASE_URL 三行占位，列表表格含 Name、Created By、Public Key、Secret Key、Expiration、Created 六列，当前为空（None），左侧 Settings 侧栏列出 General、API Keys、MCP & CLI、LLM Connections、Model Definitions、Members、Integrations、Exports、Batch Actions、Audit Logs、Notifications](../assets/images/lf-apikeys-page.png)

这一页的信息密度不小，拆开看。`.env` 代码块给出了接入 SDK 需要的三元组模板：`LANGFUSE_SECRET_KEY`、`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_BASE_URL`——第 3 章的 demo 应用注入的就是这三个变量。表格六列（Name / Created By / Public Key / Secret Key / Expiration / Created）此刻是空的。左侧 Settings 侧栏顺便认个脸：Model Definitions 是第 5 章配模型价格的地方，Members 管成员（第 11 章），MCP & CLI、LLM Connections 等本书用到时再回来。

点右上 Create new API keys，弹出创建对话框：

![实测 Create API key 弹窗：Name 输入框（占位示例 e.g. Production server）为空，Expiration 下拉显示 No expiration，Permissions 下拉显示 Full access（All read and write privileges）并附 View 84 permissions 链接，底部 Create API key 按钮呈灰色禁用态](../assets/images/lf-apikey-create-dialog.png)

弹窗三项：**Name 必填**——为空时底部 Create API key 按钮保持灰色禁用，这不是故障，是防呆（排障实录 #4）；Expiration 默认 No expiration（本地实例可保持默认，生产实例建议给 Key 设有效期）；Permissions 默认 Full access（界面上附「View 84 permissions」链接可展开细目）。填好 Name（如 `local-dev`）后按钮点亮，点击创建——**关键一分钟来了：`pk-lf-` 开头的 public key 与 `sk-lf-` 开头的 secret key 只在这一次弹窗里完整显示，关掉就再也拿不到**。当场把两个值连同 Base URL 落进你的 `.env`（或 secrets 管理工具），再关弹窗。sk 丢了没有「找回」，只有「作废重建」。

落到贯穿案例，第 3 章 demo 应用要注入的就是这三个变量（值为占位符，替换成你刚拿到的真值）：

```bash
# demo 应用侧环境变量（不是 Langfuse 栈的 .env）
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=http://localhost:3000
```

Key 的作用域是**项目**：`pk-lf-` / `sk-lf-` 只对 `after-sales` 这个项目生效，第 11 章讲多项目隔离时会回到这一点。另一个使用纪律：sk 等同于这个项目内全部读写权限的口令，不要进 git、不要出现在截图与日志里——本书 demo 一律从环境变量读取。

### 2.4.4 LANGFUSE_INIT_* 的适用场景

`.env` 骨架里那组注释掉的 `LANGFUSE_INIT_*` 变量（用户、组织、项目、Key 共九个）看起来像是一条「跳过 UI、用环境变量初始化」的捷径，但它有一个硬前提：**`LANGFUSE_INIT_ORG_ID` 必须指向一个已存在的组织**。首次部署的数据库里还没有任何组织，缺了组织 ID,整套 INIT 变量会被忽略（启动日志里有 warn），你在 `.env` 里配的初始用户、初始项目一个都不会出现——本书实测即如此（排障实录 #3）。

所以适用场景要说清：**首次部署走 UI 注册**（2.4.1-2.4.3 就是全流程，五分钟）；INIT 变量留给「向既有组织初始化」的自动化场景——比如你重建了一套环境，想在启动时把项目与 Key 直接灌进一个已有的组织，那就先拿到组织 ID 再填变量。把 INIT 当成首次部署的建号手段，是最常见的误用。

## 2.5 数据持久化、备份与升级

### 2.5.1 五个命名卷

`docker compose down` 不删卷、`docker compose down -v` 才删——删了等于清空全部数据。五个命名卷（named volume）与数据的对应关系：

| 命名卷 | 装什么 | 对应容器 |
|--------|--------|---------|
| `langfuse_postgres_data` | 事务数据：组织、项目、用户、Key | postgres |
| `langfuse_clickhouse_data` | 观测数据：trace / observation / score | clickhouse |
| `langfuse_clickhouse_logs` | ClickHouse 服务日志 | clickhouse |
| `langfuse_minio_data` | 原始事件与多媒体（对象存储） | minio |
| `langfuse_redis_data` | 队列与缓存状态 | redis |

三类数据（事务 / 观测 / 原始事件）分别落三个卷，与 2.1 的数据三分格局一一对应。**卷是这份部署的全部家当**——容器可以随时删掉重建，卷没了就要从头再来（当然，观测数据丢了还可以靠应用重新摄取，但历史 trace 与 Prompt 版本、数据集就没了）。

### 2.5.2 备份要点

两条路，按停机容忍度选：**逻辑备份**——Postgres 用 `pg_dump` 导出事务数据，观测数据可用 ClickHouse 的导出手段；**卷快照**——`docker compose down` 之后整卷打包（卷在宿主机 Docker 数据目录下），再 `up -d` 回来。本地实例本书立场的最低要求：**升级前必须有一次备份**（下一小节马上解释为什么），平时按数据重要程度自定节奏。第 12 章讲质量门禁时，回归用的数据集与实验结果都在这套卷里——它们丢了，你的回归基线就丢了。

逻辑备份的最小实操（**思路演示，命令结构以你的实际环境为准**）：对最重要的两个数据容器各导一份，避开业务高峰：

```bash
# 事务数据：pg_dump 导出为 SQL 文本
docker exec langfuse-local-postgres-1 \
  pg_dump -U postgres postgres > backup-postgres-$(date +%F).sql

# 观测数据：ClickHouse 用 clickhouse-client 导出建表与数据
docker exec langfuse-local-clickhouse-1 \
  clickhouse-client --user clickhouse --password '<口令>' \
  -q "SHOW TABLES FROM default"          # 先看有哪些表
docker exec langfuse-local-clickhouse-1 \
  clickhouse-client --user clickhouse --password '<口令>' \
  -q "BACKUP TABLE default.traces TO '/tmp/traces.zip'"
```

两条口径提醒：其一，ClickHouse 的 `BACKUP` 目标路径在**容器内**文件系统，导完要 `docker cp` 出来；其二，观测数据的体量会随使用增长，全量备份的节奏要跟着数据量调整——本地实例按「升级前 + 每周」起步即可，生产场景另计。恢复演练与验证（备份是否可用）的完整流程不在本章展开，本地实例的最简验证是：导出文件非空且能重新导入查询成功。最后一条纪律：**备份文件与部署栈分开存放**——卷快照留在本机不算真正的备份，至少一份导出物落到另一块盘或另一台机器。

### 2.5.3 升级与降级风险

升级动作本身很轻：改 `.env` 里的 `LANGFUSE_IMAGE_TAG` 到目标版本，然后：

```bash
docker compose pull
docker compose up -d
```

数据库结构的升级（迁移，migration）不需要你手工执行——新版本容器启动时自动完成。证据就在排障实录 #1：那次的认证失败（P1000）正是发生在启动期的迁移环节，说明迁移是容器启动流程的一部分。这也解释了升级的一个行为特征：新版本首次 `up -d` 后要等迁移跑完才服务就绪，比平时多等一会儿是正常的。

两个策略提醒。其一，**不必追每一个新版**——v4 日更 1-2 版，跟着日更走等于把实例当升级试验场；本书做法是锁一个具体版本（2.2.3），按需升级，升级前读该版本的 release notes。其二，**降级有风险**：迁移是单向的，数据库结构升上去之后，直接把 tag 换回旧版本可能因结构不匹配而起不来。一旦升级后出了问题，正解不是降级，而是回滚到 2.5.2 升级前做的备份（恢复卷 + 用旧 tag 重建）。这也是「升级前必须备份」的由来。

## 2.6 排障实录

以下四条全部来自 2026-11-08 本机部署 v4.76.0 的真实过程，每条按「现象 → 根因 → 解法」三段式记录。对号入座之前，先确认基本的排查姿态：`docker compose ps` 看哪个容器不健康，`docker compose logs <服务名>` 看它的日志——四条实录里有三条是靠这两条命令定位的。

### 实录 #1：web 起不来，日志报数据库认证失败（P1000）

**现象。** `docker compose up -d` 后四个数据容器陆续 healthy，唯独 langfuse-web 反复重启，日志里数据库认证失败（错误码 P1000），迁移流程走不下去。

**根因。** compose 里 `DATABASE_URL` 有默认值 `postgresql://postgres:postgres@postgres:5432/postgres`，而 `.env` 里只设置了 `POSTGRES_PASSWORD` 的随机值——postgres 容器拿随机口令初始化，web 却拿 compose 默认口令去连，两个变量不一致，认证必然失败。这正是 2.2.4 强调「必须同值」的那处坑：**默认值是占位符，改一半等于没改**。

**解法。** `.env` 里显式写全连接串，口令部分与 `POSTGRES_PASSWORD` 同值：

```bash
DATABASE_URL=postgresql://postgres:<与 POSTGRES_PASSWORD 同值>@postgres:5432/postgres
```

改完 `docker compose up -d` 重建 web（依赖它的 worker 也会跟着重建），日志里迁移正常执行、web 转为 healthy。

### 实录 #2：栈明明 healthy，curl 却返回 502

**现象。** 七容器全部 healthy，浏览器也能打开界面，但 `curl http://localhost:3000/api/public/health` 返回 502；Python SDK 从本机连 Langfuse 同样连不上。

**根因。** 本机设置了 `HTTP_PROXY` / `HTTPS_PROXY` 系统代理环境变量。curl 与多数 HTTP 客户端**不会自动豁免 localhost**——对 `localhost:3000` 的请求被发去了代理服务器，代理不回源你本机的端口，于是拿到 502。栈本身毫无问题，是「验证工具被代理劫持」。

**解法。** 验证与本地调试一律绕开代理：

```bash
curl --noproxy '*' http://localhost:3000/api/public/health
```

Python 侧设 `NO_PROXY=localhost`；浏览器自动化（如 Playwright）启动参数加 `--no-proxy-server`。本书所有 demo 脚本的环境变量里都带着这条豁免——第 3 章起你会反复见到它。

### 实录 #3：LANGFUSE_INIT_* 整套被忽略

**现象。** `.env` 里配好了 `LANGFUSE_INIT_USER_EMAIL` / `LANGFUSE_INIT_ORG_NAME` / `LANGFUSE_INIT_PROJECT_*` 全套，指望启动时自动建号建组织；起来后发现日志有 warn，界面里既没有那个账号，也没有那个组织。

**根因。** INIT 变量要求 `LANGFUSE_INIT_ORG_ID` 指向**已存在**的组织；首次部署数据库里还没有组织，组织 ID 缺失，整套 INIT 变量被整体忽略。这不是变量写错，是前提不满足（2.4.4 已展开）。

**解法。** 首次部署走 UI 注册（2.4.1-2.4.3）：注册首个账号，建组织与项目，创建 API Key——五分钟的事，没有捷径需求。INIT 变量留给「向既有组织初始化项目」的自动化场景：先在界面或 API 里拿到组织 ID，再填变量重建环境。

### 实录 #4：Create API key 按钮灰色点不动

**现象。** 项目 Settings → API Keys → Create new API keys，弹窗打开后底部 Create API key 按钮是灰色禁用态，怎么点都没有反应。

**根因。** 弹窗里 Name 是必填项，为空时按钮保持 disabled——界面的防呆设计，不是部署问题。对照 2.4.3 的截图：Name 输入框空着，按钮就是灰的。

**解法。** 先填 Name（如 `local-dev`），按钮即点亮；Expiration、Permissions 保持默认（No expiration / Full access）即可创建。顺带一条给脚本党的实测经验：用 Playwright 之类工具自动化这一步时，按界面角色（role）匹配按钮偶尔不稳，直接按 DOM 文本定位点击最可靠。

## 本章小结

1. **部署单位是六个容器**：web（UI/API，3000）与 worker（异步摄取，3030）两个业务容器，Postgres（事务数据）、Redis（缓存与队列）、ClickHouse（观测数据）、MinIO（原始事件与多媒体）四个数据容器；另有可选 beta 的 langfuse-ai-gateway（3031），无 Key 时未配置态，不影响全局。三类数据各落其所，排障先问「这份数据该在哪」。
2. **版本要锁，密钥要换**：`LANGFUSE_IMAGE_TAG` 锁具体版本号（v4 日更 1-2 版，浮动 tag 等于随缘升级）；compose 里全部 `CHANGEME` 项在 `.env` 里覆盖，三件密钥 `openssl rand` 生成。
3. **`DATABASE_URL` 与 `POSTGRES_PASSWORD` 必须同值**——部署第一坑（实录 #1）；MinIO 口令在四个变量里出现，四处一致。
4. **健康检查是唯一权威判据**：`GET /api/public/health` 返回 `{"status":"OK","version":"…"}` 才算部署完成；本机有代理时 curl 加 `--noproxy '*'`（实录 #2）。首拉镜像 4-8 GB,留好预期。
5. **首次部署的初始化路径是 UI 注册**：Sign up → Skip 订阅页 → New Organization 建组织与项目 → Settings → API Keys；`pk-lf-` / `sk-lf-` 只显示一次，当场落盘。INIT 变量需要已有组织 ID，是「向既有组织初始化」的工具，不是首次部署的捷径（实录 #3）。
6. **卷是全部家当**：五个命名卷对应三类数据；升级 = 换 tag 拉新重启，迁移启动时自动执行；迁移单向，降级的正解是回滚升级前的备份——所以升级前必须备份。

下一步：带着 2.4.3 拿到的三个变量（`LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` / `LANGFUSE_BASE_URL`）进入第 3 章，给「售后助手」装上 Python SDK，发出第一条 trace。

## 验收清单

读到这里，你应该能：

- ☐ 完成一次六容器部署：`docker compose ps` 全部 healthy，`/api/public/health` 返回 `status: OK` 且版本号与你锁的 tag 一致；
- ☐ 说出六个容器各自的职责，以及事务数据、观测数据、原始事件各落在哪个容器与哪个命名卷；
- ☐ 用 `openssl rand` 生成三件密钥，并解释 `DATABASE_URL` 与 `POSTGRES_PASSWORD` 为什么必须同值（对照实录 #1 的现象与根因）；
- ☐ 走完注册到 API Key 的全流程，说出 `sk-lf-` 只显示一次对你的操作顺序提出了什么要求；
- ☐ 说出 `LANGFUSE_INIT_*` 生效的前提（已有组织 ID）与它真正的适用场景；
- ☐ 完成一次端口顺延：3000 被占时把 web 挪到 3001，两处改动（映射与 `NEXTAUTH_URL`）一起落，健康检查复查通过；
- ☐ 遇到 localhost 返回 502 时，先查代理再查栈（实录 #2 的条件反射）。

## 延伸阅读

- **第 3 章（快速开始）**——本章 API Key 三元组的第一个消费者：SDK 安装、三变量注入、首条 trace 十分钟链路；`--noproxy` 豁免也会在那里再次出现。
- **第 5 章（成本与性能监控）**——本章截图里 Settings 侧栏的 Model Definitions，是给 glm-5.3-flash 这类内置价格表之外的模型配价格的地方。
- **第 11 章（多项目与团队管理）**——2.4.2 建组织时埋下的伏笔：组织/项目两层、成员角色、API Key 作用域的系统展开。
- **第 12 章（Prompt 回归与质量门禁）**——2.5.2 备份意义的最终解释：回归基线（数据集与实验结果）就存在这套卷里。
- **官方 self-hosting 文档（langfuse.com/docs,self-hosting 部分）**——本章的 `source` 指向其入口页；配置变量的全量清单与生产部署（Kubernetes/Helm）路线以官方文档为准，本章只覆盖本地部署实测走过的路径。

## 复核清单（发布前）

- [x] 六容器职责、端口、卷、CHANGEME 清单、INIT 变量清单均对照本机 compose 文件（官方 main 分支，2026-11-08 下载）逐项核对；
- [x] 健康检查返回体、UI 注册到 API Key 全流程、四条排障实录均来自 2026-11-08 本机 v4.76.0 实测（DEPLOY.md 排障实录 #1-#4），五张截图同日实拍；
- [ ] 首拉镜像「4-8 GB」为本机单次观测口径，随版本与镜像源网络有出入，复审时按当时版本复核；
- [ ] 端口顺延 3001 的两处联动（映射 + `NEXTAUTH_URL`）依 compose 默认值与应用链接构造行为撰写，本机未实际执行过 3001 场景，复审时可补一次实测；
- [ ] 升级（换 tag 重启）与迁移启动时自动执行的行为，依 compose 结构与实录 #1 的启动期迁移现象归纳，本机未做过跨版本升级演练，第 12 章生产化时补实测。
