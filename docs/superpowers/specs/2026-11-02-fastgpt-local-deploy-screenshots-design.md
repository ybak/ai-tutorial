# 设计:本地部署 FastGPT + 实测截图补充进书

日期:2026-11-02
状态:已确认(用户批准)

## 背景与目标

fastgpt 书 13 章为纯文档对照成稿,无界面截图,阅读偏枯燥。参照 agentscope-java/copilotkit 书「跑通 demo 并实测截图」先例,本机部署 FastGPT 社区版,按贯穿案例真实铺设数据与应用,截图 ≈12-15 张铺进主线章,并把对应「未实测」挂账勾销。

用户已确认:模型通道用本地 Claude Code 同款网关(智谱 BigModel,OpenAI 兼容端点 `https://open.bigmodel.cn/api/paas/v4`,chat `glm-5.3-flash` + embedding `embedding-3`,同一把 Key,探测均已通过);截图范围主线章铺开 ≈12-15 图。

## 1. 部署(本机 Docker)

- 官方社区版 Docker Compose,pgvector 轻量组合(FastGPT + MongoDB 副本集 + Postgres/pgvector),compose 取自 labring/FastGPT 官方 `deploy/docker/`
- 落在仓库外 `D:\work\code\book\fastgpt-local\`(compose + `.env`;`.env` 含模型 Key,不进任何仓库)
- 端口 3000(占用则 3100);镜像走官方 compose 默认源
- 模型渠道:启动后在「模型渠道」加 OpenAI 兼容渠道(上述 baseURL),挂 `glm-5.3-flash`(LLM)+ `embedding-3`(向量);首登强制激活改密
- Docker Desktop 当前未启动,实施第一步启动

## 2. 数据铺设(对齐贯穿案例)

- 知识库 `after-sales-kb` + 三类小样本文档(《售后政策手册》PDF / 《商品 FAQ》XLSX(列 Title/Content/Category/Year)/ 《物流时效公告》HTML),形态一致、体量缩小
- 应用:简易配置版 + 工作流版「售后客服」(问题分类 → 知识库搜索 → AI 对话 → 指定回复 + HTTP 查工单节点)
- HTTP 工单接口:本地 node mock 服务返回固定工单 JSON,保证查工单分支真实可跑

## 3. 截图管线

- Playwright(chromium)脚本化:登录 → 铺数据 → 按清单导航截图;含 Key/token 的页面先 DOM 覆写脱敏再截
- 产物:`books/fastgpt/assets/images/`(语义化文件名);按规范插入:散文引导句 → 图 → 1-2 句解读(agentscope 书先例同款)

## 4. 截图清单(≈15 张)

| 章 | 张数 | 内容 |
|----|------|------|
| 2 部署 | 2 | 首登激活改密;模型渠道配置(Key 脱敏) |
| 3 知识库 | 3 | 创建 after-sales-kb(索引模型 embedding-3);文档导入后列表;Chunk 管理页 |
| 4 检索 | 1 | 搜索测试真实查询 |
| 6 应用 | 1 | 简易配置版「售后客服」 |
| 7 工作流 | 3 | 画布全景;HTTP 工单节点配置;调试预览真实对话 |
| 8 工具 | 1 | 工具/插件页 |
| 9 发布 | 2 | 免登录分享链接配置;iframe 嵌入(钉钉为商业版,社区版截不了,该章钉钉叙述保持文档态+挂账不变) |
| 10 OpenAPI | 1 | API Key 管理页(Key 脱敏) |
| 13 运营 | 1 | 对话记录/运行详情页 |

实际可得界面与清单有出入时:以实际界面为准微调(多于/少于 1-2 张可接受),如实记录。

## 5. 书稿更新与验收

- 各章插图 + 实测标注;对应复核清单项勾销(「已实测(2026-11-02,社区版 v4.17.3 本地部署)」);README 状态行与形态欠账说明同步
- 验收:`npm test` + `npm run site` 复绿;抽查图片站点渲染;全部截图无 Key 泄露
- commit:截图资产 + 书稿更新;push 延续用户「更新后 push」授权

## 风险与对策

Docker Desktop 未启动(第一步启动)/ 镜像拉取走官方默认源 / Playwright chromium 一次性下载约 120MB / 工作流 HTTP 分支靠本地 mock 保真 / 单张截图失败不阻塞整体、复核清单如实记录 / 机器 31.3GB RAM 充足
