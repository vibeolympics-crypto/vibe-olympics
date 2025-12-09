import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 개인화 추천 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, products, tutorials, posts
    const limit = parseInt(searchParams.get("limit") || "12");

    // 로그인한 사용자인 경우 개인화 추천
    if (session?.user?.id) {
      return await getPersonalizedRecommendations(
        session.user.id,
        type as "all" | "products" | "tutorials" | "posts",
        limit
      );
    }

    // 비로그인 사용자는 인기 콘텐츠 추천
    return await getPopularRecommendations(
      type as "all" | "products" | "tutorials" | "posts",
      limit
    );
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { error: "추천을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 개인화 추천 (로그인 사용자)
async function getPersonalizedRecommendations(
  userId: string,
  type: "all" | "products" | "tutorials" | "posts",
  limit: number
) {
  // 1. 사용자의 반응 패턴 분석
  const userReactions = await prisma.reaction.findMany({
    where: { userId },
    select: {
      targetType: true,
      targetId: true,
      type: true,
    },
  });

  // 2. 좋아요/북마크한 콘텐츠의 태그/카테고리 추출
  const likedProductIds = userReactions
    .filter((r) => r.targetType === "PRODUCT" && (r.type === "LIKE" || r.type === "BOOKMARK"))
    .map((r) => r.targetId);

  const likedTutorialIds = userReactions
    .filter((r) => r.targetType === "TUTORIAL" && (r.type === "LIKE" || r.type === "BOOKMARK"))
    .map((r) => r.targetId);

  // 좋아요한 상품의 태그/카테고리
  const likedProducts = await prisma.product.findMany({
    where: { id: { in: likedProductIds } },
    select: { tags: true, categoryId: true },
  });

  const preferredTags = [...new Set(likedProducts.flatMap((p) => p.tags))];
  const preferredCategories = [...new Set(likedProducts.map((p) => p.categoryId))];

  // 좋아요한 튜토리얼의 태그/타입
  const likedTutorials = await prisma.tutorial.findMany({
    where: { id: { in: likedTutorialIds } },
    select: { tags: true, type: true },
  });

  const preferredTutorialTags = [...new Set(likedTutorials.flatMap((t) => t.tags))];
  const preferredTutorialTypes = [...new Set(likedTutorials.map((t) => t.type))];

  // 3. 이미 반응한 콘텐츠 제외
  const excludeProductIds = userReactions
    .filter((r) => r.targetType === "PRODUCT")
    .map((r) => r.targetId);
  
  const excludeTutorialIds = userReactions
    .filter((r) => r.targetType === "TUTORIAL")
    .map((r) => r.targetId);

  const excludePostIds = userReactions
    .filter((r) => r.targetType === "POST")
    .map((r) => r.targetId);

  // 4. 추천 콘텐츠 조회
  const recommendations: {
    products: unknown[];
    tutorials: unknown[];
    posts: unknown[];
  } = {
    products: [],
    tutorials: [],
    posts: [],
  };

  if (type === "all" || type === "products") {
    // 선호 태그/카테고리 기반 상품 추천
    const productRecommendations = await prisma.product.findMany({
      where: {
        id: { notIn: excludeProductIds },
        status: "PUBLISHED",
        isPublished: true,
        OR: [
          { tags: { hasSome: preferredTags } },
          { categoryId: { in: preferredCategories } },
        ],
      },
      orderBy: [
        { salesCount: "desc" },
        { averageRating: "desc" },
      ],
      take: type === "products" ? limit : Math.ceil(limit / 3),
      select: {
        id: true,
        title: true,
        shortDescription: true,
        thumbnail: true,
        price: true,
        pricingType: true,
        averageRating: true,
        salesCount: true,
        tags: true,
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, name: true, image: true } },
      },
    });

    // 태그 매칭 점수 계산
    recommendations.products = productRecommendations.map((p) => ({
      ...p,
      matchScore: p.tags.filter((t) => preferredTags.includes(t)).length,
      recommendReason: getProductRecommendReason(
        { tags: p.tags, categoryId: p.category.id }, 
        preferredTags, 
        preferredCategories
      ),
    }));
  }

  if (type === "all" || type === "tutorials") {
    // 선호 태그/타입 기반 튜토리얼 추천
    const tutorialRecommendations = await prisma.tutorial.findMany({
      where: {
        id: { notIn: excludeTutorialIds },
        isPublished: true,
        OR: [
          { tags: { hasSome: preferredTutorialTags } },
          { type: { in: preferredTutorialTypes } },
        ],
      },
      orderBy: [
        { viewCount: "desc" },
        { likeCount: "desc" },
      ],
      take: type === "tutorials" ? limit : Math.ceil(limit / 3),
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        type: true,
        viewCount: true,
        likeCount: true,
        tags: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });

    recommendations.tutorials = tutorialRecommendations.map((t) => ({
      ...t,
      matchScore: t.tags.filter((tag) => preferredTutorialTags.includes(tag)).length,
      recommendReason: getTutorialRecommendReason(t, preferredTutorialTags, preferredTutorialTypes),
    }));
  }

  if (type === "all" || type === "posts") {
    // 커뮤니티 게시글 추천 (인기 기반)
    const postRecommendations = await prisma.post.findMany({
      where: {
        id: { notIn: excludePostIds },
        isDeleted: false,
      },
      orderBy: [
        { viewCount: "desc" },
        { likeCount: "desc" },
      ],
      take: type === "posts" ? limit : Math.ceil(limit / 3),
      select: {
        id: true,
        title: true,
        category: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });

    recommendations.posts = postRecommendations.map((p) => ({
      ...p,
      recommendReason: "인기 게시글",
    }));
  }

  // 5. 협업 필터링: 비슷한 취향의 사용자가 좋아하는 콘텐츠
  const similarUsers = await findSimilarUsers(userId, likedProductIds, likedTutorialIds);
  
  if (similarUsers.length > 0) {
    const collaborativeRecommendations = await getCollaborativeRecommendations(
      similarUsers,
      excludeProductIds,
      excludeTutorialIds,
      Math.ceil(limit / 4)
    );
    
    // 협업 필터링 결과 추가
    if (collaborativeRecommendations.products.length > 0) {
      recommendations.products.push(
        ...collaborativeRecommendations.products.map((p) => ({
          ...p,
          recommendReason: "비슷한 취향의 사용자가 좋아함",
        }))
      );
    }
  }

  return NextResponse.json({
    type: "personalized",
    userId,
    recommendations,
    preferences: {
      tags: preferredTags.slice(0, 10),
      categories: preferredCategories,
      tutorialTypes: preferredTutorialTypes,
    },
  });
}

// 인기 기반 추천 (비로그인 사용자)
async function getPopularRecommendations(
  type: "all" | "products" | "tutorials" | "posts",
  limit: number
) {
  const recommendations: {
    products: unknown[];
    tutorials: unknown[];
    posts: unknown[];
  } = {
    products: [],
    tutorials: [],
    posts: [],
  };

  if (type === "all" || type === "products") {
    recommendations.products = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
      },
      orderBy: [
        { salesCount: "desc" },
        { averageRating: "desc" },
      ],
      take: type === "products" ? limit : Math.ceil(limit / 3),
      select: {
        id: true,
        title: true,
        shortDescription: true,
        thumbnail: true,
        price: true,
        pricingType: true,
        averageRating: true,
        salesCount: true,
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, name: true, image: true } },
      },
    });
  }

  if (type === "all" || type === "tutorials") {
    recommendations.tutorials = await prisma.tutorial.findMany({
      where: { isPublished: true },
      orderBy: [
        { viewCount: "desc" },
        { likeCount: "desc" },
      ],
      take: type === "tutorials" ? limit : Math.ceil(limit / 3),
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        type: true,
        viewCount: true,
        likeCount: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });
  }

  if (type === "all" || type === "posts") {
    recommendations.posts = await prisma.post.findMany({
      where: { isDeleted: false },
      orderBy: [
        { viewCount: "desc" },
        { likeCount: "desc" },
      ],
      take: type === "posts" ? limit : Math.ceil(limit / 3),
      select: {
        id: true,
        title: true,
        category: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });
  }

  return NextResponse.json({
    type: "popular",
    recommendations,
  });
}

// 비슷한 취향의 사용자 찾기
async function findSimilarUsers(
  userId: string,
  likedProductIds: string[],
  likedTutorialIds: string[]
): Promise<string[]> {
  if (likedProductIds.length === 0 && likedTutorialIds.length === 0) {
    return [];
  }

  // 같은 콘텐츠를 좋아한 다른 사용자 찾기
  const similarUserReactions = await prisma.reaction.findMany({
    where: {
      userId: { not: userId },
      OR: [
        { targetType: "PRODUCT", targetId: { in: likedProductIds } },
        { targetType: "TUTORIAL", targetId: { in: likedTutorialIds } },
      ],
      type: { in: ["LIKE", "BOOKMARK"] },
    },
    select: { userId: true },
  });

  // 중복 제거 및 상위 5명
  const userCounts = similarUserReactions.reduce((acc, r) => {
    acc[r.userId] = (acc[r.userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([uid]) => uid);
}

// 협업 필터링 추천
async function getCollaborativeRecommendations(
  similarUserIds: string[],
  excludeProductIds: string[],
  excludeTutorialIds: string[],
  limit: number
) {
  // 비슷한 사용자들이 좋아하는 상품
  const collaborativeProducts = await prisma.reaction.findMany({
    where: {
      userId: { in: similarUserIds },
      targetType: "PRODUCT",
      targetId: { notIn: excludeProductIds },
      type: { in: ["LIKE", "BOOKMARK"] },
    },
    select: { targetId: true },
    take: limit * 2,
  });

  const productIds = [...new Set(collaborativeProducts.map((r) => r.targetId))].slice(0, limit);

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: "PUBLISHED",
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      shortDescription: true,
      thumbnail: true,
      price: true,
      pricingType: true,
      averageRating: true,
      salesCount: true,
      category: { select: { id: true, name: true, slug: true } },
      seller: { select: { id: true, name: true, image: true } },
    },
  });

  return { products };
}

// 상품 추천 이유 생성
function getProductRecommendReason(
  product: { tags: string[]; categoryId: string },
  preferredTags: string[],
  preferredCategories: string[]
): string {
  const matchingTags = product.tags.filter((t) => preferredTags.includes(t));
  
  if (matchingTags.length > 0) {
    return `관심 태그: ${matchingTags.slice(0, 2).join(", ")}`;
  }
  
  if (preferredCategories.includes(product.categoryId)) {
    return "관심 카테고리의 상품";
  }
  
  return "추천 상품";
}

// 튜토리얼 추천 이유 생성
function getTutorialRecommendReason(
  tutorial: { tags: string[]; type: string },
  preferredTags: string[],
  preferredTypes: string[]
): string {
  const matchingTags = tutorial.tags.filter((t) => preferredTags.includes(t));
  
  if (matchingTags.length > 0) {
    return `관심 태그: ${matchingTags.slice(0, 2).join(", ")}`;
  }
  
  if (preferredTypes.includes(tutorial.type)) {
    const typeLabels: Record<string, string> = {
      TUTORIAL: "튜토리얼",
      MAKING: "제작기",
      TIPS: "팁",
      EXTERNAL: "외부 자료",
    };
    return `관심 유형: ${typeLabels[tutorial.type] || tutorial.type}`;
  }
  
  return "추천 콘텐츠";
}
