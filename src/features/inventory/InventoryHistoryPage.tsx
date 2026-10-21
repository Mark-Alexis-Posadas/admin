import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  History,
  Package,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { inventoryApi } from "./inventory.api";

type MovementType = "all" | "added" | "removed";
const PAGE_SIZE = 10;

export default function InventoryHistoryPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<MovementType>("all");
  const [productId, setProductId] = useState<string | undefined>(undefined);

  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: [
      "admin",
      "inventory",
      "movements",
      page,
      search,
      type,
      productId,
    ],
    queryFn: () =>
      inventoryApi.getMovements({
        page,
        limit: PAGE_SIZE,
        search,
        type,
        productId,
      }),
    placeholderData: (previous) => previous,
  });

  const movements = data?.movements ?? [];
  const pagination = data?.pagination;
  const added = movements.reduce(
    (sum, item) => sum + Math.max(0, item.adjustment),
    0,
  );
  const removed = movements.reduce(
    (sum, item) => sum + Math.max(0, -item.adjustment),
    0,
  );
  const hasFilters = Boolean(search || productId || type !== "all");

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setType("all");
    setProductId(undefined);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-xl sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-300">
              <History size={17} /> INVENTORY AUDIT TRAIL
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Inventory Activity
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Track manual stock adjustments, search products, and see who made
              each change.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </div>
      </header>

      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Current page statistics"
      >
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
          value={`−${removed}`}
          icon={<ArrowDownRight size={19} />}
          tone="red"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-4 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Stock Movement Records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {pagination?.total ?? 0} matching adjustments · newest first
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <SlidersHorizontal size={16} /> Filters
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form
              className="relative flex min-w-0 flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput.trim());
                setPage(1);
              }}
            >
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Search product name or SKU"
                value={searchInput}
                maxLength={100}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search product name or SKU..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-24 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={isFetching}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Search
              </button>
            </form>
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Movement type"
            >
              {(["all", "added", "removed"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={type === value}
                  onClick={() => {
                    setType(value);
                    setPage(1);
                  }}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold capitalize transition ${type === value ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  {value === "all" ? "All movements" : value}
                </button>
              ))}
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                  <X size={15} /> Clear
                </button>
              )}
            </div>
          </div>
          {productId && (
            <p className="text-xs text-indigo-700">
              Showing one product only.{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => {
                  setProductId(undefined);
                  setPage(1);
                }}
              >
                Show all products
              </button>
            </p>
          )}
        </div>

        {isPending ? (
          <div className="p-14 text-center text-sm text-slate-500">
            Loading inventory history...
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-3 p-14 text-center">
            <p className="text-sm text-rose-600">
              Unable to load inventory history.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-sm font-semibold text-indigo-600"
            >
              Try again
            </button>
          </div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-14 text-center">
            <Package size={36} className="text-slate-300" />
            <h3 className="font-semibold text-slate-800">
              No matching stock movements
            </h3>
            <p className="text-sm text-slate-500">
              Try another product name, SKU, or movement type.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-indigo-600"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Adjustment</th>
                  <th className="px-5 py-4">Stock change</th>
                  <th className="px-5 py-4">Reason</th>
                  <th className="px-5 py-4">Updated by</th>
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
                        {movement.product && (
                          <button
                            type="button"
                            onClick={() => {
                              setProductId(movement.product!._id);
                              setPage(1);
                            }}
                            className="mt-1 text-xs font-semibold text-indigo-600 hover:underline"
                          >
                            View product history
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold ${isAddition ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
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
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                        {movement.previousStock}
                        <ArrowRight
                          size={14}
                          className="mx-2 inline text-slate-400"
                        />
                        {movement.newStock}
                      </td>
                      <td
                        className="max-w-[220px] break-words px-5 py-4 text-sm text-slate-600"
                        title={movement.reason}
                      >
                        {movement.reason}
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
                          timeZone: "Asia/Manila",
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
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                <ArrowLeft size={15} className="mr-1 inline" /> Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Next <ArrowRight size={15} className="ml-1 inline" />
              </button>
            </div>
          </div>
        )}
      </section>
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
