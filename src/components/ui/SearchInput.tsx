import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Search } from "lucide-react";

interface SearchInputProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "children" | "aria-label"
> {
  label: string;
  action?: ReactNode;
  wrapperClassName?: string;
}

export default function SearchInput({
  label,
  action,
  wrapperClassName = "relative min-w-0 flex-1",
  className,
  type = "search",
  ...props
}: SearchInputProps) {
  return (
    <div className={wrapperClassName}>
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        {...props}
        type={type}
        aria-label={label}
        className={
          className ??
          `w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 ${action ? "pr-24" : "pr-4"} text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`
        }
      />
      {action}
    </div>
  );
}
