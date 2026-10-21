import PageHeader from "../../components/ui/PageHeader";
import RefreshButton from "../../components/ui/RefreshButton";
import StatCard from "../../components/ui/StatCard";
import SearchInput from "../../components/ui/SearchInput";
import Pagination from "../../components/ui/Pagination";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SectionHeader from "../../components/ui/SectionHeader";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import { formatDateTime } from "../../lib/formatters";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  History,
  Package,
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
      <PageHeader
        variant="hero"
        title="Inventory Activity"
        subtitle="Track manual stock adjustments, search products, and see who made each change."
        eyebrow={
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-300">
            <History size={17} aria-hidden="true" /> INVENTORY AUDIT TRAIL
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

      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Current page statistics"
      >
        <StatCard
          variant="stacked"
          label="Movements on this page"
          value={movements.length}
          icon={<History size={19} />}
        />
        <StatCard
          variant="stacked"
          label="Units added on this page"
          value={`+${added}`}
          icon={<ArrowUpRight size={19} />}
          tone="emerald"
        />
        <StatCard
          variant="stacked"
          label="Units removed on this page"
          value={`−${removed}`}
          icon={<ArrowDownRight size={19} />}
          tone="rose"
        />
      </section>

      <Card>
        <div className="space-y-4 border-b border-slate-100 p-5 sm:p-6">
          <SectionHeader
            className=""
            title="Stock Movement Records"
            description={
              <>{pagination?.total ?? 0} matching adjustments · newest first</>
            }
            actions={
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <SlidersHorizontal size={16} /> Filters
              </div>
            }
          />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form
              className="relative flex min-w-0 flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput.trim());
                setPage(1);
              }}
            >
              <SearchInput
                type="text"
                label="Search product name or SKU"
                value={searchInput}
                maxLength={100}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search product name or SKU..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-24 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                action={
                  <button
                    type="submit"
                    disabled={isFetching}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Search
                  </button>
                }
              />
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
          <LoadingState>Loading inventory history...</LoadingState>
        ) : isError ? (
          <ErrorState
            action={
              <Button variant="ghost" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          >
            Unable to load inventory history.
          </ErrorState>
        ) : movements.length === 0 ? (
          <EmptyState
            icon={<Package size={36} />}
            title="No matching stock movements"
            action={
              hasFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              )
            }
          >
            Try another product name, SKU, or movement type.
          </EmptyState>
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
                        {formatDateTime(movement.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            busy={isFetching}
            onPageChange={setPage}
            summary={
              <>
                Page {pagination.page} of {pagination.totalPages}
              </>
            }
            previousLabel={
              <>
                <ArrowLeft size={15} aria-hidden="true" /> Previous
              </>
            }
            nextLabel={
              <>
                Next <ArrowRight size={15} aria-hidden="true" />
              </>
            }
          />
        )}
      </Card>
    </div>
  );
}
