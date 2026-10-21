import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Users } from "lucide-react";
import { customerApi } from "./customer.api";
import { CustomerError, CustomerHeader, CustomerPagination } from "./CustomerComponents";
import { buttonClass, date, panelClass, peso, spendingNote } from "./customer.utils";

export default function CustomersPage() {
  const [input, setInput] = useState("");
  const [filters, setFilters] = useState({ page: 1, search: "" });
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["admin", "customers", "list", filters],
    queryFn: ({ signal }) => customerApi.list(filters.page, filters.search, signal),
  });
  return <div className="mx-auto max-w-7xl space-y-6 pb-12">
    <CustomerHeader title="Customers" busy={isFetching} refresh={() => void refetch()}>Get to know your customers and explore their order history.</CustomerHeader>
    <section className={panelClass}>
      <div className="space-y-4 border-b border-slate-100 p-5 sm:p-6">
        <div><h2 className="text-lg font-bold text-slate-900">Customer directory</h2><p className="mt-1 text-sm text-slate-500">{data ? `${data.pagination.total} ${filters.search ? "matching" : "registered"} customers` : "Registered customer accounts"}</p></div>
        <form className="flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); setFilters({ page: 1, search: input.trim() }); }}>
          <div className="relative min-w-48 flex-1"><Search size={18} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Search customers by name or email" type="search" maxLength={100} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search name or email..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>
          <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Search</button>
          {(input || filters.search) && <button type="button" className={buttonClass} onClick={() => { setInput(""); setFilters({ page: 1, search: "" }); }}>Clear</button>}
        </form>
        <p className="text-xs text-slate-500">{spendingNote} Order counts include cancellations.</p>
      </div>
      {isPending ? <p role="status" className="p-14 text-center text-sm text-slate-500">Loading customers...</p> : isError ? <CustomerError retry={() => void refetch()} /> : data.customers.length === 0 ? <div className="space-y-3 p-14 text-center"><Users className="mx-auto text-slate-300" size={36} /><h3 className="font-semibold text-slate-800">{filters.search ? "No matching customers" : "No customers yet"}</h3><p className="text-sm text-slate-500">{filters.search ? "Try another name or email address." : "Customer accounts will appear here after registration."}</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Customer", "Total orders", "Total spending", "Registered", ""].map((label) => <th key={label} className="px-5 py-4" scope="col">{label || <span className="sr-only">Details</span>}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.customers.map((customer) => <tr key={customer._id} className="hover:bg-slate-50"><td className="max-w-80 break-words px-5 py-4"><p className="font-semibold text-slate-900">{customer.name}</p><p className="mt-1 text-xs text-slate-500">{customer.email}</p></td><td className="px-5 py-4 font-medium">{customer.orderCount}</td><td className="px-5 py-4 font-semibold text-slate-800">{peso(customer.totalSpending)}</td><td className="px-5 py-4 text-slate-500">{date(customer.createdAt)}</td><td className="px-5 py-4"><Link className="font-semibold text-indigo-600 hover:underline" to={`/admin/customers/${customer._id}`} aria-label={`View ${customer.name}'s profile`}>View profile</Link></td></tr>)}</tbody></table></div>}
      {data && !isError && <CustomerPagination pagination={data.pagination} busy={isFetching} change={(page) => setFilters((previous) => ({ ...previous, page }))} />}
    </section>
  </div>;
}
