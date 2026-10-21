import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { customerApi } from "./customer.api";
import { CustomerError, CustomerHeader, CustomerPagination } from "./CustomerComponents";
import { date, panelClass, peso, spendingNote } from "./customer.utils";

export default function CustomerDetailsPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const rawPage = params.get("page") ?? "1";
  const page = /^[1-9]\d*$/.test(rawPage) && Number(rawPage) <= 1_000_000 ? Number(rawPage) : 1;
  const { data, isPending, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["admin", "customers", "detail", id, page],
    queryFn: ({ signal }) => customerApi.details(id, page, signal),
    retry: (count, failure) => !(axios.isAxiosError(failure) && [400, 401, 403, 404].includes(failure.response?.status ?? 0)) && count < 2,
  });
  return <div className="mx-auto max-w-7xl space-y-6 pb-12">
    <Link to="/admin/customers" className="text-sm font-semibold text-indigo-600 hover:underline">← Back to customers</Link>
    <CustomerHeader title="Customer profile" busy={isFetching} refresh={() => void refetch()}>Account information and complete order history.</CustomerHeader>
    {isPending ? <p role="status" className="p-14 text-center text-sm text-slate-500">Loading customer profile...</p> : isError ? <section className={panelClass}><CustomerError message={axios.isAxiosError(error) && error.response?.status === 404 ? "Customer not found." : "Unable to load this customer. Check your session and connection."} retry={() => void refetch()} /></section> : <>
      <section className={`${panelClass} p-6`}><h2 className="break-words text-xl font-bold text-slate-900">{data.customer.name}</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Email address</dt><dd className="mt-1 break-all font-medium text-slate-800">{data.customer.email}</dd></div><div><dt className="text-slate-500">Registered</dt><dd className="mt-1 font-medium text-slate-800">{date(data.customer.createdAt)}</dd></div></dl></section>
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Order summary">{[["Total orders", data.summary.orderCount], ["Total spending", peso(data.summary.totalSpending)], ["Cancelled orders", data.summary.cancelledOrderCount]].map(([label, value]) => <div key={label} className={`${panelClass} p-5`}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></div>)}</section>
      <p className="text-xs text-slate-500">{spendingNote} Order counts include cancellations.</p>
      <section className={panelClass}><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-900">Order history</h2><p className="mt-1 text-sm text-slate-500">All orders, newest first.</p></div>
        {data.orders.length === 0 ? <p className="p-14 text-center text-sm text-slate-500">{data.summary.orderCount === 0 ? "This customer has not placed any orders yet." : "No orders on this page. Use Previous to return to earlier pages."}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Order", "Date", "Total", "Status", "Payment"].map((label) => <th key={label} scope="col" className="px-5 py-4">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.orders.map((order) => <tr key={order._id} className="hover:bg-slate-50"><td className="px-5 py-4"><Link to={`/admin/orders/${order._id}`} className="font-semibold text-indigo-600 hover:underline" aria-label={`View order ${order._id}`}>#{order._id.slice(-8)}</Link></td><td className="px-5 py-4 text-slate-500">{date(order.createdAt)}</td><td className="px-5 py-4 font-semibold">{peso(order.total)}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${order.orderStatus === "cancelled" ? "bg-rose-50 text-rose-700" : order.orderStatus === "delivered" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}>{order.orderStatus}</span></td><td className="px-5 py-4 capitalize text-slate-600">{order.paymentStatus}</td></tr>)}</tbody></table></div>}
        <CustomerPagination pagination={data.pagination} busy={isFetching} change={(next) => setParams({ page: String(next) })} />
      </section>
    </>}
  </div>;
}
