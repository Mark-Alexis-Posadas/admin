import type { ReactNode } from "react";
import Button from "./Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  busy: boolean;
  onPageChange: (page: number) => void;
  summary?: ReactNode;
  previousLabel?: ReactNode;
  nextLabel?: ReactNode;
}

export default function Pagination({
  page,
  totalPages,
  busy,
  onPageChange,
  summary,
  previousLabel = "Previous",
  nextLabel = "Next",
}: PaginationProps) {
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5"
    >
      <p className="text-sm text-slate-500">
        {summary ?? (
          <>
            Page {page} of {Math.max(1, totalPages)}
          </>
        )}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={busy || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {previousLabel}
        </Button>
        <Button
          disabled={busy || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {nextLabel}
        </Button>
      </div>
    </nav>
  );
}
