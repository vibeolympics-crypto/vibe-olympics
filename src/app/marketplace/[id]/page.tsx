import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailContent } from "./product-detail-content";

// 상품 데이터 조회
const getProduct = async (id: string) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            isSeller: true,
            sellerVerified: true,
            totalSales: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
            wishlists: true,
            purchases: true,
          },
        },
      },
    });

    if (!product) return null;

    // 조회수 증가
    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // 판매자의 총 상품 수 계산
    const sellerProductCount = await prisma.product.count({
      where: { sellerId: product.sellerId, status: "PUBLISHED" },
    });

    // 판매자 평균 평점 계산
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId: product.sellerId, status: "PUBLISHED" },
      select: { averageRating: true },
    });
    const sellerRating = sellerProducts.length > 0
      ? sellerProducts.reduce((acc: number, p: { averageRating: number }) => acc + p.averageRating, 0) / sellerProducts.length
      : 0;

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      seller: {
        id: product.seller.id,
        name: product.seller.name || "익명",
        username: product.seller.email?.split("@")[0] || "unknown",
        image: product.seller.image,
        bio: product.seller.bio || "",
        totalProducts: sellerProductCount,
        totalSales: product.seller.totalSales,
        rating: sellerRating,
        verified: product.seller.sellerVerified,
      },
      images: product.images || [],
      tags: product.tags || [],
      features: product.features || [],
      techStack: product.techStack || [],
      rating: product.averageRating,
      reviewCount: product._count.reviews,
      salesCount: product.salesCount,
      viewCount: product.viewCount,
      downloadCount: product.downloadCount,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      status: product.status,
      license: product.licenseType,
      pricingType: product.pricingType,
      reviews: product.reviews.map((review: { id: string; user: { id: string; name: string | null; image: string | null }; rating: number; content: string; createdAt: Date; helpfulCount: number }) => ({
        id: review.id,
        user: {
          id: review.user.id,
          name: review.user.name || "익명",
          image: review.user.image,
        },
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt.toISOString(),
        helpful: review.helpfulCount,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
};

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "상품을 찾을 수 없습니다",
    };
  }

  const description = product.shortDescription || product.description.slice(0, 160);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibeolympics.com";
  const priceText = product.pricingType === "FREE" ? "무료" : `₩${product.price.toLocaleString()}`;

  return {
    title: `${product.title}`,
    description,
    keywords: [
      ...product.tags,
      product.category.name,
      "VIBE 코딩",
      "디지털 상품",
      product.seller.name,
      priceText === "무료" ? "무료 템플릿" : "유료 템플릿",
    ],
    authors: [{ name: product.seller.name }],
    openGraph: {
      title: product.title,
      description,
      type: "website",
      url: `${appUrl}/marketplace/${product.id}`,
      siteName: "Vibe Olympics",
      images: product.images[0] ? [{
        url: product.images[0],
        width: 1200,
        height: 630,
        alt: product.title,
      }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: product.images[0] ? [product.images[0]] : [],
    },
    alternates: {
      canonical: `/marketplace/${product.id}`,
    },
    other: {
      "product:price:amount": String(product.price),
      "product:price:currency": "KRW",
      "product:availability": "in stock",
    },
  };
}

// JSON-LD 구조화 데이터 생성 (SEO 강화)
function generateProductJsonLd(product: NonNullable<Awaited<ReturnType<typeof getProduct>>>) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibeolympics.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription || product.description.slice(0, 300),
    image: product.images,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "Vibe Olympics",
    },
    offers: {
      "@type": "Offer",
      url: `${appUrl}/marketplace/${product.id}`,
      priceCurrency: "KRW",
      price: product.price,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Person",
        name: product.seller.name,
      },
    },
    aggregateRating: product.reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    review: product.reviews.slice(0, 5).map(review => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.user.name,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: review.content,
      datePublished: review.createdAt,
    })),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const jsonLd = generateProductJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailContent product={product} />
    </>
  );
}
