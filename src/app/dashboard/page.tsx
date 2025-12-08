import { Metadata } from "next";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "대시보드",
  description: "내 계정, 상품, 판매 현황을 관리하세요.",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
