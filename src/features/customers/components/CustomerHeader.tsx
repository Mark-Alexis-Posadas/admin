import type { ReactNode } from "react";
import { Users } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import RefreshButton from "../../../components/ui/RefreshButton";

export default function CustomerHeader({
  title,
  children,
  busy,
  refresh,
}: {
  title: string;
  children: ReactNode;
  busy: boolean;
  refresh: () => void;
}) {
  return (
    <PageHeader
      variant="hero"
      title={title}
      subtitle={children}
      eyebrow={
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-300">
          <Users size={17} aria-hidden="true" /> SHOPSPHERE / CUSTOMERS
        </p>
      }
      actions={
        <RefreshButton variant="inverse" busy={busy} onClick={refresh} />
      }
    />
  );
}
