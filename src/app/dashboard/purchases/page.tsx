import { Metadata } from "next";
import { PurchasesContent } from "./purchases-content";

export const metadata: Metadata = {
  title: "구매 내역",
  description: "구매한 상품을 확인하세요.",
};

export default function PurchasesPage() {
  return <PurchasesContent />;
}
