import StatCard from "../../components/ui/StatCard";
import SectionHeader from "../../components/ui/SectionHeader";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import Pagination from "../../components/ui/Pagination";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { customerApi } from "./customer.api";
import CustomerHeader from "./components/CustomerHeader";
import { spendingNote } from "./customer.utils";
import {
  formatDate as date,
  formatCurrency as peso,
} from "../../lib/formatters";

export default function CustomerDetailsPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const rawPage = params.get("page") ?? "1";
  const page =
    /^[1-9]\d*$/.test(rawPage) && Number(rawPage) <= 1_000_000
      ? Number(rawPage)
      : 1;
  const { data, isPending, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["admin", "customers", "detail", id, page],
    queryFn: ({ signal }) => customerApi.details(id, page, signal),
    retry: (count, failure) =>
      !(
        axios.isAxiosError(failure) &&
        [400, 401, 403, 404].includes(failure.response?.status ?? 0)
      ) && count < 2,
  });
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <Link
        to="/admin/customers"
        className="text-sm font-semibold text-indigo-600 hover:underline"
      >
        ← Back to customers
      </Link>
      <CustomerHeader
        title="Customer profile"
        busy={isFetching}
        refresh={() => void refetch()}
      >
        Account information and complete order history.
      </CustomerHeader>
      {isPending ? (
        <LoadingState>Loading customer profile...</LoadingState>
      ) : isError ? (
        <Card>
          <ErrorState
            action={<Button onClick={() => void refetch()}>Try again</Button>}
          >
            {axios.isAxiosError(error) && error.response?.status === 404
              ? "Customer not found."
              : "Unable to load this customer. Check your session and connection."}
          </ErrorState>
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <h2 className="break-words text-xl font-bold text-slate-900">
              {data.customer.name}
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Email address</dt>
                <dd className="mt-1 break-all font-medium text-slate-800">
                  {data.customer.email}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Registered</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {date(data.customer.createdAt)}
                </dd>
              </div>
            </dl>
          </Card>
          <section
            className="grid gap-4 sm:grid-cols-3"
            aria-label="Order summary"
          >
            {[
              ["Total orders", data.summary.orderCount],
              ["Total spending", peso(data.summary.totalSpending)],
              ["Cancelled orders", data.summary.cancelledOrderCount],
            ].map(([label, value]) => (
              <StatCard
                key={label}
                variant="simple"
                label={label}
                value={value}
              />
            ))}
          </section>
          <p className="text-xs text-slate-500">
            {spendingNote} Order counts include cancellations.
          </p>
          <Card>
            <SectionHeader
              title="Order history"
              description="All orders, newest first."
            />
            {data.orders.length === 0 ? (
              <EmptyState>
                {data.summary.orderCount === 0
                  ? "This customer has not placed any orders yet."
                  : "No orders on this page. Use Previous to return to earlier pages."}
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      {["Order", "Date", "Total", "Status", "Payment"].map(
                        (label) => (
                          <th key={label} scope="col" className="px-5 py-4">
                            {label}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.orders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <Link
                            to={`/admin/orders/${order._id}`}
                            className="font-semibold text-indigo-600 hover:underline"
                            aria-label={`View order ${order._id}`}
                          >
                            #{order._id.slice(-8)}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {date(order.createdAt)}
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {peso(order.total)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            tone={
                              order.orderStatus === "cancelled"
                                ? "rose"
                                : order.orderStatus === "delivered"
                                  ? "emerald"
                                  : "indigo"
                            }
                          >
                            {order.orderStatus}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 capitalize text-slate-600">
                          {order.paymentStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              busy={isFetching}
              onPageChange={(next) => setParams({ page: String(next) })}
              summary={
                <>
                  {data.pagination.total} records · Page {data.pagination.page}{" "}
                  of {Math.max(1, data.pagination.totalPages)}
                </>
              }
            />
          </Card>
        </>
      )}
    </div>
  );
}
