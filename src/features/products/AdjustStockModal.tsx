import { useEffect, useId, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Minus,
  Package,
  Plus,
  X,
} from "lucide-react";

import { productApi } from "./product.api";
import type { AdminProduct } from "./product.types";

export type StockUpdate = {
  productId: string;
  productName: string;
  sku: string;
  adjustment: number;
  previousStock: number;
  newStock: number;
};

type Props = {
  product: AdminProduct;
  onClose: () => void;
  onSuccess: (update: StockUpdate) => void;
};

type Mode = "add" | "remove";

const QUICK_AMOUNTS = [1, 5, 10, 25];

export default function AdjustStockModal({
  product,
  onClose,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const descriptionId = useId();
  const [mode, setMode] = useState<Mode>("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const currentStock = Number.isFinite(product.stock) ? product.stock : 0;
  const amount = quantity.trim() === "" ? 0 : Number(quantity);
  const validAmount = Number.isSafeInteger(amount) && amount > 0;
  const adjustment = mode === "add" ? amount : -amount;
  const projectedStock = currentStock + adjustment;
  const exceedsStock =
    mode === "remove" && validAmount && amount > currentStock;
  const exceedsSafeInteger =
    validAmount && !Number.isSafeInteger(projectedStock);

  const mutation = useMutation({
    mutationFn: (input: { adjustment: number; reason: string }) =>
      productApi.adjustStock(product._id, input.adjustment, input.reason),

    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "products"],
      });

      onSuccess({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        adjustment: variables.adjustment,
        previousStock: data.newStock - variables.adjustment,
        newStock: data.newStock,
      });

      onClose();
    },

    onError: (err: unknown) => {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;

      setError(
        typeof message === "string"
          ? message
          : "Unable to adjust stock. Please try again.",
      );
    },
  });

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !mutation.isPending) onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mutation.isPending, onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (!validAmount) {
      setError("Enter a quantity greater than zero using whole numbers only.");
      return;
    }
    if (exceedsStock) {
      setError("You cannot remove more units than the current stock.");
      return;
    }
    if (exceedsSafeInteger) {
      setError("The resulting stock exceeds the supported number range.");
      return;
    }
    const cleanReason = reason.trim();
    if (cleanReason.length < 3 || cleanReason.length > 500) {
      setError("Reason must be between 3 and 500 characters.");
      return;
    }
    setError("");
    mutation.mutate({ adjustment, reason: cleanReason });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !mutation.isPending)
          onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
      >
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 px-6 pb-6 pt-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <Package size={22} strokeWidth={1.8} />
              </div>
              <div>
                <h2
                  id={titleId}
                  className="text-xl font-bold tracking-tight text-slate-900"
                >
                  Adjust inventory
                </h2>
                <p id={descriptionId} className="mt-0.5 text-sm text-slate-500">
                  Update stock with an audit reason
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              aria-label="Close adjust inventory dialog"
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
            >
              <X size={19} />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {product.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                SKU: {product.sku || "—"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                In stock
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">
                {currentStock.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-7">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Adjustment type
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
              <button
                type="button"
                disabled={mutation.isPending}
                aria-pressed={mode === "add"}
                onClick={() => {
                  setMode("add");
                  setError("");
                }}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${mode === "add" ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/70" : "text-slate-500 hover:text-slate-800"}`}
              >
                <ArrowUpRight size={18} /> Add stock
              </button>
              <button
                type="button"
                disabled={mutation.isPending}
                aria-pressed={mode === "remove"}
                onClick={() => {
                  setMode("remove");
                  setError("");
                }}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${mode === "remove" ? "bg-white text-rose-700 shadow-sm ring-1 ring-slate-200/70" : "text-slate-500 hover:text-slate-800"}`}
              >
                <ArrowDownRight size={18} /> Remove stock
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="stock-quantity"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Quantity
            </label>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => {
                  setQuantity(
                    String(Math.max(1, (validAmount ? amount : 1) - 1)),
                  );
                  setError("");
                }}
                aria-label="Decrease quantity"
                className="flex w-12 shrink-0 items-center justify-center border-r border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <Minus size={18} />
              </button>
              <input
                id="stock-quantity"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                required
                autoFocus
                disabled={mutation.isPending}
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setError("");
                }}
                placeholder="0"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-center text-lg font-bold tabular-nums text-slate-900 outline-none placeholder:text-slate-300"
              />
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => {
                  setQuantity(String((validAmount ? amount : 0) + 1));
                  setError("");
                }}
                aria-label="Increase quantity"
                className="flex w-12 shrink-0 items-center justify-center border-l border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => {
                    setQuantity(String(value));
                    setError("");
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${amount === value && quantity !== "" ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  {value} units
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Projected stock
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {currentStock.toLocaleString()} {mode === "add" ? "+" : "−"}{" "}
                {validAmount ? amount.toLocaleString() : "0"} units
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-2xl font-bold tabular-nums ${exceedsStock || exceedsSafeInteger ? "text-rose-600" : "text-slate-900"}`}
              >
                {validAmount && !exceedsSafeInteger
                  ? projectedStock.toLocaleString()
                  : currentStock.toLocaleString()}
              </p>
              {validAmount && !exceedsStock && !exceedsSafeInteger && (
                <p className="mt-0.5 flex items-center justify-end gap-1 text-xs font-medium text-emerald-600">
                  <Check size={13} /> Valid adjustment
                </p>
              )}
              {exceedsStock && (
                <p className="mt-0.5 text-xs font-medium text-rose-600">
                  Insufficient stock
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="stock-reason"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="stock-reason"
              required
              minLength={3}
              maxLength={500}
              rows={3}
              disabled={mutation.isPending}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError("");
              }}
              placeholder={
                mode === "add"
                  ? "e.g. New inventory received from supplier"
                  : "e.g. Damaged items removed from inventory"
              }
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
            />
            <div className="mt-1 flex justify-between gap-2 text-xs text-slate-400">
              <span>Saved in inventory audit history</span>
              <span className="tabular-nums">{reason.length}/500</span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                mutation.isPending ||
                !validAmount ||
                exceedsStock ||
                exceedsSafeInteger ||
                reason.trim().length < 3
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/15 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-[1.4]"
            >
              {mutation.isPending ? (
                "Saving adjustment..."
              ) : mode === "add" ? (
                <>
                  <Plus size={17} /> Add {validAmount ? amount : ""} units
                </>
              ) : (
                <>
                  <Minus size={17} /> Remove {validAmount ? amount : ""} units
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
