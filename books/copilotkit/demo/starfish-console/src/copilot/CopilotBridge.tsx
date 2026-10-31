/**
 * CopilotBridge.tsx — copilot 能力注册桥(第 4/6/7 章能力的集中挂载点)
 *
 * 放在 CopilotKitProvider 内、业务组件旁,负责:
 * - useAgentContext:把工作台概览发布给 Agent(第 4 章)
 * - useFrontendTool:get_orders / toggle_listing(第 6 章)
 * - useComponent:render_order_card,在聊天里渲染订单卡片(第 6 章)
 * - useHumanInTheLoop:update_price 改价审批卡(第 7 章)
 */
import { useState } from "react";
import { z } from "zod";
import {
  useAgentContext,
  useComponent,
  useFrontendTool,
  useHumanInTheLoop,
} from "@copilotkit/react-core/v2";
import { ORDERS, PRODUCTS, type Order, type Product } from "../data";

/* ---------- 第 4 章:上下文发布 ---------- */

function useContextBridge(
  orders: Order[],
  products: Product[],
  sales: number,
) {
  useAgentContext({
    description: "星帆工作台当前的业务概览,数值实时来自界面状态",
    value: {
      今日销售额: sales,
      今日订单数: orders.length,
      待处理售后: orders.filter((o) => o.status === "售后中").length,
      订单摘要: orders.map((o) => ({
        订单号: o.id,
        买家: o.buyer,
        金额: o.amount,
        状态: o.status,
      })),
      商品摘要: products.map((p) => ({
        SKU: p.sku,
        标题: p.title,
        现价: p.price,
        库存: p.stock,
        上架中: p.listed,
      })),
    },
  });
}

/* ---------- 第 6 章:前端工具 ---------- */

function useTools(
  orders: Order[],
  products: Product[],
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
) {
  useFrontendTool({
    name: "get_orders",
    description: "查询星帆工作台的订单列表,可按状态筛选",
    parameters: z.object({
      status: z
        .enum(["待发货", "已发货", "已完成", "售后中"])
        .optional()
        .describe("按状态筛选,不传则返回全部"),
    }),
    handler: async ({ status }) => {
      const rows = status ? orders.filter((o) => o.status === status) : orders;
      return JSON.stringify(rows);
    },
  });

  useFrontendTool({
    name: "toggle_listing",
    description: "切换商品的上架/下架状态",
    parameters: z.object({
      sku: z.string().describe("商品 SKU 编码,如 SKU-1001"),
    }),
    handler: async ({ sku }) => {
      let next: boolean | undefined;
      setProducts((prev) =>
        prev.map((p) => {
          if (p.sku !== sku) return p;
          next = !p.listed;
          return { ...p, listed: next };
        }),
      );
      return JSON.stringify({ sku, 上架状态: next ? "已上架" : "已下架" });
    },
  });
}

/* ---------- 第 6 章:组件即工具(聊天内订单卡片) ---------- */

export function OrderCard({ order }: { order: Order }) {
  const statusColor: Record<string, string> = {
    待发货: "#b45309",
    已发货: "#1d4ed8",
    已完成: "#15803d",
    售后中: "#b91c1c",
  };
  return (
    <div className="order-card">
      <div className="order-card-head">
        <span className="order-card-id">{order.id}</span>
        <span
          className="order-card-status"
          style={{ color: statusColor[order.status] ?? "#334155" }}
        >
          {order.status}
        </span>
      </div>
      <div className="order-card-row">买家:{order.buyer}</div>
      <div className="order-card-row">金额:${order.amount.toFixed(2)}</div>
      <div className="order-card-row">
        商品:{order.sku} · {order.channel}
      </div>
    </div>
  );
}

function useOrderCardTool(orders: Order[]) {
  useComponent({
    name: "render_order_card",
    description: "在聊天中渲染一张订单卡片,展示单个订单的详情",
    parameters: z.object({
      orderId: z.string().describe("订单号,如 ORD-20431"),
    }),
    render: ({ orderId }: { orderId: string }) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return <div className="order-card">未找到订单 {orderId}</div>;
      return <OrderCard order={order} />;
    },
  });
}

/* ---------- 第 7 章:update_price 审批卡 ---------- */

function usePriceApproval(
  products: Product[],
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
) {
  useHumanInTheLoop({
    name: "update_price",
    description:
      "修改商品价格。这是敏感操作,必须等卖家在审批卡上点击确认后才能生效",
    parameters: z.object({
      sku: z.string().describe("商品 SKU 编码"),
      newPrice: z.number().describe("新价格(美元)"),
      reason: z.string().describe("改价理由"),
    }),
    render: ({ args, respond, status }) => {
      if (status !== "executing") return <></>;
      const product = products.find((p) => p.sku === args.sku);
      const decide = (approved: boolean) => {
        if (approved) {
          setProducts((prev) =>
            prev.map((p) =>
              p.sku === args.sku ? { ...p, price: args.newPrice } : p,
            ),
          );
          respond?.(
            `卖家已批准:${args.sku} 价格从 $${product?.price.toFixed(2)} 调整为 $${args.newPrice.toFixed(2)},改价已生效`,
          );
        } else {
          respond?.(`卖家拒绝了本次改价:${args.sku} 保持原价不变`);
        }
      };
      return (
        <div className="approval-card">
          <div className="approval-title">改价审批 · 星帆工作台</div>
          <div className="approval-body">
            <div>
              <strong>{args.sku}</strong>
              {product ? ` ${product.title}` : ""}:$
              {product?.price.toFixed(2)} → <strong>${args.newPrice?.toFixed(2)}</strong>
            </div>
            <div className="approval-reason">理由:{args.reason}</div>
          </div>
          <div className="approval-actions">
            <button className="btn-approve" onClick={() => decide(true)}>
              批准并生效
            </button>
            <button className="btn-deny" onClick={() => decide(false)}>
              拒绝
            </button>
          </div>
        </div>
      );
    },
  });
}

/* ---------- 桥组件 ---------- */

export function CopilotBridge({
  orders,
  products,
  setProducts,
  sales,
}: {
  orders: Order[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: number;
}) {
  useContextBridge(orders, products, sales);
  useTools(orders, products, setProducts);
  useOrderCardTool(orders);
  usePriceApproval(products, setProducts);
  return null;
}

/** useState 的命名导出别名,供子模块类型引用 */
export { useState };
