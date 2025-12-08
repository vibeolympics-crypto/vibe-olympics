import { Metadata } from "next";
import { SettlementsContent } from "./settlements-content";

export const metadata: Metadata = {
  title: "정산 현황 | Dashboard",
  description: "판매 정산 현황을 확인하세요",
};

export default function SellerSettlementsPage() {
  return <SettlementsContent />;
}
