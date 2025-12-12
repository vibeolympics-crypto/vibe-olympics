import { Metadata } from "next";
import { ReportsContent } from "./reports-content";

export const metadata: Metadata = {
  title: "판매 리포트 | 대시보드",
  description: "주간/월간 판매 현황 리포트를 확인하고 이메일로 받아보세요.",
};

export default function ReportsPage() {
  return <ReportsContent />;
}
