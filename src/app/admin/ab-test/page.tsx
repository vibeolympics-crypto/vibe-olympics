import { Suspense } from 'react';
import { ABTestDashboard } from '@/components/admin/ab-test-dashboard';

export const metadata = {
  title: 'A/B 테스트 관리 - 관리자',
  description: 'A/B 테스트 실험을 생성하고 관리합니다',
};

export default function ABTestAdminPage() {
  return (
    <div className="container-app py-8">
      <Suspense fallback={<ABTestLoadingSkeleton />}>
        <ABTestDashboard />
      </Suspense>
    </div>
  );
}

function ABTestLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-[var(--bg-elevated)] rounded-lg animate-pulse mt-2" />
        </div>
        <div className="h-10 w-24 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-[var(--bg-elevated)] rounded-xl animate-pulse"
          />
        ))}
      </div>

      {/* Table */}
      <div className="h-96 bg-[var(--bg-elevated)] rounded-xl animate-pulse" />
    </div>
  );
}
