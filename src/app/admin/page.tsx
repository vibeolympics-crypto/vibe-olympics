import { Suspense } from "react";
import { AdminDashboardContent } from "./admin-content";

export const metadata = {
  title: "관리자 대시보드",
  description: "Vibe Olympics 관리자 대시보드",
};

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoadingSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminLoadingSkeleton() {
  return (
    <div className="container-app py-8">
      <div className="h-10 w-64 bg-[var(--bg-elevated)] rounded-lg animate-pulse mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-[var(--bg-elevated)] rounded-xl animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-[var(--bg-elevated)] rounded-xl animate-pulse" />
        <div className="h-80 bg-[var(--bg-elevated)] rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
