---
chapter: 24
title: 会话存储与分布式部署
source: integration/session/index.md, integration/session/overview.md, integration/session/mysql.md, integration/session/redis.md, integration/session/oss.md, integration/distributed/index.md, integration/distributed/redis.md, integration/distributed/jdbc.md, integration/distributed/mongodb.md, integration/distributed/oss.md
---

# 第 24 章 会话存储与分布式部署

> 本章导读：Agent 在单机上跑通之后，第一个分布式问题往往不是流量，而是状态——两个应用副本各写各的本地文件，同一个用户的会话在两台机器上就是两份互不相通的记忆。本章把 Agent 状态的持久化与多副本部署的存储底座整理成一份完整参考：先说清 `AgentStateStore` 接口本身——`(userId, sessionId)` 寻址、与原生 Session Log 的区别；然后进入生产推荐的 `DistributedStore` 一键配置——一行代码同时覆盖 Agent 状态、工作区文件系统 KV、沙箱快照与并发锁，四个后端（Redis、JDBC、MongoDB、阿里云 OSS）可以混合搭配；最后是 MySQL、Redis、OSS 三个 legacy 状态存储模块——它们已由分布式存储的对应模块取代，保留作为存量维护参考。读完本章，你可以让多个 Agent 副本共享同一份状态与工作区，并按现有基础设施选择后端组合。

```mermaid
flowchart LR
    A{"按现有基础设施选后端<br/>（后端详细文档）"} -->|"多副本生产，追求低延迟"| B["Redis：加依赖 → fromJedis 一键配置<br/>Cluster 场景必须显式选 V1 布局"]
    A -->|"已有关系型数据库"| C["JDBC：加依赖 → create(dataSource)<br/>方言 SPI 自动检测 · 自动建表校验"]
    A -->|"已有 MongoDB 集群"| D["MongoDB：加依赖 → create(mongoClient)<br/>文档型 · 集合级 30 天 TTL"]
    A -->|"大快照 · 阿里云生态"| E["阿里云 OSS：加依赖 → create 一键配置<br/>大快照首选 · 不提供沙箱并发锁"]
    B --> F{"快照过大，或需要沙箱并发锁？"}
    C --> F
    D --> F
    E --> F
    F -->|"是"| G["混合后端：DistributedStore.builder()<br/>状态与文件走主后端<br/>大快照换 OSS · 锁可换 Redis"]
    F -->|"否"| H["验证：多副本共享同一份状态与工作区<br/>重启恢复 · 跨节点共享<br/>（快速上手主线见第 42 章）"]
    G --> H
```

*本章操作流程图*

## 从单机到多副本：存储要解决什么

前二十章的所有示例都默认 Agent 运行在单个进程里。只要部署第二个副本，三件事立刻出现：

- **会话不共享**。单机默认的 `JsonFileAgentStateStore` 把状态写在本进程的本地磁盘；下一个请求被负载均衡到另一台机器时，它读不到上一台机器写的状态，用户面对的同一个 Agent 在两台机器上是两份记忆。
- **重启丢状态**。pod 重建、进程重启后，本地文件随之消失，恢复无从谈起。
- **副本间互相看不见**。沙箱快照要能让任意副本接续执行，两个副本同时执行同一个沙箱任务还需要谁来加锁。

框架的答案分两层：`AgentStateStore` 接口约定状态存到哪里（本章前半的接口参考）；`DistributedStore` 把所有需要分布式持久化的组件——Agent 状态、工作区文件系统 KV、沙箱快照、并发锁——统一到同一个后端入口（生产推荐，本章主体）。三个 legacy 状态存储模块诞生于统一入口之前，如今只在维护存量代码时才会遇到。

本章与第 42 章（走向生产）是分工关系：第 42 章以 `DistributedStore` 一键配置为主线讲单机到分布式必须换哪些组件，是快速上手路径；本章是存储底座的完整参考——每个组件的定位、四个后端各自的接入方式与参数、legacy 模块的存量维护。首次配置可先读第 42 章跑通主线，选型与排障时回到本章查阅。

## Agent 状态存储概览

> **注意**：推荐使用 DistributedStore 一键配置（见本章"分布式存储（Distributed Store）"一节）——它同时覆盖 AgentStateStore、BaseStore、SandboxSnapshotSpec、SandboxExecutionGuard。如果只需要单独配置 AgentStateStore，继续阅读本节。

`io.agentscope.core.state.AgentStateStore` 是 AgentScope 用来持久化 Agent 状态的接口——比如 Memory、Workspace、Plan 等组件都会被序列化为 `State` 后由 `AgentStateStore` 落盘，从而支持重启恢复、跨节点共享。

状态通过 `(userId, sessionId)` 二元组寻址：

- `sessionId`——非空、非空白，标识一次会话 / session。
- `userId`——可空。`null` 表示匿名 / 单租户调用方（CLI、测试等）。

### 与原生 Session Log 的区别

本节是 AgentStateStore 接口参考。HarnessAgent 默认 EVENT_LOG 通过 SessionLogStore 恢复 checkpoint；仅替换 stateStore 不会迁移或共享原生日志。LEGACY 仍使用本节的状态存储。Workspace 的 BaseStore 能存文件，也不代表具备日志所需的原子 CAS，例如当前 OSS/COS 需配合独立日志后端。存储位置和支持矩阵见第 19 章（会话日志与恢复）。

### 可用实现

| 实现 | 模块 | 适合场景 |
| --- | --- | --- |
| `InMemoryAgentStateStore` | `agentscope-core` | 单元测试 |
| `JsonFileAgentStateStore` | `agentscope-core` | 单机开发（**HarnessAgent 默认**） |
| `RedisAgentStateStore` | `agentscope-extensions-redis` | 多副本生产首选（见本章"Redis"一节） |
| `JdbcAgentStateStore` | `agentscope-extensions-jdbc` | 已有数据库的场景（见本章"JDBC"一节） |
| `OssAgentStateStore` | `agentscope-extensions-oss` | 阿里云生态（见本章"阿里云 OSS"一节） |

### 单独配置

```java
ReActAgent agent = ReActAgent.builder()
    .name("assistant")
    .model(model)
    .stateStore(stateStore)   // 任选一种 AgentStateStore 实现
    .build();
```

详细用法和代码示例见本章各后端小节：Redis（`RedisAgentStateStore`）、JDBC（`JdbcAgentStateStore`）、OSS（`OssAgentStateStore`）。

## 分布式存储（Distributed Store）

AgentScope 将所有需要分布式持久化的组件统一到 `DistributedStore` 接口下。一行配置即可让 Agent 的状态、工作区文件系统、沙箱快照和并发锁全部切到同一个分布式后端。这是多副本部署的推荐配置方式——与其为每个组件分别挑选、装配存储实现，不如让 builder 从一个入口自动完成注入；后文四个后端小节里的提供的组件清单，本质都是这条一键路径的手工拆解版。

### 快速上手

```java
// Redis 一键配置
DistributedStore store = RedisDistributedStore.fromJedis(
        new JedisPooled("redis://localhost:6379"));

HarnessAgent agent = HarnessAgent.builder()
    .name("my-agent")
    .model("dashscope:qwen-plus")
    .distributedStore(store)
    .filesystem(new RemoteFilesystemSpec()            // baseStore 自动注入
            .isolationScope(IsolationScope.USER))
    .build();
```

第 42 章沿这条一键路径给出了多副本生产的最小上手模板；本章后续小节则把每个后端、每个组件的参数展开成完整参考。

### 能力矩阵

| 功能组件 | 接口 | Redis | OSS | JDBC | MongoDB |
|---------|------|:-----:|:---:|:-----:|:-------:|
| Agent 状态持久化 | `AgentStateStore` | `RedisAgentStateStore` | `OssAgentStateStore` | `JdbcAgentStateStore` | `MongoAgentStateStore` |
| 工作区文件系统 KV | `BaseStore` | `RedisStore` | `OssBaseStore` | `JdbcStore` | `MongoBaseStore` |
| 沙箱快照 | `SandboxSnapshotSpec` | `RedisSnapshotSpec` | `OssSnapshotSpec` | `JdbcSnapshotSpec` | `MongoSnapshotSpec` |
| 沙箱并发锁 | `SandboxExecutionGuard` | `RedisSandboxExecutionGuard` | — | `JdbcSandboxExecutionGuard` | `MongoSandboxExecutionGuard` |

> OSS 不提供 `SandboxExecutionGuard`——对象存储不适合做分布式锁。需要 sandbox 并发控制的 OSS 用户，用 `DistributedStore.builder()` 混入 Redis 的 guard。

DistributedStore 在多副本部署中的位置如图 24-1 所示。

```mermaid
flowchart TB
    subgraph APP["多副本 Agent 应用"]
        A1["应用副本 1"]
        A2["应用副本 2"]
        H["HarnessAgent<br/>distributedStore 一行配置"]
        A1 --> H
        A2 --> H
    end
    H --> C1["AgentStateStore<br/>Agent 状态持久化"]
    H --> C2["BaseStore<br/>工作区文件系统 KV"]
    H --> C3["SandboxSnapshotSpec<br/>沙箱快照"]
    H --> C4["SandboxExecutionGuard<br/>沙箱并发锁"]
    C1 --> BE["存储后端<br/>Redis JDBC MongoDB 阿里云 OSS<br/>可按组件混合搭配"]
    C2 --> BE
    C3 --> BE
    C4 -.-> X["OSS 不提供沙箱并发锁<br/>可混入 Redis 的 guard"]
```

*图 24-1：DistributedStore 与多副本部署拓扑*

### 混合后端

不同组件可以来自不同的存储后端：

```java
DistributedStore jdbc = JdbcDistributedStore.create(dataSource);
DistributedStore redis = RedisDistributedStore.fromJedis(jedis);

// JDBC 管状态和文件，Redis 管沙箱锁和快照
DistributedStore mixed = DistributedStore.builder()
    .agentStateStore(jdbc.agentStateStore())
    .baseStore(jdbc.baseStore())
    .sandboxSnapshotSpec(redis.sandboxSnapshotSpec())
    .sandboxExecutionGuard(redis.sandboxExecutionGuard())
    .build();

HarnessAgent.builder()
    .distributedStore(mixed)
    .filesystem(new DockerFilesystemSpec()
            .image("ubuntu:24.04"))
    .build();
```

### 各组件说明

#### AgentStateStore — Agent 状态持久化

Agent 的对话上下文、压缩摘要、权限规则、Plan Mode 状态等，通过 `(userId, sessionId)` 寻址。`distributedStore` 自动注入，也可通过 `.stateStore(...)` 单独覆盖。

#### BaseStore — 工作区文件系统 KV

`RemoteFilesystemSpec` 的存储后端，将 `MEMORY.md`、`memory/`、`skills/`、`sessions/` 等路径路由到共享 KV 存储。`distributedStore` 自动注入到 `RemoteFilesystemSpec`（如果用的是无参构造器）。

#### SandboxSnapshotSpec — 沙箱快照

将 Docker/K8s 等沙箱的工作区打成 tar 包持久化，下次 `call()` 自动恢复。`distributedStore` 自动注入到 `SandboxFilesystemSpec`。

#### SandboxExecutionGuard — 沙箱并发锁

`AGENT` / `GLOBAL` 隔离范围在多副本下需要分布式锁防止并发冲突。`distributedStore` 自动注入到 `SandboxFilesystemSpec`。

### 优先级

```
显式 builder 方法 (.stateStore(), .filesystem() 上的 .snapshotSpec() 等)
    > distributedStore 自动注入
        > 本地默认 (JsonFileAgentStateStore, NoopSnapshotSpec 等)
```

### 后端详细文档

本章后续四节依次展开各后端：Redis（最全功能覆盖，多副本生产首选）、JDBC（已有关系型数据库的场景）、MongoDB（文档型存储，适合大量会话历史）、阿里云 OSS（对象存储，大容量快照首选）。

### Control Plane 托管 Store

若已部署 Control Plane 控制面，可由控制面托管 `DistributedStore` 的协调类能力（BaseStore、沙箱锁/快照、MessageBus、AsyncToolRegistry、**TaskRepository**、可选 **SessionTurnGate**）。**`AgentStateStore` 仍需自备一个后端**（Redis / JDBC / OSS）；core 已提供 `getVersioned` / `saveIfVersion` 乐观并发，但存储不在控制面。

```java
ControlPlaneStores cp = ControlPlaneStores.fromEnv();
HarnessAgent.builder()
    .distributedStore(cp.withAgentStateStore(redis.agentStateStore()))
    .filesystem(new RemoteFilesystemSpec().isolationScope(IsolationScope.USER))
    .build();
```

- 控制面开启：`--enable-hosted-store`（生产建议 Postgres）。
- **`withAgentStateStore` 已包含**托管 `TaskRepository` 与 `SessionTurnGate`。使用 **`SandboxFilesystemSpec` 且需要子 agent 后台任务**时，应走此路径（workspace 版 `TaskRepository` 无法跨副本持久化任务）。
- **AgentStateStore versioning**：Redis、Postgres、MySQL、InMemory 支持 CAS；JsonFile / OSS / COS / JPA 仍为 last-writer-wins。多副本建议选支持 versioning 的后端。
- **Turn gate + `ConflictPolicy.FAIL`** 为可选：多副本下减少重复 LLM turn；正确性仍靠 CAS（当后端支持 versioning 时）。
- 当前鉴权为集群内共享 internal token；租户（`agentName` / `namespace`）取自请求体——**不适用于**同一控制面上互不信任的多租户。
- `MessageBus.queueDrain` 为 **destructive**（读即 ack）；租户/key 弄错会丢消息。

## Redis

`agentscope-extensions-redis` 提供全链路的 Redis 分布式存储实现，是多副本生产部署的首选后端。

### 添加依赖

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-extensions-redis</artifactId>
    <version>${agentscope.version}</version>
</dependency>
```

模块本身不强制依赖某一 Redis 客户端，按项目实际使用引入（Jedis / Lettuce / Redisson）。

### 一键配置

```java
import io.agentscope.extensions.redis.RedisDistributedStore;

JedisPooled jedis = new JedisPooled("redis://localhost:6379");
DistributedStore store = RedisDistributedStore.fromJedis(jedis);

HarnessAgent agent = HarnessAgent.builder()
    .distributedStore(store)
    .filesystem(new RemoteFilesystemSpec()
            .isolationScope(IsolationScope.USER))
    .build();
```

自定义 key 前缀（多环境隔离）：

```java
DistributedStore store = RedisDistributedStore.fromJedis(jedis, "prod:");
```

使用 Jedis Cluster 时，需要显式选择支持 Redis Cluster 的 Agent State key 布局：

```java
import io.agentscope.extensions.redis.state.RedisAgentStateStore;

DistributedStore store = RedisDistributedStore.fromJedis(
    jedisCluster,
    "prod:",
    RedisAgentStateStore.KeyLayoutVersion.V1);
```

### 提供的组件

#### 1. RedisAgentStateStore

Agent 状态持久化到 Redis。支持 Jedis / Lettuce / Redisson 三种客户端。

```java
import io.agentscope.extensions.redis.state.RedisAgentStateStore;

// Jedis
AgentStateStore store = RedisAgentStateStore.builder()
    .jedisClient(new JedisPooled("redis://localhost:6379"))
    .keyPrefix("myapp:session:")
    .build();

// Lettuce 集群
AgentStateStore store = RedisAgentStateStore.builder()
    .lettuceClusterClient(RedisClusterClient.create(RedisURI.create("localhost", 7000)))
    .keyLayoutVersion(RedisAgentStateStore.KeyLayoutVersion.V1)
    .build();

// Redisson
Config config = new Config();
config.useSingleServer().setAddress("redis://localhost:6379");
AgentStateStore store = RedisAgentStateStore.builder()
    .redissonClient(Redisson.create(config))
    .build();
```

##### V0 与 V1 key 布局

`RedisAgentStateStore` 默认使用 V0，以兼容已有 Redis key。Redis Cluster 必须显式选择 V1，同一个 key 前缀下的所有应用实例也必须使用相同版本。

假设配置和调用参数如下：

```text
keyPrefix = agentscope:session:
userId = alice
sessionId = s1
```

两种布局只在 session 段上有差异：V0 使用 `alice/s1`，V1 则使用 Redis hash tag `{alice/s1}`。

| 数据 | V0 key | V1 key |
|---|---|---|
| 单值状态 `agent_state` | `agentscope:session:alice/s1:agent_state` | `agentscope:session:{alice/s1}:agent_state` |
| 状态版本 | `agentscope:session:alice/s1:agent_state:ver` | `agentscope:session:{alice/s1}:agent_state:ver` |
| 列表状态 `messages` | `agentscope:session:alice/s1:messages:list` | `agentscope:session:{alice/s1}:messages:list` |
| 列表变更检测 hash | `agentscope:session:alice/s1:messages:list:_hash` | `agentscope:session:{alice/s1}:messages:list:_hash` |
| Session 索引 | `agentscope:session:alice/s1:_keys` | `agentscope:session:{alice/s1}:_keys` |

Session 索引是一个 Redis Set，其中的成员格式不随布局改变。单值状态对应 `agent_state`，列表状态对应 `messages:list`。`userId` 为 null 或空白字符串时，两种布局都会将它转换为 `__anon__`。

V0 没有 hash tag，Redis Cluster 会按完整 key 分别计算 slot。乐观并发 Lua 脚本用到的状态 key、版本 key 和 Session 索引可能落在不同 slot，进而触发 `CROSSSLOT`。V1 只对 `{...}` 中的 `alice/s1` 计算 slot，因此同一 session 下的 key 会落在同一个 slot。

V0 和 V1 使用不同的 key namespace。Store 配置为某个布局后，读写、`exists`、`delete` 和 `listSessionIds` 都只操作该布局，不会读取另一个布局的数据。V1 还有以下限制：

- `keyPrefix` 不能包含 `{` 或 `}`。
- `userId` 和 `sessionId` 不能包含 `{`、`}` 或 `/`。
- `sessionId` 不能为 null 或空白字符串。

##### 从 V0 迁移到 V1

框架不会自动迁移数据，也不提供双写。推荐按 key 前缀停写迁移：

1. 盘点并校验。找出使用该前缀的所有应用实例，以及需要保留的 `(userId, sessionId)`。先处理不满足 V1 字符限制的 ID。对于包含 `/` 的 V0 ID，不要直接拆分 Redis key 来推断原始 ID，应以应用保存的 ID 为准。
2. 确定是否保留旧状态。如果 Agent 状态可以丢弃，或者已有较短 TTL，可以停写后删除或等待 V0 key 过期，然后直接启用 V1。需要保留状态时，继续执行后面的复制步骤。
3. 停止写入并备份 Redis。等待在途请求结束，禁止所有实例继续写入该前缀，然后创建备份或快照。边写边复制可能导致状态值、版本号和 Session 索引不一致。
4. 按 session 逐 key 复制。只把 session 段从 `userId/sessionId` 改为 `{userId/sessionId}`。复制所有现存 key，包括单值状态、版本、列表、列表 hash 和 `_keys`。最后复制 `_keys`，避免未复制完成的 session 被识别为已存在。
5. 保留 Redis 类型和 TTL。迁移工具可以针对每个 key 分别执行 `DUMP`、`PTTL` 和 `RESTORE ... REPLACE`。`PTTL = -1` 表示目标 key 不过期，此时 `RESTORE` 的 TTL 使用 `0`；`PTTL = -2` 表示源 key 已不存在，应跳过。使用支持 Cluster 路由的客户端，确保源 key 和目标 key 的命令发送到正确节点。不要跨 slot 使用 `RENAME`，也不要使用多 key 复制或删除命令。
6. 切换前校验。检查 V0 和 V1 的 Redis 类型、值、TTL、版本号、列表内容和 `_keys` 成员，并核对 session 总数。对 V1 的状态 key、版本 key 和 Session 索引执行 `CLUSTER KEYSLOT`，三者的 slot 必须相同。再用测试 session 验证加载、保存、CAS、列表和删除操作。
7. 同时切换所有实例。让使用该前缀的 Store 全部改为 `KeyLayoutVersion.V1`，完成统一发布后再恢复流量。V0 和 V1 写入实例同时运行，会让同一个 session 产生两份独立变化的数据。
8. 在观察期保留 V0 数据。切换到 V1 后不要再修改这份 V0 副本。如果 V1 尚未产生新写入，可以让所有实例直接切回 V0。V1 已经产生新写入时，需要再次停写，将变化的数据反向迁移后再回滚，否则 V0 看不到这些更新。切回 V0 也会重新引入 Redis Cluster 的 `CROSSSLOT` 问题。
9. 定向清理 V0 数据。观察期结束后，逐 key 删除旧的 V0 数据。不要按前缀全量清理，因为这会同时删除该前缀下的 V1 key。

#### 2. RedisStore（BaseStore）

工作区文件系统 KV 存储，供 `RemoteFilesystemSpec` 使用。

```java
import io.agentscope.extensions.redis.store.RedisStore;

BaseStore store = new RedisStore(jedis);
BaseStore store = new RedisStore(jedis, "myapp:store:");
```

**并发安全**：`put` / `putIfVersion` 使用 Lua 脚本保证原子性（version read + hash write + index update 单次 `EVAL`），`putIfVersion` 可作为分布式 CAS 原语。

#### 3. RedisSnapshotSpec

沙箱快照存储到 Redis 二进制 key。适合小工作区 + 短 TTL 场景。

```java
import io.agentscope.extensions.redis.snapshot.RedisSnapshotSpec;

SandboxSnapshotSpec spec = new RedisSnapshotSpec(jedis, "myapp:snapshot:", 3600);
```

> 注意 Redis 内存代价——大工作区（>50MB）建议用 OSS。

#### 4. RedisSandboxExecutionGuard

基于 Redis `SET NX PX` 租约的分布式锁，用于 `AGENT` / `GLOBAL` 隔离范围下的多副本并发控制。

```java
import io.agentscope.extensions.redis.sandbox.RedisSandboxExecutionGuard;

SandboxExecutionGuard guard = RedisSandboxExecutionGuard.builder(jedis)
    .keyPrefix("myapp:guard:")
    .leaseTtl(Duration.ofMinutes(30))
    .retryInterval(Duration.ofMillis(500))
    .build();
```

### 选型建议

| 场景 | 建议 |
|------|------|
| 多副本生产，追求低延迟 | **首选** Redis |
| 已有 Redis 集群 | Lettuce Cluster 或 Redisson Sentinel |
| 小工作区 + 短 TTL 快照 | Redis 快照可以，但注意内存 |
| 大工作区快照 | 混合后端：Redis 管状态和锁，OSS 管快照 |

## JDBC

`agentscope-extensions-jdbc` 提供基于标准 JDBC 的全链路分布式存储实现，是关系型数据库的统一入口：传入任意 JDBC `DataSource`，方言通过 SPI 自动检测，无需针对数据库单独选型。适合已有关系型数据库基础设施的场景。

目前已支持的数据库：

| 数据库     | 定位                      |
| ---------- | ------------------------- |
| MySQL      | 生产环境常用选项          |
| PostgreSQL | 生产环境常用选项          |
| H2         | 内存 / 嵌入式，测试与开发 |
| SQLite     | 嵌入式，轻量单机场景      |

后续将持续扩展对更多关系型数据库的支持，包括 Oracle 以及达梦、高斯、OceanBase 等国产数据库。

> 历史模块 `agentscope-extensions-mysql`、`agentscope-extensions-postgresql`、`agentscope-extensions-skill-mysql-repository`、`agentscope-extensions-skill-postgresql-repository` 已废弃，由本模块统一取代，迁移方式见下文。

### 添加依赖

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-extensions-jdbc</artifactId>
    <version>${agentscope.version}</version>
</dependency>
```

数据库驱动按实际使用自行引入（如 `mysql-connector-j`、`postgresql`、`sqlite-jdbc`）。

### 一键配置

```java
import io.agentscope.extensions.jdbc.JdbcDistributedStore;

DataSource dataSource = ...;  // HikariCP, Druid, etc.
DistributedStore store = JdbcDistributedStore.create(dataSource);

HarnessAgent agent = HarnessAgent.builder()
    .distributedStore(store)
    .filesystem(new RemoteFilesystemSpec()
            .isolationScope(IsolationScope.USER))
    .build();
```

自定义表名推荐只通过 `tablePrefix` 设置统一前缀；builder 另提供 `storeTableName` / `sessionStateTableName` / `snapshotTableName` 支持逐表完全自定义，通常无需使用：

```java
AbstractJdbcDialect dialect = AbstractJdbcDialect.from(dataSource)
    .tablePrefix("myapp_")            // 默认 agentscope_
    .build();

DistributedStore store = JdbcDistributedStore.create(dataSource, dialect);
```

建表与结构校验统一在 `AbstractJdbcDialect.from(ds).build()` 装配时完成：`autoCreateTable`（默认 true）控制是否执行 DDL，无论开关与否都会校验已启用表组的业务表，缺表或缺列即带参考 DDL 快速失败（Spring 环境在启动时暴露）。表名与前缀仅允许 `[A-Za-z_][A-Za-z0-9_]*`。

**表组开关**：`enableBaseTables`（默认开）与 `enableSkillTables`（默认关）决定 `build()` 建表与校验覆盖哪些表组，与 `autoCreateTable` 正交、彼此也独立——基础表用 MySQL、skill 走 git 通道是合法组合。

```java
AbstractJdbcDialect dialect = AbstractJdbcDialect.from(dataSource)
    .enableBaseTables(true)      // 默认开 —— store、sessions、snapshots
    .enableSkillTables(true)     // 默认关 —— 显式开启才建 skill 表
    .build();                    // 会创建 agentscope_skills / agentscope_skill_resources
```

默认创建的表：`agentscope_store`、`agentscope_sessions`、`agentscope_snapshots`；锁表 `agentscope_distributed_locks` 在首次加锁时创建。开启 skill 表组后额外创建：`agentscope_skills`、`agentscope_skill_resources`。

### 提供的组件

#### 1. JdbcAgentStateStore

Agent 状态持久化到数据库表。

```java
import io.agentscope.extensions.jdbc.dialect.AbstractJdbcDialect;
import io.agentscope.extensions.jdbc.state.JdbcAgentStateStore;

AbstractJdbcDialect dialect = AbstractJdbcDialect.from(dataSource).build();  // 建表与校验在此完成

AgentStateStore store = new JdbcAgentStateStore(dataSource, dialect);
```

**表结构**：自动创建的表包含 `session_id`、`state_key`、`item_index`、`state_data`（LONGTEXT JSON）、`version`、`created_at`、`updated_at` 等列，主键为 `(session_id, state_key, item_index)`。`version` 列支撑 `saveIfVersion` 乐观并发控制（CAS 写入）。

#### 2. JdbcStore（BaseStore）

工作区文件系统 KV 存储，SQL 全部来自方言层，组件本身与数据库无关。

```java
import io.agentscope.extensions.jdbc.store.JdbcStore;

BaseStore store = JdbcStore.builder(dataSource)
    .dialect(dialect)
    .build();
```

**并发安全**：`putIfVersion` 通过单语句 CAS `UPDATE ... WHERE version = ?` 实现，所有已支持数据库均可用。

#### 3. JdbcSnapshotSpec

沙箱快照以 BLOB 存储到数据库表（MySQL 为 LONGBLOB，PostgreSQL 为 BYTEA）。

```java
import io.agentscope.extensions.jdbc.snapshot.JdbcSnapshotSpec;

SandboxSnapshotSpec spec = new JdbcSnapshotSpec(dataSource, dialect);
```

#### 4. JdbcSandboxExecutionGuard

分布式锁，锁策略由方言决定：

- **MySQL**：原生 `GET_LOCK()` / `RELEASE_LOCK()`，锁绑定 JDBC 连接，连接关闭时自动释放；lock name 超过 64 字符时自动 hash。
- **PostgreSQL / H2 / SQLite**：基于 `agentscope_distributed_locks` 表的通用锁，不依赖数据库私有语法。

```java
import io.agentscope.extensions.jdbc.sandbox.JdbcSandboxExecutionGuard;

SandboxExecutionGuard guard = JdbcSandboxExecutionGuard.builder(dialect)
    .keyPrefix("myapp:lock:")
    .lockTimeout(Duration.ofMinutes(30))
    .build();
```

> 注意：MySQL named locks 是 server 级别的（非 database 级别）。在共享 MySQL 实例时，使用唯一的 `keyPrefix` 避免冲突。

#### 5. JdbcAgentSkillRepository

skill 存储走同一套方言：实现 core 的 `AgentSkillRepository`，本模块支持的每个数据库都能直接作为 skill 通道。

```java
import io.agentscope.core.skill.repository.AgentSkillRepository;
import io.agentscope.extensions.jdbc.skill.JdbcAgentSkillRepository;

AbstractJdbcDialect dialect = AbstractJdbcDialect.from(dataSource)
    .enableSkillTables(true)
    .build();

AgentSkillRepository repo = new JdbcAgentSkillRepository(dataSource, dialect);
```

建两张表：`agentscope_skills` 和 `agentscope_skill_resources`（复合主键 `(id, resource_path)`，外键 `ON DELETE CASCADE`）。与其他组件一样，repository 不碰 schema——表组在 build 时开启；方言没开表组就直接构造，会立刻报错。

两点行为说明：

- `metadata_json` 是必需列。早于该列的旧表会在启动校验时报错并附参考 DDL，按提示 `ALTER TABLE` 补列后重启即可，框架不会代改已有表。
- `delete` 会先显式删掉技能的资源行再删技能行，因此在 SQLite（默认不启用级联外键）上行为也一致；资源路径必须是相对路径且不含 `..`，越出技能目录的路径在保存时即被拒绝，读取回表中的行时也做同样校验。

##### 作用域隔离（namespace）

技能名跨团队重名是常态，`agentscope_skills` 用 `namespace` 列做作用域隔离：唯一键为 **`UNIQUE(namespace, name)`**，namespace 内唯一、跨 namespace 可重名。`skill_resources` 同样带 `namespace` 列，与技能行同一事务写入。这也是 `AgentSkillRepository` 作用域隔离契约在关系型存储上的落地：**一个实例绑定一个 namespace，无参方法全部作用于绑定值**。

```sql
namespace VARCHAR(64) NOT NULL DEFAULT 'default'   -- 存量行自动落入 default
CONSTRAINT uk_namespace_name UNIQUE (namespace, name)
```

```java
JdbcAgentSkillRepository teamA =
    new JdbcAgentSkillRepository(dataSource, dialect, "team-a", true);
JdbcAgentSkillRepository teamB =
    new JdbcAgentSkillRepository(dataSource, dialect, "team-b", true);

teamA.save(List.of(skill), false);                 // 团队 A 保存
teamB.save(List.of(skill), false);                 // 同名技能在另一 namespace，互不影响
teamA.getSkill("code-review");
teamA.delete("code-review");                       // 只作用于绑定的 namespace

// 同一实例上显式指定 namespace 的便捷方法
teamA.save("team-b", List.of(otherSkill), false);
```

- 不指定 namespace 的构造器都绑定 `"default"`。
- `force=true` 的覆盖只发生在同一 namespace 内，不会跨 namespace 删旧写新。
- namespace 在构造与便捷方法入口都校验：1–64 字符、`[A-Za-z0-9._-]`，非法抛 `IllegalArgumentException`。
- namespace 比较在所有数据库上均大小写敏感；MySQL 下两表的 `namespace` 列显式指定 `utf8mb4_bin`，`name` 列保持默认的大小写不敏感。
- `clearAllSkills()` 清除一个 namespace 的全部技能（无参形式作用于绑定的 namespace）。
- `namespace` **一次写入**——仓库没有任何语句会更新它。

**存量升级**（框架不会代改已有表，需人工执行一次）：

```sql
-- 1. 加列（瞬时完成，存量行自动归入 default；两张表都要）
ALTER TABLE agentscope_skills
  ADD COLUMN namespace VARCHAR(64) NOT NULL DEFAULT 'default';
ALTER TABLE agentscope_skill_resources
  ADD COLUMN namespace VARCHAR(64) NOT NULL DEFAULT 'default';

-- 2. 仅 MySQL——把隔离边界固定为大小写敏感比较（会重建表，建议低峰执行）
ALTER TABLE agentscope_skills
  MODIFY COLUMN namespace VARCHAR(64) COLLATE utf8mb4_bin NOT NULL DEFAULT 'default';
ALTER TABLE agentscope_skill_resources
  MODIFY COLUMN namespace VARCHAR(64) COLLATE utf8mb4_bin NOT NULL DEFAULT 'default';

-- 3. 重建唯一索引（建议低峰执行：先删旧的单列唯一，再建复合唯一），
--    并为资源表的 namespace 建索引
ALTER TABLE agentscope_skills DROP INDEX name;
ALTER TABLE agentscope_skills
  ADD UNIQUE KEY uk_namespace_name (namespace, name);
ALTER TABLE agentscope_skill_resources ADD INDEX idx_namespace (namespace);
```

PostgreSQL 变体：

```sql
ALTER TABLE agentscope_skills ADD COLUMN namespace VARCHAR(64) NOT NULL DEFAULT 'default';
ALTER TABLE agentscope_skill_resources ADD COLUMN namespace VARCHAR(64) NOT NULL DEFAULT 'default';
ALTER TABLE agentscope_skills DROP CONSTRAINT agentscope_skills_name_key;
ALTER TABLE agentscope_skills ADD CONSTRAINT uk_namespace_name UNIQUE (namespace, name);
CREATE INDEX IF NOT EXISTS agentscope_skill_resources_namespace_idx
  ON agentscope_skill_resources (namespace);
```

H2 的旧唯一约束可以按名字 `ALTER TABLE agentscope_skills DROP CONSTRAINT <约束名>` 后重建。SQLite 不同：内联 `UNIQUE` 产生的隐式索引删不掉，需要按"建新表 → 拷数据 → 删旧表 → 改名"的标准表重建流程处理（两张表都在建新表时写好 `namespace` 列，skills 表同时写 `UNIQUE(namespace, name)`）。

启动校验只比对列不比对索引，**第 2、3 步都要做**（第 3 步拆除全局 `UNIQUE(name)`；第 2 步使 MySQL 下 namespace 比较大小写敏感）。资源表索引仅影响性能。

### 从历史模块迁移

历史模块不建议继续使用，请按自身节奏尽早迁移：

| 已废弃                                                                     | 替代                                                                  |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `MysqlDistributedStore.create(ds)` / `PostgresDistributedStore.create(ds)` | `JdbcDistributedStore.create(ds)`                                     |
| `new MysqlAgentStateStore(ds)`                                             | `new JdbcAgentStateStore(ds, AbstractJdbcDialect.from(ds).build())`   |
| `JdbcStore.builder(ds).dialect(mysqlDialect)`                              | `JdbcStore.builder(ds).dialect(AbstractJdbcDialect.from(ds).build())` |
| `MysqlSkillRepository` / `PostgresSkillRepository`（skill-mysql / skill-postgresql 模块） | `new JdbcAgentSkillRepository(ds, AbstractJdbcDialect.from(ds).enableSkillTables(true).build())` |

skill 仓库迁移要点：

- 现行旧模块建的表已包含 `metadata_json`，原样可用；更早的旧表先补上这一列，启动报错里附有参考 DDL。
- "原样可用"有一个例外：旧模块从不拒绝绝对路径或含 `..` 的资源路径，而新实现对读取的行做同样校验——`getSkill` 会拒绝这类行，`getAllSkills` / `getAllSkillNames` 会跳过并告警。名字本身非法的行也无法通过 API 删除，只能 `clearAllSkills` 或直接 SQL 处理。迁移前请先审计 `resource_path` 和技能名；这些值本就无法被下游安全消费。
- 旧模块会隐式创建 `agentscope` 库（MySQL）/ schema（PostgreSQL）；新实现的表放在连接所指向的库里——把 `DataSource` 指向存量表即可。
- `databaseName` / `schemaName` 无对应物——表跟随 DataSource 所指向的库，与基础表一致。表名可用 `skillTableName` / `skillResourcesTableName` 覆盖。相应地，`getSource()` 由 `mysql_<库名>_<表名>` / `postgresql_<schema>_<表名>` 变为 `jdbc_<skillTableName>@<namespace>`（namespace 后缀保证同一张表的不同作用域互不混淆）：以其为键的消费方（如 skill 暂存缓存命名空间）迁移后会使用新的子目录，旧目录由孤儿 GC 回收。

### 选型建议

| 场景                             | 建议                |
| -------------------------------- | ------------------- |
| 已有关系型数据库，不想引入 Redis | **首选** JDBC 模块  |
| 需要 SQL 审计 / 报表 / 联表查询  | JDBC 模块           |
| 快照数据量大（>100MB）           | BLOB 可行但推荐 OSS |
| 追求最低延迟                     | Redis               |

## MongoDB

`agentscope-extensions-mongodb` 提供全链路的 MongoDB 分布式存储实现，适合已部署 MongoDB 或偏好文档型后端的场景。

### 添加依赖

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-extensions-mongodb</artifactId>
    <version>${agentscope.version}</version>
</dependency>
```

模块依赖官方 MongoDB Java Driver，无需额外客户端库。

### 一键配置

```java
import io.agentscope.extensions.mongodb.MongoDistributedStore;

MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");
DistributedStore store = MongoDistributedStore.create(mongoClient);

HarnessAgent agent = HarnessAgent.builder()
    .distributedStore(store)
    .filesystem(new RemoteFilesystemSpec()
            .isolationScope(IsolationScope.USER))
    .build();
```

通过连接字符串创建（store 管理客户端生命周期）：

```java
DistributedStore store = MongoDistributedStore.fromConnectionString(
        "mongodb://user:pass@host:27017/mydb?authSource=admin");
```

连接串中包含库名路径时（如 `/mydb`），将使用该库而非默认的 `agentscope`。

### 提供的组件

#### 1. MongoAgentStateStore

Agent 会话状态持久化到 MongoDB。每个会话是一个文档，使用复合 `_id` `{user, session}`。State key 存储在 `states` 子文档中（通过 dot notation 访问），与保留字段隔离。

```java
import io.agentscope.extensions.mongodb.state.MongoAgentStateStore;

AgentStateStore store = MongoAgentStateStore.builder()
    .mongoClient(mongoClient)
    .databaseName("agentscope")
    .collectionName("agentscope_sessions")
    .build();
```

- **单值**：存储在 `states.<key>`，版本号在 `versions.<key>`。
- **列表**：存储在 `states.<key>` 为 BSON 数组，内容 hash 在 `hashes.<key>`，用于增量 append 优化。
- **TTL**：`_updated_at` 上 30 天过期（sparse 索引），与快照 TTL 对齐。

#### 2. MongoBaseStore（BaseStore）

工作区文件系统 KV 存储，供 `RemoteFilesystemSpec` 使用。通过复合 `(namespace, key)` 索引上的范围查询实现前缀匹配——与 `InMemoryStore` 和 `PostgresBaseStore` 行为一致。

```java
import io.agentscope.extensions.mongodb.store.MongoBaseStore;

BaseStore store = new MongoBaseStore(mongoClient.getDatabase("agentscope"), "agentscope_base");
```

- 命名空间路径使用 ``（ASCII Unit Separator）作为段分隔符，带 trailing separator 实现前缀匹配。
- `put` / `putIfVersion` 通过 `version` 字段支持乐观并发。

#### 3. MongoSnapshotSpec

沙箱快照存储为 BSON Binary，集合上建有 `createdAt` 的 30 天 TTL 索引。与会话 TTL 对齐，确保快照不会先于会话过期。

```java
import io.agentscope.extensions.mongodb.snapshot.MongoSnapshotSpec;

SandboxSnapshotSpec spec = new MongoSnapshotSpec(mongoClient, "agentscope");
```

> BSON 文档大小上限 16 MB，快照上限 15 MB。更大工作区建议混合后端（MongoDB 管状态和锁，OSS 管快照）。

#### 4. MongoSandboxExecutionGuard

基于 MongoDB 集合的分布式锁，`expiresAt` 上建有 TTL 索引。每次获取锁生成随机 UUID token 用于安全续约和释放——同一 JVM 内两个 guard 实例不会误删对方的锁。

```java
import io.agentscope.extensions.mongodb.sandbox.MongoSandboxExecutionGuard;

SandboxExecutionGuard guard = MongoSandboxExecutionGuard.builder(mongoClient)
    .databaseName("agentscope")
    .collectionName("agentscope_sandbox_locks")
    .lockTimeout(Duration.ofMinutes(30))
    .leaseTtl(Duration.ofMinutes(30))
    .retryInterval(Duration.ofMillis(500))
    .build();
```

- `lockTimeout` 仅限制获取等待时间；`leaseTtl` 控制锁文档生存期。
- 后台 watchdog 每 `leaseTtl / 3` 续约一次，使用 2 线程池避免单线程阻塞。
- guard 实现 `AutoCloseable`，由 `MongoDistributedStore.close()` 级联关闭。

### 集合与 TTL

四个组件落在四个集合里，集合划分、各自的 TTL 与默认名称汇总于章末参考速查的 MongoDB 一节；所有集合名集中在 `MongoConstants` 中管理，可按组件覆盖。

### 选型建议

| 场景 | 建议 |
|------|------|
| 已有 MongoDB 集群 | **首选** MongoDB |
| 偏好文档型存储 | MongoDB |
| 大量会话历史（字段无长度限制） | MongoDB（无 MySQL 字段长度红线） |
| 大工作区快照（>15 MB） | 混合后端：MongoDB 管状态和锁，OSS 管快照 |

## 阿里云 OSS

`agentscope-extensions-oss` 提供基于阿里云对象存储（OSS）的分布式存储实现，适合大容量数据和阿里云生态的场景。

### 添加依赖

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-extensions-oss</artifactId>
    <version>${agentscope.version}</version>
</dependency>
```

### 一键配置

```java
import io.agentscope.extensions.oss.OssDistributedStore;
import com.aliyun.oss.OSSClientBuilder;

OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
DistributedStore store = OssDistributedStore.create(ossClient, "my-bucket", "agentscope/");

HarnessAgent agent = HarnessAgent.builder()
    .distributedStore(store)
    .filesystem(new RemoteFilesystemSpec()
            .isolationScope(IsolationScope.USER))
    .build();
```

### 提供的组件

#### 1. OssAgentStateStore

Agent 状态持久化到 OSS 对象。

```java
import io.agentscope.extensions.oss.OssAgentStateStore;

AgentStateStore store = OssAgentStateStore.builder()
    .ossClient(ossClient)
    .bucketName("my-bucket")
    .keyPrefix("agentscope/state/")
    .build();
```

#### 2. OssBaseStore

工作区文件系统 KV 存储到 OSS 对象。

```java
import io.agentscope.extensions.oss.OssBaseStore;

BaseStore store = OssBaseStore.builder()
    .ossClient(ossClient)
    .bucketName("my-bucket")
    .keyPrefix("agentscope/store/")
    .build();
```

#### 3. OssSnapshotSpec

沙箱快照存储到 OSS 对象。大工作区快照的首选——对象存储天然适合大二进制文件。

```java
import io.agentscope.extensions.oss.OssSnapshotSpec;

SandboxSnapshotSpec spec = new OssSnapshotSpec(ossClient, "my-bucket", "agentscope/snapshot/");

// 或者从 endpoint + AK/SK 直接构造
SandboxSnapshotSpec spec = new OssSnapshotSpec(
    "oss-cn-hangzhou.aliyuncs.com",
    accessKeyId, accessKeySecret,
    "my-bucket", "agentscope/snapshot/");
```

#### 不提供：SandboxExecutionGuard

对象存储不适合做分布式锁。如需 sandbox 并发控制，混合 Redis store：

```java
DistributedStore ossStore = OssDistributedStore.create(ossClient, "my-bucket", "agentscope/");

DistributedStore mixed = DistributedStore.builder()
    .agentStateStore(ossStore.agentStateStore())
    .baseStore(ossStore.baseStore())
    .sandboxSnapshotSpec(ossStore.sandboxSnapshotSpec())
    .sandboxExecutionGuard(RedisDistributedStore.fromJedis(jedis).sandboxExecutionGuard())
    .build();
```

### 选型建议

| 场景 | 建议 |
|------|------|
| 大容量快照（>100MB 工作区） | **首选** OSS |
| 阿里云生态，已有 OSS bucket | OSS |
| 需要 sandbox 并发锁 | 混合 OSS + Redis |
| 追求低延迟 | Redis |

### 安全提示

- 生产环境建议使用 RAM Role + STS 临时凭证，避免在代码中硬编码 AK/SK
- 为快照 bucket 配置生命周期规则（如 7 天自动过期），避免存储成本失控

## 存量维护参考：三个 legacy 状态存储模块

接下来三节是 AgentScope 早期的三个独立状态存储模块——MySQL、Redis、OSS。它们只实现了 `AgentStateStore` 一个接口，如今已分别迁移进本章分布式存储的 JDBC、Redis、OSS 模块，每节开头的注意块都标明了迁移去向。仍在维护使用这些模块的存量代码、或要在历史文档与配置里核对参数时，这三节就是完整的对照材料；新项目一律使用前文的 `DistributedStore` 一键配置。

三节结构相同：添加依赖 → 快速上手 → key 结构与寻址规则 → 通过 `AgentStateStore` API 直接使用；构造器与 builder 的完整参数表已统一收拢到章末参考速查。

## MySQL 状态存储

> **注意**：本节内容已迁移至分布式存储的 JDBC 模块（见本章"JDBC"一节）。以下内容保留作为参考，但建议使用新文档。

`agentscope-extensions-mysql` 把 AgentScope 的 Agent 状态持久化到 MySQL。适合已有 MySQL 基础设施、需要事务和 SQL 查询能力的场景。

### 添加依赖

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-extensions-mysql</artifactId>
    <version>${agentscope.version}</version>
</dependency>
```

数据库驱动按你使用的版本自行引入（例如 `mysql:mysql-connector-j`）。

### 快速上手

```java
import com.zaxxer.hikari.HikariDataSource;
import io.agentscope.core.state.AgentStateStore;
import io.agentscope.extensions.mysql.state.MysqlAgentStateStore;

HikariDataSource ds = new HikariDataSource();
ds.setJdbcUrl("jdbc:mysql://localhost:3306/agentscope?serverTimezone=UTC");
ds.setUsername("root");
ds.setPassword("***");

// 第二个参数 createIfNotExist=true：自动创建库与表
AgentStateStore stateStore = new MysqlAgentStateStore(ds, true);

ReActAgent agent = ReActAgent.builder()
    .name("assistant")
    .model(model)
    .stateStore(stateStore)
    .build();
```

如果库与表已经预先创建好了，可以使用更安全的形式：

```java
AgentStateStore stateStore = new MysqlAgentStateStore(ds);          // 库/表不存在则抛 IllegalStateException
AgentStateStore stateStore = new MysqlAgentStateStore(ds, false);   // 同上，显式声明
```

### 自定义库名 / 表名

```java
AgentStateStore stateStore = new MysqlAgentStateStore(
    ds,
    "agentscope_prod",        // 库名
    "session_state",          // 表名
    true                      // 是否自动创建
);
```

库名、表名只允许 `[a-zA-Z_][a-zA-Z0-9_-]*`，长度 ≤ 64，避免 SQL 注入。

### 表结构

`createIfNotExist=true` 时会自动建表：

```sql
CREATE TABLE IF NOT EXISTS agentscope_sessions (
    session_id VARCHAR(255) COLLATE utf8mb4_bin NOT NULL,
    state_key  VARCHAR(255) COLLATE utf8mb4_bin NOT NULL,
    item_index INT NOT NULL DEFAULT 0,
    state_data LONGTEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, state_key, item_index)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

两个键列显式指定 `utf8mb4_bin`，而表级默认排序规则仍为 `utf8mb4_unicode_ci`：`session_id` 与 `state_key` 是大小写敏感的标识符，而表级默认排序规则大小写不敏感，若不指定二进制排序规则，两个仅大小写不同的 id 会在主键上冲突、共用同一行。注意 `utf8mb4_bin` 为 PAD SPACE 语义——仅尾部空格不同的值仍视为相等。

#### 迁移在此改动之前创建的表

`CREATE TABLE IF NOT EXISTS` 不会修改已存在的表，因此更早部署的实例仍保持大小写不敏感，需要由运维执行迁移。`agentscope_store`、`agentscope_sessions`、`agentscope_snapshots` 三张表的主键都是调用方提供的标识符，道理相同：

```sql
ALTER TABLE agentscope_store
    MODIFY namespace_path VARCHAR(512) COLLATE utf8mb4_bin NOT NULL,
    MODIFY item_key       VARCHAR(255) COLLATE utf8mb4_bin NOT NULL;

ALTER TABLE agentscope_sessions
    MODIFY session_id VARCHAR(255) COLLATE utf8mb4_bin NOT NULL,
    MODIFY state_key  VARCHAR(255) COLLATE utf8mb4_bin NOT NULL;

ALTER TABLE agentscope_snapshots
    MODIFY snapshot_id VARCHAR(512) COLLATE utf8mb4_bin NOT NULL;
```

若配置过表前缀或逐表名称覆盖，请相应替换表名。创建 `agentscope_snapshots` 的两条路径——`agentscope-extensions-jdbc` 方言与 legacy 的 `agentscope-extensions-mysql` 快照客户端——现在钉的是同一个排序规则，因此更早部署的实例只需执行上面的语句。

有两点需要提前考虑：

- **读取语义随排序规则一起改变。** 比较与前缀查询（`session_id = ?`、`LIKE 'prefix%'`）变为大小写敏感，原先用小写 `sess-1` 能查到 `SESS-1` 的场景将不再匹配。请在会话空闲窗口执行迁移。
- **已有数据可能已经丢失。** 若迁移前曾写入两个仅大小写不同的键，第二次写入会通过 `ON DUPLICATE KEY UPDATE` 覆盖第一次，那一行无法从表中恢复。

- `(userId, sessionId)` 二元组会被打包进 `session_id` 列，形如 `{userSegment}:{sessionId}`（`userSegment` 为 `userId`，匿名 session 用 `__anon__`）。
- 单值：`item_index = 0`
- 列表：`item_index = 0,1,2,...`，每项一行；同时另存一行 `state_key='xxx:_hash'` 用作变更检测。

### 直接使用 API

`MysqlAgentStateStore` 实现了 `AgentStateStore` 接口，常用调用如下：

```java
// 单值（匿名 session 时 userId 可传 null）
stateStore.save("user-42", "session-1", "agent_state", state);
Optional<MyState> got = stateStore.get("user-42", "session-1", "agent_state", MyState.class);

// 列表（增量 append；变更时整体重写）
stateStore.save("user-42", "session-1", "messages", listOfMessages);
List<MyState> all = stateStore.getList("user-42", "session-1", "messages", MyState.class);

// 维护
boolean exists = stateStore.exists("user-42", "session-1");
stateStore.delete("user-42", "session-1");
Set<String> sessions = stateStore.listSessionIds("user-42");   // 传 null 列出匿名 session

// 清理（请谨慎，仅用于测试）
stateStore.truncateAllSessions();
```

构造参数的完整说明表收拢在章末参考速查的 legacy MySQL 一节。

## Redis 状态存储

> **注意**：本节内容已迁移至分布式存储的 Redis 模块（见本章"Redis"一节）。以下内容保留作为参考，但建议使用新文档。

`agentscope-extensions-redis` 把 AgentScope 的 Agent 状态存到 Redis。统一抽象出 `RedisClientAdapter`，支持 **Jedis、Lettuce、Redisson** 三个客户端，覆盖 Standalone、Cluster、Sentinel 等部署模式。

### 添加依赖

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-extensions-redis</artifactId>
    <version>${agentscope.version}</version>
</dependency>
```

模块本身不强制依赖某一客户端，按你项目里实际用的引入即可（Jedis / Lettuce / Redisson）。

### 快速上手（Lettuce 单机）

```java
import io.lettuce.core.RedisClient;
import io.agentscope.core.state.AgentStateStore;
import io.agentscope.extensions.redis.state.RedisAgentStateStore;

RedisClient redisClient = RedisClient.create("redis://localhost:6379");

AgentStateStore stateStore = RedisAgentStateStore.builder()
    .lettuceClient(redisClient)
    .build();
```

### 三种客户端的接入

#### Jedis

```java
import redis.clients.jedis.UnifiedJedis;

UnifiedJedis jedis = new redis.clients.jedis.JedisPooled("localhost", 6379);
AgentStateStore stateStore = RedisAgentStateStore.builder()
    .jedisClient(jedis)   // UnifiedJedis、JedisCluster、JedisSentineled 都可
    .build();
```

#### Lettuce 集群

```java
import io.lettuce.core.cluster.RedisClusterClient;
import io.lettuce.core.RedisURI;

RedisClusterClient clusterClient = RedisClusterClient.create(
    RedisURI.create("redis://localhost:7000"));

AgentStateStore stateStore = RedisAgentStateStore.builder()
    .lettuceClusterClient(clusterClient)
    .build();
```

#### Redisson

```java
import org.redisson.Redisson;
import org.redisson.config.Config;

Config config = new Config();
config.useSingleServer().setAddress("redis://localhost:6379");
RedissonClient redisson = Redisson.create(config);

AgentStateStore stateStore = RedisAgentStateStore.builder()
    .redissonClient(redisson)
    .build();
```

> Redisson 还支持 `useClusterServers()` / `useSentinelServers()` / `useMasterSlaveServers()`，配好后照样传给 `redissonClient(...)`。

### 自定义 key 前缀

默认所有 key 形如 `agentscope:session:{userSegment}/{sessionId}:...`（`userSegment` 即 `userId`，匿名 session 用 `__anon__`）。多个项目共享同一个 Redis 时建议自定义：

```java
AgentStateStore stateStore = RedisAgentStateStore.builder()
    .lettuceClient(redisClient)
    .keyPrefix("myapp:session:")
    .build();
```

### Key 结构

`(userId, sessionId)` 二元组会被打包成单一槽位标识 `{userSegment}/{sessionId}`（`userSegment` 为 `userId`，`userId` 为 null 时取 `__anon__`）。

| 类型 | Key 模式 |
| --- | --- |
| 单值 | `{prefix}{userSegment}/{sessionId}:{stateKey}`（Redis String，存 JSON） |
| 列表 | `{prefix}{userSegment}/{sessionId}:{stateKey}:list`（Redis List，每项一条 JSON） |
| 列表 hash | `{prefix}{userSegment}/{sessionId}:{stateKey}:list:_hash`（变更检测用） |
| Session 索引 | `{prefix}{userSegment}/{sessionId}:_keys`（Redis Set，记录该 session 下所有 stateKey） |

`_keys` 索引让 `delete(userId, sessionId)`、`exists(userId, sessionId)` 都只需要常数次 Redis 调用，避免 `KEYS *`。

### 挂载到 Agent

```java
ReActAgent agent = ReActAgent.builder()
    .name("assistant")
    .model(model)
    .stateStore(stateStore)
    .build();
```

之后你的 Memory、Workspace、Plan 等组件就会自动通过 Redis 持久化。每次调用读写哪个槽位，由该次调用的 `RuntimeContext` 决定：

```java
RuntimeContext rc = RuntimeContext.builder()
    .userId("alice")
    .sessionId("session-1")
    .build();

agent.call(msg, rc).block();
```

### 自定义客户端适配

如果你需要接其他 Redis 兼容存储（比如 KeyDB、Tair），可以实现 `RedisClientAdapter` 然后通过 `clientAdapter(...)` 注入：

```java
AgentStateStore stateStore = RedisAgentStateStore.builder()
    .clientAdapter(new MyCustomAdapter(...))
    .build();
```

builder 的客户端方法与 `keyPrefix` 参数的完整说明表收拢在章末参考速查的 legacy Redis 一节。

## OSS 状态存储

> **注意**：本节内容已迁移至分布式存储的 OSS 模块（见本章"阿里云 OSS"一节）。以下内容保留作为参考，但建议使用新文档。

`agentscope-extensions-oss` 把 AgentScope 的 Agent 状态持久化到阿里云对象存储（OSS）。适合大容量数据和阿里云生态的场景。

### 添加依赖

```xml
<dependency>
    <groupId>io.agentscope</groupId>
    <artifactId>agentscope-extensions-oss</artifactId>
    <version>${agentscope.version}</version>
</dependency>
```

### 快速上手

```java
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import io.agentscope.core.state.AgentStateStore;
import io.agentscope.extensions.oss.OssAgentStateStore;

OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);

AgentStateStore stateStore = OssAgentStateStore.builder()
    .ossClient(ossClient)
    .bucketName("my-agentscope-bucket")
    .keyPrefix("agentscope/state/")
    .build();

ReActAgent agent = ReActAgent.builder()
    .name("assistant")
    .model(model)
    .stateStore(stateStore)
    .build();
```

### Key 结构

`(userId, sessionId)` 二元组会被打包进 OSS 对象路径：

| 类型 | Key 模式 |
| --- | --- |
| 单值 | `{keyPrefix}{userId}/{sessionId}/{stateKey}.json` |
| 列表 | `{keyPrefix}{userId}/{sessionId}/{stateKey}.list.json` |
| 列表 hash | `{keyPrefix}{userId}/{sessionId}/{stateKey}.list.hash`（变更检测用） |

匿名 session（`userId` 为 null）时 `userId` 用 `__anon__` 替代。

builder 参数的完整说明表收拢在章末参考速查的 legacy OSS 一节。

### 安全提示

- 生产环境建议使用 RAM Role + STS 临时凭证，避免在代码中硬编码 AK/SK
- 为 bucket 配置生命周期规则（如 7 天自动过期），避免存储成本失控

## 本章小结

这一章沿着三条线走完了 Agent 状态的存储底座：

1. **为什么需要存储底座**：单机默认的本地文件存储在第二个副本出现时立即失效——会话不共享、重启丢状态、副本间互相看不见，状态必须外置到共享后端；
2. **接口层**：`AgentStateStore` 以 `(userId, sessionId)` 寻址，与原生 Session Log 是两套恢复通道，仅替换 stateStore 不会迁移或共享原生日志；
3. **生产推荐**：`DistributedStore` 一行配置同时覆盖 AgentStateStore、BaseStore、SandboxSnapshotSpec、SandboxExecutionGuard 四类组件，四个后端可按组件混合搭配；OSS 不提供沙箱并发锁，需要时混入 Redis 的 guard；
4. **四个后端**：Redis 低延迟、多副本生产首选（Redis Cluster 必须显式选 V1 key 布局）；JDBC 是关系型数据库统一入口，兼管 skill 仓库与历史模块迁移；MongoDB 文档型、集合级 TTL；OSS 大容量快照首选；
5. **Control Plane**：已部署控制面时可托管协调类能力，但 `AgentStateStore` 仍需自备后端，正确性靠后端的 versioning CAS；
6. **legacy 三模块**：MySQL、Redis、OSS 三个独立状态存储已被分布式存储对应模块取代，保留作为存量维护参考，参数表收拢在章末速查。

**验收清单**——读到这里，你应该能：

- ☐ 说出 `AgentStateStore` 与原生 Session Log 的区别，并解释为什么只换 stateStore 不会迁移原生日志；
- ☐ 用 `DistributedStore` 一键配置让多个 Agent 副本共享状态与工作区；
- ☐ 解释 OSS 为什么不提供 `SandboxExecutionGuard`，并配出 OSS + Redis 的混合后端；
- ☐ 为已有 MySQL / MongoDB / OSS 基础设施的团队各选对后端，并说出 Redis Cluster 场景必须显式选择 V1 key 布局的原因；
- ☐ 面对使用 legacy MySQL / Redis / OSS 状态存储的存量代码，说出各自的迁移去向。

## 参考速查

本节收拢本章各节引用过的参数与集合配置全表，供实施时查阅；正文主线中的最小路径不依赖本节。

### legacy MySQL 构造参数

| 构造参数 / 方法 | 说明 |
| --- | --- |
| `dataSource` | 必填。建议用 HikariCP / Druid 等连接池 |
| `databaseName` | 默认 `agentscope` |
| `tableName` | 默认 `agentscope_sessions` |
| `createIfNotExist` | `true` 时自动 `CREATE DATABASE` + `CREATE TABLE` |

> `truncateAllSessions()` 使用 `TRUNCATE TABLE`，需要 DROP 权限；DDL 不可回滚，仅用于测试或运维清理。

### legacy Redis builder 参数

| 方法 | 说明 |
| --- | --- |
| `jedisClient(UnifiedJedis)` | Jedis 单机/集群/哨兵任意一种 |
| `lettuceClient(RedisClient)` | Lettuce 单机/Sentinel |
| `lettuceClusterClient(RedisClusterClient)` | Lettuce 集群 |
| `redissonClient(RedissonClient)` | Redisson 任意部署模式 |
| `clientAdapter(RedisClientAdapter)` | 自定义适配器 |
| `keyPrefix(String)` | 默认 `agentscope:session:` |

> 上述客户端方法互斥，只设置一个。

### legacy OSS builder 参数

| 方法 | 说明 |
| --- | --- |
| `ossClient(OSS)` | 必填。阿里云 OSS 客户端 |
| `bucketName(String)` | 必填。OSS Bucket 名称 |
| `keyPrefix(String)` | 默认 `agentscope/state/` |

### MongoDB 集合与 TTL

| 集合 | 用途 | TTL | 默认名称 |
|------|------|-----|---------|
| 会话 | Agent 状态存储 | `_updated_at` 30 天 | `agentscope_sessions` |
| 基础存储 | 工作区 KV | — | `agentscope_base` |
| 快照 | 沙箱 tar 归档 | `createdAt` 30 天 | `agentscope_snapshots` |
| 沙箱锁 | 分布式锁 | `expiresAt` 即时 | `agentscope_sandbox_locks` |
