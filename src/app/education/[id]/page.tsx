import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TutorialDetailContent } from "./tutorial-detail-content";

// 튜토리얼 데이터 조회
const getTutorial = async (id: string) => {
  try {
    const tutorial = await prisma.tutorial.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            isSeller: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!tutorial) return null;

    // 조회수 증가
    await prisma.tutorial.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      id: tutorial.id,
      title: tutorial.title,
      description: tutorial.description,
      content: tutorial.content,
      type: tutorial.type.toLowerCase(),
      thumbnail: tutorial.thumbnail,
      externalUrl: tutorial.externalUrl,
      duration: tutorial.duration,
      tags: tutorial.tags,
      viewCount: tutorial.viewCount + 1,
      likeCount: tutorial._count.likes,
      isFeatured: tutorial.isFeatured,
      createdAt: tutorial.createdAt.toISOString(),
      updatedAt: tutorial.updatedAt.toISOString(),
      author: {
        id: tutorial.author.id,
        name: tutorial.author.name || "익명",
        username: tutorial.author.email?.split("@")[0] || "unknown",
        image: tutorial.author.image,
        bio: tutorial.author.bio || "",
        isSeller: tutorial.author.isSeller,
      },
    };
  } catch (error) {
    console.error("Failed to fetch tutorial:", error);
    return null;
  }
};

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tutorial = await getTutorial(id);

  if (!tutorial) {
    return {
      title: "콘텐츠를 찾을 수 없습니다",
    };
  }

  const typeLabel = {
    tutorial: "튜토리얼",
    making: "제작기",
    tips: "팁",
    external: "외부 자료",
  }[tutorial.type] || "교육";

  return {
    title: `${tutorial.title} | ${typeLabel} | Vibe Olympics 교육 센터`,
    description: tutorial.description,
    keywords: tutorial.tags.join(", "),
    openGraph: {
      title: tutorial.title,
      description: tutorial.description,
      type: "article",
      publishedTime: tutorial.createdAt,
      modifiedTime: tutorial.updatedAt,
      authors: [tutorial.author.name],
      tags: tutorial.tags,
      images: tutorial.thumbnail ? [tutorial.thumbnail] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: tutorial.title,
      description: tutorial.description,
      images: tutorial.thumbnail ? [tutorial.thumbnail] : [],
    },
    alternates: {
      canonical: `/education/${tutorial.id}`,
    },
  };
}

// JSON-LD 구조화 데이터 생성
function generateJsonLd(tutorial: NonNullable<Awaited<ReturnType<typeof getTutorial>>>) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibe-olympics.com";
  
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: tutorial.title,
    description: tutorial.description,
    author: {
      "@type": "Person",
      name: tutorial.author.name,
    },
    datePublished: tutorial.createdAt,
    dateModified: tutorial.updatedAt,
    publisher: {
      "@type": "Organization",
      name: "Vibe Olympics",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/education/${tutorial.id}`,
    },
    keywords: tutorial.tags.join(", "),
  };

  // 썸네일 이미지 추가
  if (tutorial.thumbnail) {
    jsonLd.image = {
      "@type": "ImageObject",
      url: tutorial.thumbnail,
    };
  }

  // 튜토리얼 타입에 따른 추가 스키마
  if (tutorial.type === "tutorial") {
    jsonLd["@type"] = "HowTo";
    jsonLd.name = tutorial.title;
  }

  return jsonLd;
}

export default async function TutorialDetailPage({ params }: Props) {
  const { id } = await params;
  const tutorial = await getTutorial(id);

  if (!tutorial) {
    notFound();
  }

  const jsonLd = generateJsonLd(tutorial);

  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TutorialDetailContent tutorial={tutorial} />
    </>
  );
}
