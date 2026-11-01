# build/ — 构建工具链

本仓库（ai-tutorial）是教程书架的唯一事实源：每本书自包含在 `books/<bookId>/` 下（`chapters/` 书稿正文、`assets/` 本地图片、`demo/`、`docs/`），`build/` 只负责把 Markdown 变成 PDF 与静态站点，不含内容。每本书的目录约定与章节映射登记在 `build/books/<bookId>.mjs`，全部书目汇总在 `build/books/registry.mjs`。

## 目录角色

| 路径 | 角色 |
| --- | --- |
| `books/<bookId>/chapters/` | 书稿正文（图片引用 `../assets/images/…`，相对章节文件解析到书内 `assets/`） |
| `books/<bookId>/assets/` | 书内本地化图片（`fetch-images.mjs` 下载落位） |
| `build/books/<bookId>.mjs` | 书配置：书级元数据 + 篇/章/源文件映射（`book.PARTS`）+ 排除清单 |
| `build/books/registry.mjs` | 书注册表（可构建 + 规划中） |
| `build/*.mjs` `add_outline.py` | 构建管线（本目录） |
| `build/assets/style.css` | 书籍排版样式（构建时内联进 HTML） |
| `build/assets/vendor/` | mermaid/pagedjs 运行时，构建时自动从 `node_modules` 同步，不入库 |
| `output/` | 构建产物（已 gitignore）：单书 `output/<bookId>/`（book.html、PDF、`.outline.json`），站点 `output/site/`（书架 + 各书子站） |

## 常用命令（在 `build/` 下）

```bash
npm install            # 首次：装 markdown-it / highlight.js / mermaid / pagedjs / pagefind
pip install pymupdf    # 首次：书签步骤 add_outline.py 依赖 PyMuPDF（import fitz）
npm test               # 单测：books（路径推导/registry 约束）、clean（清洗规则）、site（站点装配）
node build.mjs --check --book agentscope-java  # 全源体检：JSX 残留 / 站内链接 / 覆盖率（不写文件）
node build.mjs --html  --book agentscope-java  # 只产出 output/agentscope-java/book.html（浏览器可直接打开）
node build.mjs --pdf   --book agentscope-java  # HTML + Edge headless 打印 → output/agentscope-java/*.pdf + PyMuPDF 补书签，约 10-20 分钟（含书签保存）
npm run site           # 静态站点全站总装 + pagefind 索引 → output/site/（书架页 + 各书子站 + 全局搜索）
```

`--book <bookId>` 可与任一模式（`--html` / `--pdf` / `--pdf-fallback` / `--check`）混排；缺省时仅一本可构建书则自动取之，多于一本则报错要求显式指定。`--site` 是全站总装，书无关。辅助:`node fetch-images.mjs` 把章节里的远程图片下载到书内 `assets/images/` 并改写引用;缺省扫描书架全部含 `chapters/` 的书,`--book <bookId>` 限定单本。

## 上游更新流程

agentscope-java 的上游文档在只读仓库 `../agentscope-java/docs/v2/zh`（`--check` 依赖它，位置由书配置 `srcDir` 推导，相对仓库根）。上游变更后：

1. 重新整合/校对受影响章节 → 直接改 `books/agentscope-java/chapters/*.md`；
2. `node build.mjs --check --book agentscope-java` 确认体检仍绿（未覆盖清单 == 排除清单，JSX 残留 0）；
3. 提交章节；
4. `node build.mjs --pdf --book agentscope-java` 出新 PDF，连同变更一起发布。

新增章节需同步登记 `build/books/agentscope-java.mjs` 的 `book.PARTS`（篇/章/源文件映射，书签大纲与站点目录同源于此）。

## 机制一句话

- **图片**：章节统一写 `../assets/images/…`——单书产物落在 `output/<bookId>/`、站点章节页落在 `output/site/<bookId>/chapters/`，构建把书内 `assets/` 整目录镜像到与产物同级，相对引用零改写即可解析；`fetch-images.mjs` 负责把微信图床外链换成本地哈希文件名。
- **书签**：Edge 打印不生成 PDF outline，`build.mjs` 从 `book.PARTS` 生成大纲写到 `output/<bookId>/.outline.json`，再调 `add_outline.py`（PyMuPDF）按「大字标题」定位各章页码写入书签与元数据；任何一章定位失败即整体构建失败。
- **站点**：`npm run site` 产出书架首页（`output/site/index.html`）+ 各书子站（`output/site/<bookId>/`）+ 全局搜索；旧章节路径（`/chapters/*.html`）生成 meta-refresh 跳转页指向书内新路径。

## 机器相关常量

`build.mjs` 的 `EDGE_PATH` 硬编码本机 Edge 路径（`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`），换机器需按实际安装位置调整；打印走 CDP `Page.printToPDF`（`preferCSSPageSize` 跟随 A4），不用 `--print-to-pdf` CLI（纸张恒为 Letter 会截断页面盒）。
