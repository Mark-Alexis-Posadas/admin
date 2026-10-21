import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  History,
  AlertCircle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CircleOff,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import axios from "axios";
import type { AdminProduct } from "./product.types";
import AdjustStockModal from "./AdjustStockModal";
import { productApi } from "./product.api";

type ProductFilter = "all" | "active" | "inactive" | "low-stock";
type StockUpdate = {
  productId: string;
  productName: string;
  sku: string;
  adjustment: number;
  previousStock: number;
  newStock: number;
};
const peso = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const filters: { value: ProductFilter; label: string }[] = [
  { value: "all", label: "All products" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "low-stock", label: "Low stock" },
];

function ProductThumbnail({ product }: { product: AdminProduct }) {
  const images = Array.isArray(product.images) ? product.images : [];
  const image = images.find((item) => item?.isPrimary) ?? images[0];
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  if (!image?.url || brokenUrl === image.url) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400">
        <Package size={20} strokeWidth={1.7} />
      </div>
    );
  }

  return (
    <img
      src={image.url}
      alt={image.alt || product.name || "Product"}
      loading="lazy"
      onError={() => setBrokenUrl(image.url)}
      className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover"
    />
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  note,
}: {
  label: string;
  value: number;
  icon: typeof Package;
  accent: "indigo" | "emerald" | "amber" | "slate";
  note: string;
}) {
  const palette = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`rounded-xl p-2.5 ${palette[accent]}`}>
          <Icon size={19} strokeWidth={1.9} />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </div>
  );
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(
    null,
  );

  const [lastStockUpdate, setLastStockUpdate] = useState<StockUpdate | null>(
    null,
  );

  const {
    data: products = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: productApi.getAll,
  });

  useEffect(() => {
    if (!lastStockUpdate) return;

    document
      .getElementById(`product-${lastStockUpdate.productId}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }, [lastStockUpdate]);

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productApi.updateStatus(id, isActive),
    onSuccess: async () => {
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (err) => {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ??
              "Status update failed. Please try again.")
          : "Status update failed. Please try again.",
      );
    },
  });

  const stats = useMemo(() => {
    const active = products.filter((product) => product.isActive).length;
    const lowStock = products.filter(
      (product) => (product.stock ?? 0) <= (product.lowStockThreshold ?? 0),
    ).length;
    return {
      total: products.length,
      active,
      inactive: products.length - active,
      lowStock,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.sku,
        product.category,
        product.brand,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      );
      const lowStock = (product.stock ?? 0) <= (product.lowStockThreshold ?? 0);
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && product.isActive) ||
        (filter === "inactive" && !product.isActive) ||
        (filter === "low-stock" && lowStock);
      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  const hasFilters = search.trim().length > 0 || filter !== "all";

  function toggleStatus(product: AdminProduct) {
    const nextStatus = !product.isActive;
    if (
      !window.confirm(
        `${nextStatus ? "Activate" : "Deactivate"} ${product.name}?`,
      )
    )
      return;
    statusMutation.mutate({ id: product._id, isActive: nextStatus });
  }

  if (isError && products.length === 0) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle size={26} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Unable to load products
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Check your admin session and backend connection, then try again.
          </p>
          <button
            onClick={() => void refetch()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-lg shadow-slate-200 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-36 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100">
              <Sparkles size={13} /> ShopSphere / Catalog
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Product inventory
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Manage your catalog, keep stock accurate, and control what
              customers see.
            </p>
          </div>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Plus size={18} /> Add product{" "}
            <ArrowUpRight size={15} className="text-slate-400" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total products"
          value={stats.total}
          icon={Boxes}
          accent="indigo"
          note="Products in your catalog"
        />
        <StatCard
          label="Active products"
          value={stats.active}
          icon={CheckCircle2}
          accent="emerald"
          note="Visible to customers"
        />
        <StatCard
          label="Low stock"
          value={stats.lowStock}
          icon={AlertCircle}
          accent="amber"
          note="At or below threshold"
        />
        <StatCard
          label="Inactive products"
          value={stats.inactive}
          icon={CircleOff}
          accent="slate"
          note="Hidden from storefront"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                All products
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Browse and update your ShopSphere catalog.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isFetching ? "animate-spin" : ""}
              />{" "}
              Refresh
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, SKU, brand, category..."
                aria-label="Search products"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as ProductFilter)
                }
                aria-label="Filter products"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 lg:min-w-44"
              >
                {filters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredProducts.length}
              </span>{" "}
              of {products.length} products
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-6"
          >
            <AlertCircle size={17} className="shrink-0" /> {error}
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
              className="ml-auto"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {lastStockUpdate && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <div>
              <p className="font-semibold text-emerald-900">
                Stock updated successfully!
              </p>

              <p className="mt-1 text-sm text-emerald-800">
                {lastStockUpdate.productName} · {lastStockUpdate.sku}
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                {lastStockUpdate.adjustment > 0 ? "Added" : "Removed"}{" "}
                {Math.abs(lastStockUpdate.adjustment)} units
                {" · "}
                {lastStockUpdate.previousStock} → {lastStockUpdate.newStock}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLastStockUpdate(null)}
              aria-label="Dismiss notification"
              className="text-emerald-800 hover:text-emerald-950"
            >
              ✕
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4 sm:pl-6">Product</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Price</th>
                <th className="px-4 py-4">Inventory</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-5 py-4 text-right sm:pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-5">
                      <div className="h-10 rounded-lg bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Package size={26} />
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900">
                      {hasFilters ? "No matching products" : "No products yet"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {hasFilters
                        ? "Try a different search or filter."
                        : "Add your first product to start building your catalog."}
                    </p>
                    {hasFilters ? (
                      <button
                        onClick={() => {
                          setSearch("");
                          setFilter("all");
                        }}
                        className="mt-4 text-sm font-semibold text-indigo-600 hover:underline"
                      >
                        Clear filters
                      </button>
                    ) : (
                      <Link
                        to="/admin/products/new"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"
                      >
                        <Plus size={16} /> Add product
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stock = product.stock ?? 0;
                  const threshold = product.lowStockThreshold ?? 0;
                  const lowStock = stock <= threshold;
                  const progress = Math.min(
                    100,
                    Math.max(0, (stock / Math.max(threshold * 3, 1)) * 100),
                  );
                  const busy = statusMutation.isPending;
                  const updatingThis =
                    busy && statusMutation.variables?.id === product._id;

                  return (
                    <tr
                      key={product._id}
                      id={`product-${product._id}`}
                      className={`border-t transition-colors ${
                        lastStockUpdate?.productId === product._id
                          ? "bg-emerald-50 ring-1 ring-inset ring-emerald-200"
                          : "border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-5 py-4 sm:pl-6">
                        <div className="flex min-w-56 items-center gap-3">
                          <ProductThumbnail product={product} />
                          <div className="min-w-0">
                            <p
                              className="max-w-64 truncate font-semibold text-slate-900"
                              title={product.name}
                            >
                              {product.name || "Untitled product"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              SKU: {product.sku || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                          {product.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                        {peso(product.price)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`font-semibold ${lowStock ? "text-amber-700" : "text-slate-800"}`}
                            >
                              {stock} units
                            </span>
                            {lowStock && (
                              <AlertCircle
                                size={15}
                                className="text-amber-500"
                                aria-label="Low stock"
                              />
                            )}
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${lowStock ? "bg-amber-400" : "bg-emerald-500"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {lowStock
                              ? "Low stock"
                              : `Alert at ${threshold} units`}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${product.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                          />
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 sm:pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/products/${product._id}/edit`}
                            title="Edit product"
                            aria-label={`Edit ${product.name}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <Pencil size={14} /> Edit
                          </Link>
                          <Link
                            to={`/admin/inventory?productId=${product._id}`}
                            title={`View stock history for ${product.name}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <History size={15} />
                            History
                          </Link>
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            title="Adjust stock"
                            aria-label={`Adjust stock for ${product.name}`}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <PackagePlus size={15} /> Stock
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleStatus(product)}
                            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${product.isActive ? "text-rose-600 hover:bg-rose-50" : "text-emerald-700 hover:bg-emerald-50"}`}
                          >
                            {updatingThis
                              ? "Saving..."
                              : product.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredProducts.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500 sm:px-6">
            <span>
              {filteredProducts.length} product
              {filteredProducts.length === 1 ? "" : "s"} displayed
            </span>
            <span>Stock levels reflect the latest loaded inventory</span>
          </div>
        )}
      </section>

      {selectedProduct && (
        <AdjustStockModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={(update) => {
            setLastStockUpdate(update);
          }}
        />
      )}
    </div>
  );
}
