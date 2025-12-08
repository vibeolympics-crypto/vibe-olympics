import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TargetType, ReactionType } from "@prisma/client";

// GET: 반응 통계 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 통계 유형: popular, trending, category, user
    const targetType = searchParams.get("targetType") as TargetType | null;
    const period = searchParams.get("period") || "7d"; // 7d, 30d, 90d, all
    const limit = parseInt(searchParams.get("limit") || "10");

    // 기간 계산
    const now = new Date();
    let startDate: Date | null = null;
    
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = null;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    switch (type) {
      case "popular":
        return await getPopularContent(targetType, startDate, limit);
      
      case "trending":
        return await getTrendingContent(targetType, limit);
      
      case "category":
        return await getCategoryStats(targetType, startDate);
      
      case "user":
        return await getUserReactionStats(request, startDate);
      
      case "overview":
        return await getOverviewStats(startDate);
      
      default:
        return await getOverviewStats(startDate);
    }
  } catch (error) {
    console.error("Reaction analytics error:", error);
    return NextResponse.json(
      { error: "반응 통계를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 인기 콘텐츠 조회
async function getPopularContent(
  targetType: TargetType | null,
  startDate: Date | null,
  limit: number
) {
  const where: Record<string, unknown> = {};
  
  if (targetType) {
    where.targetType = targetType;
  }
  
  if (startDate) {
    where.createdAt = { gte: startDate };
  }

  // 반응 수 기준 인기 콘텐츠
  const popularItems = await prisma.reaction.groupBy({
    by: ["targetType", "targetId"],
    where,
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: limit,
  });

  // 상세 정보 조회
  const itemsWithDetails = await Promise.all(
    popularItems.map(async (item) => {
      let details: Record<string, unknown> | null = null;
      
      switch (item.targetType) {
        case "PRODUCT":
          const product = await prisma.product.findUnique({
            where: { id: item.targetId },
            select: {
              id: true,
              title: true,
              thumbnail: true,
              averageRating: true,
              salesCount: true,
              seller: { select: { name: true, image: true } },
            },
          });
          details = product;
          break;
        
        case "TUTORIAL":
          const tutorial = await prisma.tutorial.findUnique({
            where: { id: item.targetId },
            select: {
              id: true,
              title: true,
              thumbnail: true,
              viewCount: true,
              author: { select: { name: true, image: true } },
            },
          });
          details = tutorial;
          break;
        
        case "POST":
          const post = await prisma.post.findUnique({
            where: { id: item.targetId },
            select: {
              id: true,
              title: true,
              viewCount: true,
              author: { select: { name: true, image: true } },
            },
          });
          details = post;
          break;
      }

      // 반응 유형별 카운트
      const reactionCounts = await prisma.reaction.groupBy({
        by: ["type"],
        where: {
          targetType: item.targetType,
          targetId: item.targetId,
        },
        _count: { type: true },
      });

      const counts: Record<ReactionType, number> = {
        LIKE: 0,
        RECOMMEND: 0,
        HELPFUL: 0,
        BOOKMARK: 0,
      };
      reactionCounts.forEach((r) => {
        counts[r.type] = r._count.type;
      });

      return {
        targetType: item.targetType,
        targetId: item.targetId,
        totalReactions: item._count.id,
        reactionCounts: counts,
        details,
      };
    })
  );

  return NextResponse.json({
    type: "popular",
    items: itemsWithDetails,
  });
}

// 트렌딩 콘텐츠 (최근 급상승)
async function getTrendingContent(
  targetType: TargetType | null,
  limit: number
) {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    createdAt: { gte: last24h },
  };
  
  if (targetType) {
    where.targetType = targetType;
  }

  // 최근 24시간 반응
  const recentReactions = await prisma.reaction.groupBy({
    by: ["targetType", "targetId"],
    where,
    _count: { id: true },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: limit * 2, // 더 많이 가져와서 필터링
  });

  // 지난 7일 대비 상승률 계산
  const trendingItems = await Promise.all(
    recentReactions.map(async (item) => {
      // 이전 기간 반응 수
      const previousCount = await prisma.reaction.count({
        where: {
          targetType: item.targetType,
          targetId: item.targetId,
          createdAt: { gte: last7d, lt: last24h },
        },
      });

      const dailyAverage = previousCount / 6; // 6일 평균
      const growthRate = dailyAverage > 0 
        ? ((item._count.id - dailyAverage) / dailyAverage) * 100 
        : item._count.id * 100;

      return {
        targetType: item.targetType,
        targetId: item.targetId,
        recentCount: item._count.id,
        previousAverage: dailyAverage,
        growthRate: Math.round(growthRate),
      };
    })
  );

  // 상승률 기준 정렬
  const sorted = trendingItems
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, limit);

  return NextResponse.json({
    type: "trending",
    items: sorted,
  });
}

// 카테고리별 반응 통계
async function getCategoryStats(
  targetType: TargetType | null,
  startDate: Date | null
) {
  const where: Record<string, unknown> = {};
  
  if (targetType) {
    where.targetType = targetType;
  }
  
  if (startDate) {
    where.createdAt = { gte: startDate };
  }

  // 반응 유형별 전체 통계
  const reactionTypeCounts = await prisma.reaction.groupBy({
    by: ["type"],
    where,
    _count: { id: true },
  });

  // 대상 유형별 통계
  const targetTypeCounts = await prisma.reaction.groupBy({
    by: ["targetType"],
    where: startDate ? { createdAt: { gte: startDate } } : {},
    _count: { id: true },
  });

  // 일별 반응 추이 (최근 30일)
  const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
  const dailyReactions = await prisma.reaction.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: { gte: thirtyDaysAgo },
      ...(targetType ? { targetType } : {}),
    },
    _count: { id: true },
  });

  // 날짜별로 집계
  const dailyStats: Record<string, number> = {};
  dailyReactions.forEach((r) => {
    const dateStr = r.createdAt.toISOString().split("T")[0];
    dailyStats[dateStr] = (dailyStats[dateStr] || 0) + r._count.id;
  });

  return NextResponse.json({
    type: "category",
    reactionTypes: reactionTypeCounts.map((r) => ({
      type: r.type,
      count: r._count.id,
    })),
    targetTypes: targetTypeCounts.map((r) => ({
      type: r.targetType,
      count: r._count.id,
    })),
    dailyTrend: Object.entries(dailyStats)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  });
}

// 사용자 반응 통계 (로그인 필요)
async function getUserReactionStats(
  request: NextRequest,
  startDate: Date | null
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "로그인이 필요합니다" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const where: Record<string, unknown> = { userId };
  
  if (startDate) {
    where.createdAt = { gte: startDate };
  }

  // 내 반응 통계
  const myReactions = await prisma.reaction.groupBy({
    by: ["type"],
    where,
    _count: { id: true },
  });

  // 내 콘텐츠에 대한 반응 통계 (판매자인 경우)
  const myProducts = await prisma.product.findMany({
    where: { sellerId: userId },
    select: { id: true },
  });

  const myTutorials = await prisma.tutorial.findMany({
    where: { authorId: userId },
    select: { id: true },
  });

  const myPosts = await prisma.post.findMany({
    where: { authorId: userId },
    select: { id: true },
  });

  // 내 콘텐츠에 대한 반응
  const receivedReactions = await prisma.reaction.groupBy({
    by: ["type"],
    where: {
      OR: [
        { targetType: "PRODUCT", targetId: { in: myProducts.map((p) => p.id) } },
        { targetType: "TUTORIAL", targetId: { in: myTutorials.map((t) => t.id) } },
        { targetType: "POST", targetId: { in: myPosts.map((p) => p.id) } },
      ],
      ...(startDate ? { createdAt: { gte: startDate } } : {}),
    },
    _count: { id: true },
  });

  // 북마크한 콘텐츠
  const bookmarked = await prisma.reaction.findMany({
    where: {
      userId,
      type: "BOOKMARK",
    },
    select: {
      targetType: true,
      targetId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    type: "user",
    given: myReactions.map((r) => ({
      type: r.type,
      count: r._count.id,
    })),
    received: receivedReactions.map((r) => ({
      type: r.type,
      count: r._count.id,
    })),
    recentBookmarks: bookmarked,
    contentCounts: {
      products: myProducts.length,
      tutorials: myTutorials.length,
      posts: myPosts.length,
    },
  });
}

// 전체 개요 통계
async function getOverviewStats(startDate: Date | null) {
  const where = startDate ? { createdAt: { gte: startDate } } : {};

  // 총 반응 수
  const totalReactions = await prisma.reaction.count({ where });

  // 반응 유형별 수
  const byType = await prisma.reaction.groupBy({
    by: ["type"],
    where,
    _count: { id: true },
  });

  // 대상 유형별 수
  const byTarget = await prisma.reaction.groupBy({
    by: ["targetType"],
    where,
    _count: { id: true },
  });

  // 활성 사용자 수 (반응한 사용자)
  const activeUsers = await prisma.reaction.groupBy({
    by: ["userId"],
    where,
  });

  return NextResponse.json({
    type: "overview",
    totalReactions,
    byReactionType: byType.map((r) => ({
      type: r.type,
      count: r._count.id,
      percentage: totalReactions > 0 
        ? Math.round((r._count.id / totalReactions) * 100) 
        : 0,
    })),
    byTargetType: byTarget.map((r) => ({
      type: r.targetType,
      count: r._count.id,
      percentage: totalReactions > 0 
        ? Math.round((r._count.id / totalReactions) * 100) 
        : 0,
    })),
    activeUsersCount: activeUsers.length,
  });
}
