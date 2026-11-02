# fastgpt 本地部署实测截图补充进书 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans(本计划为有状态本机操作,主会话内联执行;仅 Task 7 书稿更新可派子代理)。Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 本机部署 FastGPT v4.17.3 社区版,按贯穿案例铺设真实数据与应用,Playwright 脱敏截图 ≈15 张铺进主线章,勾销对应未实测挂账。

**Architecture:** 仓库外 `D:\work\code\book\fastgpt-local\` 承载部署与工具(compose 渲染脚本、样本、mock、截图脚本、`.env`);仓库内只新增 `books/fastgpt/assets/images/` 截图与章节正文更新。模型走智谱 BigModel OpenAI 兼容端点(glm-5.3-flash + embedding-3,同一把本地 Claude Code Key)。

**Tech Stack:** Docker Compose(v4.17.3 官方模板渲染)、Node 22(fetch/playwright)、Edge headless(样本 PDF)、Playwright chromium(截图)。

## Global Constraints

- 模型端点:`https://open.bigmodel.cn/api/paas/v4`;chat `glm-5.3-flash`;embedding `embedding-3`;Key 取自 `~/.claude/settings.json` 的 `ANTHROPIC_AUTH_TOKEN`(只写 fastgpt-local/.env,不进任何 git 仓库)
- 所有截图不得含 Key/token 明文:截取含密钥字段的页面前,用 Playwright `page.evaluate` 把对应输入框值覆写为 `******`
- 部署根目录:`D:\work\code\book\fastgpt-local\`(仓库外);FastGPT 端口 3000(占用则全链路改 3100)
- 穿插对象名遵守书稿贯穿案例:知识库 `after-sales-kb`、应用「售后客服」、文档 `after-sales-policy.pdf` / `product-faq.xlsx` / `shipping-notice.html`
- 样本文件形态一致、体量缩小(PDF 3-5 页、XLSX 20 行、HTML 一页)
- 书稿插图格式:散文引导句 → 图 → 1-2 句解读;图片路径 `../assets/images/<语义化文件名>.png`
- 钉钉渠道为商业版功能,社区版不截图;第 9 章钉钉叙述保持文档态+挂账不变
- 验收:`cd build && npm test` 与 `npm run site` 全绿;截图无密钥泄露

---

### Task 1: 部署栈搭建与启动

**Files:**
- Create: `D:\work\code\book\fastgpt-local\render-compose.mjs`(模板渲染)
- Create: `D:\work\code\book\fastgpt-local\docker-compose.yml`(渲染产物)
- Create: `D:\work\code\book\fastgpt-local\.env`(模型 Key 等)

- [ ] **Step 1: 启动 Docker Desktop 并等 daemon 就绪**

```powershell
powershell -NoProfile -Command "Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'"
# 轮询直到成功(最长 180s):
docker info --format '{{.ServerVersion}}'
```
Expected: 输出 server version。失败排查:WSL2 未初始化则 `wsl --install --no-distribution` 后重启(此时 STOP 并报告用户)。

- [ ] **Step 2: 下载官方模板与参数,渲染 compose**

`render-compose.mjs`(完整脚本):
```js
import fs from 'node:fs';
const get = async (u) => (await fetch(u)).text();
const args = JSON.parse(await get('https://raw.githubusercontent.com/labring/FastGPT/main/deploy/version/main/args.json'));
let tpl = await get('https://raw.githubusercontent.com/labring/FastGPT/main/deploy/version/main/docker-compose.template.yml');
const pg = await get('https://raw.githubusercontent.com/labring/FastGPT/main/deploy/templates/vector/pg.txt');
// 在 services 段尾插入 pg 向量库服务(置于 fastgpt-aiproxy-pg 服务之后;以 networks: 锚点前插入)
tpl = tpl.replace(/\nnetworks:\n/, () => '\n' + pg.trimEnd().split('\n').map(l => l).join('\n') + '\n\nnetworks:\n');
// 渲染 ${{name.image}} / ${{name.tag}} 为 cn registry
tpl = tpl.replace(/\$\{{([\w-]+)\.(image|tag)\}\}/g, (_, n, k) => k === 'image' ? args.images.cn[n] : args.tags[n]);
fs.writeFileSync('docker-compose.yml', tpl);
console.log('rendered', fs.readFileSync('docker-compose.yml','utf8').split('\n').length, 'lines');
```
Run: `cd /d/work/code/book/fastgpt-local && node render-compose.mjs`
Expected: 560+ 行;`docker compose config --quiet` 无报错(校验 YAML 合法;若 pg 片段缩进不匹配则手工对齐为两空格层级)。

- [ ] **Step 3: 写 .env 与启动**

`.env` 仅在 compose 未内联时需要;若模板用字面量密码则跳过。启动:
```bash
docker compose up -d
# 轮询健康(最长 10 分钟):
docker compose ps
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/   # 200/307 即就绪
```
Expected: 全部服务 Up(fastgpt-app、fastgpt-plugin、fastgpt-aiproxy、mongo、pg、redis、rustfs、sandbox 系);首页可访问。镜像拉取失败则重试 `docker compose pull`。

- [ ] **Step 4: 记录部署事实到 fastgpt-local/DEPLOY.md**(版本 tag、端口、root 初始密码 123456、改密后的新密码——新密码本地保存)

### Task 2: 初始化与模型渠道

- [ ] **Step 1: 首登激活**——浏览器或 Playwright 打开 `http://localhost:3000/accounts/login`,root / 123456,按强制流程设置新密码(记入 DEPLOY.md)
- [ ] **Step 2: 加模型渠道**——「账号 → 模型渠道」(v4.17 渠道管理入口以实际 UI 为准)新增 OpenAI 兼容渠道:BaseURL `https://open.bigmodel.cn/api/paas/v4`,Key 同 `.env`,模型勾选/填入 `glm-5.3-flash`(LLM)与 `embedding-3`(向量);点「测试」
- [ ] **Step 3: 冒烟验证**——任一对话入口向 glm-5.3-flash 发「你好」得真实回复;知识库索引模型下拉可见 embedding-3
- 若渠道只能在 env 层配置(4.17 aiproxy 体系),按实际 UI/文档路径走,把过程截图素材价值记入 Task 6 清单

### Task 3: 样本文件与 mock 工单服务

**Files(全在 fastgpt-local/samples/ 与 mock/):**
- Create: `samples/make-samples.mjs`(生成三件样本)
- Create: `samples/after-sales-policy.html` → 打印为 `after-sales-policy.pdf`
- Create: `samples/product-faq.xlsx`(经 node xlsx 包)
- Create: `samples/shipping-notice.html`
- Create: `mock/ticket-server.mjs`

- [ ] **Step 1: 生成样本**——`npm i xlsx`(fastgpt-local 下);`make-samples.mjs` 产出:政策手册 HTML(4 节:退货/换货/维修/赔偿,各含小表格)→ `"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --headless --print-to-pdf=after-sales-policy.pdf file:///.../after-sales-policy.html`;FAQ XLSX 20 行(列 Title/Content/Category/Year,售后主题);物流公告 HTML 一页
- [ ] **Step 2: mock 工单服务**——`ticket-server.mjs`:
```js
import http from 'node:http';
http.createServer((req, res) => {
  const phone = new URL(req.url, 'x').searchParams.get('phone');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ code: 200, data: {
    tickets: [{ id: 'TK-20261', phone, type: '运输破损', status: '处理中', createdAt: '2026-11-01', solution: '已安排补发,运费我方承担' }],
    count: 1 } }));
}).listen(4599, () => console.log('ticket mock on 4599'));
```
Run: `node mock/ticket-server.mjs &`(后台);`curl "http://localhost:4599/api/after-sale/tickets?phone=13800000000"` 返回 JSON 即通

### Task 4: 知识库铺设与检索验证

- [ ] **Step 1: 建库**——UI 新建知识库 `after-sales-kb`,索引模型 embedding-3(截图素材)
- [ ] **Step 2: 导入三件样本**——PDF 走 QA 拆分或通用解析;XLSX 直接导入;HTML 文本导入;等训练状态「已就绪」
- [ ] **Step 3: 检索验证**——搜索测试查询「运输破损怎么赔偿」,命中 FAQ/政策片段即通(截图素材)

### Task 5: 应用铺设与真实运行

- [ ] **Step 1: 简易配置版「售后客服」**——新建应用(简易配置),提示词按书中案例口径,绑定 after-sales-kb,调试对话验证(截图素材)
- [ ] **Step 2: 工作流版**——复制/新建工作流应用:问题分类 → 知识库搜索 → AI 对话 → 指定回复(拒答/兜底/工单答复)+ HTTP 节点(GET `http://host.docker.internal:4599/api/after-sale/tickets?phone={{phone}}`,容器内经 host.docker.internal 访问宿主 mock);画布连线完成后调试:问「我手机 13800000000 的工单怎么样了」走通查工单分支
- [ ] **Step 3: 应用发布**——免登录分享链接开启、iframe 嵌入码查看;API Key 创建(账号 → API 密钥)

### Task 6: Playwright 截图管线与 15 张截图

**Files:**
- Create: `fastgpt-local/shot/package.json` + `shot.mjs`

- [ ] **Step 1: 安装**——`cd shot && npm i playwright && npx playwright install chromium`
- [ ] **Step 2: 截图脚本**——`shot.mjs` 骨架:登录(读 DEPLOY.md 密码)→ 复用 storageState;每张图一个 async 步骤:`await page.goto(url); await page.waitForSelector(...); await page.evaluate(脱敏); await page.screenshot({ path: '../../ai-tutorial/books/fastgpt/assets/images/<名>.png', fullPage: false })`。脱敏函数:`document.querySelectorAll('input[type=password],input[name*=key i],input[name*=token i]').forEach(el => el.value = '******')`
- [ ] **Step 3: 按清单截 15 张**(清单见 spec §4:deploy-login/deploy-channel/dataset-create/dataset-files/dataset-chunks/dataset-search(4 章)/app-simple/workflow-canvas/workflow-http/workflow-debug/tools/publish-link/publish-embed/openapi-keys/chat-ops;文件名即前述语义名,前缀 `shot-`)
- [ ] **Step 4: 复核**——逐张 Read 检查:内容对题、无 Key 明文、分辨率 ≥1280 宽;不合格重截

### Task 7: 书稿更新(可派子代理)

**Files:**
- Modify: `books/fastgpt/chapters/02/03/04/06/07/08/09/10/13-*.md`(9 章)
- Modify: `books/fastgpt/README.md`(状态行、欠账说明)

- [ ] 按先例格式插图:图前一句散文引导(指明这是本地 v4.17.3 社区版实测),图后 1-2 句解读;图片引用 `../assets/images/shot-*.png`
- [ ] 对应复核清单项勾销改「已实测(2026-11-02,社区版 v4.17.3 本地部署,glm-5.3-flash + embedding-3)」;未覆盖项保留挂账
- [ ] README 状态行补「关键界面与链路已本地实测并配图(2026-11-02)」;⚠️ 欠账行改写为「余下未实测项见各章复核清单」

### Task 8: 验证与提交

- [ ] `cd build && npm test` 全绿;`node fetch-images.mjs --book fastgpt` 幂等零改写;`npm run site` 绿且 fastgpt 章节页图片渲染抽查 3 张
- [ ] commit(assets + 章节 + README 一个 commit,文案仿 agentscope 截图先例);push(沿用用户「更新后 push」授权)
