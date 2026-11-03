# 设计:RAGFlow 本地部署 + 实测截图补充进书

日期:2026-11-03
状态:已确认(用户批准;模式沿用 2026-11-02 fastgpt 同款方案)

## 背景与目标

ragflow 书(13 章,v1.0.0-rc2 基线)为纯文档对照成稿,无界面截图。按 fastgpt 轮同款模式:本地部署 RAGFlow、按贯穿案例铺设真实数据、截图 ≈10 张插入对应章节、勾销实测挂账。

## 与 fastgpt 轮的差异点

- 部署:官方 `docker/` 目录 sparse-checkout 到 `D:\work\code\book\ragflow-local\`;镜像 `infiniflow/ragflow:v1.0.0-rc2`(书基线);profile cpu;引擎默认 Elasticsearch(MEM_LIMIT 8GB);服务栈 es01/mysql/minio/redis/kvrocks/ragflow
- 端口:Web 80(占用则 8080)/API 9380;`.env` 需设 COMPOSE_PROFILES=cpu
- 账号:RAGFlow 无强制管理员流程,UI 注册本地账号(凭据入 ragflow-local/DEPLOY.md)
- 模型:模型提供商 → OpenAI-API-Compatible(智谱 `https://open.bigmodel.cn/api/paas/v4` + 同 Key)→ glm-5.3-flash(LLM)+ embedding-3(向量,设为系统默认向量模型——建库前置)
- 数据:复用 fastgpt-local/samples 三件样本,数据集 `after-sales-kb`,解析完成
- Playwright 管线与脱敏规则沿用(shot/ 目录复用)

## 截图清单(≈10 张)

| 章 | 张数 | 内容 |
|----|------|------|
| 2 部署与模型通道 | 2 | 注册/登录页;模型提供商配置(glm-5.3-flash + embedding-3) |
| 3 数据集 | 2 | 创建数据集(索引模型 embedding-3);文件列表(解析完成) |
| 4 解析与切片 | 1 | Chunk 列表(分块结果) |
| 7 检索测试 | 1 | 检索测试真实查询与得分 |
| 8 聊天助手 | 2 | 助手配置;调试对话 |
| 10 Agent 与工作流 | 1 | Agent 画布(模板,自动化受阻则如实留缺) |
| 11 API | 1 | API 密钥(Key 脱敏) |

实际界面与清单有出入时以实际为准(±1-2 张),如实记录。

## 书稿更新与验收

- ragflow 对应章节插图(引导句→图→解读)、复核清单勾销实测项、README 状态行追加实测配图说明
- 未完成项如实挂账(如 Agent 画布自动化受阻、团队/运维章无界面素材)
- 验收:`npm test` + `npm run site` 全绿;无 Key 泄露;站点图片渲染抽查
- commit + push(沿用用户「更新后 push」授权)

## 风险

ES 启动与镜像拉取耗时(约 4-8GB 下载)/ UI 自动化探索成本(RAGFlow 界面与 FastGPT 不同,逐页探测)/ Agent 画布自动化受阻则留缺 / 完成后本地栈保留运行(用户可 docker compose down)
