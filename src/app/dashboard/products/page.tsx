import { Metadata } from "next";
import { ProductsContent } from "./products-content";

export const metadata: Metadata = {
  title: "내 상품",
  description: "등록한 상품을 관리하세요.",
};

export default function ProductsPage() {
  return <ProductsContent />;
}
