import type { ComponentPropsWithoutRef } from "react";

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  tone?: "slate" | "indigo" | "emerald" | "rose" | "amber";
}

const tones = {
  slate: "bg-slate-100 text-slate-600",
  indigo: "bg-indigo-50 text-indigo-700",
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
};

export default function Badge({
  tone = "slate",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium capitalize ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
