import { api } from "../../lib/api";
import type { AdminOrder } from "../orders/order.types";

export interface Customer {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}
export interface CustomerSummary {
  orderCount: number;
  totalSpending: number;
}
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface CustomerList {
  customers: (Customer & CustomerSummary)[];
  pagination: Pagination;
}
export interface CustomerDetails {
  customer: Customer;
  summary: CustomerSummary & { cancelledOrderCount: number };
  orders: Pick<AdminOrder, "_id" | "orderStatus" | "paymentStatus" | "total" | "createdAt">[];
  pagination: Pagination;
}
export const customerApi = {
  async list(page: number, search: string, signal?: AbortSignal) {
    const { data } = await api.get<CustomerList>("/admin/customers", { params: { page, limit: 10, search }, signal });
    return data;
  },
  async details(id: string, page: number, signal?: AbortSignal) {
    const { data } = await api.get<CustomerDetails>(`/admin/customers/${encodeURIComponent(id)}`, { params: { page, limit: 10 }, signal });
    return data;
  },
};
