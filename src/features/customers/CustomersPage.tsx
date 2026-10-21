import EmptyState from "../../components/ui/EmptyState";
import SearchInput from "../../components/ui/SearchInput";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import Pagination from "../../components/ui/Pagination";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { customerApi } from "./customer.api";
import CustomerHeader from "./components/CustomerHeader";
import { spendingNote } from "./customer.utils";
import {
  formatDate as date,
  formatCurrency as peso,
} from "../../lib/formatters";

export default function CustomersPage() {
  const [input, setInput] = useState("");
  const [filters, setFilters] = useState({ page: 1, search: "" });
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["admin", "customers", "list", filters],
    queryFn: ({ signal }) =>
      customerApi.list(filters.page, filters.search, signal),
  });
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <CustomerHeader
        title="Customers"
        busy={isFetching}
        refresh={() => void refetch()}
      >
        Get to know your customers and explore their order history.
      </CustomerHeader>
      <Card>
        <div className="space-y-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Customer directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {data
                ? `${data.pagination.total} ${filters.search ? "matching" : "registered"} customers`
                : "Registered customer accounts"}
            </p>
          </div>
          <form
            className="flex flex-wrap gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setFilters({ page: 1, search: input.trim() });
            }}
          >
            <SearchInput
              label="Search customers by name or email"
              wrapperClassName="relative min-w-48 flex-1"
              maxLength={100}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Search name or email..."
            />
            <Button type="submit" variant="primary">
              Search
            </Button>
            {(input || filters.search) && (
              <Button
                type="button"
                onClick={() => {
                  setInput("");
                  setFilters({ page: 1, search: "" });
                }}
              >
                Clear
              </Button>
            )}
          </form>
          <p className="text-xs text-slate-500">
            {spendingNote} Order counts include cancellations.
          </p>
        </div>
        {isPending ? (
          <LoadingState>Loading customers...</LoadingState>
        ) : isError ? (
          <ErrorState
            action={<Button onClick={() => void refetch()}>Try again</Button>}
          >
            Unable to load customers. Check your session and connection.
          </ErrorState>
        ) : data.customers.length === 0 ? (
          <EmptyState
            icon={<Users size={36} />}
            title={
              filters.search ? "No matching customers" : "No customers yet"
            }
          >
            {filters.search
              ? "Try another name or email address."
              : "Customer accounts will appear here after registration."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  {[
                    "Customer",
                    "Total orders",
                    "Total spending",
                    "Registered",
                    "",
                  ].map((label) => (
                    <th key={label} className="px-5 py-4" scope="col">
                      {label || <span className="sr-only">Details</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-slate-50">
                    <td className="max-w-80 break-words px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {customer.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {customer.email}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {customer.orderCount}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {peso(customer.totalSpending)}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {date(customer.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        className="font-semibold text-indigo-600 hover:underline"
                        to={`/admin/customers/${customer._id}`}
                        aria-label={`View ${customer.name}'s profile`}
                      >
                        View profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && !isError && (
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            busy={isFetching}
            onPageChange={(page) =>
              setFilters((previous) => ({ ...previous, page }))
            }
            summary={
              <>
                {data.pagination.total} records · Page {data.pagination.page} of{" "}
                {Math.max(1, data.pagination.totalPages)}
              </>
            }
          />
        )}
      </Card>
    </div>
  );
}
