import { lazy, Suspense } from "react";

const SalesAnalyticsPage = lazy(() => import("./SalesAnalyticsPage"));

export default function AnalyticsRoute() {
  return <Suspense fallback={<p role="status">Loading sales analytics...</p>}>
    <SalesAnalyticsPage />
  </Suspense>;
}
