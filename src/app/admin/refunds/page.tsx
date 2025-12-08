import { Metadata } from "next";
import { RefundsContent } from "./refunds-content";

export const metadata: Metadata = {
  title: "환불 관리 | Admin",
  description: "환불 요청 관리 페이지",
};

export default function AdminRefundsPage() {
  return <RefundsContent />;
}
