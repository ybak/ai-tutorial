# langfuse 书成稿实施计划(搭建实测 → 13 章边写边截 → 收尾)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `books/langfuse` 从规划稿写成 13 章图文并茂成书,全部界面截图来自本机 Docker 自托管 Langfuse v4 真实实例。

**Architecture:** 先在书架外 `D:\work\code\book\langfuse-local\` 搭部署栈 + Python Demo 跑通贯穿案例全链路,产出真实数据与截图素材;再逐章成稿(边写边截),最后全书统检与收尾。设计见 `docs/superpowers/specs/2026-11-08-langfuse-book-design.md`。

**Tech Stack:** Docker Compose(Langfuse v4 六容器)、Python(langfuse SDK + openai SDK)、Node/Playwright(截图管线,复用 ragflow-local/shot)、书架构建(npm test / npm run site)。

## Global Constraints

- 版本基线:**Langfuse v4**(部署当日 latest,锁定镜像 tag 记入 DEPLOY.md 与书稿「素材源与版本基线」,核实日期如实)
- 书稿规范:`docs/book-writing-guide.md` 全项——章骨架八节齐全、正文 ≥500 行/章、中文全角标点、术语首现中英对照、章首 mermaid 图(LR 布局 6-8 节点)
- 贯穿案例命名全书一致:Langfuse 项目 `after-sales`、应用「售后助手」、Prompt `after-sales-answer`、数据集 `after-sales-qa`;禁各章自造
- 密钥零入库:`.env`/`DEPLOY.md` 只在书架外 `langfuse-local/`;书稿与截图不得出现明文 Key(脱敏规则:中段 `***`)
- LLM 通道:智谱 OpenAI 兼容 `https://open.bigmodel.cn/api/paas/v4` + `glm-5.3-flash`(Key 沿用 ragflow-local/DEPLOY.md 记录)
- 截图三段式「引导句→图→解读」,相对路径 `../assets/images/…`,产物入 `books/langfuse/assets/images/`
- 事实纪律:凡写进书稿的界面行为,以本机实例实测为准;文档与实测不符处,以实测为准并在书稿如实标注
- commit:每章一个 commit(或逻辑单元一个);push 沿用用户「更新后 push」授权;commit 尾行 `Co-Authored-By: Claude Code <noreply@anthropic.com>`
- 并发:成稿期子代理 ≤3(账户限流经验)

---

### Task 1: langfuse-local 实操区与部署栈

**Files:**
- Create: `D:\work\code\book\langfuse-local\docker-compose.yml`(官方 v4 compose 落地)
- Create: `D:\work\code\book\langfuse-local\.env`
- Create: `D:\work\code\book\langfuse-local\DEPLOY.md`

**Interfaces:**
- Produces: `http://localhost:3000` 可访问的 Langfuse v4 Web;后续所有任务依赖此实例与 DEPLOY.md 记录的凭据/端口/镜像 tag

- [ ] **Step 1: 获取官方 compose 与镜像基线**

```bash
mkdir -p /d/work/code/book/langfuse-local && cd /d/work/code/book/langfuse-local
curl -sL -o docker-compose.yml https://raw.githubusercontent.com/langfuse/langfuse/main/docker-compose.yml
grep -E 'image:|NEXTAUTH_URL|PORT' docker-compose.yml | head -30
```

若 raw.githubusercontent 不可达,改从 `https://langfuse.com/self-hosting/deployment/docker-compose` 页面获取(有下载链接)。记录 web/worker 镜像 tag 于 DEPLOY.md。

- [ ] **Step 2: 写 .env(必填项按 compose 注释)**

`.env` 必含:`NEXTAUTH_SECRET`(openssl rand -base64 32 生成)、`SALT`、`CLICKHOUSE_PASSWORD`、`MINIO_ROOT_PASSWORD` 等 compose 引用的变量;`NEXTAUTH_URL=http://localhost:3000`、`PORT=3000`(占用则改 3001 并同步 compose 映射)。

```bash
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -base64 32  # SALT
```

- [ ] **Step 3: 启动并验证六容器健康**

```bash
cd /d/work/code/book/langfuse-local && docker compose up -d
docker compose ps   # web/worker/postgres/redis/clickhouse/minio 全部 running/healthy
```

预期:首次拉镜像 4-8GB,ClickHouse/MinIO 较慢属正常;web 健康( `curl -s http://localhost:3000/api/public/health` 返回 `{"status":"ok"}` 或类似)。失败排障记录进 DEPLOY.md。

- [ ] **Step 4: 写 DEPLOY.md**

记录:镜像 tag 与核实日期、端口、全部凭据、容器清单、排障经过。此文件不入书架仓库。

---

### Task 2: 管理员初始化与项目配置

**Files:**
- Create: `D:\work\code\book\langfuse-local\shot\lf-init.mjs`(Playwright,复用 ragflow-local/shot 的 node_modules 与模式)

**Interfaces:**
- Produces: 管理员账号、组织/项目 `after-sales`、项目 API Key(存 DEPLOY.md);截图素材(注册页、组织/项目创建、项目首屏、API Key 创建页 4 张)

- [ ] **Step 1: Playwright 环境复用**

```bash
cd /d/work/code/book/ragflow-local/shot && node -e "require('playwright'); console.log('ok')"
```

新脚本放 `langfuse-local/shot/`,用绝对路径 require ragflow-local/shot 的 playwright 包(或 `npm i playwright` 一次性安装到 langfuse-local/shot)。

- [ ] **Step 2: 浏览器手动/自动化走初始化流程**

首访 `http://localhost:3000` → 注册管理员(邮箱/密码,凭据入 DEPLOY.md)→ 建组织(默认)→ 建项目 `after-sales` → 项目 Settings → API Keys → 新建 Key(复制存 DEPLOY.md,页面即关)。

- [ ] **Step 3: 截图 4 张**

脚本逐页截:`lf-register.png`(注册页)、`lf-org-project.png`(项目创建完成态)、`lf-project-home.png`(项目首屏)、`lf-apikey.png`(API Key 创建页,Key 值脱敏)。产物先落 `langfuse-local/shot/`,成稿时择优拷贝至 `books/langfuse/assets/images/`。

- [ ] **Step 4: SDK 连通性冒烟**

```bash
export LANGFUSE_HOST=http://localhost:3000 LANGFUSE_PUBLIC_KEY=pk-... LANGFUSE_SECRET_KEY=sk-...
python -c "from langfuse import get_client; lf=get_client(); lf.auth_check(); print('auth ok')"
```

(pip install langfuse 先行;API 名以 `pip show langfuse` 版本对应文档为准,`auth_check` 不存在则用任一轻量调用验证连通。)

---

### Task 3: Python Demo「售后助手」与首条 trace

**Files:**
- Create: `D:\work\code\book\langfuse-local\demo\support_bot.py`
- Create: `D:\work\code\book\langfuse-local\demo\requirements.txt`

**Interfaces:**
- Consumes: Task 2 的 API Key(经环境变量 `LANGFUSE_HOST/PUBLIC_KEY/SECRET_KEY` 与 `ZHIPU_API_KEY` 注入)
- Produces: `support_bot.py` 的可运行埋点链路——后续章节引用其中代码段;`answer(query, session_id)` 函数签名、`retrieve()`/`llm_call()` 分层结构

- [ ] **Step 1: requirements.txt 与安装**

```
langfuse>=3
openai>=1
```

```bash
pip install -r requirements.txt
```

- [ ] **Step 2: 写 support_bot.py(全链路埋点)**

结构(实际 API 名以本地 SDK 实测为准,先 `python -c "import langfuse; help(langfuse)"` 核对):

```python
import os
from openai import OpenAI
from langfuse import get_client, observe

lf = get_client()
zhipu = OpenAI(base_url="https://open.bigmodel.cn/api/paas/v4",
               api_key=os.environ["ZHIPU_API_KEY"])

FAQ = {  # 贯穿案例语料:售后域三条(退货政策/物流时效/换货流程),真实内容写售后政策口径
    "退货": "跨境商品支持 7 天无理由退货;…",
    "物流": "保税仓发货 3-5 日达;海外直邮 7-15 日;…",
    "换货": "质量问题 30 天内免费换货一次;…",
}

@observe(name="retrieve-context")        # span:检索
def retrieve(query: str) -> str:
    hits = [v for k, v in FAQ.items() if any(c in query for c in k)]
    return "\n".join(hits) or FAQ["退货"]

@observe(name="llm-call")                # generation:LLM 调用
def llm_call(messages) -> str:
    resp = zhipu.chat.completions.create(model="glm-5.3-flash", messages=messages)
    # SDK 自动记录 usage/model;此处取回文本
    return resp.choices[0].message.content

@observe()                               # trace 根:售后助手
def answer(query: str, session_id: str | None = None) -> str:
    context = retrieve(query)
    messages = [
        {"role": "system", "content": f"你是跨境电商售后助手,依据资料回答:\n{context}"},
        {"role": "user", "content": query},
    ]
    return llm_call(messages)

if __name__ == "__main__":
    print(answer("我想退货,政策是什么?", session_id="demo-session-001"))
```

session 关联、prompt 托管、成本字段等深化在 Task 4 增量改;本任务先把三层结构(根 trace→retrieve span→llm generation)与首条 trace 跑通。

- [ ] **Step 3: 运行并验证 trace 落库**

```bash
python support_bot.py   # 期望输出一段售后回答文本
```

Web UI → Traces 出现名为 `answer` 的 trace;点开可见 retrieve-context span 与 llm-call generation 层级、glm-5.3-flash 的 usage/latency。截图:`lf-first-trace.png`(trace 详情,含层级树)。

- [ ] **Step 4: 多轮 session 验证(为第 4 章备素材)**

连续跑 3 条不同 query 带 `session_id="demo-session-001"`,UI Sessions 视图出现串联。截图:`lf-session.png`。

---

### Task 4: Demo 素材扩展(Prompt 托管/成本/数据集/实验)

**Files:**
- Modify: `D:\work\code\book\langfuse-local\demo\support_bot.py`(prompt 改从 Langfuse 拉取)
- Create: `D:\work\code\book\langfuse-local\demo\setup_assets.py`(建 prompt/数据集)
- Create: `D:\work\code\book\langfuse-local\demo\eval_runs.py`(数据集实验)

**Interfaces:**
- Consumes: Task 3 的 support_bot.py 结构
- Produces: Langfuse 内真实素材——prompt `after-sales-answer`(v1/v2,labels)、数据集 `after-sales-qa`(≥6 items,含 expected_output)、实验 run ≥2 个;第 6-9、12、13 章写作素材

- [ ] **Step 1: setup_assets.py 建 prompt 与数据集**

```python
lf.create_prompt(name="after-sales-answer",
                 prompt="你是跨境电商售后助手…{{context}}\n用户问题:{{query}}",
                 labels=["production"])
# v2:改口径(如强调先安抚再给政策),labels=["production"] 前版本撤为 experimental
items = [ {"input": "…", "expected_output": "…"}, … ]  # ≥6 条:退货/物流/换货/超时/退款周期/拒赔申诉
lf.create_dataset(name="after-sales-qa")
# 逐条 create_dataset_item
```

(API 签名以本地 SDK 实测为准。)UI 验证:Prompts 列表 2 版本、Datasets 见 items。

- [ ] **Step 2: support_bot.py 改用托管 prompt**

`answer()` 内改 `lf.get_prompt("after-sales-answer")` + `prompt.compile(context=…, query=…)`;trace 内 generation 可见 prompt 版本关联。运行验证。

- [ ] **Step 3: eval_runs.py 跑两轮实验**

遍历 `after-sales-qa` items → 调 `answer()` → 记 latency/cost → 对 expected_output 打 score(先用简单启发式:含关键词;第 9 章再升级 LLM-as-judge)→ 两个版本 prompt 各跑一轮形成两个 run。UI 验证:Dataset 详情出现 2 个 run 可对比。截图:`lf-dataset-runs.png`(run 对比)。

- [ ] **Step 4: 成本可见性验证(为第 5 章备素材)**

UI → Metrics/Dashboards 出现 glm-5.3-flash 成本与 token 数据(若模型无内置单价,在模型管理里配置智谱价格,实测路径截图:`lf-model-price.png`)。

---

### Task 5: RAGFlow tracing 联动验证(第 10 章素材)

**Files:**
- Modify: ragflow 侧配置(UI 操作,不改书架文件)
- Create: `D:\work\code\book\langfuse-local\shot\lf-ragflow-link.mjs`(截图脚本)

**Interfaces:**
- Consumes: 本机 ragflow-local 栈(若未运行先 `docker compose up -d`,ragflow-local/DEPLOY.md 有凭据)
- Produces: 截图 2 张——`lf-ragflow-config.png`(RAGFlow tracing 配置页)、`lf-ragflow-trace.png`(RAGFlow 请求出现在 Langfuse trace 流)

- [ ] **Step 1: 起 ragflow-local 栈并登录**

```bash
cd /d/work/code/book/ragflow-local && docker compose up -d && docker compose ps
```

- [ ] **Step 2: RAGFlow 侧配置 Langfuse tracing**

UI → 头像/系统设置 → tracing(实测路径以 rc2 界面为准)→ 选 Langfuse → 填 `http://localhost:3000` + 项目 Key(注意容器网络:若 RAGFlow 容器访问宿主机 3000 需用 `http://host.docker.internal:3000`,实测确定并如实记录)→ 保存。

- [ ] **Step 3: 触发一次售后助手对话并双向验证**

RAGFlow 聊天页对 `after-sales-kb` 提问一次 → Langfuse Traces 出现 RAGFlow 来源 trace。截图 2 张如上。

---

### Task 6: 全书约定与素材事实文档(FACTS)

**Files:**
- Create: `D:\work\code\book\langfuse-local\FACTS.md`(书架外,写作素材单一来源)

**Interfaces:**
- Produces: 成稿期(尤其并行子代理)共享的约定与实测事实——所有章节写作任务的必读输入

- [ ] **Step 1: 汇总 FACTS.md**

内容:①贯穿案例命名与 demo 代码要点(最终版 support_bot.py 全文+每段代码职责);②版本基线(镜像 tag/核实日期/SDK 版本号);③实测界面事实清单(各功能入口路径、界面行为、与官方文档不符处);④术语中英对照表(trace/observation/span/generation/score/dataset/evals/prompt label/annotation queue…);⑤截图素材库清单(现有 PNG+尚缺清单);⑥各章截图落位表;⑦智谱模型与价格配置事实。

- [ ] **Step 2: 缺口截图补齐**

对照素材缺口(如保存视图、annotation queue、evals 配置页),在后续章节任务执行时随写随补;FACTS.md 持续更新。

---

### Task 7: 书架落地准备(books/langfuse 结构与 README 成稿化)

**Files:**
- Modify: `books/langfuse/README.md`(按 ragflow README 体例改写:状态行、定位、读者、素材源与版本基线、贯穿案例、术语约定、章节规划 13 章表、交叉引用)
- Create: `books/langfuse/assets/images/`(空目录,后续落图)

**Interfaces:**
- Produces: 章节表文件名(01-overview…13-redteam)与本章规划一致——后续每章任务按此落文件

- [ ] **Step 1: README 按体例改写并 commit**

章节规划表 13 行(章名/一句话/分量)链接 chapters/ 文件;状态行「成稿中(YYYY-MM-DD)…」;commit `docs(langfuse): README 成稿体例定稿与 13 章规划`。

---

### Task 8-20: 13 章成稿(每章一任务,边写边截)

统一约定(适用每章,不再逐章重复):
- **Files:** Create `books/langfuse/chapters/NN-slug.md`
- **步骤模板:** ①读 FACTS.md 与相关官方文档面(langfuse.com/docs 对应节)→ ②写全章(骨架八节、≥500 行、全角标点、代码段取自 demo 实测版)→ ③插入本章截图(拷贝 shot 产物至 assets/images/ 并三段式引用;缺图则先占位清单,补截后替换)→ ④自验:`wc -l` ≥500、骨架节齐全、mermaid 语法 `npx -p @mermaid-js/mermaid-cli mmdc --validate`(或目测 GitHub 渲染规则)→ ⑤commit `docs(langfuse): 第 N 章 <章名>`
- **Interfaces( Produces):** 章末「延伸阅读」给出相邻章交叉引用(→ 第 N 章);术语沿用 FACTS 对照表

各章专有要点:

- [ ] **Task 8 / 第 1 章 初识 Langfuse(01-overview.md)** — LLM 应用为什么需要专门的可观测(与传统 APM/日志差异表);Langfuse 四大能力面(Trace/Prompt/评估/指标)导览图;开源 MIT vs EE 功能边界(自托管视角,如实标注 license 项);书架地图(与 ragflow/fastgpt/mcp 书的交叉引用)。薄章(400-500 行可接受,骨架不缺)。章首:导览图。
- [ ] **Task 9 / 第 2 章 本地部署(02-deploy.md)** — 六容器架构图(mermaid 部署图);compose 关键配置逐段讲;初始化流程;数据持久化(volume)与备份要点;升级策略(日更节奏下锁 tag);排障实录(取 DEPLOY.md 真实排障)。截图 5 张落位。章首:操作流程图。
- [ ] **Task 10 / 第 3 章 快速开始(03-quickstart.md)** — SDK 安装与三种 Key 注入方式;首条 trace 十分钟走通(逐步);observe 装饰器与手动 span 两风格;Debug 排障。截图 3 张。章首:操作流程图。
- [ ] **Task 11 / 第 4 章 Trace 模型与链路追踪(04-tracing.md)** — 数据模型(trace/observation/span/generation/event)关系图;session 串联多轮;metadata/levels/environment;采集规范(命名约定、敏感字段脱敏、采样权衡);过滤与保存视图。重章。截图 4 张。章首:操作流程图。
- [ ] **Task 12 / 第 5 章 成本与性能监控(05-cost-metrics.md)** — 模型价格配置;成本核算口径;Dashboards 与 metrics API;延迟分析与 P95;webhook 告警(实测可达则配一次,不可达如实留缺)。截图 3 张。章首:操作流程图。
- [ ] **Task 13 / 第 6 章 Prompt 管理(06-prompt-mgmt.md)** — create/get prompt 与 compile;版本与 label(production/staging/experimental);Playground 调试;SDK 拉取缓存与回退;与 trace 的版本关联。重章。截图 4 张。章首:操作流程图。
- [ ] **Task 14 / 第 7 章 数据集与评分(07-datasets-scores.md)** — dataset/dataset item 建设方法论(从 badcase 反哺);score 类型与三来源(在线评分/人工标注 annotation queue/LLM-as-judge);评分维度设计(正确性/合规性/语气)。重章。截图 3 张。章首:操作流程图。
- [ ] **Task 15 / 第 8 章 实验与 A/B(08-experiments.md)** — dataset run 实验模型;run 对比读数(耗时/成本/得分);prompt label 流量切分实现 A/B;版本切换与回滚。截图 2 张。章首:操作流程图。
- [ ] **Task 16 / 第 9 章 自动化评估(09-evals.md)** — evals 机制与模板(UI 配 LLM-as-judge 实操);自定义 judge prompt 要点(评分 rubric 进 prompt);线上持续评估与抽样策略;幻觉检测入门(judge+依据核查)。self-host 功能边界如实标注。截图 2 张。章首:操作流程图。
- [ ] **Task 17 / 第 10 章 接入已有系统(10-integrations.md)** — RAGFlow tracing 联动全实操(主线);OpenAI SDK wrapper 一行换 import 自动埋点;LangChain/LlamaIndex/dify 等集成清单(表格,自托管实测项打勾);OTel 桥接(部署章呼应)。截图 2 张。章首:操作流程图。
- [ ] **Task 18 / 第 11 章 多项目与团队管理(11-org-admin.md)** — 组织/项目/环境隔离设计(dev/prod 项目分置与 Key 治理);成员与角色(self-host 版 RBAC 边界如实);审计与数据保留(EE 项标注)。薄章。截图 2 张。章首:导览图。
- [ ] **Task 19 / 第 12 章 Prompt 回归与质量门禁(12-regression.md)** — 回归体系三件套(基线数据集+实验+评分阈值);把 eval_runs.py 扩成回归脚本(阈值不达标非零退出);CI 集成思路(GitHub Actions 示例,标注思路非本机实测);幻觉回归案例。重章。截图 2 张(回归 run 结果/判例)。章首:操作流程图。
- [ ] **Task 20 / 第 13 章 红队与安全评估(13-redteam.md)** — 红队定位(测试自己应用的防御,合规口径);对抗数据集设计(越狱/提示注入/敏感信息诱导三类,案例给防御性 rubric 而非攻击工具化);安全评分体系;badcase 运营闭环(发现→标注→回归)。截图 1-2 张。章首:导览图。

---

### Task 21: 全书统检与收尾

**Files:**
- Modify: `books/langfuse/README.md`(状态行终稿)
- Modify: `build/books/registry.mjs`(如 tagline 需微调,先查现状再动)

- [ ] **Step 1: 全书一致性统检**

贯穿案例命名(`after-sales`/售后助手/`after-sales-qa`/`after-sales-answer`)、术语中英对照一致、章级交叉引用与「延伸阅读」不断链、全角标点、各章 ≥500 行:

```bash
wc -l books/langfuse/chapters/*.md   # 逐章 ≥500(第 1/11 章薄章 ≥400 并在 README 说明)
grep -rn "pk-lf\|sk-lf\|eyJs" books/langfuse/  # Key 泄露扫描,零命中
```

- [ ] **Step 2: 构建验证**

```bash
npm test && npm run site   # 全绿;站点抽查 langfuse 书图片渲染
```

- [ ] **Step 3: README 状态行终稿 + commit + push**

状态行如实记录成稿日期、基线版本与核实日期、实测截图张数、未完成挂账(如自动化受阻留缺项)。commit `docs(langfuse): 全书成稿——13 章 + 实测截图 N 张`,push。
