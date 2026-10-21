import { api } from "../../lib/api";

export type AnalyticsRange = "7d" | "30d" | "90d" | "custom";
export type AnalyticsInterval = "day" | "week" | "month";
export interface AnalyticsFilters {
  range: AnalyticsRange;
  interval: AnalyticsInterval;
  startDate?: string;
  endDate?: string;
}
export interface RevenuePoint {
  date: string;
  revenue: number;
  salesCount: number;
}
export interface AnalyticsReport {
  filters: AnalyticsFilters & { startDate: string; endDate: string; start: string; endExclusive: string; timezone: string };
  currency: string;
  revenueBasis: string;
  summary: {
    totalOrders: number;
    totalRevenue: number;
    salesCount: number;
    unitsSold: number;
    averageOrderValue: number;
    paidOrderShare: number;
  };
  ordersByStatus: { status: string; count: number }[];
  trend: RevenuePoint[];
  topProducts: { productId: string; name: string; sku: string; quantitySold: number; revenue: number }[];
  recentSales: { _id: string; createdAt: string; total: number; orderStatus: string; quantity: number }[];
}

export const analyticsApi = {
  async report(filters: AnalyticsFilters, signal?: AbortSignal) {
    const { data } = await api.get<AnalyticsReport>("/admin/analytics", { params: filters, signal });
    return data;
  },
};
