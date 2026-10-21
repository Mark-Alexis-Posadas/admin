import type { ComponentPropsWithoutRef } from "react";

interface CardProps extends ComponentPropsWithoutRef<"section"> {
  as?: "section" | "div" | "article";
}

export default function Card({
  as: Tag = "section",
  className = "",
  ...props
}: CardProps) {
  return (
    <Tag
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
      {...props}
    />
  );
}
