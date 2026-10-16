import { api } from "../../lib/api";
import type { AdminProduct, ProductPayload } from "./product.types";

type ProductResponse = {
  message: string;
  product: AdminProduct;
};

export const productApi = {
  getAll: async (): Promise<AdminProduct[]> => {
    const { data } = await api.get<AdminProduct[]>("/admin/products");

    return data;
  },

  getById: async (id: string): Promise<AdminProduct> => {
    const { data } = await api.get<AdminProduct>(`/admin/products/${id}`);

    return data;
  },

  create: async (payload: ProductPayload): Promise<AdminProduct> => {
    const { data } = await api.post<ProductResponse>(
      "/admin/products",
      payload,
    );

    return data.product;
  },

  update: async (
    id: string,
    payload: Omit<ProductPayload, "stock">,
  ): Promise<AdminProduct> => {
    const { data } = await api.patch<ProductResponse>(
      `/admin/products/${id}`,
      payload,
    );

    return data.product;
  },

  updateStatus: async (
    id: string,
    isActive: boolean,
  ): Promise<AdminProduct> => {
    const { data } = await api.patch<ProductResponse>(
      `/admin/products/${id}/status`,
      { isActive },
    );

    return data.product;
  },

  adjustStock: async (
    id: string,
    adjustment: number,
    reason: string,
  ): Promise<{ message: string; newStock: number }> => {
    const { data } = await api.patch(`/admin/products/${id}/stock`, {
      adjustment,
      reason,
    });

    return data;
  },
};
