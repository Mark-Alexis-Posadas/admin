import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { formatCurrency as peso } from "../lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { orderApi } from "../features/orders/order.api";

const DashboardPage = () => {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: orderApi.getAll,
  });

  if (isLoading)
    return <LoadingState className="">Loading dashboard...</LoadingState>;
  if (isError)
    return <ErrorState className="">Unable to load dashboard.</ErrorState>;

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
      <PageHeader
        title="Dashboard Overview"
        subtitle="Welcome to ShopSphere Admin."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            variant="simple"
            label={stat.label}
            value={stat.value}
          />
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
