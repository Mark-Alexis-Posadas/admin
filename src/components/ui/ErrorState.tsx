import type { ReactNode } from "react";

interface ErrorStateProps {
  title?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function ErrorState({
  title,
  children,
  action,
  className = "space-y-3 p-10 text-center",
}: ErrorStateProps) {
  return (
    <div role="alert" className={className}>
      {title && <h2 className="text-lg font-bold text-slate-800">{title}</h2>}
      <p className="text-sm text-rose-600">{children}</p>
      {action}
    </div>
  );
}
