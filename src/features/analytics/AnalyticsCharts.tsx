import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsReport } from "./analytics.api";
import {
  formatCurrency as money,
  formatReportDate as reportDate,
  formatCompactCurrency as shortMoney,
} from "../../lib/formatters";
import { statusColors } from "./analytics.utils";

export function RevenueChart({ report }: { report: AnalyticsReport }) {
  const titleId = useId();
  const gradientId = useId();

  return (
    <>
      <div className="mt-5 h-72 min-w-0" role="group" aria-labelledby={titleId}>
        <p id={titleId} className="sr-only">
          Paid revenue by {report.filters.interval}, in {report.currency}. Use
          arrow keys on the chart to inspect values, or expand the data table.
        </p>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={report.trend}
            margin={{ top: 15, right: 15, bottom: 5, left: 0 }}
            accessibilityLayer
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="#e2e8f0"
              strokeDasharray="4 5"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => reportDate(value)}
              tick={{ fill: "#64748b", fontSize: 11 }}
              minTickGap={36}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value: number) =>
                shortMoney(value, report.currency)
              }
              tick={{ fill: "#64748b", fontSize: 11 }}
              width={65}
              axisLine={false}
              tickLine={false}
              domain={[0, (maximum: number) => Math.max(1, maximum)]}
            />
            <Tooltip
              labelFormatter={(label) => reportDate(String(label))}
              formatter={(value) => [
                money(Number(value), report.currency),
                "Paid revenue",
              ]}
              contentStyle={{
                borderRadius: 12,
                borderColor: "#e2e8f0",
                fontSize: 12,
              }}
            />
            <Area
              type="linear"
              dataKey="revenue"
              name="Paid revenue"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              dot={report.trend.length === 1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium">
          View chart data
        </summary>
        <div className="mt-3 max-h-64 overflow-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              Revenue and paid sales per reporting period
            </caption>
            <thead>
              <tr>
                <th scope="col" className="py-2">
                  Period starts
                </th>
                <th scope="col">Revenue</th>
                <th scope="col">Paid sales</th>
              </tr>
            </thead>
            <tbody>
              {report.trend.map((point) => (
                <tr key={point.date} className="border-t border-slate-200">
                  <td className="py-2">{reportDate(point.date)}</td>
                  <td>{money(point.revenue, report.currency)}</td>
                  <td>{point.salesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

export function StatusChart({ report }: { report: AnalyticsReport }) {
  return (
    <div className="mt-6 space-y-4">
      {report.ordersByStatus.map(({ status, count }) => {
        const percentage = report.summary.totalOrders
          ? (count / report.summary.totalOrders) * 100
          : 0;
        return (
          <div key={status}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="capitalize text-slate-600">{status}</span>
              <span className="font-semibold text-slate-800">
                {count.toLocaleString()}{" "}
                <span className="ml-1 font-normal text-slate-400">
                  ({percentage.toFixed(0)}%)
                </span>
              </span>
            </div>
            <div
              role="meter"
              aria-label={`${status} orders`}
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={Math.max(1, report.summary.totalOrders)}
              className="h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className={`h-full rounded-full ${statusColors[status] ?? "bg-slate-400"}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
        All orders are counted here, including unpaid and cancelled orders.
      </p>
    </div>
  );
}
