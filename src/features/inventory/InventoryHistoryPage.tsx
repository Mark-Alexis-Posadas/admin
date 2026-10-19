import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  History,
  Package,
  RefreshCw,
} from "lucide-react";

import { inventoryApi } from "./inventory.api";

const PAGE_SIZE = 10;

export default function InventoryHistoryPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["admin", "inventory", "movements", page],
    queryFn: () =>
      inventoryApi.getMovements({
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  });

  const movements = data?.movements ?? [];
  const pagination = data?.pagination;

  const added = movements.reduce(
    (sum, item) => sum + Math.max(item.adjustment, 0),
    0,
  );

  const removed = movements.reduce(
    (sum, item) => sum + Math.abs(Math.min(item.adjustment, 0)),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-xl sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-300">
              <History size={17} />
              Inventory Audit Trail
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Inventory Activity
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Monitor every manual stock adjustment, track quantities, and
              identify which administrator made the change.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Movements on this page"
          value={movements.length}
          icon={<History size={19} />}
        />

        <StatCard
          label="Units added on this page"
          value={`+${added}`}
          icon={<ArrowUpRight size={19} />}
          tone="green"
        />

        <StatCard
          label="Units removed on this page"
          value={`-${removed}`}
          icon={<ArrowDownRight size={19} />}
          tone="red"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Stock Movement Records
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {pagination?.total ?? 0} total adjustments recorded
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
            <Boxes size={15} />
            Newest first
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            Loading inventory history...
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-red-600">
            Unable to load inventory history.
          </div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-14 text-center">
            <Package size={36} className="text-slate-300" />
            <h3 className="font-semibold text-slate-800">
              No stock movements yet
            </h3>
            <p className="text-sm text-slate-500">
              Adjustments will appear here once stock is updated.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Adjustment</th>
                  <th className="px-5 py-4">Stock Change</th>
                  <th className="px-5 py-4">Reason</th>
                  <th className="px-5 py-4">Updated By</th>
                  <th className="px-5 py-4">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {movements.map((movement) => {
                  const isAddition = movement.adjustment > 0;

                  return (
                    <tr
                      key={movement._id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {movement.product?.name ?? "Deleted product"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {movement.product?.sku ?? "Unavailable SKU"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold ${
                            isAddition
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {isAddition ? (
                            <ArrowUpRight size={15} />
                          ) : (
                            <ArrowDownRight size={15} />
                          )}
                          {isAddition ? "+" : ""}
                          {movement.adjustment}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {movement.previousStock}
                        <ArrowRight
                          size={14}
                          className="mx-2 inline text-slate-400"
                        />
                        {movement.newStock}
                      </td>

                      <td className="max-w-[220px] px-5 py-4 text-sm text-slate-600">
                        <span title={movement.reason}>{movement.reason}</span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-800">
                          {movement.admin?.name ?? "Unknown admin"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {movement.admin?.email ?? ""}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {new Date(movement.createdAt).toLocaleString("en-PH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                <ArrowLeft size={15} className="mr-1 inline" />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pagination.totalPages || isFetching}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Next
                <ArrowRight size={15} className="ml-1 inline" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "slate",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: "slate" | "green" | "red";
}) {
  const colors = {
    slate: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 inline-flex rounded-xl p-3 ${colors[tone]}`}>
        {icon}
      </div>

      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
