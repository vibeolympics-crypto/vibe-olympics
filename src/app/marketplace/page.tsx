import { Metadata } from "next";
import { MarketplaceContent } from "./marketplace-content";

export const metadata: Metadata = {
  title: "마켓플레이스 - 디지털 상품 구매",
  description: "VIBE 코딩 기반 디지털 상품을 둘러보세요. 비즈니스 모델, 업무 자동화, 데이터 분석 등 다양한 솔루션을 만나보세요.",
  keywords: [
    "디지털 상품",
    "AI 솔루션",
    "업무 자동화 템플릿",
    "비즈니스 모델",
    "데이터 분석 도구",
    "VIBE 코딩 상품",
    "프롬프트 템플릿",
  ],
  openGraph: {
    title: "마켓플레이스 - Vibe Olympics",
    description: "VIBE 코딩 기반 디지털 상품을 둘러보세요.",
    url: "https://vibeolympics.com/marketplace",
  },
};

export default function MarketplacePage() {
  return <MarketplaceContent />;
}
