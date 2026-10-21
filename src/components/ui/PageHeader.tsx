import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  variant?: "plain" | "hero";
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  variant = "plain",
}: PageHeaderProps) {
  if (variant === "plain")
    return (
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
        </div>
        {actions}
      </header>
    );

  return (
    <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-lg sm:p-9">
      <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          {eyebrow}
          <h1 className="break-words text-3xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {subtitle}
            </div>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}
