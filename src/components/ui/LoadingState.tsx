import type { ReactNode } from "react";

export default function LoadingState({
  children,
  className = "p-14 text-center text-sm text-slate-500",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={className}>
      {children}
    </div>
  );
}
