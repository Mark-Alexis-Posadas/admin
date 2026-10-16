import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { productApi } from "./product.api";
import type { ProductPayload } from "./product.types";

const emptyForm: ProductPayload = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  shortDescription: "",
  price: 0,
  compareAtPrice: null,
  category: "",
  brand: "",
  stock: 0,
  lowStockThreshold: 5,
  images: [],
  tags: [],
  weight: null,
  isFeatured: false,
};

export default function ProductFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ProductPayload>(emptyForm);
  const [imageUrl, setImageUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "products", id],
    queryFn: () => productApi.getById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!product) return;

    setForm({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      images: product.images,
      tags: product.tags,
      weight: product.weight,
      isFeatured: product.isFeatured,
    });

    setImageUrl(product.images[0]?.url ?? "");
    setTagsInput(product.tags.join(", "));
  }, [product]);

  const mutation = useMutation({
    mutationFn: (payload: ProductPayload) => {
      if (isEditing) {
        const { stock: _stock, ...details } = payload;

        return productApi.update(id!, details);
      }

      return productApi.create(payload);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "products"],
      });

      navigate("/admin/products");
    },

    onError: (err) => {
      if (axios.isAxiosError(err)) {
        const response = err.response?.data;

        setError(
          response?.error ?? response?.message ?? "Unable to save product.",
        );
      } else {
        setError("Unable to save product.");
      }
    },
  });

  function update<K extends keyof ProductPayload>(
    key: K,
    value: ProductPayload[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedImageUrl = imageUrl.trim();

    const images = trimmedImageUrl
      ? [
          {
            url: trimmedImageUrl,
            alt: form.name,
            isPrimary: true,
          },
        ]
      : [];

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    mutation.mutate({
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category.trim(),
      images,
      tags,
    });
  }

  if (isEditing && isLoading) {
    return <p>Loading product...</p>;
  }

  if (isEditing && isError) {
    return <p>Failed to load product.</p>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to="/admin/products"
        className="text-sm font-medium text-indigo-600"
      >
        ← Back to Products
      </Link>

      <div>
        <h2 className="text-2xl font-bold">
          {isEditing ? "Edit Product" : "Add Product"}
        </h2>
        <p className="mt-1 text-slate-500">
          {isEditing
            ? "Update product information and inventory."
            : "Create a new product for your store."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Product Name">
            <input
              required
              minLength={2}
              maxLength={150}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Slug">
            <input
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="wireless-headphones"
              className={inputClass}
            />
          </Field>

          <Field label="SKU">
            <input
              required
              value={form.sku}
              onChange={(e) => update("sku", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Category">
            <input
              required
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Brand">
            <input
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Price (PHP)">
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => update("price", Number(e.target.value))}
              className={inputClass}
            />
          </Field>

          <Field label="Compare-at Price (optional)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.compareAtPrice ?? ""}
              onChange={(e) =>
                update(
                  "compareAtPrice",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              className={inputClass}
            />
          </Field>

          <Field label="Stock">
            <input
              type="number"
              required
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) => update("stock", Number(e.target.value))}
              className={inputClass}
            />
          </Field>

          <Field label="Low Stock Threshold">
            <input
              type="number"
              min={0}
              step={1}
              value={form.lowStockThreshold}
              onChange={(e) =>
                update("lowStockThreshold", Number(e.target.value))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Weight (optional)">
            <input
              type="number"
              min={0}
              step="any"
              value={form.weight ?? ""}
              onChange={(e) =>
                update(
                  "weight",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Short Description">
          <textarea
            rows={2}
            maxLength={300}
            value={form.shortDescription}
            onChange={(e) => update("shortDescription", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Full Description">
          <textarea
            rows={5}
            required
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Primary Image URL">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/product.jpg"
            className={inputClass}
          />
        </Field>

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Product preview"
            className="h-32 w-32 rounded-lg border object-cover"
          />
        )}
        {!isEditing && (
          <Field label="Initial Stock">
            <input
              type="number"
              required
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) => update("stock", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        )}

        <Field label="Tags (comma separated)">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="audio, wireless, bluetooth"
            className={inputClass}
          />
        </Field>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => update("isFeatured", e.target.checked)}
          />
          Featured Product
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Product"}
          </button>

          <Link
            to="/admin/products"
            className="rounded-lg border border-slate-300 px-6 py-3 font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
