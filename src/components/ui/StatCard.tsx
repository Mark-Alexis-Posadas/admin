import type { ReactNode } from "react";
import Card from "./Card";

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  note?: ReactNode;
  tone?: "indigo" | "emerald" | "amber" | "slate" | "rose";
  variant?: "metric" | "stacked" | "simple";
}

const tones = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-600",
  rose: "bg-rose-50 text-rose-600",
};

export default function StatCard({
  label,
  value,
  icon,
  note,
  tone = "indigo",
  variant = "metric",
}: StatCardProps) {
  const iconNode = icon && (
    <div
      aria-hidden="true"
      className={`inline-flex rounded-xl ${variant === "stacked" ? "mb-4 p-3" : "p-2.5"} ${tones[tone]}`}
    >
      {icon}
    </div>
  );
  return (
    <Card as="div" className="p-5">
      {variant === "stacked" && iconNode}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {variant !== "stacked" && iconNode}
      </div>
      <p
        className={`mt-2 break-words font-bold tracking-tight text-slate-900 ${variant === "metric" ? "text-3xl" : "text-2xl"}`}
      >
        {value}
      </p>
      {note && <p className="mt-1 text-xs leading-5 text-slate-400">{note}</p>}
    </Card>
  );
}
