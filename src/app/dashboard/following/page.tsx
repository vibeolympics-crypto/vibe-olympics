import { Metadata } from "next";
import { FollowingContent } from "./following-content";

export const metadata: Metadata = {
  title: "팔로잉",
  description: "내가 팔로우하는 판매자 목록과 최신 상품을 확인하세요.",
};

export default function FollowingPage() {
  return <FollowingContent />;
}
