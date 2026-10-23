import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import SectionHeader from "../../components/ui/SectionHeader";
import RefreshButton from "../../components/ui/RefreshButton";
import StatCard from "../../components/ui/StatCard";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import Badge from "../../components/ui/Badge";
import FormField from "../../components/ui/FormField";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Coins,
  Package,
  RefreshCw,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { analyticsApi, type AnalyticsFilters } from "./analytics.api";
import { RevenueChart, StatusChart } from "./AnalyticsCharts";
import {
  manilaToday,
  formatCurrency as money,
  formatReportDate as reportDate,
} from "../../lib/formatters";

const initialFilters: AnalyticsFilters = { range: "30d", interval: "day" };
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function SalesAnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [draft, setDraft] = useState<AnalyticsFilters>(initialFilters);
  const [validationError, setValidationError] = useState("");
  const { data, error, isError, isPending, isFetching, refetch } = useQuery({
    queryKey: ["admin", "analytics", filters],
    queryFn: ({ signal }) => analyticsApi.report(filters, signal),
    staleTime: 30_000,
    gcTime: 0,
    retry: (count, failure) =>
      !(
        axios.isAxiosError(failure) &&
        [400, 401, 403].includes(failure.response?.status ?? 0)
      ) && count < 1,
  });

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.range === "custom") {
      const days =
        (Date.parse(`${draft.endDate}T00:00:00+08:00`) -
          Date.parse(`${draft.startDate}T00:00:00+08:00`)) /
          86_400_000 +
        1;
      if (
        !Number.isFinite(days) ||
        days < 1 ||
        days > 366 ||
        (draft.endDate ?? "") > manilaToday()
      ) {
        setValidationError(
          "Choose valid dates, in order, spanning at most 366 days and ending today or earlier.",
        );
        return;
      }
    }
    setValidationError("");
    setFilters(
      draft.range === "custom"
        ? { ...draft }
        : { range: draft.range, interval: draft.interval },
    );
  }

  const accessError =
    axios.isAxiosError(error) &&
    [401, 403].includes(error.response?.status ?? 0);
  const blockingError = isError && (!data || accessError);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <PageHeader
        variant="hero"
        title="Sales Analytics"
        subtitle="Track paid revenue, understand order activity, and discover your best-selling products."
        eyebrow={
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-300">
            <BarChart3 size={17} aria-hidden="true" /> SHOPSPHERE / REPORTING
          </p>
        }
        actions={
          <RefreshButton
            variant="inverse"
            busy={isFetching}
            onClick={() => void refetch()}
          />
        }
      />

      <Card className="p-5 sm:p-6" aria-label="Report filters">
        <form
          onSubmit={applyFilters}
          className="flex flex-wrap items-end gap-4"
        >
          <FormField
            label={
              <>
                <CalendarDays size={15} />
                DATE RANGE
              </>
            }
            labelClassName="flex items-center gap-2 text-xs font-semibold text-slate-500"
            className="min-w-40 flex-1 space-y-2"
          >
            <select
              className={inputClass}
              value={draft.range}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  range: event.target.value as AnalyticsFilters["range"],
                }))
              }
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </FormField>
          {draft.range === "custom" && (
            <>
              <FormField
                label={<>START DATE</>}
                labelClassName="text-xs font-semibold text-slate-500"
                className="min-w-40 flex-1 space-y-2"
              >
                <input
                  type="date"
                  required
                  max={draft.endDate || manilaToday()}
                  className={inputClass}
                  value={draft.startDate ?? ""}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      startDate: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField
                label={<>END DATE</>}
                labelClassName="text-xs font-semibold text-slate-500"
                className="min-w-40 flex-1 space-y-2"
              >
                <input
                  type="date"
                  required
                  min={draft.startDate}
                  max={manilaToday()}
                  className={inputClass}
                  value={draft.endDate ?? ""}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      endDate: event.target.value,
                    }))
                  }
                />
              </FormField>
            </>
          )}
          <FormField
            label={<>GROUP REVENUE BY</>}
            labelClassName="text-xs font-semibold text-slate-500"
            className="min-w-36 flex-1 space-y-2"
          >
            <select
              className={inputClass}
              value={draft.interval}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  interval: event.target.value as AnalyticsFilters["interval"],
                }))
              }
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </FormField>
          <Button type="submit" variant="primary">
            Apply filters
          </Button>
        </form>
        {validationError && (
          <p role="alert" className="mt-3 text-sm text-rose-600">
            {validationError}
          </p>
        )}
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Asia/Manila calendar dates, including today. Custom ranges: up to 366
          days. Weeks start Monday; first and last chart periods may be partial.
        </p>
      </Card>

      {isPending ? (
        <Card>
          <LoadingState>
            <RefreshCw
              className="mx-auto mb-3 animate-spin text-indigo-500"
              size={24}
              aria-hidden="true"
            />
            Preparing your sales report...
          </LoadingState>
        </Card>
      ) : blockingError ? (
        <Card>
          <ErrorState
            title="Unable to load sales analytics"
            action={
              accessError ? (
                <Link
                  to="/login"
                  className="inline-block font-semibold text-indigo-600"
                >
                  Sign in again
                </Link>
              ) : (
                <Button onClick={() => void refetch()}>Try again</Button>
              )
            }
          >
            {accessError
              ? "Your session has expired or does not have admin access."
              : "Check your connection and try again."}
          </ErrorState>
        </Card>
      ) : data ? (
        <>
          {isError && (
            <p
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              Refresh failed. Showing the last successful report.{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => void refetch()}
              >
                Retry
              </button>
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <p>
              {reportDate(data.filters.startDate)} –{" "}
              {reportDate(data.filters.endDate)}{" "}
              <span className="ml-1 text-xs">({data.filters.timezone})</span>
            </p>
            <span role="status">
              {isFetching ? "Updating report..." : "Paid orders · PHP"}
            </span>
          </div>
          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Sales performance indicators"
          >
            {[
              {
                label: "Paid revenue",
                value: money(data.summary.totalRevenue, data.currency),
                note: "Non-cancelled paid orders, including shipping",
                icon: Wallet,
              },
              {
                label: "Total orders",
                value: data.summary.totalOrders.toLocaleString(),
                note: `${data.summary.salesCount.toLocaleString()} qualifying paid sales`,
                icon: ShoppingBag,
              },
              {
                label: "Average order value",
                value: money(data.summary.averageOrderValue, data.currency),
                note: "Paid revenue divided by paid sales",
                icon: Coins,
              },
              {
                label: "Units sold",
                value: data.summary.unitsSold.toLocaleString(),
                note: `${data.summary.paidOrderShare}% of orders qualify as paid sales`,
                icon: Package,
              },
            ].map(({ label, value, note, icon: Icon }) => (
              <StatCard
                key={label}
                label={label}
                value={value}
                note={note}
                icon={<Icon size={18} />}
              />
            ))}
          </section>
          {data.collections && (
            <Card className="p-5 sm:p-6">
              <SectionHeader
                title="COD collections by confirmation date"
                description={data.collections.basis}
                className="mb-4"
                actions={
                  <p className="text-right font-bold text-slate-900">
                    {money(data.collections.totalRevenue, data.currency)}
                    <span className="block text-xs font-normal text-slate-500">
                      {data.collections.collectionCount} collections
                    </span>
                  </p>
                }
              />
              <RevenueChart
                label="COD collections"
                report={{
                  ...data,
                  trend: data.collections.trend.map((point) => ({
                    date: point.date,
                    revenue: point.revenue,
                    salesCount: point.collectionCount,
                  })),
                }}
              />
            </Card>
          )}
          {data.summary.totalOrders === 0 ? (
            <Card>
              <EmptyState
                icon={<Activity size={36} />}
                title="No orders in this date range"
              >
                Try a longer period or choose a custom range.
              </EmptyState>
            </Card>
          ) : (
            data.summary.salesCount === 0 && (
              <p className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-800">
                Orders exist in this period, but none are explicitly paid and
                non-cancelled. Delivered COD orders remain unpaid unless payment
                is recorded.
              </p>
            )
          )}
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="p-5 sm:p-6 xl:col-span-2">
              <SectionHeader
                title="Revenue trend"
                description="Paid revenue by order creation date"
                className=""
              />
              <RevenueChart report={data} />
            </Card>
            <Card className="p-5 sm:p-6">
              <SectionHeader
                title="Orders by status"
                description="Fulfillment across all orders"
                className=""
              />
              <StatusChart report={data} />
            </Card>
          </div>
          <Card>
            <SectionHeader
              title="Top-selling products"
              description="Top 10 by units in paid sales. Historical item revenue excludes shipping."
            />
            {data.topProducts.length === 0 ? (
              <EmptyState className="p-10 text-center">
                No products sold in qualifying paid orders.
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[570px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-4">
                        Product
                      </th>
                      <th scope="col" className="px-5 py-4">
                        SKU
                      </th>
                      <th scope="col" className="px-5 py-4 text-right">
                        Units sold
                      </th>
                      <th scope="col" className="px-5 py-4 text-right">
                        Item revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.topProducts.map((product) => (
                      <tr key={product.productId} className="hover:bg-slate-50">
                        <td className="max-w-80 break-words px-5 py-4 font-semibold text-slate-800">
                          {product.name}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {product.sku}
                        </td>
                        <td className="px-5 py-4 text-right font-medium">
                          {product.quantitySold.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {money(product.revenue, data.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card>
            <SectionHeader
              title="Recent sales activity"
              description="Latest 10 qualifying paid orders in this range, by creation date."
              actions={
                <Link
                  to="/admin/orders"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline"
                >
                  All orders <ArrowUpRight size={15} />
                </Link>
              }
            />
            {data.recentSales.length === 0 ? (
              <EmptyState className="p-10 text-center">
                No qualifying paid sales in this period.
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      {[
                        "Order",
                        "Created",
                        "Units",
                        "Status",
                        "Paid total",
                      ].map((label) => (
                        <th key={label} scope="col" className="px-5 py-4">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentSales.map((sale) => (
                      <tr key={sale._id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <Link
                            to={`/admin/orders/${sale._id}`}
                            className="font-semibold text-indigo-600 hover:underline"
                            aria-label={`View order ${sale._id}`}
                          >
                            #{sale._id.slice(-8)}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {reportDate(sale.createdAt)}
                        </td>
                        <td className="px-5 py-4">{sale.quantity}</td>
                        <td className="px-5 py-4">
                          <Badge tone="emerald">{sale.orderStatus}</Badge>
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {money(sale.total, data.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <p className="text-xs leading-6 text-slate-500">
            {data.revenueBasis} This report uses the current payment and order
            statuses, not a historical payment ledger. Customer Management
            spending also includes unpaid orders and will differ.
          </p>
        </>
      ) : null}
    </div>
  );
}
