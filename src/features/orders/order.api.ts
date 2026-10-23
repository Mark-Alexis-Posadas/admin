import { api } from "../../lib/api";
import type { AdminOrder, OrderStatus } from "./order.types";

export const orderApi = {
  getAll: async (): Promise<AdminOrder[]> => {
    const { data } = await api.get<AdminOrder[]>("/admin/orders");
    return data;
  },

  getById: async (id: string): Promise<AdminOrder> => {
    const { data } = await api.get<AdminOrder>(`/admin/orders/${id}`);
    return data;
  },

  updateStatus: async (
    id: string,
    status: OrderStatus,
  ): Promise<AdminOrder> => {
    const { data } = await api.patch<{
      message: string;
      order: AdminOrder;
    }>(`/admin/orders/${id}/status`, { status });

    return data.order;
  },
  collectCod: async (id: string): Promise<AdminOrder> => {
    const { data } = await api.post<{ message: string; order: AdminOrder }>(
      `/admin/orders/${id}/collect-cod`,
      { confirmed: true },
    );
    return data.order;
  },
};
