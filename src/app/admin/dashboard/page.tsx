import { AdminDashboardEnhanced } from "./admin-dashboard-enhanced";

export const metadata = {
  title: "관리자 대시보드 | Vibe Olympics",
  description: "플랫폼 전체 매출, 사용자, 상품 통계를 확인하세요.",
};

export default function AdminDashboardPage() {
  return (
    <div className="container-app py-8">
      <AdminDashboardEnhanced />
    </div>
  );
}
