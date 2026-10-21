import type { ReactNode } from "react";

interface FormFieldProps {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  required?: boolean;
  className?: string;
  labelClassName?: string;
}

// Wrapping the single input/select/textarea gives it an implicit accessible label.
export default function FormField({
  label,
  hint,
  children,
  required,
  className = "block space-y-2",
  labelClassName = "block text-sm font-semibold text-slate-700",
}: FormFieldProps) {
  return (
    <label className={className}>
      <span className={labelClassName}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-rose-500">
            *
          </span>
        )}
      </span>
      {children}
      {hint && (
        <span className="block text-xs leading-5 text-slate-400">{hint}</span>
      )}
    </label>
  );
}
