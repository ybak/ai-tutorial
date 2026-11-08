# Super-agent 设计探索——以 Grok Bot 为例

> **状态：已发布**（成稿 2026-11-07，迁入可构建书架 2026-11-08，Asia/Hong_Kong）。  
> 把 DeepSeek Harness 团队的架构文，翻译成中台工程师**听得懂、用得上**的一天工作法。  
> **立场：不是 DeepSeek 产品说明书**；Grok Bot 是对照实例，不是论文复刻。  
> 章节编写遵循 [书稿编写规范](../../docs/book-writing-guide.md)；文风优先**深入浅出**。

## 一句话海报

> 助手不该让你当总机。  
> 连续像「同一个人」；高效像「边说边做」；主动像「有事按门铃、没事安静」；持久像「合盖了主线还在」。

## 你读完能带走什么

| 你是谁 | 带走什么 |
|--------|---------|
| 中台 / 平台工程师 | 把助手嵌进多信道研发日，而不是只当单次问答窗 |
| 架构 / Tech Lead | 看清与 Coding Agent、个人助手的差距，以及 Watchdog 差在哪 |
| 已在用 Grok Bot 的同学 | 一张对照表 + 门禁约定，能直接开会 |

## 怎么读（三章地图）

| 章 | 人话主线 | 打开 |
|----|---------|------|
| 第 1 章 | 为什么痛（注意力上限）→ 四特征各一反例/正例 → 侧栏与同一聊天 | [chapters/01-problem-and-four-traits.md](chapters/01-problem-and-four-traits.md) |
| 第 2 章 | 前台接待 / 后台专员 → 门铃与群噪音 → 直通与批处理为何省事 | [chapters/02-router-worker-and-events.md](chapters/02-router-worker-and-events.md) |
| 第 3 章 | 边说边做 → 信道怎么说话 → 三地分离 → 卡住谁来喊停 | [chapters/03-async-persistence-watchdog.md](chapters/03-async-persistence-watchdog.md) |

> **README 是导读海报，不是第 1 章。** 先扫本页，再进章节。

## 原文怎么用

- **原文**：[Super-agent 设计探索：迈向更自主的 Agent 系统](https://mp.weixin.qq.com/s/zoS7GlReWPhfCjENGxXCdg)（DeepSeek Harness 团队，核实日期 2026-11-07）
- **原文声明**：工程思路探讨，**不是**现有产品功能介绍。
- **本书分工**：原文负责「为什么这样拆」；本书负责「Grok Bot 可见行为 + 可执行约定」。实现逻辑一律标成**推测**。

## 贯穿案例（全书固定）

**星帆出海 · open-api-platform 订单域适配**

中台工程师**林舟**（虚构）一天内对接渠道订单、写适配层、跟 PR / CI / 群讨论；用同一 Grok Bot 练「主会话协调 + 后台执行 + Routines + 人确认」。

| 项 | 值 |
|----|-----|
| 公司 / 产品 | 星帆出海 |
| 人物 | 林舟（禁止各章改名） |
| 仓库 / 域 | `open-api-platform` 订单域适配 |
| 接口锚点 | `OrderGateway`；幂等键从 `渠道单号 + 店铺 ID` 演进到 `channel + out_trade_no` |
| 时区 | Asia/Hong_Kong（UTC+8） |
| 助手 | Grok Bot（对照实例） |

## 图片怎么读（改写后的策略）

优先用**达意比喻图与裁切图**，禁止三章反复贴同一张全窗聊天图。

| 文件 | 证明什么 | 主要出现 |
|------|---------|---------|
| `21-four-traits-analogy.jpg` | 四特征是生活感受 | 第 1 章主图 |
| `22-router-analogy.jpg` | 前台接待 / 后台专员 | 第 2 章主图 |
| `23-three-places-analogy.jpg` | 云端 / Bot 计算机 / 本机 | 第 3 章主图 |
| `30-crop-sidebar-only.png` | 多助手边界（连续） | 第 1 章 |
| `31-crop-chat-body.png` | 对话区连续交互 | 第 1 章 |
| `02-router-worker.jpg` | 双层架构示意 | 第 2 章一次 |
| `03-event-compute-split.jpg` | 事件分流示意 | 第 2 章一次 |
| `14-main-chat-clean.png` | 完整窗协调入口 | **全书最多 1 次**（第 1 章） |

不引用互相重复的 `01/04/05/10/11/12` 全窗图凑数。`40-agent-info-routines-panel.png` 在面板实开确认前，**不当 Routines 实图**。

## 五模块（后文展开，这里只认脸）

| 人话 | 文章词 | 哪一章 |
|------|--------|--------|
| 前台接待 + 后台专员 | Router / Worker | 第 2 章 |
| 门铃、过滤、直通 | 事件驱动 | 第 2 章 |
| 边说边做、看信道说话 | 异步多信道 | 第 3 章 |
| 云端 / Bot 计算机 / 本机 | 计算-状态-环境分离 | 第 3 章 |
| 卡住谁来喊停 | Watchdog | 第 3 章 |

## 状态

| 项 | 值 |
|----|-----|
| 状态 | 规划中 / 三章改写稿（浅显版） |
| bookId | `super-agent`（见 `build/books/registry.mjs`） |
| 旧单章 | 原 `01-super-agent-with-grokbot.md` 已拆入三章并删除 |

元数据（书名 / 一句话）以 [`build/books/registry.mjs`](../../build/books/registry.mjs) 为单一来源。

