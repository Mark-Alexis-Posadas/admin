import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { productApi } from "./product.api";
import type { AdminProduct } from "./product.types";

type Props = {
  product: AdminProduct;
  onClose: () => void;
};

export default function AdjustStockModal({ product, onClose }: Props) {
  const queryClient = useQueryClient();

  const [adjustment, setAdjustment] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      productApi.adjustStock(product._id, Number(adjustment), reason),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "products"],
      });

      onClose();
    },

    onError: (err) => {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Unable to adjust stock.")
          : "Unable to adjust stock.",
      );
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = Number(adjustment);

    if (!Number.isSafeInteger(value) || value === 0) {
      setError("Enter a non-zero whole number.");
      return;
    }

    if (reason.trim().length < 3) {
      setError("Please provide a reason.");
      return;
    }

    setError("");
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-dialog-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="stock-dialog-title" className="text-xl font-bold">
          Adjust Stock
        </h2>

        <p className="mt-2 text-sm text-slate-500">{product.name}</p>

        <p className="mt-4 text-sm">
          Current stock: <strong>{product.stock}</strong>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Adjustment</label>

            <input
              type="number"
              step="1"
              required
              value={adjustment}
              onChange={(event) => setAdjustment(event.target.value)}
              placeholder="Example: 10 or -3"
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />

            <p className="mt-1 text-xs text-slate-500">
              Positive adds stock. Negative removes stock.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Reason</label>

            <textarea
              required
              minLength={3}
              maxLength={500}
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Example: New inventory received"
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white disabled:opacity-50"
            >
              {mutation.isPending ? "Saving..." : "Save Adjustment"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-lg border border-slate-300 px-5 py-3"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
