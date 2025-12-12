import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${APP_URL}/marketplace`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/education`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${APP_URL}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // ?숈쟻 ?쇱슦??- ?곹뭹 ?곸꽭 ?섏씠吏
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, updatedAt: true },
    });
    productRoutes = products.map((product) => ({
      url: `${APP_URL}/marketplace/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB ?곌껐 ?ㅽ뙣 ??鍮?諛곗뿴
  }

  // ?숈쟻 ?쇱슦??- 而ㅻ??덊떚 寃뚯떆湲 (??젣?섏? ?딆? 寃껊쭔)
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.post.findMany({
      where: { isDeleted: false },
      select: { id: true, updatedAt: true },
    });
    postRoutes = posts.map((post) => ({
      url: `${APP_URL}/community/${post.id}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB ?곌껐 ?ㅽ뙣 ??鍮?諛곗뿴
  }

  // ?숈쟻 ?쇱슦??- 援먯쑁 肄섑뀗痢?
  let tutorialRoutes: MetadataRoute.Sitemap = [];
  try {
    const tutorials = await prisma.tutorial.findMany({
      where: { isPublished: true },
      select: { id: true, updatedAt: true },
    });
    tutorialRoutes = tutorials.map((tutorial) => ({
      url: `${APP_URL}/education/${tutorial.id}`,
      lastModified: tutorial.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB ?곌껐 ?ㅽ뙣 ??鍮?諛곗뿴
  }

  // ?숈쟻 ?쇱슦??- ?먮ℓ???꾨줈???섏씠吏
  let sellerRoutes: MetadataRoute.Sitemap = [];
  try {
    const sellers = await prisma.user.findMany({
      where: { isSeller: true },
      select: { id: true, updatedAt: true },
    });
    sellerRoutes = sellers.map((seller) => ({
      url: `${APP_URL}/seller/${seller.id}`,
      lastModified: seller.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB ?곌껐 ?ㅽ뙣 ??鍮?諛곗뿴
  }

  return [...staticRoutes, ...productRoutes, ...postRoutes, ...tutorialRoutes, ...sellerRoutes];
}

