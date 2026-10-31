/**
 * server.ts — 星帆工作台的 Copilot Runtime(第 2 章 2.3 的完整落地)
 *
 * 零依赖 Node HTTP 服务器,挂载 Copilot Runtime 于 /api/copilotkit,
 * 注册 default 内置 Agent。SPA 与 Runtime 分离端口,故 cors 必须显式开启。
 */
import { createServer } from "node:http";
import { BuiltInAgent, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: "anthropic:glm-5.3-flash",
      prompt: [
        "你是星帆工作台的运营助理小帆,服务跨境电商卖家。",
        "回答简洁、给数字、不编造:订单与库存数据以工具和上下文为准。",
        "卖家让你改价、上下架时,先说明你将要做的事,再调用对应工具。",
      ].join("\n"),
    }),
  },
});

const port = 8200;

createServer(
  createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: true,
  }),
).listen(port, () => {
  console.log(
    `Copilot Runtime listening at http://localhost:${port}/api/copilotkit`,
  );
});
