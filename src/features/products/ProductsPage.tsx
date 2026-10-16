import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil } from "lucide-react";
import axios from "axios";
import type { AdminProduct } from "./product.types";
import AdjustStockModal from "./AdjustStockModal";
import { productApi } from "./product.api";

const peso = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(
    null,
  );
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: productApi.getAll,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productApi.updateStatus(id, isActive),

    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({
        queryKey: ["admin", "products"],
      });
    },

    onError: (err) => {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Status update failed.")
          : "Status update failed.",
      );
    },
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = search.trim().toLowerCase();

      const matchesSearch = [
        product.name,
        product.sku,
        product.category,
        product.brand,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && product.isActive) ||
        (filter === "inactive" && !product.isActive) ||
        (filter === "low-stock" && product.stock <= product.lowStockThreshold);

      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  if (isLoading) {
    return <p>Loading products...</p>;
  }

  if (isError) {
    return (
      <p className="text-red-600">
        Failed to load products. Check your admin session.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your ShopSphere inventory.
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Products", value: products.length },
          {
            label: "Active Products",
            value: products.filter((p) => p.isActive).length,
          },
          {
            label: "Low Stock",
            value: products.filter((p) => p.stock <= p.lowStockThreshold)
              .length,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, SKU, category..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5"
        >
          <option value="all">All Products</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="low-stock">Low Stock</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => {
              const lowStock = product.stock <= product.lowStockThreshold;

              const images = Array.isArray(product.images)
                ? product.images
                : [];

              const image = images.find((img) => img.isPrimary) ?? images[0];
              return (
                <tr key={product._id} className="border-t border-slate-100">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {image ? (
                        <img
                          src={image.url}
                          alt={image.alt || product.name}
                          className="h-12 w-12 rounded-lg bg-slate-100 object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-100" />
                      )}

                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>

                  <td className="p-4 text-slate-500">{product.sku}</td>

                  <td className="p-4">{product.category}</td>

                  <td className="p-4 font-medium">{peso(product.price)}</td>

                  <td className="p-4">
                    <span
                      className={
                        lowStock
                          ? "font-semibold text-red-600"
                          : "text-slate-700"
                      }
                    >
                      {product.stock}
                      {lowStock && " · Low"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        product.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <Link
                        to={`/admin/products/${product._id}/edit`}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        <Pencil size={15} />
                        Edit
                      </Link>
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        Adjust Stock
                      </button>
                      <button
                        disabled={statusMutation.isPending}
                        onClick={() => {
                          const nextStatus = !product.isActive;

                          if (
                            !window.confirm(
                              `${nextStatus ? "Activate" : "Deactivate"} ${product.name}?`,
                            )
                          ) {
                            return;
                          }

                          statusMutation.mutate({
                            id: product._id,
                            isActive: nextStatus,
                          });
                        }}
                        className="font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                      >
                        {product.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedProduct && (
        <AdjustStockModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
