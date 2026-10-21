import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import axios from "axios";
import { Activity, ArrowUpRight, BarChart3, CalendarDays, Coins, Package, RefreshCw, ShoppingBag, Wallet } from "lucide-react";
import { analyticsApi, type AnalyticsFilters } from "./analytics.api";
import { RevenueChart, StatusChart } from "./AnalyticsCharts";
import { manilaToday, money, reportDate } from "./analytics.utils";
import { buttonClass, panelClass } from "../customers/customer.utils";

const initialFilters: AnalyticsFilters = { range: "30d", interval: "day" };
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function SalesAnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [draft, setDraft] = useState<AnalyticsFilters>(initialFilters);
  const [validationError, setValidationError] = useState("");
  const { data, error, isError, isPending, isFetching, refetch } = useQuery({
    queryKey: ["admin", "analytics", filters],
    queryFn: ({ signal }) => analyticsApi.report(filters, signal),
    staleTime: 30_000,
    gcTime: 0,
    retry: (count, failure) => !(axios.isAxiosError(failure) && [400, 401, 403].includes(failure.response?.status ?? 0)) && count < 1,
  });

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.range === "custom") {
      const days = (Date.parse(`${draft.endDate}T00:00:00+08:00`) - Date.parse(`${draft.startDate}T00:00:00+08:00`)) / 86_400_000 + 1;
      if (!Number.isFinite(days) || days < 1 || days > 366 || (draft.endDate ?? "") > manilaToday()) {
        setValidationError("Choose valid dates, in order, spanning at most 366 days and ending today or earlier.");
        return;
      }
    }
    setValidationError("");
    setFilters(draft.range === "custom" ? { ...draft } : { range: draft.range, interval: draft.interval });
  }

  const accessError = axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);
  const blockingError = isError && (!data || accessError);

  return <div className="mx-auto max-w-7xl space-y-6 pb-12">
    <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-lg sm:p-9">
      <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div><p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-300"><BarChart3 size={17} /> SHOPSPHERE / REPORTING</p><h1 className="text-3xl font-bold tracking-tight">Sales Analytics</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Track paid revenue, understand order activity, and discover your best-selling products.</p></div>
        <button type="button" onClick={() => void refetch()} disabled={isFetching} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"><RefreshCw size={16} className={isFetching ? "animate-spin" : ""} /> Refresh</button>
      </div>
    </header>

    <section className={`${panelClass} p-5 sm:p-6`} aria-label="Report filters">
      <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-4">
        <label className="min-w-40 flex-1 space-y-2"><span className="flex items-center gap-2 text-xs font-semibold text-slate-500"><CalendarDays size={15} /> DATE RANGE</span><select className={inputClass} value={draft.range} onChange={(event) => setDraft((previous) => ({ ...previous, range: event.target.value as AnalyticsFilters["range"] }))}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="custom">Custom range</option></select></label>
        {draft.range === "custom" && <>
          <label className="min-w-40 flex-1 space-y-2"><span className="text-xs font-semibold text-slate-500">START DATE</span><input type="date" required max={draft.endDate || manilaToday()} className={inputClass} value={draft.startDate ?? ""} onChange={(event) => setDraft((previous) => ({ ...previous, startDate: event.target.value }))} /></label>
          <label className="min-w-40 flex-1 space-y-2"><span className="text-xs font-semibold text-slate-500">END DATE</span><input type="date" required min={draft.startDate} max={manilaToday()} className={inputClass} value={draft.endDate ?? ""} onChange={(event) => setDraft((previous) => ({ ...previous, endDate: event.target.value }))} /></label>
        </>}
        <label className="min-w-36 flex-1 space-y-2"><span className="text-xs font-semibold text-slate-500">GROUP REVENUE BY</span><select className={inputClass} value={draft.interval} onChange={(event) => setDraft((previous) => ({ ...previous, interval: event.target.value as AnalyticsFilters["interval"] }))}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></label>
        <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Apply filters</button>
      </form>
      {validationError && <p role="alert" className="mt-3 text-sm text-rose-600">{validationError}</p>}
      <p className="mt-4 text-xs leading-5 text-slate-500">Asia/Manila calendar dates, including today. Custom ranges: up to 366 days. Weeks start Monday; first and last chart periods may be partial.</p>
    </section>

    {isPending ? <section className={`${panelClass} p-14 text-center`} role="status"><RefreshCw className="mx-auto mb-3 animate-spin text-indigo-500" size={24} /><p className="text-sm text-slate-500">Preparing your sales report...</p></section> : blockingError ? <section role="alert" className={`${panelClass} space-y-4 p-10 text-center`}><h2 className="text-lg font-bold text-slate-800">Unable to load sales analytics</h2><p className="text-sm text-slate-500">{accessError ? "Your session has expired or does not have admin access." : "Check your connection and try again."}</p>{accessError ? <Link to="/login" className="inline-block font-semibold text-indigo-600">Sign in again</Link> : <button type="button" className={buttonClass} onClick={() => void refetch()}>Try again</button>}</section> : data ? <>
      {isError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Refresh failed. Showing the last successful report. <button type="button" className="font-semibold underline" onClick={() => void refetch()}>Retry</button></p>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500"><p>{reportDate(data.filters.startDate)} – {reportDate(data.filters.endDate)} <span className="ml-1 text-xs">({data.filters.timezone})</span></p><span role="status">{isFetching ? "Updating report..." : "Paid orders · PHP"}</span></div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Sales performance indicators">
        {[
          { label: "Paid revenue", value: money(data.summary.totalRevenue, data.currency), note: "Non-cancelled paid orders, including shipping", icon: Wallet },
          { label: "Total orders", value: data.summary.totalOrders.toLocaleString(), note: `${data.summary.salesCount.toLocaleString()} qualifying paid sales`, icon: ShoppingBag },
          { label: "Average order value", value: money(data.summary.averageOrderValue, data.currency), note: "Paid revenue divided by paid sales", icon: Coins },
          { label: "Units sold", value: data.summary.unitsSold.toLocaleString(), note: `${data.summary.paidOrderShare}% of orders qualify as paid sales`, icon: Package },
        ].map(({ label, value, note, icon: Icon }) => <div key={label} className={`${panelClass} p-5`}><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Icon size={18} /></span></div><p className="mt-4 break-words text-3xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-2 text-xs leading-5 text-slate-400">{note}</p></div>)}
      </section>
      {data.summary.totalOrders === 0 ? <section className={`${panelClass} p-12 text-center`}><Activity size={36} className="mx-auto mb-4 text-slate-300" /><h2 className="font-bold text-slate-800">No orders in this date range</h2><p className="mt-2 text-sm text-slate-500">Try a longer period or choose a custom range.</p></section> : data.summary.salesCount === 0 && <p className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-800">Orders exist in this period, but none are explicitly paid and non-cancelled. Delivered COD orders remain unpaid unless payment is recorded.</p>}
      <div className="grid gap-6 xl:grid-cols-3">
        <section className={`${panelClass} p-5 sm:p-6 xl:col-span-2`}><h2 className="text-lg font-bold text-slate-900">Revenue trend</h2><p className="mt-1 text-sm text-slate-500">Paid revenue by order creation date</p><RevenueChart report={data} /></section>
        <section className={`${panelClass} p-5 sm:p-6`}><h2 className="text-lg font-bold text-slate-900">Orders by status</h2><p className="mt-1 text-sm text-slate-500">Fulfillment across all orders</p><StatusChart report={data} /></section>
      </div>
      <section className={panelClass}>
        <div className="border-b border-slate-100 p-5 sm:p-6"><h2 className="text-lg font-bold text-slate-900">Top-selling products</h2><p className="mt-1 text-sm text-slate-500">Top 10 by units in paid sales. Historical item revenue excludes shipping.</p></div>
        {data.topProducts.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No products sold in qualifying paid orders.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[570px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th scope="col" className="px-5 py-4">Product</th><th scope="col" className="px-5 py-4">SKU</th><th scope="col" className="px-5 py-4 text-right">Units sold</th><th scope="col" className="px-5 py-4 text-right">Item revenue</th></tr></thead><tbody className="divide-y divide-slate-100">{data.topProducts.map((product) => <tr key={product.productId} className="hover:bg-slate-50"><td className="max-w-80 break-words px-5 py-4 font-semibold text-slate-800">{product.name}</td><td className="px-5 py-4 text-slate-500">{product.sku}</td><td className="px-5 py-4 text-right font-medium">{product.quantitySold.toLocaleString()}</td><td className="px-5 py-4 text-right font-semibold">{money(product.revenue, data.currency)}</td></tr>)}</tbody></table></div>}
      </section>
      <section className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6"><div><h2 className="text-lg font-bold text-slate-900">Recent sales activity</h2><p className="mt-1 text-sm text-slate-500">Latest 10 qualifying paid orders in this range, by creation date.</p></div><Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline">All orders <ArrowUpRight size={15} /></Link></div>
        {data.recentSales.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No qualifying paid sales in this period.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Order", "Created", "Units", "Status", "Paid total"].map((label) => <th key={label} scope="col" className="px-5 py-4">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.recentSales.map((sale) => <tr key={sale._id} className="hover:bg-slate-50"><td className="px-5 py-4"><Link to={`/admin/orders/${sale._id}`} className="font-semibold text-indigo-600 hover:underline" aria-label={`View order ${sale._id}`}>#{sale._id.slice(-8)}</Link></td><td className="px-5 py-4 text-slate-500">{reportDate(sale.createdAt)}</td><td className="px-5 py-4">{sale.quantity}</td><td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium capitalize text-emerald-700">{sale.orderStatus}</span></td><td className="px-5 py-4 font-semibold">{money(sale.total, data.currency)}</td></tr>)}</tbody></table></div>}
      </section>
      <p className="text-xs leading-6 text-slate-500">{data.revenueBasis} This report uses the current payment and order statuses, not a historical payment ledger. Customer Management spending also includes unpaid orders and will differ.</p>
    </> : null}
  </div>;
}
