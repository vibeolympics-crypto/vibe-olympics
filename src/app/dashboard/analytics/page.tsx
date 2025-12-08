import { Metadata } from "next";
import { AnalyticsContent } from "./analytics-content";

export const metadata: Metadata = {
  title: "수익/통계",
  description: "판매 현황과 수익을 분석하세요.",
};

export default function AnalyticsPage() {
  return <AnalyticsContent />;
}
