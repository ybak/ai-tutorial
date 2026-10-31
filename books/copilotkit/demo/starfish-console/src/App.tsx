/**
 * App.tsx — 星帆工作台主界面
 *
 * 布局通过 URL 参数 ?layout= 切换(演示第 3 章三种布局):
 *   sidebar(默认)| popup | chat
 */
import { useState } from "react";
import {
  CopilotKitProvider,
  CopilotChat,
  CopilotPopup,
  CopilotSidebar,
} from "@copilotkit/react-core/v2";
import { ORDERS, PRODUCTS, todaySales, type Order, type Product } from "./data";
import { CopilotBridge } from "./copilot/CopilotBridge";

type Layout = "sidebar" | "popup" | "chat";

function Dashboard({ sales, orders }: { sales: number; orders: Order[] }) {
  const afterSales = orders.filter((o) => o.status === "售后中").length;
  return (
    <div className="dashboard">
      <div className="metric">
        <div className="metric-label">今日销售额</div>
        <div className="metric-value">${sales.toFixed(2)}</div>
      </div>
      <div className="metric">
        <div className="metric-label">今日订单</div>
        <div className="metric-value">{orders.length}</div>
      </div>
      <div className="metric">
        <div className="metric-label">待处理售后</div>
        <div className="metric-value warn">{afterSales}</div>
      </div>
    </div>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <section className="panel">
      <h2>订单列表</h2>
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>买家</th>
            <th>金额</th>
            <th>状态</th>
            <th>商品</th>
            <th>渠道</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="mono">{o.id}</td>
              <td>{o.buyer}</td>
              <td className="mono">${o.amount.toFixed(2)}</td>
              <td>
                <span className={`status status-${o.status}`}>{o.status}</span>
              </td>
              <td>{o.sku}</td>
              <td>{o.channel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ProductsTable({
  products,
}: {
  products: Product[];
}) {
  return (
    <section className="panel">
      <h2>商品管理</h2>
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>标题</th>
            <th>价格</th>
            <th>库存</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.sku}>
              <td className="mono">{p.sku}</td>
              <td>{p.title}</td>
              <td className="mono">${p.price.toFixed(2)}</td>
              <td className="mono">{p.stock}</td>
              <td>
                <span className={`listing ${p.listed ? "on" : "off"}`}>
                  {p.listed ? "上架中" : "已下架"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function App() {
  const [orders] = useState<Order[]>(ORDERS);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const sales = todaySales(orders);
  const layout =
    (new URLSearchParams(window.location.search).get("layout") as Layout) ??
    "sidebar";

  return (
    <CopilotKitProvider runtimeUrl="http://localhost:8200/api/copilotkit">
      <CopilotBridge
        orders={orders}
        products={products}
        setProducts={setProducts}
        sales={sales}
      />
      <div className="shell">
        <header className="topbar">
          <div className="brand">星帆工作台</div>
          <div className="subtitle">跨境电商卖家运营台 · copilot 演示</div>
        </header>
        <main className="content">
          <Dashboard sales={sales} orders={orders} />
          <OrdersTable orders={orders} />
          <ProductsTable products={products} />
        </main>
      </div>
      {layout === "sidebar" && (
        <CopilotSidebar
        defaultOpen
        labels={{
          modalHeaderTitle: "小帆 · 运营助理",
          welcomeMessageText: "你好,我是小帆。订单、库存、改价,直接问我。",
        }}
      />
      )}
      {layout === "popup" && (
        <CopilotPopup
        defaultOpen
        labels={{
          modalHeaderTitle: "小帆 · 运营助理",
          welcomeMessageText: "你好,我是小帆。订单、库存、改价,直接问我。",
        }}
      />
      )}
      {layout === "chat" && (
        <div className="chat-fullheight">
          <CopilotChat
          labels={{
            modalHeaderTitle: "小帆 · 运营助理",
            welcomeMessageText: "你好,我是小帆。订单、库存、改价,直接问我。",
          }}
        />
        </div>
      )}
    </CopilotKitProvider>
  );
}
