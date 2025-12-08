import {
  HeroSection,
  CategoriesSection,
  FeaturesSection,
  HowItWorksSection,
  CTASection,
} from "@/components/home";

// JSON-LD 구조화 데이터
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vibe Olympics",
  description: "VIBE 코딩 기반 지적 상품 마켓플레이스. 아이디어를 현실로, 지식을 가치로 만들어보세요.",
  url: process.env.NEXTAUTH_URL || "https://vibeolympics.com",
  logo: `${process.env.NEXTAUTH_URL || "https://vibeolympics.com"}/logo.png`,
  sameAs: [
    "https://github.com/vibeolympics",
    "https://twitter.com/vibeolympics",
  ],
};

export default function Home() {
  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <CategoriesSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}

