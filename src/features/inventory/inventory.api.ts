import { api } from "../../lib/api";
import type { InventoryHistoryResponse } from "./inventory.types";

export type InventoryMovementType = "all" | "added" | "removed";

export type InventoryHistoryParams = {
  page?: number;
  limit?: number;
  productId?: string;
  search?: string;
  type?: InventoryMovementType;
};

export const inventoryApi = {
  getMovements: async (
    params: InventoryHistoryParams = {},
  ): Promise<InventoryHistoryResponse> => {
    const { data } = await api.get<InventoryHistoryResponse>(
      "/admin/inventory/movements",
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          ...(params.productId ? { productId: params.productId } : {}),
          ...(params.search?.trim() ? { search: params.search.trim() } : {}),
          ...(params.type && params.type !== "all"
            ? { type: params.type }
            : {}),
        },
      },
    );

    return data;
  },
};
