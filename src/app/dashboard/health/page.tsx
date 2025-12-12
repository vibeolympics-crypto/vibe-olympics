import { Metadata } from "next";
import HealthDashboardContent from "./health-content";

export const metadata: Metadata = {
  title: "서버 헬스 모니터링 | Vibe Olympics",
  description: "서버 상태 및 API 성능 모니터링",
};

export default function HealthDashboardPage() {
  return <HealthDashboardContent />;
}
