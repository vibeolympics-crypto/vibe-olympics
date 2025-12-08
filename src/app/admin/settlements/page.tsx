import { Metadata } from "next";
import { SettlementsContent } from "./settlements-content";

export const metadata: Metadata = {
  title: "정산 관리 | Admin",
  description: "판매자 정산 관리 페이지",
};

export default function AdminSettlementsPage() {
  return <SettlementsContent />;
}
