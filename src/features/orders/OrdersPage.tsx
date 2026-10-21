import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import { formatDate } from "../../lib/formatters";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import { formatCurrency as peso } from "../../lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { orderApi } from "./order.api";

const OrdersPage = () => {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: orderApi.getAll,
  });

  if (isLoading)
    return <LoadingState className="">Loading orders...</LoadingState>;
  if (isError)
    return <ErrorState className="">Failed to load orders.</ErrorState>;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Manage customer orders." />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4">Order</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-t border-slate-100">
                <td className="p-4 font-medium">#{order._id.slice(-8)}</td>

                <td className="p-4">
                  <p>{order.user?.name ?? "Unknown customer"}</p>
                  <p className="text-xs text-slate-500">{order.user?.email}</p>
                </td>

                <td className="p-4">{peso(order.total)}</td>

                <td className="p-4">
                  <Badge>{order.orderStatus}</Badge>
                </td>

                <td className="p-4 text-slate-500">
                  {formatDate(order.createdAt, {})}
                </td>

                <td className="p-4">
                  <Link
                    to={`/admin/orders/${order._id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersPage;
