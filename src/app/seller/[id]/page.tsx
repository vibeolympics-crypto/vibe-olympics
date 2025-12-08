import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SellerProfileContent } from "./seller-profile-content";

interface Props {
  params: Promise<{ id: string }>;
}

async function getSeller(id: string) {
  try {
    const seller = await prisma.user.findUnique({
      where: { 
        id,
        isSeller: true,
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        website: true,
        github: true,
        twitter: true,
        createdAt: true,
        _count: {
          select: {
            products: {
              where: { status: "PUBLISHED" },
            },
          },
        },
      },
    });

    return seller;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const seller = await getSeller(id);

  if (!seller) {
    return {
      title: "판매자를 찾을 수 없습니다",
    };
  }

  const displayName = seller.name || "익명 판매자";

  return {
    title: `${displayName} | Vibe Olympics 판매자`,
    description: seller.bio || `${displayName}님의 판매자 프로필입니다. ${seller._count.products}개의 상품을 판매하고 있습니다.`,
    openGraph: {
      title: `${displayName} - Vibe Olympics 판매자`,
      description: seller.bio || `${displayName}님의 판매자 프로필`,
      images: seller.image ? [seller.image] : [],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: displayName,
      description: seller.bio || `${displayName}님의 판매자 프로필`,
    },
  };
}

// JSON-LD 구조화 데이터
function generateJsonLd(seller: NonNullable<Awaited<ReturnType<typeof getSeller>>>) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://vibeolympics.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: seller.name || "익명 판매자",
    url: `${baseUrl}/seller/${seller.id}`,
    image: seller.image,
    description: seller.bio,
    sameAs: [
      seller.website,
      seller.github ? `https://github.com/${seller.github}` : null,
      seller.twitter ? `https://twitter.com/${seller.twitter}` : null,
    ].filter(Boolean),
  };
}

export default async function SellerProfilePage({ params }: Props) {
  const { id } = await params;
  const seller = await getSeller(id);

  if (!seller) {
    notFound();
  }

  const jsonLd = generateJsonLd(seller);

  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SellerProfileContent sellerId={id} />
    </>
  );
}
