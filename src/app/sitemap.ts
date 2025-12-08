import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL || "https://vibeolympics.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/marketplace`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/education`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 동적 라우트 - 상품 상세 페이지
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, updatedAt: true },
    });
    productRoutes = products.map((product) => ({
      url: `${BASE_URL}/marketplace/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB 연결 실패 시 빈 배열
  }

  // 동적 라우트 - 커뮤니티 게시글 (삭제되지 않은 것만)
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.post.findMany({
      where: { isDeleted: false },
      select: { id: true, updatedAt: true },
    });
    postRoutes = posts.map((post) => ({
      url: `${BASE_URL}/community/${post.id}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB 연결 실패 시 빈 배열
  }

  // 동적 라우트 - 교육 콘텐츠
  let tutorialRoutes: MetadataRoute.Sitemap = [];
  try {
    const tutorials = await prisma.tutorial.findMany({
      where: { isPublished: true },
      select: { id: true, updatedAt: true },
    });
    tutorialRoutes = tutorials.map((tutorial) => ({
      url: `${BASE_URL}/education/${tutorial.id}`,
      lastModified: tutorial.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB 연결 실패 시 빈 배열
  }

  // 동적 라우트 - 판매자 프로필 페이지
  let sellerRoutes: MetadataRoute.Sitemap = [];
  try {
    const sellers = await prisma.user.findMany({
      where: { isSeller: true },
      select: { id: true, updatedAt: true },
    });
    sellerRoutes = sellers.map((seller) => ({
      url: `${BASE_URL}/seller/${seller.id}`,
      lastModified: seller.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB 연결 실패 시 빈 배열
  }

  return [...staticRoutes, ...productRoutes, ...postRoutes, ...tutorialRoutes, ...sellerRoutes];
}
