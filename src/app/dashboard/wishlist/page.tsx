import { Metadata } from "next";
import { WishlistContent } from "./wishlist-content";

export const metadata: Metadata = {
  title: "찜한 상품",
  description: "찜한 상품 목록을 확인하세요.",
};

export default function WishlistPage() {
  return <WishlistContent />;
}
