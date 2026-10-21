import type { ReactNode } from "react";
import Card from "../../../components/ui/Card";
import SectionHeader from "../../../components/ui/SectionHeader";

export default function ProductFormSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <SectionHeader
        heading="h3"
        icon={icon}
        title={title}
        description={subtitle}
        className="border-b border-slate-100 px-5 py-5 sm:px-7"
      />
      <div className="space-y-5 p-5 sm:p-7">{children}</div>
    </Card>
  );
}
