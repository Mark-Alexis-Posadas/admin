import Field from "../../components/ui/FormField";
import Section from "./components/ProductFormSection";
import { formatCurrency as peso } from "../../lib/formatters";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Box,
  Check,
  ImageIcon,
  Info,
  Loader2,
  Package,
  Save,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { productApi } from "./product.api";
import type { ProductPayload, ProductImage } from "./product.types";

const blank: ProductPayload = {
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

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function ProductFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductPayload>({ ...blank });
  const [imageUrl, setImageUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

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
    const images = Array.isArray(product.images) ? product.images : [];
    const primary = images.find((img) => img.isPrimary) ?? images[0];
    setForm({
      name: product.name ?? "",
      slug: product.slug ?? "",
      sku: product.sku ?? "",
      description: product.description ?? "",
      shortDescription: product.shortDescription ?? "",
      price: product.price ?? 0,
      compareAtPrice: product.compareAtPrice ?? null,
      category: product.category ?? "",
      brand: product.brand ?? "",
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      images,
      tags: Array.isArray(product.tags) ? product.tags : [],
      weight: product.weight ?? null,
      isFeatured: Boolean(product.isFeatured),
    });
    setImageUrl(primary?.url ?? "");
    setTagsInput(Array.isArray(product.tags) ? product.tags.join(", ") : "");
    setSlugEdited(true);
  }, [product]);

  const mutation = useMutation({
    mutationFn: (payload: ProductPayload) => {
      if (isEditing) {
        const { stock: _stock, ...details } = payload;
        void _stock;
        return productApi.update(id!, details);
      }
      return productApi.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      navigate("/admin/products");
    },
    onError: (err: unknown) => {
      const response = axios.isAxiosError(err) ? err.response?.data : undefined;
      const message = response?.error ?? response?.message;
      setError(
        typeof message === "string"
          ? message
          : "Unable to save product. Check the fields and try again.",
      );
    },
  });

  function update<K extends keyof ProductPayload>(
    key: K,
    value: ProductPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const previewImages = useMemo(() => {
    const existing = Array.isArray(form.images) ? form.images : [];
    const primary = existing.find((img) => img.isPrimary) ?? existing[0];
    return { primary, extra: existing.filter((img) => img !== primary) };
  }, [form.images]);

  const finalStock = Number(form.stock) || 0;
  const lowStock = isEditing
    ? (product?.stock ?? 0) <= form.lowStockThreshold
    : finalStock <= form.lowStockThreshold;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const trimmedUrl = imageUrl.trim();
    const existingImages = Array.isArray(form.images) ? form.images : [];
    const previousPrimary =
      existingImages.find((img) => img.isPrimary) ?? existingImages[0];
    // Preserve all secondary images instead of silently deleting them on edit.
    const secondaryImages = existingImages.filter(
      (img) => img !== previousPrimary,
    );
    const images: ProductImage[] = trimmedUrl
      ? [
          { url: trimmedUrl, alt: form.name.trim(), isPrimary: true },
          ...secondaryImages.map((img) => ({ ...img, isPrimary: false })),
        ]
      : secondaryImages.length
        ? [
            { ...secondaryImages[0], isPrimary: true },
            ...secondaryImages
              .slice(1)
              .map((img) => ({ ...img, isPrimary: false })),
          ]
        : [];
    const tags = [
      ...new Set(
        tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ];
    if (
      !form.name.trim() ||
      !form.sku.trim() ||
      !form.category.trim() ||
      !form.description.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }
    const slug = slugify(form.slug);
    if (!slug) {
      setError("Please enter a valid product slug.");
      return;
    }
    if (
      !Number.isFinite(form.price) ||
      form.price < 0 ||
      !Number.isSafeInteger(form.lowStockThreshold) ||
      form.lowStockThreshold < 0 ||
      (!isEditing && (!Number.isSafeInteger(form.stock) || form.stock < 0))
    ) {
      setError(
        "Please enter valid prices and non-negative whole-number inventory values.",
      );
      return;
    }
    mutation.mutate({
      ...form,
      name: form.name.trim(),
      slug,
      sku: form.sku.trim().toUpperCase(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim(),
      images,
      tags,
    });
  }

  if (isEditing && isLoading)
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-5">
        <div className="h-12 w-64 rounded-xl bg-slate-200" />
        <div className="h-72 rounded-2xl bg-slate-100" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
    );
  if (isEditing && isError)
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <p className="font-semibold text-rose-800">
          Could not load this product.
        </p>
        <Link
          to="/admin/products"
          className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline"
        >
          Back to products
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
          >
            <ArrowLeft size={16} /> Back to products
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
              <Package size={23} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {isEditing ? "Edit product" : "Create product"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? "Refine your product listing. Inventory is managed separately."
                  : "Add a new product to your ShopSphere catalog."}
              </p>
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 sm:inline-flex">
          <BadgeCheck size={15} /> ShopSphere Catalog
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="space-y-6">
          <Section
            icon={<Box size={20} />}
            title="Basic information"
            subtitle="The essentials customers will see on your storefront."
          >
            <Field label="Product name" required>
              <input
                className={inputClass}
                required
                minLength={2}
                maxLength={150}
                placeholder="e.g. Wireless Ergonomic Mouse"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name,
                    ...(!slugEdited ? { slug: slugify(name) } : {}),
                  }));
                }}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="URL slug"
                hint="Used in product links. Lowercase letters, numbers, and hyphens."
                required
              >
                <input
                  className={inputClass}
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    update("slug", slugify(e.target.value));
                  }}
                  placeholder="wireless-ergonomic-mouse"
                />
              </Field>
              <Field label="SKU" hint="Unique inventory identifier." required>
                <input
                  className={inputClass}
                  required
                  value={form.sku}
                  onChange={(e) => update("sku", e.target.value.toUpperCase())}
                  placeholder="COMP-WEM-002"
                />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Category" required>
                <input
                  className={inputClass}
                  required
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder="Computer Accessories"
                />
              </Field>
              <Field label="Brand">
                <input
                  className={inputClass}
                  value={form.brand}
                  onChange={(e) => update("brand", e.target.value)}
                  placeholder="e.g. ErgoTech"
                />
              </Field>
            </div>
            <Field
              label="Short description"
              hint={`${form.shortDescription.length}/300 characters`}
            >
              <textarea
                className={inputClass}
                rows={2}
                maxLength={300}
                value={form.shortDescription}
                onChange={(e) => update("shortDescription", e.target.value)}
                placeholder="A quick summary of your product..."
              />
            </Field>
            <Field label="Full description" required>
              <textarea
                className={inputClass}
                rows={6}
                required
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Describe features, materials, specifications, and benefits..."
              />
            </Field>
          </Section>

          <Section
            icon={<Tag size={20} />}
            title="Pricing & organization"
            subtitle="Set the selling price and help customers discover this product."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Selling price (PHP)" required>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => update("price", Number(e.target.value))}
                />
              </Field>
              <Field
                label="Compare-at price (PHP)"
                hint="Optional original price for showing discounts."
              >
                <input
                  className={inputClass}
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
                  placeholder="Optional"
                />
              </Field>
            </div>
            <Field label="Tags" hint="Separate each tag with a comma.">
              <input
                className={inputClass}
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="wireless, office, ergonomic"
              />
            </Field>
            <Field label="Weight (kg)" hint="Optional product weight.">
              <input
                className={inputClass}
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
                placeholder="e.g. 0.5"
              />
            </Field>
          </Section>

          <Section
            icon={<ImageIcon size={20} />}
            title="Product media"
            subtitle="Set a primary image for the catalog and product detail pages."
          >
            <Field
              label="Primary image URL"
              hint="Paste a public HTTPS image URL. Other existing images are preserved when editing."
            >
              <input
                className={inputClass}
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImageFailed(false);
                }}
                placeholder="https://example.com/product.jpg"
              />
            </Field>
            {imageUrl.trim() && !imageFailed && (
              <div className="relative h-44 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img
                  src={imageUrl}
                  alt="New primary product preview"
                  className="h-full w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              </div>
            )}
            {imageUrl.trim() && imageFailed && (
              <p className="text-sm text-amber-700">
                Image preview could not load. Check the URL.
              </p>
            )}
            {isEditing && previewImages.extra.length > 0 && (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Info size={15} /> {previewImages.extra.length} additional saved
                image(s) will be preserved.
              </p>
            )}
            {imageUrl.trim() && (
              <button
                type="button"
                onClick={() => {
                  setImageUrl("");
                  setImageFailed(false);
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700"
              >
                <Trash2 size={15} /> Clear primary image
              </button>
            )}
          </Section>

          <Section
            icon={<Package size={20} />}
            title="Inventory settings"
            subtitle={
              isEditing
                ? "Current stock is read-only here to protect checkout inventory."
                : "Configure initial stock and low-stock alerts."
            }
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {!isEditing ? (
                <Field label="Initial stock" required>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={form.stock}
                    onChange={(e) => update("stock", Number(e.target.value))}
                  />
                </Field>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">
                    Current stock
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {product?.stock ?? 0}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      units
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Use Adjust Stock on the products page.
                  </p>
                </div>
              )}
              <Field label="Low-stock threshold">
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step={1}
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    update("lowStockThreshold", Number(e.target.value))
                  }
                />
              </Field>
            </div>
            {lowStock && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <Info size={17} className="mt-0.5 shrink-0" /> Stock is at or
                below your low-stock threshold.
              </div>
            )}
          </Section>

          <Section
            icon={<Sparkles size={20} />}
            title="Visibility & promotion"
            subtitle="Choose whether this item should be featured."
          >
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200">
              <div>
                <span className="block text-sm font-semibold text-slate-900">
                  Featured product
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Highlight this product in featured collections.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => update("isFeatured", e.target.checked)}
                className="h-5 w-5 accent-indigo-600"
              />
            </label>
          </Section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700"
            >
              {error}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Link
              to="/admin/products"
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}{" "}
              {mutation.isPending
                ? "Saving product..."
                : isEditing
                  ? "Save changes"
                  : "Create product"}
            </button>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Check size={16} className="text-indigo-600" /> Live preview
              </div>
              <p className="mt-1 text-xs text-slate-500">
                How the product might appear in your catalog
              </p>
            </div>
            <div className="p-4">
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                {imageUrl.trim() && !imageFailed ? (
                  <img
                    src={imageUrl}
                    alt={form.name || "Product preview"}
                    className="h-full w-full object-contain"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <ImageIcon size={38} className="text-slate-300" />
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {form.isFeatured && (
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                    Featured
                  </span>
                )}
                {lowStock && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                    Low stock
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                {form.category || "Category"}
              </p>
              <h4 className="mt-1 line-clamp-2 text-base font-bold text-slate-900">
                {form.name || "Your product name"}
              </h4>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {form.shortDescription ||
                  "Your short product description will appear here."}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-slate-900">
                  {peso(form.price || 0)}
                </span>
                {form.compareAtPrice !== null &&
                  form.compareAtPrice > form.price && (
                    <span className="text-xs text-slate-400 line-through">
                      {peso(form.compareAtPrice)}
                    </span>
                  )}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                SKU: {form.sku || "—"}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-900">
              <Info size={17} /> Inventory safety
            </div>
            <p className="mt-2 text-xs leading-5 text-indigo-800">
              {isEditing
                ? "Stock quantity cannot be edited on this form. Go back to Products and use Adjust Stock to record a change with an audit reason."
                : "Initial stock is set when the product is created. Future adjustments should use the dedicated inventory action."}
            </p>
            <Link
              to="/admin/products"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline"
            >
              View inventory <ArrowRight size={13} />
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}
