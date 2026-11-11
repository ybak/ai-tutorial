# NOTICE（来源与用途声明）

## 原作品

本仓库内容整理自 **AgentScope Java** 项目的官方中文文档：

- 原项目：https://github.com/agentscope-ai/agentscope-java
- 整理范围：`docs/v2/zh` 目录下的官方文档（含 `docs/`、`service/`、`integration/`、`jev/` 及部分官方博客文章）
- 原项目许可：**Apache License 2.0**（详见本仓库 [LICENSE](LICENSE)）
- 原项目版权归 AgentScope Java 项目及其原作者所有

## 本仓库的性质

本仓库（`ai-tutorial`）是上述官方文档的**非官方中文教程重排本**，依 Apache License 2.0 的许可条款进行再分发。相对于原始文档，本仓库做了**大量修改与重组**，包括但不限于：

1. **结构重排**：将站点型文档按学习曲线重组为「7 篇 44 章」的教程结构，补充章首导读与章间衔接
2. **格式转换**：Mintlify 站点组件（Note / Card / Tab 等）转换为通用 Markdown；站内链接改写为章节交叉引用
3. **合并精编**：10 家模型提供商等重复性文档按统一模板合并
4. **图表补充**：新增 24 张 mermaid 架构图 / 时序图 / 部署图（另有 28 张源自原始文档）
5. **插图本地化**：全部插图随仓库本地存储

本仓库与 AgentScope Java 项目及其维护者**无任何隶属或认可关系**。技术内容的权威版本始终是官方文档与本体的源码。

## 用途声明

本仓库出于**个人学习与技术分享**目的整理发布，**不用于任何商业用途**。如果你：

- 希望系统学习 AgentScope Java，欢迎阅读、克隆、分享本书；
- 是 AgentScope Java 项目的维护者，对本仓库的整理方式有任何意见，请提 Issue，我会及时处理（包括应要求进行调整）；
- 发现内容与官方文档不一致，请以官方文档为准，并欢迎提 Issue 指正。

## 许可

本仓库整体以 **Apache License 2.0** 发布（详见 [LICENSE](LICENSE)）。依据 Apache License 2.0 第 4 条，本仓库对原作品作出了上述修改声明；原作品的许可声明与免责条款继续适用于其原始内容。

## 其他书的来源

书架后来追加的教程（MCP、RAGFlow、FastGPT、CopilotKit、Langfuse、Super-agent、LiteLLM 等）是面向同一平台案例的学习整理，不是把上述 AgentScope 文档再发行一遍。各书 README 写明素材与许可。与上游项目无隶属关系。

《LiteLLM：多模型网关、配额与降级》（2026-11-11）依据 [BerriAI/litellm](https://github.com/BerriAI/litellm) 的公开文档与仓库许可撰写，不随本仓库分发 LiteLLM 源码。2026-11-11 读取的根 `LICENSE` 写明：`enterprise/` 目录适用该目录自己的许可，其余为 MIT。`enterprise/LICENSE.md` 为商业许可。本书必做步骤不使用该目录。New API（QuantumNous/new-api）在书中仅作许可对照，其 AGPL-3.0 及第 7 条附加署名条款以该项目仓库为准，本书不包含其代码。
