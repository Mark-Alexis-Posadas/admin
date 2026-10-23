import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { formatDateTime } from "../../lib/formatters";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import { formatCurrency as peso } from "../../lib/formatters";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

import { orderApi } from "./order.api";
import type { OrderStatus } from "./order.types";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const OrderDetailsPage = () => {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [collectionError, setCollectionError] = useState("");
  const [collectionSuccess, setCollectionSuccess] = useState("");

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "orders", id],
    queryFn: () => orderApi.getById(id),
    enabled: Boolean(id),
  });

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => orderApi.updateStatus(id, status),

    onSuccess: async () => {
      setError("");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin", "orders"],
        }),
        queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] }),
      ]);
    },

    onError: (err) => {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ?? "Unable to update order status.",
        );
      } else {
        setError("Unable to update order status.");
      }
    },
  });

  const collection = useMutation({
    mutationFn: () => orderApi.collectCod(id),
    retry: false,
    onSuccess: async (updated) => {
      setCollectionError("");
      setCollectionSuccess("COD collection recorded successfully.");
      queryClient.setQueryData(["admin", "orders", id], updated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "customers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] }),
      ]);
    },
    onError: async (failure) => {
      setCollectionSuccess("");
      setCollectionError(
        axios.isAxiosError(failure)
          ? (failure.response?.data?.message ??
              "Unable to record collection. Refresh the order before retrying.")
          : "Unable to record collection. Refresh the order before retrying.",
      );
      // A duplicate, stale request or ambiguous network error may have committed.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "customers"] }),
      ]);
    },
  });

  if (isLoading)
    return <LoadingState className="">Loading order...</LoadingState>;
  if (isError || !order)
    return <ErrorState className="">Order not found.</ErrorState>;

  const address = order.shippingAddress;
  const nextStatuses = transitions[order.orderStatus].filter(
    (status) => status !== "cancelled" || order.paymentStatus !== "paid",
  );
  const eligible =
    order.paymentMethod === "COD" &&
    order.paymentStatus === "unpaid" &&
    order.orderStatus === "delivered" &&
    !order.paidAt &&
    !order.paymentCollectedBy;

  const handleStatusChange = (status: OrderStatus) => {
    if (status === "cancelled") {
      const confirmed = window.confirm(
        "Cancel this order and restore its inventory?",
      );

      if (!confirmed) return;
    }

    mutation.mutate(status);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <Link to="/admin/orders" className="text-sm font-medium text-indigo-600">
        ← Back to Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Order #{order._id.slice(-8)}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {formatDateTime(order.createdAt, {})}
          </p>
        </div>

        <Badge tone="indigo" className="px-4 py-2 text-sm font-semibold">
          {order.orderStatus}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold">Order Items</h3>

          {order.items.map((item) => (
            <div
              key={item.product}
              className="flex justify-between gap-4 border-b border-slate-100 pb-4"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-slate-500">
                  {item.sku} · Qty {item.quantity}
                </p>
              </div>

              <p className="font-medium">{peso(item.price * item.quantity)}</p>
            </div>
          ))}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{peso(order.subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{peso(order.shippingFee)}</span>
            </div>

            <div className="flex justify-between border-t pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{peso(order.total)}</span>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 font-semibold">Customer & Shipping</h3>

            <p className="font-medium">
              {order.user?.name ?? address.fullName}
            </p>
            <p className="text-sm text-slate-500">{order.user?.email}</p>

            <div className="mt-4 text-sm leading-6 text-slate-600">
              <p>{address.fullName}</p>
              <p>{address.phone}</p>
              <p>{address.addressLine1}</p>
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>
                {address.city}, {address.province} {address.postalCode}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 font-semibold">Payment</h3>
            <p className="text-sm">Method: {order.paymentMethod}</p>
            <p className="mt-1 text-sm capitalize">
              Status: {order.paymentStatus}
            </p>
            {order.paidAt && (
              <p className="mt-3 text-sm text-slate-600">
                Collection confirmed: {formatDateTime(order.paidAt, {})}
              </p>
            )}
            {order.paymentCollectedBy && (
              <p className="mt-1 break-all text-xs text-slate-500">
                Confirmed by administrator ID: {order.paymentCollectedBy}
              </p>
            )}
            {order.paymentStatus === "paid" && !order.paidAt && (
              <p className="mt-3 text-xs text-slate-500">
                Legacy paid order: collection audit details are unavailable.
              </p>
            )}
            {eligible && (
              <Button
                variant="primary"
                className="mt-4 w-full"
                disabled={collection.isPending || mutation.isPending}
                onClick={() => {
                  setCollectionError("");
                  setCollectionSuccess("");
                  if (
                    window.confirm(
                      `Confirm that the full COD payment of ${peso(order.total)} has been collected for this delivered order? This cannot be undone here.`,
                    )
                  )
                    collection.mutate();
                }}
              >
                {collection.isPending
                  ? "Recording collection..."
                  : "Confirm COD Collection"}
              </Button>
            )}
            {order.paymentStatus === "unpaid" &&
              order.orderStatus !== "delivered" && (
                <p className="mt-3 text-xs text-slate-500">
                  COD collection can be confirmed only after delivery. Delivery
                  does not automatically record payment.
                </p>
              )}
            {collectionSuccess && (
              <p role="status" className="mt-3 text-sm text-emerald-700">
                {collectionSuccess}
              </p>
            )}
            {collectionError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {collectionError}
              </p>
            )}
          </section>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-2 text-lg font-semibold">Update Order Status</h3>

        <p className="mb-5 text-sm text-slate-500">
          Current status:{" "}
          <strong className="capitalize">{order.orderStatus}</strong>
        </p>

        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          {nextStatuses.map((status) => (
            <button
              key={status}
              disabled={mutation.isPending || collection.isPending}
              onClick={() => handleStatusChange(status)}
              className={`rounded-lg px-5 py-3 text-sm font-medium text-white disabled:opacity-50 ${
                status === "cancelled"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {mutation.isPending
                ? "Updating..."
                : status === "cancelled"
                  ? "Cancel Order"
                  : `Mark as ${status}`}
            </button>
          ))}
        </div>

        {nextStatuses.length === 0 && (
          <p className="text-sm text-slate-500">
            No further status changes are allowed.
          </p>
        )}
      </section>
    </div>
  );
};

export default OrderDetailsPage;
