import type { ComponentPropsWithoutRef } from "react";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "inverse";
}

const variants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "border border-slate-200 text-slate-600 hover:bg-slate-50",
  ghost: "text-indigo-600 hover:bg-indigo-50",
  inverse: "border border-white/20 bg-white/10 text-white hover:bg-white/20",
};

export default function Button({
  variant = "secondary",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
