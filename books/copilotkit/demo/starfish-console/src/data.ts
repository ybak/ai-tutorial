/**
 * data.ts — 星帆工作台的静态业务数据(与全书贯穿案例数据一致)
 */

export type OrderStatus = "待发货" | "已发货" | "已完成" | "售后中";

export interface Order {
  id: string;
  buyer: string;
  amount: number;
  status: OrderStatus;
  sku: string;
  channel: string;
}

export interface Product {
  sku: string;
  title: string;
  price: number;
  stock: number;
  listed: boolean;
}

export const ORDERS: Order[] = [
  { id: "ORD-20431", buyer: "Maria", amount: 86.4, status: "待发货", sku: "SKU-1001 ×2", channel: "美线" },
  { id: "ORD-20407", buyer: "James", amount: 42.99, status: "已发货", sku: "SKU-1002 ×3", channel: "欧线" },
  { id: "ORD-20395", buyer: "Aiko", amount: 128.0, status: "售后中", sku: "SKU-1001 ×1", channel: "东南亚" },
];

export const PRODUCTS: Product[] = [
  { sku: "SKU-1001", title: "无线蓝牙耳机", price: 29.99, stock: 340, listed: true },
  { sku: "SKU-1002", title: "铝合金手机支架", price: 12.5, stock: 58, listed: true },
];

export function todaySales(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + o.amount, 0);
}
