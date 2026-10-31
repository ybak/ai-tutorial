# 星帆工作台(starfish-console)

《CopilotKit:从前端接入 AI Agent》贯穿案例的可运行工程:跨境电商卖家运营台,演示 copilot 接入的完整链路——预置组件(第 2/3 章)、上下文发布(第 4 章)、前端工具与生成式 UI(第 6 章)、工具级审批(第 7 章)。

**实测基线**:`@copilotkit/react-core` / `@copilotkit/runtime` **1.83.0**(2026-10-31;书稿截图均基于此版本)。v2 API 通过 `/v2` 子路径导出提供,与书稿一致。

## 运行

```bash
npm install
cp .env.example .env        # 填入你的模型密钥
npm run server              # 终端 1:Copilot Runtime,监听 8200
npm run dev                 # 终端 2:Vite 前端,监听 5173
```

打开 `http://localhost:5173`(默认侧边栏布局;`?layout=popup` / `?layout=chat` 切换布局,对应第 3 章三种布局)。

## 模型通道

`server.ts` 的内置 Agent 用 Anthropic 协议模型字符串(`anthropic:glm-5.3-flash`)。注意两点:

1. **`@ai-sdk/anthropic` 的 `baseURL` 约定包含 `/v1`**——它直接在其后拼 `/messages`。若你的网关地址是 `https://example.com/api/anthropic`,要设成 `https://example.com/api/anthropic/v1`,否则 404 且前端只看到「无回复」。
2. 密钥只放服务端 `.env`(经 `--env-file` 注入),前端不放任何 `VITE_` 密钥(见第 2 章 2.5)。

换 OpenAI 等其他 provider 只需改 `server.ts` 的 `model` 字符串(见第 5 章模型选型)。

## 目录

| 文件 | 对应章节 |
|------|---------|
| `server.ts` | 第 2 章 2.3(Runtime + 内置 Agent) |
| `src/App.tsx` | 第 2 章 2.4(Provider 接线)、第 3 章 3.2(三种布局) |
| `src/copilot/CopilotBridge.tsx` | 第 4 章(`useAgentContext`)、第 6 章(`useFrontendTool`/`useComponent`)、第 7 章(`useHumanInTheLoop`) |
| `src/theme.css` | 第 3 章 3.3(design tokens 对齐) |
| `src/data.ts` | 贯穿案例数据(ORD-20431 / SKU-1001,与书稿一致) |
