import { api } from "../../lib/api";
import type { InventoryHistoryResponse } from "./inventory.types";

export const inventoryApi = {
  getMovements: async (params: {
    page?: number;
    limit?: number;
    productId?: string;
  }): Promise<InventoryHistoryResponse> => {
    const { data } = await api.get<InventoryHistoryResponse>(
      "/admin/inventory/movements",
      { params },
    );

    return data;
  },
};
