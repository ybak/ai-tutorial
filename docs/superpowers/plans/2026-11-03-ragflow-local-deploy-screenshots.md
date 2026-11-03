# ragflow 本地部署实测截图补充进书 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans(有状态本机操作,内联执行;仅书稿更新任务派子代理)。

**Goal:** 本机部署 RAGFlow v1.0.0-rc2,铺设售后域数据,截图 ≈10 张插入 ragflow 书对应章节并勾销实测挂账。

**Architecture:** 部署与工具在 `D:\work\code\book\ragflow-local\`(sparse-checkout 官方 docker 目录);仓库内只新增 `books/ragflow/assets/images/` 截图与章节更新。模型与数据沿用 fastgpt 轮既定方案(智谱网关 + 三件样本)。

**Tech Stack:** Docker Compose(官方 docker 目录,ES 引擎)、Node 22 + Playwright(截图)、Edge headless(已有)。

## Global Constraints

- 版本基线:RAGFlow **v1.0.0-rc2**(书基线一致);COMPOSE_PROFILES=cpu
- 模型端点 `https://open.bigmodel.cn/api/paas/v4`;glm-5.3-flash(LLM)+ embedding-3(向量,设系统默认)
- 所有截图 Key/token 脱敏后再截
- 贯穿案例对象:`after-sales-kb`、三类样本文件(复用 fastgpt-local/samples)
- 插图格式:引导句→图→1-2 句解读;路径 `../assets/images/shot-*.png`
- 验收:`npm test` + `npm run site` 全绿;无密钥泄露;commit + push(沿用授权)

---

### Task 1: 部署栈

- [ ] sparse-checkout 官方 docker 目录到 ragflow-local/:
  ```bash
  git clone --depth 1 --branch v1.0.0-rc2 --filter=blob:none --sparse https://github.com/infiniflow/ragflow /d/work/code/book/ragflow-repo
  cd /d/work/code/book/ragflow-repo && git sparse-checkout set docker
  cp -r docker /d/work/code/book/ragflow-local && cd /d/work/code/book/ragflow-local
  ```
- [ ] `.env` 设 `COMPOSE_PROFILES=cpu`(追加/修改);确认 `RAGFLOW_IMAGE=infiniflow/ragflow:v1.0.0-rc2`
- [ ] `docker compose up -d`(拉镜像约 4-8GB,轮询 ragflow 容器健康与 Web 80 可达,最长 15 分钟;Web 80 被占则改 SVR_WEB_HTTP_PORT=8080 全链路)
- [ ] `ragflow-local/DEPLOY.md` 记录:版本、端口、账号(注册后补)、模型渠道

### Task 2: 注册与模型配置

- [ ] Playwright(`--no-proxy-server`)打开 Web,注册本地账号(记入 DEPLOY.md),登录态存 storage.json
- [ ] 设置 → 模型提供商 → 添加 OpenAI-API-Compatible:BaseURL 智谱端点 + Key(读 fastgpt-local/.env)→ 添加 glm-5.3-flash(LLM)与 embedding-3(向量)→ 系统模型设置里把 embedding-3 设为默认向量模型
- [ ] 验证:对话或建库下拉可见 glm-5.3-flash / embedding-3
- [ ] 截图:shot-rf-login(注册/登录页)、shot-rf-model-provider(模型提供商配置,Key 脱敏)

### Task 3: 数据集铺设与检索测试

- [ ] 新建数据集 `after-sales-kb`(向量模型 embedding-3)→ 上传三件样本 → 点解析 → 等解析完成(轮询)
- [ ] 截图:shot-rf-dataset-create、shot-rf-dataset-files(已解析)、shot-rf-chunks(切片列表)
- [ ] 检索测试:真实查询「运输破损怎么赔偿」→ 得分结果 → shot-rf-retrieval-test

### Task 4: 聊天助手与 Agent 画布、API 密钥

- [ ] 新建聊天助手(绑定 after-sales-kb,提示词对齐案例口径)→ 调试对话真实问答 → shot-rf-chat-config、shot-rf-chat-debug
- [ ] Agent 页:用模板建 Agent → 画布截图 shot-rf-agent-canvas(自动化受阻则留缺并记录)
- [ ] API 密钥页:创建密钥 → 脱敏 → shot-rf-api-keys

### Task 5: 书稿更新(派子代理)

- [ ] 10 张图按章节锚点插入(02×2、03×2、04×1、07×1、08×2、10×1、11×1),格式「引导句→图→解读」;实测标注与复核清单勾销(未完成项如实保留:如 Agent 画布受阻、检索调优参数类未覆盖)
- [ ] ragflow README 状态行追加实测配图说明

### Task 6: 构建验证与提交

- [ ] `npm test` + `npm run site` 全绿;站点章节页图片渲染抽查;无 Key 泄露复核
- [ ] commit(assets + 章节 + README)+ push(沿用授权)
