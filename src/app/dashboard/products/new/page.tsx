import { Metadata } from "next";
import { NewProductContent } from "./new-product-content";

export const metadata: Metadata = {
  title: "새 상품 등록",
  description: "새로운 디지털 상품을 등록하세요.",
};

export default function NewProductPage() {
  return <NewProductContent />;
}
