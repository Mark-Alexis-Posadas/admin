import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { orderApi } from "../features/orders/order.api";

const peso = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

const DashboardPage = () => {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: orderApi.getAll,
  });

  if (isLoading) return <p>Loading dashboard...</p>;
  if (isError) return <p>Unable to load dashboard.</p>;

  const pending = orders.filter(
    (order) => order.orderStatus === "pending",
  ).length;

  const active = orders.filter(
    (order) =>
      order.orderStatus !== "cancelled" && order.orderStatus !== "delivered",
  ).length;

  const orderValue = orders
    .filter((order) => order.orderStatus !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  const stats = [
    { label: "Total Orders", value: orders.length },
    { label: "Pending Orders", value: pending },
    { label: "Active Orders", value: active },
    { label: "Non-cancelled Order Value", value: peso(orderValue) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <p className="mt-1 text-slate-500">Welcome to ShopSphere Admin.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold">Order Management</h3>
        <p className="mt-2 text-sm text-slate-500">
          View orders and update fulfillment statuses.
        </p>

        <Link
          to="/admin/orders"
          className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white"
        >
          Manage Orders
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
