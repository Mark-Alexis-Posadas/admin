import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  children,
  icon,
  action,
  className = "space-y-3 p-14 text-center",
}: EmptyStateProps) {
  return (
    <div className={className}>
      {icon && (
        <div aria-hidden="true" className="flex justify-center text-slate-300">
          {icon}
        </div>
      )}
      {title && <h3 className="font-semibold text-slate-800">{title}</h3>}
      {children && <p className="text-sm text-slate-500">{children}</p>}
      {action}
    </div>
  );
}
