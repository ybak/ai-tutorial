# 设计:langfuse 书成稿——本地部署实测 + 图文并茂 13 章

日期:2026-11-08
状态:已确认(用户批准;模式沿用 ragflow/fastgpt 两轮,实操前置)

## 背景与目标

`books/langfuse` 现状为规划稿(README 8 章初稿,状态「规划中」)。本次按书架标准成稿:13 章图文并茂,与 ragflow(13 章 31 图)、fastgpt(13 章 15 图)同体例。与两轮前作的关键差异:**先搭建实测、再成稿**(边写边截),所有事实来自真实实例,避免先成稿后实测的版本差异回改。

## 已确认决策

| 决策点 | 结论 |
|--------|------|
| 部署形态 | 本地 Docker 自托管 **v4**(最新稳定 v4.76.0,2026-11-05 发布;实施时锁定具体 tag 并记录核实日期);六容器:web + worker + Postgres + Redis + ClickHouse + MinIO(另有可选 beta 的 ai-gateway,书中如实标注可选) |
| 贯穿案例载体 | Python Demo「售后助手」主线教 SDK + 第 10 章一节 RAGFlow tracing 联动(书架外 `langfuse-local/`,与 ragflow-local/fastgpt-local 并列,不进书架仓库) |
| 章节规模 | 13 章 4 篇(对齐书架体例,每章正文 ≥500 行,见 book-writing-guide.md) |
| 实施节奏 | 先搭建实测(Deploy→Demo→联动)再逐章成稿,边写边截 |
| LLM 通道 | 智谱 OpenAI 兼容接口 `https://open.bigmodel.cn/api/paas/v4` + glm-5.3-flash(沿用前两轮 Key,凭据入 langfuse-local/DEPLOY.md,严禁入书架仓库) |
| 截图管线 | shot/ Playwright 管线复用,含 Key 脱敏;截图落 `books/langfuse/assets/images/` |

## 书定位与贯穿案例

- 定位:LLM 可观测与评估平台实战。三角色:测试(评估体系)、运维(可观测/成本)、运营(Prompt 运营)
- 贯穿案例「**售后客服可观测底座**」:延续跨境电商售后域。Demo 应用链路:用户 query → 检索 span → Prompt 模板(Langfuse 管理)→ LLM generation(glm-5.3-flash)→ 回答 → 评分
- 案例随章节成长:第 3 章首条 trace → 第 4 章链路细化与 session 串联 → 第 6 章 Prompt 入管 → 第 7-9 章评估数据集与实验 → 第 12 章回归门禁 → 第 13 章红队数据集
- 书架联动:第 10 章把 ragflow-local 实例(与 ragflow 书同款部署、`after-sales-kb`)的 tracing 指向同一 Langfuse,兑现 ragflow 书「售后助手 tracing 进入可观测平台(→ langfuse 书)」交叉引用
- 案例命名全书一致:项目 `after-sales`,应用/助手「售后助手」,数据集 `after-sales-qa`,禁止各章自造

## 13 章规划(4 篇)

| 篇 | 章 | 文件 | 内容一句话 | 分量 |
|----|-----|------|-----------|------|
| 一、认知与搭建 | 1 初识 Langfuse | 01-overview.md | LLM 可观测全景、与 APM/日志的区别、四大能力面(Trace/Prompt/评估/指标)、开源 vs 企业版边界、与书架各书关系 | 薄 |
| | 2 本地部署 | 02-deploy.md | Docker Compose 六容器架构与启动、初始化(注册管理员/组织/项目)、升级与数据持久化、排障 | 中 |
| | 3 快速开始 | 03-quickstart.md | Python SDK 接入、API Key、首条 trace、observe 装饰器与 start_as_current_span、Debug 模式 | 中 |
| 二、追踪与监控 | 4 Trace 模型与链路追踪 | 04-tracing.md | trace/observation/span/generation/event 层级、session 串联多轮、metadata/levels、采集规范、过滤与保存视图 | 重 |
| | 5 成本与性能监控 | 05-cost-metrics.md | 模型价格配置、成本核算、Dashboards 与 metrics API、延迟分析、webhook 告警 | 中 |
| 三、Prompt 与评估 | 6 Prompt 管理 | 06-prompt-mgmt.md | 版本管理、label 与发布(production/staging)、变量编译、Playground、SDK 拉取与本地缓存、与 trace 关联 | 重 |
| | 7 数据集与评分 | 07-datasets-scores.md | 评估数据集建设、score 三来源(在线/人工标注/LLM-as-judge)、annotation queue 标注队列 | 重 |
| | 8 实验与 A/B | 08-experiments.md | 数据集实验(dataset runs)、run 对比、Prompt label 流量切分 A/B、版本切换 | 中 |
| | 9 自动化评估 | 09-evals.md | LLM-as-judge eval 模板配置、线上持续评估、幻觉检测入门 | 中 |
| 四、生产与质量工程 | 10 接入已有系统 | 10-integrations.md | RAGFlow tracing 联动(主线实操)、OpenAI SDK wrapper 自动埋点、主流框架集成清单、OTel 桥接 | 中 |
| | 11 多项目与团队管理 | 11-org-admin.md | 组织/项目/环境隔离、成员与角色(自托管版边界如实标注)、API Key 治理 | 薄 |
| | 12 Prompt 回归与质量门禁 | 12-regression.md | 以数据集+实验构建回归体系、幻觉检测实操、CI 集成思路 | 重 |
| | 13 红队与安全评估 | 13-redteam.md | 对抗数据集、越狱/注入测试用例设计、安全评分体系、badcase 运营闭环 | 中 |

对照 README 初稿 8 章的调整:部署独立成章(2);原「成本与性能监控」保留(5);原「数据集与评分」拆 7/8/9;新增 10 承接书架联动;原「LLM 质量工程」拆 12/13。README 同步改写为成稿体例(章节表、素材源与版本基线、贯穿案例、术语约定、交叉引用)。

## 实操环境(langfuse-local,书架外)

```
D:\work\code\book\langfuse-local\
├── docker-compose.yml        # 官方 v4 compose(web/worker/postgres/redis/clickhouse/minio)
├── .env                      # 密钥(NEXTAUTH_SECRET 等),不入库
├── DEPLOY.md                 # 部署记录+凭据(管理员账号/智谱 Key),不入库
├── demo/                     # Python Demo「售后助手」
│   ├── support_bot.py        # 主链路:检索→prompt→LLM→回答
│   ├── eval_runs.py          # 数据集实验脚本(第 8 章)
│   └── requirements.txt
└── shot/                     # Playwright 截图管线(复用 ragflow 轮,含脱敏)
```

- 书稿内嵌核心代码段(截取 demo 关键部分),demo 完整文件留实操区
- 端口 3000 占用则顺延,DEPLOY.md 如实记录

## 截图规划(≈28 张,引导句→图→解读三段式)

| 章 | 张数 | 内容 |
|----|------|------|
| 2 部署 | 5 | 容器栈运行态;首访注册;组织/项目创建;项目内首屏;*(视界面)升级或排障相关 |
| 3 快速开始 | 3 | API Key 创建;首条 trace 落库;trace 详情 |
| 4 链路 | 4 | trace 树展开(span/generation 层级);session 视图;过滤条件;保存视图 |
| 5 监控 | 3 | Dashboards;成本视图;延迟视图 |
| 6 Prompt | 4 | Prompt 列表;版本对比;Playground;label 流量配置 |
| 7 数据集 | 3 | 数据集与 items;run 结果;annotation queue |
| 8 实验 | 2 | 实验对比表;A/B label 配置 |
| 9 评估 | 2 | eval 模板配置;judge 执行结果 |
| 10 联动 | 2 | RAGFlow tracing 配置;RAGFlow trace 出现在 Langfuse |
| 11 管理 | 2 | 组织/项目设置;成员管理 |
| 12-13 | 3 | 回归实验结果;幻觉 judge 输出;红队数据集结果 |

界面与清单有出入时以实际为准(±2 张),如实记录;受阻项如实留缺并挂账。

## 实施阶段

1. **搭建实测**:langfuse-local 部署栈起来 → 管理员初始化 → demo 全链路跑通(trace/prompt/dataset/experiment)→ RAGFlow 联动验证 → 素材库就绪
2. **成稿**:13 章逐章边写边截(写哪章截哪章),章骨架按 book-writing-guide.md 全项执行(导读/章首 mermaid 图/你什么时候需要它/概述/主体/小结/验收清单/延伸阅读,全角标点,术语中英对照)
3. **收尾**:README 成稿化、`npm test` + `npm run site` 全绿、交叉引用不断链、commit + push(沿用用户「更新后 push」授权)

并行策略:成稿期可 ≤3 并发子代理分章起草(共享「全书约定」文档保证一致性),主会话汇审;截图与部署串行。

## 风险

- ClickHouse 等大镜像拉取耗时(4-8GB 级)与 Docker Desktop 磁盘余量
- v4 迭代极快(日更 1-2 版):书内基线锁定部署当日 latest,界面与文档差异如实标注
- evals/annotation 等功能在 self-host 的功能边界(EE license 项)需逐项核实,如实标注
- ragflow-local 实例若未在运行,第 10 章联动需先起 ragflow 栈
- Playwright 自动化对新 UI 的探索成本(登录/弹窗/表单),受阻项留缺挂账

## 验收

- 13 章 ≥500 行/章,骨架齐全,全角标点,贯穿案例命名一致
- 截图全部来自本机真实实例,无 Key 泄露(脱敏规则核验)
- `npm test` + `npm run site` 全绿;站点图片渲染抽查
- README 状态行更新为成稿+实测配图说明;复核清单勾销实测项
