import { Metadata } from "next";
import SupportTicketsContent from "./support-content";

export const metadata: Metadata = {
  title: "고객 지원 | Vibe Olympics",
  description: "문의 및 지원 요청을 관리합니다",
};

export default function SupportTicketsPage() {
  return <SupportTicketsContent />;
}
