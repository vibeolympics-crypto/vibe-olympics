import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MarketplaceContent } from "../../marketplace-content";
import { notFound } from "next/navigation";

// 카테고리 SEO 데이터
const categoryMeta: Record<string, { 
  title: string; 
  description: string; 
  keywords: string[];
}> = {
  "ai-solutions": {
    title: "AI 솔루션",
    description: "인공지능 기반 솔루션으로 업무 효율을 극대화하세요. 자동화, 분석, 생성 AI 도구를 만나보세요.",
    keywords: ["AI 솔루션", "인공지능", "자동화", "머신러닝", "GPT", "AI 도구"],
  },
  "business-models": {
    title: "비즈니스 모델",
    description: "검증된 비즈니스 모델과 수익화 전략을 확인하세요. 스타트업부터 기업까지 적용 가능한 템플릿.",
    keywords: ["비즈니스 모델", "수익화", "스타트업", "창업", "BM 캔버스"],
  },
  "automation": {
    title: "업무 자동화",
    description: "반복 작업을 자동화하여 시간을 절약하세요. 노코드/로우코드 자동화 솔루션 모음.",
    keywords: ["업무 자동화", "자동화", "노코드", "워크플로우", "효율화"],
  },
  "data-analytics": {
    title: "데이터 분석",
    description: "데이터 기반 의사결정을 위한 분석 도구와 대시보드 템플릿을 찾아보세요.",
    keywords: ["데이터 분석", "대시보드", "시각화", "BI", "통계"],
  },
  "templates": {
    title: "템플릿",
    description: "즉시 사용 가능한 고품질 템플릿 모음. 프레젠테이션, 문서, 스프레드시트 등.",
    keywords: ["템플릿", "문서 템플릿", "프레젠테이션", "스프레드시트"],
  },
  "prompts": {
    title: "프롬프트",
    description: "AI 챗봇과 생성 AI를 위한 최적화된 프롬프트 컬렉션. ChatGPT, Claude, Midjourney 등.",
    keywords: ["프롬프트", "ChatGPT", "Claude", "AI 프롬프트", "프롬프트 엔지니어링"],
  },
  "education": {
    title: "교육/강의",
    description: "전문가가 제작한 교육 콘텐츠와 강의 자료. 실무에 바로 적용 가능한 학습 자료.",
    keywords: ["교육", "강의", "튜토리얼", "학습", "온라인 강의"],
  },
  "development": {
    title: "개발 도구",
    description: "개발자를 위한 코드 스니펫, 라이브러리, 개발 도구 모음.",
    keywords: ["개발", "코드", "라이브러리", "API", "개발 도구"],
  },
};

interface Props {
  params: { slug: string };
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: params.slug },
        { id: params.slug },
      ],
    },
  });

  if (!category) {
    return {
      title: "카테고리를 찾을 수 없습니다",
    };
  }

  const meta = categoryMeta[category.slug] || {
    title: category.name,
    description: `${category.name} 카테고리의 디지털 상품을 둘러보세요.`,
    keywords: [category.name, "디지털 상품", "마켓플레이스"],
  };

  // 상품 수 조회
  const productCount = await prisma.product.count({
    where: { 
      categoryId: category.id,
      isPublished: true,
      status: "PUBLISHED",
    },
  });

  const title = `${meta.title} - 마켓플레이스 | Vibe Olympics`;
  const description = `${meta.description} ${productCount}개의 상품이 등록되어 있습니다.`;

  return {
    title,
    description,
    keywords: meta.keywords,
    openGraph: {
      title,
      description,
      url: `https://vibeolympics.com/marketplace/category/${category.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://vibeolympics.com/marketplace/category/${category.slug}`,
    },
  };
}

// JSON-LD 구조화 데이터
function generateJsonLd(category: { name: string; slug: string }, productCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} - Vibe Olympics 마켓플레이스`,
    description: categoryMeta[category.slug]?.description || `${category.name} 카테고리의 디지털 상품`,
    url: `https://vibeolympics.com/marketplace/category/${category.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: productCount,
      itemListElement: [],
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "홈",
          item: "https://vibeolympics.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "마켓플레이스",
          item: "https://vibeolympics.com/marketplace",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: category.name,
          item: `https://vibeolympics.com/marketplace/category/${category.slug}`,
        },
      ],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: params.slug },
        { id: params.slug },
      ],
    },
  });

  if (!category) {
    notFound();
  }

  const productCount = await prisma.product.count({
    where: { 
      categoryId: category.id,
      isPublished: true,
      status: "PUBLISHED",
    },
  });

  const jsonLd = generateJsonLd(category, productCount);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketplaceContent initialCategory={category.id} />
    </>
  );
}

// 정적 경로 생성 (선택적)
export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  return categories.map((cat) => ({
    slug: cat.slug,
  }));
}
