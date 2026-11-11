# LiteLLM：多模型网关、配额与降级

> 状态：**成稿（2026-11-11）**。10 章。主线只写 LiteLLM 开源核心（仓库根 `LICENSE` 为 MIT；`enterprise/` 另有商业许可，不进必做步骤）。版本基线是 PyPI `litellm` **1.109.0**，与本机 `importlib.metadata` 读数一致。代理、虚拟密钥、团队预算、跨模型拒绝、每分钟请求上限、主上游断开后的降级，在本地 PostgreSQL 16 加模拟上游上跑过。没有厂商密钥，没有 Admin UI 操作截图，没有向 Langfuse 投递。Spring AI 与 AgentScope Java 的接入代码按各自文档和书架既有章节编写，进程未在本章环境里启动，章内标了复核清单。

署名只用虚构名林舟。不要在书稿、配置或示例组织名里写真实作者姓名。

## 定位

星帆出海的 Java 中台已经有客服 Agent 小帆，也有海岸优品、极光数码两家商家。订单 `OD-2049` 的催单会打到模型。上游密钥不该进业务仓，两家商家的额度不该混在一把钥匙上，主模型断了客服不能停。

LiteLLM Proxy 是这件事的开源网关：对外提供 OpenAI 兼容的 Chat Completions，对内保存上游密钥、签发虚拟密钥、按团队记账，并在部署失败时改走另一个别名。New API（[QuantumNous/new-api](https://github.com/QuantumNous/new-api)，AGPL-3.0，另有第 7 条附加署名条款）只在第 2 章和第 10 章作对照，不作为正文底座。

这本书是候选池里 **ai-platform** 的「网关 / 配额」切片，不是 ai-platform 整书。租户隔离策略、计费产品、前端控制台仍留在候选池。

## 读者

正在建跨境电商智能体多租户平台的 Java 中台。你改过 `open-api-platform` 的订单域，或者准备把 AgentScope Service 的模型通道从「进程里一把上游密钥」收成公司网关。测试和运维可以只读第 2、4、7、9 章。

## 贯穿案例

名称、单号、域名与 [AgentScope Java 书](../agentscope-java/README.md) 的星帆出海 / 小帆对齐，各章不得另起一套。

| 项 | 值 | 出处 |
| --- | --- | --- |
| 平台 | 星帆出海 | agentscope-java 第 2、4、43 章 |
| 客服 Agent | 小帆，`xingfan-support`；托管形态 `xbd-seashore-cs-agent` | 第 2、4 章；demo Step 03 |
| 工程师 | 林舟 | 与 super-agent 书同一虚构人物 |
| 海岸优品 | namespace `seashore-main`，店主 alice | demo Step 02 |
| 极光数码 | namespace `aurora-main`，店主 bob | demo Step 02 |
| 订单 | `OD-2049` | 第 2 章与 Step 04 |
| 工单 | 「售后升级：订单 OD-2049 客户投诉物流延迟」，团队 `xbd-seashore-cs-team` | 第 43 章 |
| 平台对外域名 | `agentscope.example.com` | agentscope-java 第 29 章 |
| 模型网关域名 | `llm.example.com` | demo Step 13 的 `XBD_MODEL_BASE_URL` |
| 平台侧教学别名 | `merchant-gateway` | demo Step 13，指「接到公司网关」，不是上游模型名 |
| 网关模型别名 | `seashore-cs`、`seashore-cs-fast`、`aurora-cs` | 本书为两家商家固定的 `model_name`，只此三个 |

本地实验端口、模拟上游和配置在 [demo/](demo/README.md)。生产形态的主机名仍写 `llm.example.com`，不要把 `127.0.0.1:4000` 写进业务仓库。

## 章节

| 章 | 一篇话 | 文件 |
| --- | --- | --- |
| 1 | 上游密钥为什么不能进业务仓 | [chapters/01-keys-stay-out.md](chapters/01-keys-stay-out.md) |
| 2 | 把 Proxy 在本地跑起来，并给 New API 一个位置 | [chapters/02-run-the-proxy.md](chapters/02-run-the-proxy.md) |
| 3 | 虚拟密钥：上游密钥留在网关 | [chapters/03-virtual-keys.md](chapters/03-virtual-keys.md) |
| 4 | 团队预算与限流 | [chapters/04-budgets-and-limits.md](chapters/04-budgets-and-limits.md) |
| 5 | 租户隔离停在网关的哪一层 | [chapters/05-tenant-on-the-gateway.md](chapters/05-tenant-on-the-gateway.md) |
| 6 | 别名、部署 id 和业务看到的模型名 | [chapters/06-model-alias.md](chapters/06-model-alias.md) |
| 7 | 降级、重试、负载，以及一次被预算预检掐掉的降级 | [chapters/07-fallback.md](chapters/07-fallback.md) |
| 8 | AgentScope 与 Spring AI 接到同一入口 | [chapters/08-java-clients.md](chapters/08-java-clients.md) |
| 9 | 调用轨迹交给 Langfuse | [chapters/09-langfuse.md](chapters/09-langfuse.md) |
| 10 | 许可、enterprise 目录、与 New API 的边界 | [chapters/10-boundaries.md](chapters/10-boundaries.md) |

`wc -l books/litellm/chapters/*.md`（2026-11-11）：

| 文件 | 行数 |
| --- | --- |
| 01-keys-stay-out.md | 230 |
| 02-run-the-proxy.md | 293 |
| 03-virtual-keys.md | 242 |
| 04-budgets-and-limits.md | 198 |
| 05-tenant-on-the-gateway.md | 172 |
| 06-model-alias.md | 173 |
| 07-fallback.md | 166 |
| 08-java-clients.md | 200 |
| 09-langfuse.md | 147 |
| 10-boundaries.md | 155 |

写作规范希望每章不少于 500 行。这十章都短于该数，第 9、10 章差距最大。短的原因是：本环境没有厂商控制台、没有 Admin UI 操作、没有 Langfuse 投递、没有第二副本和 Redis，实测表面就这些。没有用换一种说法把同一段响应再写一遍来凑行。补上那些实验之后再加行，而不是现在加。

## 许可

- LiteLLM 仓库根 [`LICENSE`](https://github.com/BerriAI/litellm/blob/main/LICENSE)（2026-11-11 读取）：`enterprise/` 目录若存在，适用该目录自己的许可；其余内容为 MIT，版权 Berri AI，2023。
- [`enterprise/LICENSE.md`](https://github.com/BerriAI/litellm/blob/main/enterprise/LICENSE.md) 是商业许可。生产使用该目录代码需要有效的 Enterprise 订阅；开发测试可以复制修改，但权利仍归 BerriAI。本书不引用该目录的实现，也不把 SSO、审计日志、密钥托管写成必做步骤。
- 官方 Enterprise 页把虚拟密钥、预算、管理界面、负载均衡画在开源网关层，又把组织 / 项目 / 标签预算等写进「许可证开启」清单。两处不完全同构。必做步骤只走不要求 `LITELLM_LICENSE` 的代理文档：虚拟密钥、团队、预算、路由、降级。
- New API 为 AGPL-3.0。项目 README 写明依第 7 条保留界面署名 `Frontend design and development by New API contributors.` 以及指向原项目的可见链接。星帆若把网关嵌进对商家开放的控制台，这条义务和 AGPL 的网络分发义务要单独评审。本书因此不把它当底座。
- 本书正文是学习整理，随本仓库 Apache-2.0 分发。与 BerriAI、QuantumNous 无隶属关系。

## 和其他书

- [AgentScope Java](../agentscope-java/README.md)：小帆、两家商家、`llm.example.com`、Step 13 的模型通道。第 8 章接在那条通道后面。
- [Langfuse](../langfuse/README.md)：trace 怎么读、Prompt 和数据集在那边。第 9 章只写网关如何把一次补全送出去。不复用那本书里的组织命名。
- [MCP](../mcp/README.md)：工具协议。网关不代替 MCP。
- [Super-agent](../super-agent/README.md)：林舟这个人物的另一天。订单域适配的仓库名 `open-api-platform` 从那里沿用。

元数据（bookId / title / tagline）以 [`build/books/registry.mjs`](../../build/books/registry.mjs) 为准。
