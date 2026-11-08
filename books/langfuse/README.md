# Langfuse:LLM 可观测与评估

> 状态:**成稿(2026-11-08)——13 章 7033 行全部完成,基于官方文档(v4.76.0 + Python SDK 5.2.0,核实日期 2026-11-08)与本机 Docker 自托管实例实测撰写;实操前置(部署栈 → 管理员初始化 → Demo 全链路 → Prompt/数据集/实验/成本 → RAGFlow 联动)先于成稿完成,全部界面事实来自真实实例;实测截图 30 张按「引导句→图→解读」三段式插入各章(assets/images/);实测与文档差异如实标注(SDK v5 旧 API 投影不全/legacy UI 列表空态/label 与双花括号两个 demo 修复/tenant_model 位掩码 1=chat 2=embedding);兼容性实测实锤:RAGFlow rc2(v2 单事件上报)× Langfuse v4(旧端点已移除)不兼容,dual 迁移模式只救活 v3 batch——ragflow 书 12.3 行为表需按此回改标注。未实测项(端到端告警/annotation queue 全流程/CI workflow/OTel 桥接)已在各章复核清单如实挂账。**

## 定位

LLM 应用的追踪、评估与 Prompt 管理。本书以 Langfuse 为抓手,覆盖 trace 与成本监控、评估数据集与评分、Prompt 版本管理与 A/B 实验——测试、运维、运营三个角色共用一本手册;并补充 LLM 质量工程专题(Prompt 回归、幻觉检测、红队)。

## 目标读者

- 测试工程师:搭建评估数据集与评分体系,做 Prompt 回归与质量工程
- 运维工程师:trace 采集、成本监控与线上质量看板
- 运营人员:Prompt 版本管理、A/B 实验与 badcase 运营

## 素材源与版本基线

- 素材源:[langfuse/langfuse](https://github.com/langfuse/langfuse) 官方文档(langfuse.com/docs)与自托管指南
- 版本基线:**Langfuse v4.76.0(2026-11-05 发布)+ Python SDK 5.2.0**,核实日期 2026-11-08
- 每章 frontmatter `source` 与构建配置 `sources` 字段记录对应官方文档路径,供溯源与未来 `--check`
- 实操基准:本机 Docker 自托管六容器栈(web/worker/clickhouse/minio/redis/postgres),贯穿案例全部事实来自该真实实例

## 贯穿案例

**售后客服可观测底座**:延续书架跨境电商售后域。Python Demo 应用「售后助手」(关键词检索 → Langfuse 托管 Prompt → 智谱 glm-5.3-flash → 回答 → 评分)经 Langfuse Python SDK 埋点,随章节成长:第 3 章首条 trace → 第 4 章 session 串联 → 第 6 章 Prompt 入管 → 第 7-9 章评估数据集 `after-sales-qa` 与实验 → 第 12 章回归门禁 → 第 13 章红队数据集。第 10 章把 ragflow 书的「售后助手」(RAGFlow 实例)tracing 指向同一 Langfuse——**并如实记录 rc2 与 v4 的兼容性实测结论**(项目名 `after-sales`、Prompt `after-sales-answer`、数据集 `after-sales-qa` 全书一致,禁止各章自造)。

## 术语约定

- **trace(追踪)**:一次请求的完整链路;**observation(观测)**:链路上的节点,分 span(跨段)/generation(生成)/event(事件)三类
- **experiment(实验)**:v4 对「数据集跑测一轮(dataset run)」的 UI 称谓,本书沿用 UI 术语
- **prompt label(Prompt 标签)**:production/staging/experimental 三档发布位;**playground(调试场)**
- **v4 迁移写模式**:events_only(默认)/dual/legacy,第 10 章联动实测涉及

## 章节规划(13 章 4 篇)

| 章节 | 内容一句话 | 分量 |
|------|-----------|------|
| [第 1 章 初识 Langfuse](chapters/01-overview.md) | LLM 可观测全景、四大能力面、开源 vs 企业版边界 | 薄 |
| [第 2 章 本地部署](chapters/02-deploy.md) | Docker Compose 六容器、初始化、升级与排障实录 | 中 |
| [第 3 章 快速开始](chapters/03-quickstart.md) | Python SDK 接入、首条 trace、两种埋点风格 | 中 |
| [第 4 章 Trace 模型与链路追踪](chapters/04-tracing.md) | 数据模型层级、session 串联、采集规范、过滤视图 | 重 |
| [第 5 章 成本与性能监控](chapters/05-cost-metrics.md) | 模型价格、成本核算、看板、延迟分析与告警 | 中 |
| [第 6 章 Prompt 管理](chapters/06-prompt-mgmt.md) | 版本与 label、变量编译、Playground、trace 关联 | 重 |
| [第 7 章 数据集与评分](chapters/07-datasets-scores.md) | 数据集建设、score 三来源、标注队列 | 重 |
| [第 8 章 实验与 A/B](chapters/08-experiments.md) | 数据集实验、run 对比、Prompt A/B 流量切分 | 中 |
| [第 9 章 自动化评估](chapters/09-evals.md) | LLM-as-judge、持续评估、幻觉检测入门 | 中 |
| [第 10 章 接入已有系统](chapters/10-integrations.md) | RAGFlow 联动实测(含兼容性)、OpenAI wrapper、集成清单 | 中 |
| [第 11 章 多项目与团队管理](chapters/11-org-admin.md) | 组织/项目/环境隔离、成员角色、EE 边界 | 薄 |
| [第 12 章 Prompt 回归与质量门禁](chapters/12-regression.md) | 回归三件套、门禁脚本、CI 集成思路 | 重 |
| [第 13 章 红队与安全评估](chapters/13-redteam.md) | 对抗数据集、安全评分、badcase 运营闭环 | 中 |

> 初稿 8 章规划(README 规划稿)按实测素材面细化为 13 章:部署独立成章,原「数据集与评分」拆为 7/8/9 三章,新增第 10 章承接书架联动,原「LLM 质量工程」拆为 12/13 两章。

## 与其他书的交叉引用

- **ragflow 书**:ragflow 书 12.3 预留「售后助手 tracing 进 Langfuse」的交叉引用,本书第 10 章实测对接并给出版本兼容性结论(需回改 ragflow 书 12.3 标注)
- **fastgpt 书**:同为本地部署实测路线;对话运营与评测(其第 13 章)可与本书 7-9 章互参
- **mcp 书**:Agent 的工具调用链路 trace 采集(第 4 章)与中台售后域视角互见

---

元数据(bookId / title / tagline)以 `build/books/registry.mjs` 为准。
