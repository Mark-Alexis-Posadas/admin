import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { orderApi } from "./order.api";

const peso = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

const OrdersPage = () => {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: orderApi.getAll,
  });

  if (isLoading) return <p>Loading orders...</p>;
  if (isError) return <p>Failed to load orders.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Orders</h2>
        <p className="mt-1 text-slate-500">Manage customer orders.</p>
      </div>

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
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize">
                    {order.orderStatus}
                  </span>
                </td>

                <td className="p-4 text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString("en-PH")}
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
