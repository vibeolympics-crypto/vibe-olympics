/**
 * 조건부 확률 분석 API
 * 반응 패턴과 구매 전환 상관관계를 분석합니다.
 * 
 * GET /api/analytics/conversion
 * 
 * Query Parameters:
 * - period: day, week, month, all (기본: month)
 * - productId: 특정 상품 분석 (선택)
 * - categoryId: 특정 카테고리 분석 (선택)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TargetType, ReactionType } from '@prisma/client';

export const dynamic = 'force-dynamic';

// 기간별 시작 날짜 계산
function getPeriodStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.setDate(now.getDate() - 1));
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'all':
      return new Date(0);
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const productId = searchParams.get('productId');
    const categoryId = searchParams.get('categoryId');
    
    const startDate = getPeriodStartDate(period);
    
    // 1. 반응 → 구매 전환율 분석
    // 반응한 사용자 중 구매한 비율
    const conversionAnalysis = await analyzeConversion(startDate, productId, categoryId);
    
    // 2. 반응 유형별 구매 전환율
    const reactionTypeConversion = await analyzeReactionTypeConversion(startDate, productId, categoryId);
    
    // 3. 반응 조합별 구매 전환율 (복합 반응)
    const combinationConversion = await analyzeCombinationConversion(startDate, productId, categoryId);
    
    // 4. 반응에서 구매까지 평균 시간
    const timeToConversion = await analyzeTimeToConversion(startDate, productId, categoryId);
    
    // 5. 카테고리별 전환율
    const categoryConversion = await analyzeCategoryConversion(startDate);
    
    // 6. 가격대별 전환율
    const priceRangeConversion = await analyzePriceRangeConversion(startDate);

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      analysis: {
        // 전체 전환율
        overall: conversionAnalysis,
        // 반응 유형별 전환율
        byReactionType: reactionTypeConversion,
        // 반응 조합별 전환율
        byCombination: combinationConversion,
        // 전환 시간 분석
        timeToConversion,
        // 카테고리별 전환율
        byCategory: categoryConversion,
        // 가격대별 전환율
        byPriceRange: priceRangeConversion,
      },
      insights: generateInsights(
        conversionAnalysis,
        reactionTypeConversion,
        combinationConversion,
        timeToConversion
      ),
    });
  } catch (error) {
    console.error('Conversion analytics error:', error);
    return NextResponse.json(
      { error: '전환율 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 전체 전환율 분석
async function analyzeConversion(
  startDate: Date,
  productId?: string | null,
  categoryId?: string | null
) {
  // 상품에 반응한 고유 사용자 수
  const reactedUsers = await prisma.reaction.findMany({
    where: {
      targetType: TargetType.PRODUCT,
      createdAt: { gte: startDate },
      ...(productId && { targetId: productId }),
    },
    select: {
      userId: true,
      targetId: true,
    },
    distinct: ['userId', 'targetId'],
  });

  // 실제 구매한 사용자-상품 쌍
  const purchases = await prisma.purchase.findMany({
    where: {
      createdAt: { gte: startDate },
      status: 'COMPLETED',
      ...(productId && { productId }),
      ...(categoryId && {
        product: { categoryId },
      }),
    },
    select: {
      buyerId: true,
      productId: true,
    },
  });

  // 반응 후 구매한 케이스
  const purchaseSet = new Set(
    purchases.map((p) => `${p.buyerId}-${p.productId}`)
  );
  
  const convertedCount = reactedUsers.filter((r) =>
    purchaseSet.has(`${r.userId}-${r.targetId}`)
  ).length;

  const totalReacted = reactedUsers.length;
  const conversionRate = totalReacted > 0 ? (convertedCount / totalReacted) * 100 : 0;

  // 반응 없이 구매한 케이스
  const reactedSet = new Set(
    reactedUsers.map((r) => `${r.userId}-${r.targetId}`)
  );
  
  const directPurchases = purchases.filter(
    (p) => !reactedSet.has(`${p.buyerId}-${p.productId}`)
  ).length;

  return {
    totalReacted,
    totalPurchases: purchases.length,
    convertedFromReaction: convertedCount,
    directPurchases,
    conversionRate: Math.round(conversionRate * 100) / 100,
    directPurchaseRate: Math.round(
      (directPurchases / Math.max(purchases.length, 1)) * 10000
    ) / 100,
  };
}

// 반응 유형별 전환율 분석
async function analyzeReactionTypeConversion(
  startDate: Date,
  productId?: string | null,
  categoryId?: string | null
) {
  const reactionTypes = Object.values(ReactionType);
  const results: Record<string, { count: number; converted: number; rate: number }> = {};

  for (const type of reactionTypes) {
    // 해당 반응 유형으로 반응한 사용자-상품
    const reactions = await prisma.reaction.findMany({
      where: {
        targetType: TargetType.PRODUCT,
        type,
        createdAt: { gte: startDate },
        ...(productId && { targetId: productId }),
      },
      select: {
        userId: true,
        targetId: true,
      },
    });

    // 해당 상품 구매 여부 확인
    let convertedCount = 0;
    for (const reaction of reactions) {
      const purchased = await prisma.purchase.findFirst({
        where: {
          buyerId: reaction.userId,
          productId: reaction.targetId,
          status: 'COMPLETED',
          ...(categoryId && {
            product: { categoryId },
          }),
        },
      });
      if (purchased) convertedCount++;
    }

    results[type] = {
      count: reactions.length,
      converted: convertedCount,
      rate: reactions.length > 0
        ? Math.round((convertedCount / reactions.length) * 10000) / 100
        : 0,
    };
  }

  return results;
}

// 반응 조합별 전환율 분석
async function analyzeCombinationConversion(
  startDate: Date,
  productId?: string | null,
  categoryId?: string | null
) {
  // 사용자별 상품별 반응 조합 조회
  const reactions = await prisma.reaction.groupBy({
    by: ['userId', 'targetId'],
    where: {
      targetType: TargetType.PRODUCT,
      createdAt: { gte: startDate },
      ...(productId && { targetId: productId }),
    },
    _count: {
      type: true,
    },
  });

  // 각 사용자-상품 쌍의 반응 유형 조회
  const combinationStats: Record<string, { count: number; converted: number }> = {};

  for (const group of reactions.slice(0, 100)) { // 성능을 위해 최대 100개 샘플
    const userReactions = await prisma.reaction.findMany({
      where: {
        userId: group.userId,
        targetId: group.targetId,
        targetType: TargetType.PRODUCT,
      },
      select: { type: true },
    });

    const types = userReactions.map((r) => r.type).sort().join('+');
    
    // 구매 여부 확인
    const purchased = await prisma.purchase.findFirst({
      where: {
        buyerId: group.userId,
        productId: group.targetId,
        status: 'COMPLETED',
        ...(categoryId && {
          product: { categoryId },
        }),
      },
    });

    if (!combinationStats[types]) {
      combinationStats[types] = { count: 0, converted: 0 };
    }
    combinationStats[types].count++;
    if (purchased) combinationStats[types].converted++;
  }

  // 전환율 계산 및 정렬
  const results = Object.entries(combinationStats)
    .map(([combination, stats]) => ({
      combination,
      count: stats.count,
      converted: stats.converted,
      rate: stats.count > 0
        ? Math.round((stats.converted / stats.count) * 10000) / 100
        : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  return results;
}

// 반응에서 구매까지 평균 시간 분석
async function analyzeTimeToConversion(
  startDate: Date,
  productId?: string | null,
  categoryId?: string | null
) {
  // 반응 후 구매한 케이스 조회
  const purchases = await prisma.purchase.findMany({
    where: {
      createdAt: { gte: startDate },
      status: 'COMPLETED',
      ...(productId && { productId }),
      ...(categoryId && {
        product: { categoryId },
      }),
    },
    select: {
      buyerId: true,
      productId: true,
      createdAt: true,
    },
    take: 200, // 성능을 위해 제한
  });

  const timeDeltas: number[] = [];
  const timeDistribution = {
    sameDay: 0,      // 24시간 이내
    within3Days: 0,  // 3일 이내
    within7Days: 0,  // 7일 이내
    within30Days: 0, // 30일 이내
    over30Days: 0,   // 30일 초과
  };

  for (const purchase of purchases) {
    // 해당 상품에 대한 첫 번째 반응 찾기
    const firstReaction = await prisma.reaction.findFirst({
      where: {
        userId: purchase.buyerId,
        targetId: purchase.productId,
        targetType: TargetType.PRODUCT,
        createdAt: { lt: purchase.createdAt },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (firstReaction) {
      const timeDiff = purchase.createdAt.getTime() - firstReaction.createdAt.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      timeDeltas.push(daysDiff);

      if (daysDiff <= 1) timeDistribution.sameDay++;
      else if (daysDiff <= 3) timeDistribution.within3Days++;
      else if (daysDiff <= 7) timeDistribution.within7Days++;
      else if (daysDiff <= 30) timeDistribution.within30Days++;
      else timeDistribution.over30Days++;
    }
  }

  const avgDays = timeDeltas.length > 0
    ? timeDeltas.reduce((a, b) => a + b, 0) / timeDeltas.length
    : 0;

  const medianDays = timeDeltas.length > 0
    ? timeDeltas.sort((a, b) => a - b)[Math.floor(timeDeltas.length / 2)]
    : 0;

  return {
    sampleSize: timeDeltas.length,
    averageDays: Math.round(avgDays * 100) / 100,
    medianDays: Math.round(medianDays * 100) / 100,
    distribution: timeDistribution,
  };
}

// 카테고리별 전환율 분석
async function analyzeCategoryConversion(startDate: Date) {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const results: Array<{
    categoryId: string;
    categoryName: string;
    reactions: number;
    purchases: number;
    conversionRate: number;
  }> = [];

  for (const category of categories) {
    // 카테고리 상품들의 ID 조회
    const productIds = await prisma.product.findMany({
      where: { categoryId: category.id },
      select: { id: true },
    });

    const productIdList = productIds.map((p) => p.id);

    if (productIdList.length === 0) continue;

    // 해당 카테고리 상품에 대한 반응 수
    const reactionCount = await prisma.reaction.count({
      where: {
        targetType: TargetType.PRODUCT,
        targetId: { in: productIdList },
        createdAt: { gte: startDate },
      },
    });

    // 해당 카테고리 상품 구매 수
    const purchaseCount = await prisma.purchase.count({
      where: {
        productId: { in: productIdList },
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
    });

    results.push({
      categoryId: category.id,
      categoryName: category.name,
      reactions: reactionCount,
      purchases: purchaseCount,
      conversionRate: reactionCount > 0
        ? Math.round((purchaseCount / reactionCount) * 10000) / 100
        : 0,
    });
  }

  return results.sort((a, b) => b.conversionRate - a.conversionRate);
}

// 가격대별 전환율 분석
async function analyzePriceRangeConversion(startDate: Date) {
  const priceRanges = [
    { min: 0, max: 10000, label: '₩0 - ₩10,000' },
    { min: 10000, max: 30000, label: '₩10,000 - ₩30,000' },
    { min: 30000, max: 50000, label: '₩30,000 - ₩50,000' },
    { min: 50000, max: 100000, label: '₩50,000 - ₩100,000' },
    { min: 100000, max: Infinity, label: '₩100,000+' },
  ];

  const results: Array<{
    range: string;
    reactions: number;
    purchases: number;
    conversionRate: number;
  }> = [];

  for (const range of priceRanges) {
    // 해당 가격대 상품 ID 조회
    const products = await prisma.product.findMany({
      where: {
        price: {
          gte: range.min,
          lt: range.max === Infinity ? undefined : range.max,
        },
        status: 'PUBLISHED',
      },
      select: { id: true },
    });

    const productIdList = products.map((p) => p.id);

    if (productIdList.length === 0) {
      results.push({
        range: range.label,
        reactions: 0,
        purchases: 0,
        conversionRate: 0,
      });
      continue;
    }

    // 반응 수
    const reactionCount = await prisma.reaction.count({
      where: {
        targetType: TargetType.PRODUCT,
        targetId: { in: productIdList },
        createdAt: { gte: startDate },
      },
    });

    // 구매 수
    const purchaseCount = await prisma.purchase.count({
      where: {
        productId: { in: productIdList },
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
    });

    results.push({
      range: range.label,
      reactions: reactionCount,
      purchases: purchaseCount,
      conversionRate: reactionCount > 0
        ? Math.round((purchaseCount / reactionCount) * 10000) / 100
        : 0,
    });
  }

  return results;
}

// 인사이트 생성
function generateInsights(
  overall: Awaited<ReturnType<typeof analyzeConversion>>,
  byReactionType: Record<string, { count: number; converted: number; rate: number }>,
  byCombination: Array<{ combination: string; rate: number }>,
  timeToConversion: Awaited<ReturnType<typeof analyzeTimeToConversion>>
) {
  const insights: string[] = [];

  // 전체 전환율 인사이트
  if (overall.conversionRate > 0) {
    insights.push(
      `반응한 사용자 중 ${overall.conversionRate}%가 구매로 전환되었습니다.`
    );
  }

  // 직접 구매 인사이트
  if (overall.directPurchaseRate > 50) {
    insights.push(
      `구매의 ${overall.directPurchaseRate}%가 반응 없이 바로 이루어졌습니다. 상품 페이지 최적화를 고려해보세요.`
    );
  }

  // 가장 효과적인 반응 유형
  const sortedReactionTypes = Object.entries(byReactionType)
    .filter(([, stats]) => stats.count >= 5) // 최소 샘플 수
    .sort(([, a], [, b]) => b.rate - a.rate);

  if (sortedReactionTypes.length > 0) {
    const [bestType, bestStats] = sortedReactionTypes[0];
    insights.push(
      `'${bestType}' 반응이 ${bestStats.rate}%로 가장 높은 구매 전환율을 보입니다.`
    );
  }

  // 가장 효과적인 반응 조합
  const bestCombination = byCombination.find((c) => c.combination.includes('+'));
  if (bestCombination && bestCombination.rate > 0) {
    insights.push(
      `복합 반응 '${bestCombination.combination}'이 ${bestCombination.rate}%의 높은 전환율을 보입니다.`
    );
  }

  // 전환 시간 인사이트
  if (timeToConversion.sampleSize > 0) {
    if (timeToConversion.distribution.sameDay > timeToConversion.sampleSize * 0.3) {
      insights.push(
        `구매의 30% 이상이 반응 후 24시간 이내에 이루어집니다. 즉각적인 구매 유도 전략이 효과적입니다.`
      );
    }
    
    if (timeToConversion.averageDays > 7) {
      insights.push(
        `평균 ${timeToConversion.averageDays}일의 구매 결정 시간이 소요됩니다. 리마인더 이메일을 고려해보세요.`
      );
    }
  }

  return insights;
}
