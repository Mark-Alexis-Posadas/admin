import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  heading?: "h2" | "h3";
  className?: string;
}

export default function SectionHeader({
  title,
  description,
  icon,
  actions,
  heading: Heading = "h2",
  className = "border-b border-slate-100 p-5 sm:p-6",
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 ${className}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <Heading className="text-lg font-bold text-slate-900">
            {title}
          </Heading>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>
      {actions}
    </div>
  );
}
