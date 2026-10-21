import type { ReactNode } from "react";
import { RefreshCw, Users } from "lucide-react";
import type { Pagination } from "./customer.api";

import { buttonClass } from "./customer.utils";

export function CustomerHeader({ title, children, busy, refresh }: { title: string; children: ReactNode; busy: boolean; refresh: () => void }) {
  return <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-lg sm:p-9">
    <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
    <div className="relative flex flex-wrap items-start justify-between gap-5">
      <div className="min-w-0"><p className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-300"><Users size={17} /> SHOPSPHERE / CUSTOMERS</p><h1 className="break-words text-3xl font-bold tracking-tight">{title}</h1><div className="mt-2 text-sm leading-6 text-slate-300">{children}</div></div>
      <button type="button" onClick={refresh} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/20 disabled:opacity-50"><RefreshCw size={16} className={busy ? "animate-spin" : ""} /> Refresh</button>
    </div>
  </header>;
}
export function CustomerError({ message, retry }: { message?: string; retry: () => void }) {
  return <div role="alert" className="space-y-3 p-10 text-center"><p className="text-sm text-rose-600">{message ?? "Unable to load customers. Check your session and connection."}</p><button type="button" onClick={retry} className={buttonClass}>Try again</button></div>;
}
export function CustomerPagination({ pagination, busy, change }: { pagination: Pagination; busy: boolean; change: (page: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5"><p className="text-sm text-slate-500">{pagination.total} records · Page {pagination.page} of {Math.max(1, pagination.totalPages)}</p><div className="flex gap-2"><button type="button" className={buttonClass} disabled={busy || pagination.page <= 1} onClick={() => change(pagination.page - 1)}>Previous</button><button type="button" className={buttonClass} disabled={busy || pagination.page >= pagination.totalPages} onClick={() => change(pagination.page + 1)}>Next</button></div></div>;
}
