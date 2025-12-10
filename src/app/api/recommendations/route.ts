import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================
// 🎯 조건부확률 기반 추천 시스템 + 폭포 다이어그램 검증
// ============================================
// 
// 📌 두 가지 추천 전략:
// 
// [A] 개인화 추천 (Individual)
// - 1명의 사용자 행동 기반
// - 실시간 계산 (비용 높음)
// - 활용: 상품 상세, 장바구니, 결제 완료
// 
// [B] 글로벌 추천 (Global) ⭐ NEW
// - 웹사이트 전체 통계 기반
// - 사전 계산 + 캐싱 (비용 낮음)
// - 활용: 이벤트, 쿠폰, 교육, 콘텐츠 배너
// 
// ============================================
// 
// [1단계] 조건부확률 계산
// P(상품B|상품A 구매) = (A와 B 함께 구매한 횟수) / (A 구매 횟수)
// 
// [2단계] 폭포 다이어그램 검증 (Waterfall Validation)
// - 그룹(카테고리/가격대/유형) 내 전체 거래에서 참/거짓 분류
// - 내 상품의 그룹 내 포지션 계산
// - 조건부확률 × 그룹검증 일치율 산출
// 
// [3단계] 최종 추천 결정
// - 일치율 50% 이상 → 추천 ✅
// - 일치율 50% 미만 → 미추천 ❌
// 
// 활용:
// - 쿠폰 타겟팅: 특정 상품 구매자에게 관련 쿠폰 발급
// - 이벤트 홍보: 구매 패턴 기반 이벤트 대상자 선정
// - 콘텐츠 추천: 다음 관심 콘텐츠 예측
// - 번들 구성: 함께 구매 확률 높은 상품 묶음
// ============================================

// 추천 임계값 상수
const RECOMMENDATION_THRESHOLD = 0.5; // 50% 이상만 추천
const MIN_SAMPLE_SIZE = 5; // 최소 표본 크기
const GLOBAL_CACHE_TTL = 1000 * 60 * 60; // 1시간 캐시

// 글로벌 통계 캐시
let globalStatsCache: {
  data: GlobalStatistics | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

// ============================================
// 🌐 글로벌 통계 인터페이스 (사이트 전체)
// ============================================

interface GlobalStatistics {
  // 콘텐츠 유형별 통계
  contentStats: {
    products: ContentTypeStats;
    tutorials: ContentTypeStats;
    posts: ContentTypeStats;
    education: ContentTypeStats;
  };
  // 카테고리별 통계
  categoryStats: Record<string, CategoryGlobalStats>;
  // 전체 전환율 (조회 → 구매/참여)
  globalConversionRate: number;
  // 시간대별 활동 패턴
  timePatterns: Record<string, number>;
  // 계산 시점
  calculatedAt: Date;
}

interface ContentTypeStats {
  totalViews: number;
  totalEngagements: number;   // 구매/좋아요/댓글
  conversionRate: number;     // 전환율
  avgTimeOnPage: number;      // 평균 체류시간 (추정)
  topPerformers: string[];    // 상위 콘텐츠 ID
  successRate: number;        // 폭포 다이어그램 성공률
}

interface CategoryGlobalStats {
  categoryId: string;
  categoryName: string;
  totalViews: number;
  totalPurchases: number;
  conversionRate: number;
  avgRating: number;
  topProducts: string[];
  nextCategoryProbability: Record<string, number>;  // 다음 카테고리 전이 확률
  waterfallSuccessRate: number;  // 폭포 검증 성공률
}

// ============================================
// 🏔️ 폭포 다이어그램 검증 시스템
// ============================================

interface WaterfallGroup {
  groupId: string;
  groupName: string;
  totalTransactions: number;
  successCount: number;     // 참 (성공 거래)
  failureCount: number;     // 거짓 (환불/취소)
  successRate: number;      // 그룹 내 성공률
}

interface WaterfallValidation {
  product: {
    id: string;
    categoryId: string;
    price: number;
    priceRange: string;
  };
  group: WaterfallGroup;
  positionInGroup: {
    percentile: number;       // 그룹 내 백분위 (0-100)
    rank: number;             // 순위
    totalInGroup: number;     // 그룹 내 총 상품 수
    isAboveAverage: boolean;  // 평균 이상 여부
  };
  validation: {
    conditionalProbability: number;  // 조건부확률
    groupSuccessRate: number;        // 그룹 성공률
    positionScore: number;           // 포지션 점수 (0-1)
    matchRate: number;               // 최종 일치율 (0-1)
    isRecommended: boolean;          // 추천 여부
    confidence: "high" | "medium" | "low";  // 신뢰도
  };
}

/**
 * 가격 범위 분류
 */
function getPriceRange(price: number): string {
  if (price === 0) return "free";
  if (price < 10000) return "low";      // 1만원 미만
  if (price < 50000) return "mid";      // 5만원 미만
  if (price < 100000) return "high";    // 10만원 미만
  return "premium";                      // 10만원 이상
}

/**
 * 그룹 정의 (카테고리 + 가격대)
 */
function getGroupId(categoryId: string, priceRange: string): string {
  return `${categoryId}:${priceRange}`;
}

/**
 * 그룹 내 거래 성공/실패 분석
 * 참(True): 완료된 거래, 재구매, 긍정 리뷰
 * 거짓(False): 환불, 취소, 부정 리뷰
 */
async function analyzeGroupTransactions(
  categoryId: string,
  priceRange: string
): Promise<WaterfallGroup> {
  const groupId = getGroupId(categoryId, priceRange);
  
  // 해당 그룹의 모든 상품
  const groupProducts = await prisma.product.findMany({
    where: {
      categoryId,
      status: "PUBLISHED",
      isPublished: true,
    },
    select: { id: true, price: true },
  });
  
  // 가격대 필터링
  const filteredProducts = groupProducts.filter(p => 
    getPriceRange(Number(p.price)) === priceRange
  );
  const productIds = filteredProducts.map(p => p.id);
  
  if (productIds.length === 0) {
    return {
      groupId,
      groupName: `${categoryId}/${priceRange}`,
      totalTransactions: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
    };
  }
  
  // 그룹 내 모든 거래
  const purchases = await prisma.purchase.findMany({
    where: { productId: { in: productIds } },
    select: { 
      id: true, 
      productId: true,
      status: true,
    },
  });
  
  // 환불 건수 조회
  const refunds = await prisma.refundRequest.findMany({
    where: { 
      purchase: { productId: { in: productIds } },
      status: "APPROVED",
    },
    select: { id: true },
  });
  
  // 긍정/부정 리뷰 분석 (4점 이상 = 성공, 미만 = 실패)
  const reviews = await prisma.review.findMany({
    where: { productId: { in: productIds } },
    select: { rating: true },
  });
  
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const negativeReviews = reviews.filter(r => r.rating < 4).length;
  
  // 성공/실패 계산
  const totalTransactions = purchases.length;
  const refundCount = refunds.length;
  
  // 성공 = 완료된 거래 - 환불 + 긍정 리뷰 가중치
  // 실패 = 환불 + 부정 리뷰 가중치
  const successCount = Math.max(0, totalTransactions - refundCount) + 
                       Math.floor(positiveReviews * 0.5);
  const failureCount = refundCount + Math.floor(negativeReviews * 0.5);
  
  const total = successCount + failureCount || 1;
  const successRate = successCount / total;
  
  return {
    groupId,
    groupName: `${categoryId}/${priceRange}`,
    totalTransactions,
    successCount,
    failureCount,
    successRate,
  };
}

/**
 * 그룹 내 상품 포지션 계산
 * 판매량, 평점, 리뷰 수 기반 종합 점수로 백분위 산출
 */
async function calculatePositionInGroup(
  productId: string,
  categoryId: string,
  priceRange: string
): Promise<{
  percentile: number;
  rank: number;
  totalInGroup: number;
  isAboveAverage: boolean;
  score: number;
}> {
  // 그룹 내 모든 상품
  const groupProducts = await prisma.product.findMany({
    where: {
      categoryId,
      status: "PUBLISHED",
      isPublished: true,
    },
    select: { 
      id: true, 
      price: true,
      salesCount: true,
      averageRating: true,
      reviewCount: true,
    },
  });
  
  // 가격대 필터링
  const filteredProducts = groupProducts.filter(p => 
    getPriceRange(Number(p.price)) === priceRange
  );
  
  if (filteredProducts.length === 0) {
    return { percentile: 50, rank: 1, totalInGroup: 1, isAboveAverage: true, score: 0.5 };
  }
  
  // 종합 점수 계산 (판매량 40% + 평점 40% + 리뷰수 20%)
  const calculateScore = (p: typeof filteredProducts[0]) => {
    const maxSales = Math.max(...filteredProducts.map(x => x.salesCount), 1);
    const maxReviews = Math.max(...filteredProducts.map(x => x.reviewCount), 1);
    
    const salesScore = p.salesCount / maxSales;
    const ratingScore = (p.averageRating || 0) / 5;
    const reviewScore = p.reviewCount / maxReviews;
    
    return salesScore * 0.4 + ratingScore * 0.4 + reviewScore * 0.2;
  };
  
  // 모든 상품 점수 계산 및 정렬
  const scoredProducts = filteredProducts
    .map(p => ({ id: p.id, score: calculateScore(p) }))
    .sort((a, b) => b.score - a.score);
  
  const targetProduct = scoredProducts.find(p => p.id === productId);
  const targetScore = targetProduct?.score || 0;
  const rank = scoredProducts.findIndex(p => p.id === productId) + 1 || scoredProducts.length;
  const totalInGroup = scoredProducts.length;
  
  // 백분위 계산 (높을수록 좋음)
  const percentile = ((totalInGroup - rank + 1) / totalInGroup) * 100;
  
  // 평균 점수
  const avgScore = scoredProducts.reduce((sum, p) => sum + p.score, 0) / totalInGroup;
  const isAboveAverage = targetScore >= avgScore;
  
  return {
    percentile,
    rank,
    totalInGroup,
    isAboveAverage,
    score: targetScore,
  };
}

/**
 * 폭포 다이어그램 검증 실행
 * 조건부확률과 그룹 검증을 결합하여 최종 추천 여부 결정
 */
async function validateWithWaterfall(
  productId: string,
  conditionalProbability: number
): Promise<WaterfallValidation> {
  // 상품 정보 조회
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, categoryId: true, price: true },
  });
  
  if (!product || !product.categoryId) {
    return createDefaultValidation(productId, conditionalProbability);
  }
  
  const priceRange = getPriceRange(Number(product.price));
  
  // 1. 그룹 분석 (참/거짓 분류)
  const group = await analyzeGroupTransactions(product.categoryId, priceRange);
  
  // 2. 그룹 내 포지션 계산
  const position = await calculatePositionInGroup(productId, product.categoryId, priceRange);
  
  // 3. 최종 일치율 계산
  // 일치율 = (조건부확률 × 가중치1) + (그룹성공률 × 가중치2) + (포지션점수 × 가중치3)
  // 가중치: 조건부확률 40%, 그룹성공률 30%, 포지션점수 30%
  const positionScore = position.percentile / 100;
  
  const matchRate = 
    (conditionalProbability * 0.4) + 
    (group.successRate * 0.3) + 
    (positionScore * 0.3);
  
  // 4. 추천 여부 결정 (50% 임계값)
  const isRecommended = matchRate >= RECOMMENDATION_THRESHOLD;
  
  // 5. 신뢰도 계산
  let confidence: "high" | "medium" | "low" = "low";
  if (group.totalTransactions >= 30 && position.totalInGroup >= 10) {
    confidence = "high";
  } else if (group.totalTransactions >= 10 && position.totalInGroup >= 5) {
    confidence = "medium";
  }
  
  return {
    product: {
      id: productId,
      categoryId: product.categoryId,
      price: Number(product.price),
      priceRange,
    },
    group,
    positionInGroup: {
      percentile: position.percentile,
      rank: position.rank,
      totalInGroup: position.totalInGroup,
      isAboveAverage: position.isAboveAverage,
    },
    validation: {
      conditionalProbability,
      groupSuccessRate: group.successRate,
      positionScore,
      matchRate,
      isRecommended,
      confidence,
    },
  };
}

/**
 * 기본 검증 결과 생성 (데이터 부족 시)
 */
function createDefaultValidation(
  productId: string,
  conditionalProbability: number
): WaterfallValidation {
  return {
    product: {
      id: productId,
      categoryId: "",
      price: 0,
      priceRange: "unknown",
    },
    group: {
      groupId: "unknown",
      groupName: "Unknown Group",
      totalTransactions: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
    },
    positionInGroup: {
      percentile: 50,
      rank: 1,
      totalInGroup: 1,
      isAboveAverage: true,
    },
    validation: {
      conditionalProbability,
      groupSuccessRate: 0,
      positionScore: 0.5,
      matchRate: conditionalProbability * 0.4 + 0.5 * 0.3,
      isRecommended: conditionalProbability >= RECOMMENDATION_THRESHOLD,
      confidence: "low",
    },
  };
}

/**
 * 추천 목록 필터링 (폭포 다이어그램 검증 적용)
 * 50% 미만 일치율 상품 제외
 */
async function filterRecommendationsWithWaterfall<T extends { productId: string; probability: number }>(
  recommendations: T[]
): Promise<Array<T & { waterfallValidation: WaterfallValidation }>> {
  const validatedRecommendations: Array<T & { waterfallValidation: WaterfallValidation }> = [];
  
  for (const rec of recommendations) {
    const validation = await validateWithWaterfall(rec.productId, rec.probability);
    
    // 50% 이상만 추천
    if (validation.validation.isRecommended) {
      validatedRecommendations.push({
        ...rec,
        waterfallValidation: validation,
      });
    }
  }
  
  // 일치율 높은 순으로 정렬
  return validatedRecommendations.sort(
    (a, b) => b.waterfallValidation.validation.matchRate - a.waterfallValidation.validation.matchRate
  );
}

// ============================================
// 🔥 조건부확률 기반 구매 추천 (폭포 검증 적용)
// ============================================

// GET: 개인화 추천 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, products, tutorials, posts, similar, journey, global-*
    const limit = parseInt(searchParams.get("limit") || "12");
    const productId = searchParams.get("productId"); // similar 타입용
    const categoryId = searchParams.get("categoryId"); // journey 타입용

    // ============================================
    // 🌐 글로벌 추천 (사이트 전체 통계 기반) - 우선 적용
    // ============================================
    
    // 🆕 글로벌 이벤트/쿠폰 추천 (사이트 전체 통계 기반)
    if (type === "global-event" || type === "global-coupon") {
      return await getGlobalEventRecommendations(limit);
    }
    
    // 🆕 글로벌 교육 콘텐츠 추천 (사이트 전체 통계 기반)
    if (type === "global-education") {
      return await getGlobalEducationRecommendations(limit);
    }
    
    // 🆕 글로벌 콘텐츠 추천 (사이트 전체 통계 기반)
    if (type === "global-content") {
      return await getGlobalContentRecommendations(limit);
    }
    
    // 🆕 글로벌 통계 조회 (관리자용)
    if (type === "global-stats") {
      return await getGlobalStatisticsResponse();
    }

    // ============================================
    // 👤 개인화 추천 (개별 사용자 행동 기반)
    // ============================================

    // 🆕 구매 기반 유사 상품 추천 (조건부확률 + 폭포검증)
    if (type === "similar" && productId) {
      return await getSimilarProductsByPurchase(productId, limit);
    }

    // 🆕 고객 여정 기반 추천 (카테고리 전이 확률)
    if (type === "journey") {
      return await getJourneyRecommendations(
        session?.user?.id,
        categoryId,
        limit
      );
    }

    // 🆕 마케팅 타겟팅용 세그먼트 추천
    if (type === "marketing") {
      return await getMarketingRecommendations(limit);
    }

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

// ============================================
// 🔥 조건부확률 기반 구매 추천
// ============================================

/**
 * 구매 전이 확률 계산
 * P(상품B|상품A 구매) = (A와 B를 함께 구매한 사용자 수) / (A를 구매한 총 사용자 수)
 */
async function calculatePurchaseTransitionProbability(
  sourceProductId: string,
  targetProductId: string
): Promise<number> {
  // A 상품을 구매한 모든 사용자
  const sourceProductBuyers = await prisma.purchase.findMany({
    where: { productId: sourceProductId },
    select: { buyerId: true },
  });
  
  const sourceBuyerIds = [...new Set(sourceProductBuyers.map(p => p.buyerId))];
  
  if (sourceBuyerIds.length === 0) return 0;
  
  // A와 B를 모두 구매한 사용자
  const bothProductsBuyers = await prisma.purchase.findMany({
    where: {
      productId: targetProductId,
      buyerId: { in: sourceBuyerIds },
    },
    select: { buyerId: true },
  });
  
  const bothBuyerIds = [...new Set(bothProductsBuyers.map(p => p.buyerId))];
  
  // P(B|A) = 교집합 / A구매자수
  return bothBuyerIds.length / sourceBuyerIds.length;
}

/**
 * 특정 상품 구매자가 함께 구매한 상품 목록 (조건부확률 기반)
 * "이 상품을 구매한 고객이 함께 구매한 상품"
 */
async function getSimilarProductsByPurchase(
  productId: string,
  limit: number
) {
  // 1. 이 상품을 구매한 모든 사용자 찾기
  const productBuyers = await prisma.purchase.findMany({
    where: { productId },
    select: { buyerId: true, createdAt: true },
  });
  
  const buyerIds = [...new Set(productBuyers.map(p => p.buyerId))];
  
  if (buyerIds.length === 0) {
    // 구매 이력 없으면 같은 카테고리 인기 상품 반환
    return await getFallbackRecommendations(productId, limit);
  }
  
  // 2. 이 사용자들이 구매한 다른 상품들 집계
  const otherPurchases = await prisma.purchase.findMany({
    where: {
      buyerId: { in: buyerIds },
      productId: { not: productId },
    },
    select: { productId: true, createdAt: true },
  });
  
  // 3. 상품별 구매 횟수 및 최근성 가중치 계산
  const productCounts: Record<string, { count: number; recencyScore: number }> = {};
  const now = new Date();
  
  otherPurchases.forEach(p => {
    if (!productCounts[p.productId]) {
      productCounts[p.productId] = { count: 0, recencyScore: 0 };
    }
    productCounts[p.productId].count += 1;
    
    // 시간 가중치: 최근 구매일수록 높은 점수 (30일 기준)
    const daysDiff = Math.floor((now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const recencyWeight = Math.max(0, 1 - daysDiff / 30);
    productCounts[p.productId].recencyScore += recencyWeight;
  });
  
  // 4. 조건부확률 계산: P(상품X|현재상품) = X구매횟수 / 총구매자수
  const recommendations = Object.entries(productCounts)
    .map(([pid, stats]) => ({
      productId: pid,
      probability: stats.count / buyerIds.length, // 조건부확률
      purchaseCount: stats.count,
      recencyScore: stats.recencyScore,
      // 최종 점수 = 조건부확률 * 0.6 + 최근성 * 0.4
      finalScore: (stats.count / buyerIds.length) * 0.6 + (stats.recencyScore / buyerIds.length) * 0.4,
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);
  
  // 5. 상품 상세 정보 조회 (검증 전 후보 목록)
  const productIds = recommendations.map(r => r.productId);
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
      tags: true,
      category: { select: { id: true, name: true, slug: true } },
      seller: { select: { id: true, name: true, image: true } },
    },
  });
  
  // 6. 🏔️ 폭포 다이어그램 검증 적용
  const validatedRecommendations = await filterRecommendationsWithWaterfall(recommendations);
  
  // 7. 상품 상세 정보 조회 (검증 통과한 상품만)
  const validatedProductIds = validatedRecommendations.map(r => r.productId);
  const validatedProducts = await prisma.product.findMany({
    where: {
      id: { in: validatedProductIds },
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
      tags: true,
      category: { select: { id: true, name: true, slug: true } },
      seller: { select: { id: true, name: true, image: true } },
    },
  });
  
  // 8. 확률 정보 + 검증 정보와 함께 반환
  const enrichedProducts = validatedProducts.map(p => {
    const recData = validatedRecommendations.find(r => r.productId === p.id);
    const validation = recData?.waterfallValidation;
    return {
      ...p,
      conditionalProbability: recData?.probability || 0,
      purchaseCount: recData?.purchaseCount || 0,
      recencyScore: recData?.recencyScore || 0,
      recommendScore: recData?.finalScore || 0,
      recommendReason: `이 상품 구매자의 ${Math.round((recData?.probability || 0) * 100)}%가 함께 구매`,
      // 🆕 폭포 다이어그램 검증 결과
      waterfallValidation: validation ? {
        matchRate: Math.round(validation.validation.matchRate * 100),
        groupSuccessRate: Math.round(validation.validation.groupSuccessRate * 100),
        positionPercentile: Math.round(validation.positionInGroup.percentile),
        confidence: validation.validation.confidence,
        isRecommended: validation.validation.isRecommended,
      } : null,
    };
  }).sort((a, b) => b.recommendScore - a.recommendScore);

  // 검증 실패한 상품 수 계산
  const filteredOutCount = recommendations.length - validatedRecommendations.length;
  
  return NextResponse.json({
    type: "similar_purchase",
    sourceProductId: productId,
    totalBuyers: buyerIds.length,
    recommendations: enrichedProducts,
    metadata: {
      algorithm: "conditional_probability_with_waterfall",
      description: "P(추천상품|현재상품 구매) × 폭포 다이어그램 검증",
      waterfallValidation: {
        threshold: `${RECOMMENDATION_THRESHOLD * 100}%`,
        totalCandidates: recommendations.length,
        passedValidation: validatedRecommendations.length,
        filteredOut: filteredOutCount,
        filteredOutReason: "일치율 50% 미만으로 추천에서 제외",
      },
    },
  });
}

/**
 * 카테고리 전이 확률 행렬 계산
 * P(카테고리Y|카테고리X) = X→Y 전이 횟수 / X에서 출발한 총 전이 횟수
 */
async function calculateCategoryTransitionMatrix(): Promise<{
  matrix: Record<string, Record<string, number>>;
  categories: string[];
}> {
  // 모든 사용자의 구매 이력 (시간순)
  const allPurchases = await prisma.purchase.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      buyerId: true,
      product: { select: { categoryId: true } },
      createdAt: true,
    },
  });
  
  // 사용자별 구매 시퀀스 구성
  const userPurchases: Record<string, string[]> = {};
  allPurchases.forEach(p => {
    if (!p.product.categoryId) return;
    if (!userPurchases[p.buyerId]) {
      userPurchases[p.buyerId] = [];
    }
    userPurchases[p.buyerId].push(p.product.categoryId);
  });
  
  // 전이 횟수 집계
  const transitions: Record<string, Record<string, number>> = {};
  const categoryTotals: Record<string, number> = {};
  
  Object.values(userPurchases).forEach(sequence => {
    for (let i = 0; i < sequence.length - 1; i++) {
      const from = sequence[i];
      const to = sequence[i + 1];
      
      if (!transitions[from]) transitions[from] = {};
      if (!transitions[from][to]) transitions[from][to] = 0;
      transitions[from][to] += 1;
      
      if (!categoryTotals[from]) categoryTotals[from] = 0;
      categoryTotals[from] += 1;
    }
  });
  
  // 확률 행렬 계산
  const matrix: Record<string, Record<string, number>> = {};
  const categories = Object.keys(transitions);
  
  categories.forEach(from => {
    matrix[from] = {};
    Object.entries(transitions[from]).forEach(([to, count]) => {
      matrix[from][to] = count / categoryTotals[from];
    });
  });
  
  return { matrix, categories };
}

/**
 * 고객 여정 기반 추천 (카테고리 전이 확률)
 * 현재 카테고리에서 다음으로 이동할 확률이 높은 카테고리의 상품 추천
 */
async function getJourneyRecommendations(
  userId: string | undefined,
  currentCategoryId: string | null,
  limit: number
) {
  // 1. 카테고리 전이 행렬 계산
  const { matrix } = await calculateCategoryTransitionMatrix();
  
  // 2. 사용자의 최근 구매 카테고리 확인
  let sourceCategoryId = currentCategoryId;
  
  if (!sourceCategoryId && userId) {
    const lastPurchase = await prisma.purchase.findFirst({
      where: { buyerId: userId },
      orderBy: { createdAt: "desc" },
      select: { product: { select: { categoryId: true } } },
    });
    sourceCategoryId = lastPurchase?.product.categoryId || null;
  }
  
  if (!sourceCategoryId || !matrix[sourceCategoryId]) {
    // 전이 데이터 없으면 인기 상품 반환
    return await getPopularRecommendations("products", limit);
  }
  
  // 3. 다음 카테고리 확률 정렬
  const nextCategories = Object.entries(matrix[sourceCategoryId])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // 4. 각 카테고리에서 추천 상품 가져오기 (폭포 검증 적용)
  const recommendations: Array<{
    category: { id: string; name: string };
    transitionProbability: number;
    products: unknown[];
    validationStats: { total: number; passed: number; filtered: number };
  }> = [];
  
  for (const [categoryId, probability] of nextCategories) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, slug: true },
    });
    
    if (!category) continue;
    
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        status: "PUBLISHED",
        isPublished: true,
      },
      orderBy: { salesCount: "desc" },
      take: Math.ceil(limit / nextCategories.length) * 2, // 더 많이 가져와서 필터링
      select: {
        id: true,
        title: true,
        shortDescription: true,
        thumbnail: true,
        price: true,
        pricingType: true,
        averageRating: true,
        salesCount: true,
        seller: { select: { id: true, name: true, image: true } },
      },
    });
    
    // 🏔️ 폭포 다이어그램 검증 적용
    const candidateProducts = products.map(p => ({
      productId: p.id,
      probability: probability,
      originalProduct: p,
    }));
    
    const validatedProducts = await filterRecommendationsWithWaterfall(candidateProducts);
    const passedCount = validatedProducts.length;
    const filteredCount = candidateProducts.length - passedCount;
    
    recommendations.push({
      category: { id: category.id, name: category.name },
      transitionProbability: probability,
      products: validatedProducts.slice(0, Math.ceil(limit / nextCategories.length)).map(v => ({
        ...v.originalProduct,
        recommendReason: `${Math.round(probability * 100)}% 확률로 다음 관심 카테고리`,
        waterfallValidation: {
          matchRate: Math.round(v.waterfallValidation.validation.matchRate * 100),
          groupSuccessRate: Math.round(v.waterfallValidation.validation.groupSuccessRate * 100),
          positionPercentile: Math.round(v.waterfallValidation.positionInGroup.percentile),
          confidence: v.waterfallValidation.validation.confidence,
        },
      })),
      validationStats: {
        total: candidateProducts.length,
        passed: passedCount,
        filtered: filteredCount,
      },
    });
  }
  
  return NextResponse.json({
    type: "journey",
    sourceCategoryId,
    recommendations,
    metadata: {
      algorithm: "category_transition_matrix_with_waterfall",
      description: "P(다음카테고리|현재카테고리) × 폭포 다이어그램 검증",
      waterfallValidation: {
        threshold: `${RECOMMENDATION_THRESHOLD * 100}%`,
        note: "일치율 50% 미만 상품은 추천에서 제외됨",
      },
    },
  });
}

/**
 * 마케팅 타겟팅용 추천 데이터
 * 쿠폰/이벤트/홍보 대상자 세그먼트 생성
 */
async function getMarketingRecommendations(limit: number) {
  // 1. 구매 전환 확률이 높은 상품 조합 (번들 추천용)
  const bundleRecommendations = await getHighProbabilityPairs(5);
  
  // 2. 카테고리 전이 핫스팟 (이벤트 기획용)
  const { matrix } = await calculateCategoryTransitionMatrix();
  const hotTransitions = Object.entries(matrix)
    .flatMap(([from, toMap]) =>
      Object.entries(toMap).map(([to, prob]) => ({
        from,
        to,
        probability: prob,
      }))
    )
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 10);
  
  // 3. 고가치 고객 세그먼트 (쿠폰 타겟팅용)
  const highValueCustomers = await prisma.user.findMany({
    where: {
      purchases: { some: {} },
    },
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { purchases: true } },
    },
    orderBy: { purchases: { _count: "desc" } },
    take: limit,
  });
  
  // 4. 이탈 위험 고객 (재구매 유도용)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const atRiskCustomers = await prisma.user.findMany({
    where: {
      purchases: {
        some: {},
        none: { createdAt: { gte: thirtyDaysAgo } },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      purchases: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, product: { select: { categoryId: true } } },
      },
    },
    take: limit,
  });
  
  return NextResponse.json({
    type: "marketing",
    bundleRecommendations,
    categoryTransitions: hotTransitions,
    highValueCustomers: highValueCustomers.map(c => ({
      ...c,
      purchaseCount: c._count.purchases,
    })),
    atRiskCustomers: atRiskCustomers.map(c => ({
      ...c,
      lastPurchase: c.purchases[0]?.createdAt,
      lastCategory: c.purchases[0]?.product.categoryId,
    })),
    metadata: {
      description: "마케팅 타겟팅용 조건부확률 기반 세그먼트",
      usage: {
        bundleRecommendations: "번들 상품 구성에 활용",
        categoryTransitions: "크로스셀링 이벤트 기획",
        highValueCustomers: "VIP 쿠폰 발급 대상",
        atRiskCustomers: "재구매 유도 이메일 대상",
      },
    },
  });
}

/**
 * 함께 구매 확률이 높은 상품 쌍 조회 (번들 추천용 + 폭포 검증)
 */
async function getHighProbabilityPairs(limit: number) {
  // 동시 구매 패턴 분석
  const purchases = await prisma.purchase.findMany({
    select: { buyerId: true, productId: true },
  });
  
  // 사용자별 구매 상품 목록
  const userProducts: Record<string, string[]> = {};
  purchases.forEach(p => {
    if (!userProducts[p.buyerId]) userProducts[p.buyerId] = [];
    userProducts[p.buyerId].push(p.productId);
  });
  
  // 상품 쌍별 동시 구매 횟수
  const pairCounts: Record<string, number> = {};
  const productCounts: Record<string, number> = {};
  
  Object.values(userProducts).forEach(products => {
    const unique = [...new Set(products)];
    unique.forEach(p => {
      productCounts[p] = (productCounts[p] || 0) + 1;
    });
    
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const key = [unique[i], unique[j]].sort().join(":");
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
    }
  });
  
  // 조건부확률 계산 및 정렬
  const pairs = Object.entries(pairCounts)
    .map(([key, count]) => {
      const [a, b] = key.split(":");
      const probAGivenB = count / (productCounts[b] || 1);
      const probBGivenA = count / (productCounts[a] || 1);
      return {
        productA: a,
        productB: b,
        coPurchaseCount: count,
        probAGivenB,
        probBGivenA,
        avgProbability: (probAGivenB + probBGivenA) / 2,
      };
    })
    .sort((a, b) => b.avgProbability - a.avgProbability)
    .slice(0, limit * 2); // 더 많이 가져와서 필터링
  
  // 상품 정보 enrichment
  const allProductIds = [...new Set(pairs.flatMap(p => [p.productA, p.productB]))];
  const products = await prisma.product.findMany({
    where: { id: { in: allProductIds } },
    select: { id: true, title: true, price: true, thumbnail: true },
  });
  
  const productMap = new Map(products.map(p => [p.id, p]));
  
  // 🏔️ 폭포 다이어그램 검증: 각 상품 쌍의 두 상품 모두 검증
  const validatedPairs: Array<{
    productA: typeof products[0] | undefined;
    productB: typeof products[0] | undefined;
    coPurchaseCount: number;
    probability: {
      AgivenB: number;
      BgivenA: number;
      average: number;
    };
    bundleSuggestion: string;
    waterfallValidation: {
      productAMatchRate: number;
      productBMatchRate: number;
      combinedMatchRate: number;
      isRecommended: boolean;
    };
  }> = [];
  
  for (const p of pairs) {
    // 각 상품에 대한 폭포 검증
    const validationA = await validateWithWaterfall(p.productA, p.avgProbability);
    const validationB = await validateWithWaterfall(p.productB, p.avgProbability);
    
    // 두 상품의 평균 일치율
    const combinedMatchRate = 
      (validationA.validation.matchRate + validationB.validation.matchRate) / 2;
    
    // 50% 이상만 추천
    if (combinedMatchRate >= RECOMMENDATION_THRESHOLD) {
      validatedPairs.push({
        productA: productMap.get(p.productA),
        productB: productMap.get(p.productB),
        coPurchaseCount: p.coPurchaseCount,
        probability: {
          AgivenB: p.probAGivenB,
          BgivenA: p.probBGivenA,
          average: p.avgProbability,
        },
        bundleSuggestion: `${Math.round(p.avgProbability * 100)}% 동시 구매 확률`,
        waterfallValidation: {
          productAMatchRate: Math.round(validationA.validation.matchRate * 100),
          productBMatchRate: Math.round(validationB.validation.matchRate * 100),
          combinedMatchRate: Math.round(combinedMatchRate * 100),
          isRecommended: true,
        },
      });
    }
    
    if (validatedPairs.length >= limit) break;
  }
  
  return validatedPairs;
}

/**
 * 폴백 추천 (구매 데이터 없을 때)
 */
async function getFallbackRecommendations(productId: string, limit: number) {
  // 같은 카테고리의 인기 상품
  const sourceProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true, tags: true },
  });
  
  if (!sourceProduct) {
    return NextResponse.json({ type: "similar_purchase", recommendations: [] });
  }
  
  const products = await prisma.product.findMany({
    where: {
      id: { not: productId },
      categoryId: sourceProduct.categoryId,
      status: "PUBLISHED",
      isPublished: true,
    },
    orderBy: { salesCount: "desc" },
    take: limit,
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
  
  return NextResponse.json({
    type: "similar_category",
    sourceProductId: productId,
    recommendations: products.map(p => ({
      ...p,
      recommendReason: "같은 카테고리 인기 상품",
    })),
  });
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

// ============================================
// 🌐 글로벌 추천 시스템 (사이트 전체 통계 기반)
// ============================================
// 
// 개인화 추천과 달리, 웹사이트 전체 데이터를 기반으로
// 조건부확률 + 폭포 다이어그램을 사전 계산합니다.
// 
// 장점:
// - 계산 비용 절감 (1시간마다 캐시)
// - 일관된 추천 (모든 사용자에게 동일)
// - 이벤트/쿠폰/교육/콘텐츠 배너에 적합
// ============================================

/**
 * 글로벌 통계 수집 (1시간 캐시)
 * 웹사이트 전체의 조건부확률 및 폭포 다이어그램 데이터 계산
 */
async function collectGlobalStatistics(): Promise<GlobalStatistics> {
  // 캐시 확인
  const now = Date.now();
  if (globalStatsCache.data && (now - globalStatsCache.timestamp) < GLOBAL_CACHE_TTL) {
    return globalStatsCache.data;
  }
  
  // 1. 상품 통계
  const productStats = await calculateContentTypeStats("product");
  
  // 2. 튜토리얼 통계
  const tutorialStats = await calculateContentTypeStats("tutorial");
  
  // 3. 게시글 통계
  const postStats = await calculateContentTypeStats("post");
  
  // 4. 교육 콘텐츠 통계 (튜토리얼 기반)
  const educationStats = await calculateContentTypeStats("education");
  
  // 5. 카테고리별 통계
  const categoryStats = await calculateCategoryGlobalStats();
  
  // 6. 전체 전환율
  const globalConversionRate = await calculateGlobalConversionRate();
  
  // 7. 시간대별 활동 패턴
  const timePatterns = await calculateTimePatterns();
  
  const stats: GlobalStatistics = {
    contentStats: {
      products: productStats,
      tutorials: tutorialStats,
      posts: postStats,
      education: educationStats,
    },
    categoryStats,
    globalConversionRate,
    timePatterns,
    calculatedAt: new Date(),
  };
  
  // 캐시 업데이트
  globalStatsCache = { data: stats, timestamp: now };
  
  return stats;
}

/**
 * 콘텐츠 유형별 통계 계산
 */
async function calculateContentTypeStats(type: "product" | "tutorial" | "post" | "education"): Promise<ContentTypeStats> {
  let totalViews = 0;
  let totalEngagements = 0;
  let topPerformers: string[] = [];
  let successRate = 0;
  
  if (type === "product") {
    // 상품 통계
    const products = await prisma.product.findMany({
      where: { status: "PUBLISHED", isPublished: true },
      select: { 
        id: true, 
        viewCount: true, 
        salesCount: true,
        averageRating: true,
      },
      orderBy: { salesCount: "desc" },
      take: 100,
    });
    
    totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);
    totalEngagements = products.reduce((sum, p) => sum + p.salesCount, 0);
    topPerformers = products.slice(0, 10).map(p => p.id);
    
    // 폭포 성공률: 평균 평점 4점 이상 + 판매 1건 이상
    const successfulProducts = products.filter(p => 
      (p.averageRating || 0) >= 4 && p.salesCount > 0
    );
    successRate = products.length > 0 ? successfulProducts.length / products.length : 0;
    
  } else if (type === "tutorial" || type === "education") {
    // 튜토리얼/교육 통계
    const tutorials = await prisma.tutorial.findMany({
      where: { isPublished: true },
      select: { 
        id: true, 
        viewCount: true,
        likeCount: true,
        type: true,
      },
      orderBy: { viewCount: "desc" },
      take: 100,
    });
    
    // 교육용은 TUTORIAL/TIPS 타입만 필터
    const filtered = type === "education" 
      ? tutorials.filter(t => t.type === "TUTORIAL" || t.type === "TIPS")
      : tutorials;
    
    totalViews = filtered.reduce((sum, t) => sum + t.viewCount, 0);
    totalEngagements = filtered.reduce((sum, t) => sum + t.likeCount, 0);
    topPerformers = filtered.slice(0, 10).map(t => t.id);
    
    // 폭포 성공률: 조회수 대비 좋아요 비율 5% 이상
    const successfulTutorials = filtered.filter(t => 
      t.viewCount > 0 && (t.likeCount / t.viewCount) >= 0.05
    );
    successRate = filtered.length > 0 ? successfulTutorials.length / filtered.length : 0;
    
  } else if (type === "post") {
    // 게시글 통계
    const posts = await prisma.post.findMany({
      where: { isPublished: true },
      select: { 
        id: true, 
        viewCount: true,
        likeCount: true,
      },
      orderBy: { viewCount: "desc" },
      take: 100,
    });
    
    totalViews = posts.reduce((sum, p) => sum + p.viewCount, 0);
    totalEngagements = posts.reduce((sum, p) => sum + p.likeCount, 0);
    topPerformers = posts.slice(0, 10).map(p => p.id);
    
    // 폭포 성공률: 조회수 대비 좋아요 비율 3% 이상
    const successfulPosts = posts.filter(p => 
      p.viewCount > 0 && (p.likeCount / p.viewCount) >= 0.03
    );
    successRate = posts.length > 0 ? successfulPosts.length / posts.length : 0;
  }
  
  const conversionRate = totalViews > 0 ? totalEngagements / totalViews : 0;
  
  // 평균 체류시간 추정 (조회수 기반)
  const avgTimeOnPage = conversionRate > 0 ? Math.min(300, conversionRate * 1000) : 30;
  
  return {
    totalViews,
    totalEngagements,
    conversionRate,
    avgTimeOnPage,
    topPerformers,
    successRate,
  };
}

/**
 * 카테고리별 글로벌 통계
 */
async function calculateCategoryGlobalStats(): Promise<Record<string, CategoryGlobalStats>> {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  
  const stats: Record<string, CategoryGlobalStats> = {};
  
  // 카테고리 전이 행렬 가져오기
  const { matrix } = await calculateCategoryTransitionMatrix();
  
  for (const category of categories) {
    // 카테고리별 상품 조회
    const products = await prisma.product.findMany({
      where: { 
        categoryId: category.id,
        status: "PUBLISHED",
        isPublished: true,
      },
      select: {
        id: true,
        viewCount: true,
        salesCount: true,
        averageRating: true,
      },
      orderBy: { salesCount: "desc" },
    });
    
    const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);
    const totalPurchases = products.reduce((sum, p) => sum + p.salesCount, 0);
    const avgRating = products.length > 0
      ? products.reduce((sum, p) => sum + (p.averageRating || 0), 0) / products.length
      : 0;
    
    // 폭포 성공률
    const successfulProducts = products.filter(p => 
      (p.averageRating || 0) >= 4 && p.salesCount > 0
    );
    const waterfallSuccessRate = products.length > 0 
      ? successfulProducts.length / products.length 
      : 0;
    
    stats[category.id] = {
      categoryId: category.id,
      categoryName: category.name,
      totalViews,
      totalPurchases,
      conversionRate: totalViews > 0 ? totalPurchases / totalViews : 0,
      avgRating,
      topProducts: products.slice(0, 5).map(p => p.id),
      nextCategoryProbability: matrix[category.id] || {},
      waterfallSuccessRate,
    };
  }
  
  return stats;
}

/**
 * 전체 전환율 계산
 */
async function calculateGlobalConversionRate(): Promise<number> {
  // 총 상품 조회수
  const totalViews = await prisma.product.aggregate({
    where: { status: "PUBLISHED", isPublished: true },
    _sum: { viewCount: true },
  });
  
  // 총 구매 수
  const totalPurchases = await prisma.purchase.count();
  
  const views = totalViews._sum.viewCount || 1;
  return totalPurchases / views;
}

/**
 * 시간대별 활동 패턴 (0-23시)
 */
async function calculateTimePatterns(): Promise<Record<string, number>> {
  // 최근 30일 구매 데이터
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const purchases = await prisma.purchase.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });
  
  const patterns: Record<string, number> = {};
  for (let i = 0; i < 24; i++) {
    patterns[i.toString().padStart(2, "0")] = 0;
  }
  
  purchases.forEach(p => {
    const hour = p.createdAt.getHours().toString().padStart(2, "0");
    patterns[hour] = (patterns[hour] || 0) + 1;
  });
  
  // 정규화 (0-1)
  const maxCount = Math.max(...Object.values(patterns), 1);
  Object.keys(patterns).forEach(hour => {
    patterns[hour] = patterns[hour] / maxCount;
  });
  
  return patterns;
}

/**
 * 글로벌 폭포 검증 (콘텐츠 그룹 기반)
 */
interface GlobalWaterfallResult {
  contentId: string;
  contentType: "product" | "tutorial" | "post";
  globalProbability: number;      // 사이트 전체 기준 성공 확률
  groupSuccessRate: number;       // 그룹(카테고리/유형) 내 성공률
  positionPercentile: number;     // 그룹 내 포지션
  matchRate: number;              // 최종 일치율
  isRecommended: boolean;         // 50% 이상 여부
}

async function validateGlobalWaterfall(
  contentId: string,
  contentType: "product" | "tutorial" | "post",
  globalStats: GlobalStatistics
): Promise<GlobalWaterfallResult> {
  let globalProbability = 0;
  let groupSuccessRate = 0;
  let positionPercentile = 50;
  
  if (contentType === "product") {
    const product = await prisma.product.findUnique({
      where: { id: contentId },
      select: { 
        categoryId: true, 
        salesCount: true, 
        viewCount: true,
        averageRating: true,
      },
    });
    
    if (product && product.categoryId) {
      const categoryStats = globalStats.categoryStats[product.categoryId];
      if (categoryStats) {
        // 글로벌 확률: 이 상품의 전환율 vs 사이트 평균
        const productConversion = product.viewCount > 0 
          ? product.salesCount / product.viewCount 
          : 0;
        globalProbability = Math.min(1, productConversion / (globalStats.globalConversionRate || 0.01));
        
        // 그룹 성공률
        groupSuccessRate = categoryStats.waterfallSuccessRate;
        
        // 포지션: 판매량 기준
        const categoryProducts = await prisma.product.findMany({
          where: { categoryId: product.categoryId, status: "PUBLISHED" },
          select: { id: true, salesCount: true },
          orderBy: { salesCount: "desc" },
        });
        const rank = categoryProducts.findIndex(p => p.id === contentId) + 1;
        positionPercentile = ((categoryProducts.length - rank + 1) / categoryProducts.length) * 100;
      }
    }
  } else if (contentType === "tutorial") {
    const tutorial = await prisma.tutorial.findUnique({
      where: { id: contentId },
      select: { viewCount: true, likeCount: true, type: true },
    });
    
    if (tutorial) {
      const tutorialStats = globalStats.contentStats.tutorials;
      
      // 글로벌 확률: 이 튜토리얼의 참여율 vs 평균
      const tutorialEngagement = tutorial.viewCount > 0 
        ? tutorial.likeCount / tutorial.viewCount 
        : 0;
      globalProbability = Math.min(1, tutorialEngagement / (tutorialStats.conversionRate || 0.01));
      
      // 그룹 성공률
      groupSuccessRate = tutorialStats.successRate;
      
      // 포지션: 조회수 기준
      const allTutorials = await prisma.tutorial.findMany({
        where: { isPublished: true },
        select: { id: true, viewCount: true },
        orderBy: { viewCount: "desc" },
      });
      const rank = allTutorials.findIndex(t => t.id === contentId) + 1;
      positionPercentile = ((allTutorials.length - rank + 1) / allTutorials.length) * 100;
    }
  } else if (contentType === "post") {
    const post = await prisma.post.findUnique({
      where: { id: contentId },
      select: { viewCount: true, likeCount: true },
    });
    
    if (post) {
      const postStats = globalStats.contentStats.posts;
      
      // 글로벌 확률
      const postEngagement = post.viewCount > 0 
        ? post.likeCount / post.viewCount 
        : 0;
      globalProbability = Math.min(1, postEngagement / (postStats.conversionRate || 0.01));
      
      // 그룹 성공률
      groupSuccessRate = postStats.successRate;
      
      // 포지션
      const allPosts = await prisma.post.findMany({
        where: { isPublished: true },
        select: { id: true, viewCount: true },
        orderBy: { viewCount: "desc" },
      });
      const rank = allPosts.findIndex(p => p.id === contentId) + 1;
      positionPercentile = ((allPosts.length - rank + 1) / allPosts.length) * 100;
    }
  }
  
  // 일치율 계산 (글로벌 확률 40% + 그룹성공률 30% + 포지션 30%)
  const positionScore = positionPercentile / 100;
  const matchRate = 
    (globalProbability * 0.4) + 
    (groupSuccessRate * 0.3) + 
    (positionScore * 0.3);
  
  return {
    contentId,
    contentType,
    globalProbability,
    groupSuccessRate,
    positionPercentile,
    matchRate,
    isRecommended: matchRate >= RECOMMENDATION_THRESHOLD,
  };
}

/**
 * 🎯 글로벌 이벤트/쿠폰 추천
 * 사이트 전체 통계 기반으로 이벤트/쿠폰 대상 콘텐츠 추천
 */
async function getGlobalEventRecommendations(limit: number) {
  const globalStats = await collectGlobalStatistics();
  
  // 1. 카테고리별 최적 이벤트 대상
  const categoryRecommendations: Array<{
    category: { id: string; name: string };
    conversionRate: number;
    waterfallSuccessRate: number;
    topProducts: unknown[];
    eventSuggestion: string;
  }> = [];
  
  const sortedCategories = Object.values(globalStats.categoryStats)
    .sort((a, b) => b.waterfallSuccessRate - a.waterfallSuccessRate);
  
  for (const catStats of sortedCategories.slice(0, 5)) {
    // 상위 상품 정보 조회
    const products = await prisma.product.findMany({
      where: { id: { in: catStats.topProducts } },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        price: true,
        salesCount: true,
        averageRating: true,
      },
    });
    
    // 글로벌 폭포 검증
    const validatedProducts = [];
    for (const p of products) {
      const validation = await validateGlobalWaterfall(p.id, "product", globalStats);
      if (validation.isRecommended) {
        validatedProducts.push({
          ...p,
          globalValidation: {
            matchRate: Math.round(validation.matchRate * 100),
            positionPercentile: Math.round(validation.positionPercentile),
            isRecommended: validation.isRecommended,
          },
        });
      }
    }
    
    // 이벤트 제안 생성
    let eventSuggestion = "";
    if (catStats.conversionRate > 0.1) {
      eventSuggestion = "🔥 높은 전환율 - 할인 이벤트 추천";
    } else if (catStats.waterfallSuccessRate > 0.7) {
      eventSuggestion = "⭐ 높은 성공률 - 번들 이벤트 추천";
    } else {
      eventSuggestion = "📢 노출 증대 - 프로모션 추천";
    }
    
    categoryRecommendations.push({
      category: { id: catStats.categoryId, name: catStats.categoryName },
      conversionRate: catStats.conversionRate,
      waterfallSuccessRate: catStats.waterfallSuccessRate,
      topProducts: validatedProducts,
      eventSuggestion,
    });
  }
  
  // 2. 시간대별 이벤트 최적 시간
  const peakHours = Object.entries(globalStats.timePatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, activity]) => ({
      hour: `${hour}:00`,
      activityLevel: Math.round(activity * 100),
      suggestion: activity > 0.7 ? "🎯 최적 이벤트 시간" : "⏰ 권장 이벤트 시간",
    }));
  
  // 3. 전체 이벤트 효과 예측
  const expectedReach = Math.round(
    globalStats.contentStats.products.totalViews * 0.1 // 10% 예상 도달률
  );
  const expectedConversion = Math.round(
    expectedReach * globalStats.globalConversionRate
  );
  
  return NextResponse.json({
    type: "global-event",
    categoryRecommendations,
    peakHours,
    eventPrediction: {
      expectedReach,
      expectedConversion,
      globalConversionRate: Math.round(globalStats.globalConversionRate * 100) / 100,
    },
    metadata: {
      algorithm: "global_waterfall_validation",
      description: "사이트 전체 통계 기반 이벤트/쿠폰 추천",
      calculatedAt: globalStats.calculatedAt,
      cacheExpiry: new Date(Date.now() + GLOBAL_CACHE_TTL),
    },
  });
}

/**
 * 🎓 글로벌 교육 콘텐츠 추천
 * 사이트 전체 통계 기반으로 교육 콘텐츠 우선순위 결정
 */
async function getGlobalEducationRecommendations(limit: number) {
  const globalStats = await collectGlobalStatistics();
  
  // 1. 교육 콘텐츠 (튜토리얼) 상위 항목 조회
  const topTutorialIds = globalStats.contentStats.education.topPerformers;
  
  const tutorials = await prisma.tutorial.findMany({
    where: { 
      id: { in: topTutorialIds },
      isPublished: true,
    },
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
  
  // 2. 글로벌 폭포 검증 적용
  const validatedTutorials = [];
  for (const tutorial of tutorials) {
    const validation = await validateGlobalWaterfall(tutorial.id, "tutorial", globalStats);
    if (validation.isRecommended) {
      validatedTutorials.push({
        ...tutorial,
        engagementRate: tutorial.viewCount > 0 
          ? Math.round((tutorial.likeCount / tutorial.viewCount) * 100) 
          : 0,
        globalValidation: {
          matchRate: Math.round(validation.matchRate * 100),
          positionPercentile: Math.round(validation.positionPercentile),
          groupSuccessRate: Math.round(validation.groupSuccessRate * 100),
        },
        recommendReason: validation.matchRate > 0.7 
          ? "🏆 최고 성과 교육 콘텐츠"
          : validation.matchRate > 0.5 
            ? "⭐ 추천 교육 콘텐츠"
            : "📚 인기 교육 콘텐츠",
      });
    }
  }
  
  // 일치율 순 정렬
  validatedTutorials.sort((a, b) => 
    b.globalValidation.matchRate - a.globalValidation.matchRate
  );
  
  // 3. 교육 콘텐츠 통계 요약
  const educationStats = globalStats.contentStats.education;
  
  return NextResponse.json({
    type: "global-education",
    recommendations: validatedTutorials.slice(0, limit),
    stats: {
      totalViews: educationStats.totalViews,
      totalEngagements: educationStats.totalEngagements,
      avgConversionRate: Math.round(educationStats.conversionRate * 100),
      successRate: Math.round(educationStats.successRate * 100),
    },
    metadata: {
      algorithm: "global_waterfall_education",
      description: "사이트 전체 통계 기반 교육 콘텐츠 추천",
      threshold: `${RECOMMENDATION_THRESHOLD * 100}%`,
      calculatedAt: globalStats.calculatedAt,
    },
  });
}

/**
 * 📰 글로벌 콘텐츠 추천
 * 사이트 전체 통계 기반으로 콘텐츠(게시글) 우선순위 결정
 */
async function getGlobalContentRecommendations(limit: number) {
  const globalStats = await collectGlobalStatistics();
  
  // 1. 게시글 상위 항목 조회
  const topPostIds = globalStats.contentStats.posts.topPerformers;
  
  const posts = await prisma.post.findMany({
    where: { 
      id: { in: topPostIds },
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      content: true,
      viewCount: true,
      likeCount: true,
      createdAt: true,
      category: true,
      author: { select: { id: true, name: true, image: true } },
    },
  });
  
  // 2. 글로벌 폭포 검증 적용
  const validatedPosts = [];
  for (const post of posts) {
    const validation = await validateGlobalWaterfall(post.id, "post", globalStats);
    if (validation.isRecommended) {
      validatedPosts.push({
        ...post,
        content: post.content.substring(0, 200) + "...", // 미리보기
        engagementRate: post.viewCount > 0 
          ? Math.round((post.likeCount / post.viewCount) * 100) 
          : 0,
        globalValidation: {
          matchRate: Math.round(validation.matchRate * 100),
          positionPercentile: Math.round(validation.positionPercentile),
          groupSuccessRate: Math.round(validation.groupSuccessRate * 100),
        },
        recommendReason: validation.matchRate > 0.7 
          ? "🔥 핫 콘텐츠"
          : validation.matchRate > 0.5 
            ? "📈 인기 상승 중"
            : "👀 주목할 콘텐츠",
      });
    }
  }
  
  // 일치율 순 정렬
  validatedPosts.sort((a, b) => 
    b.globalValidation.matchRate - a.globalValidation.matchRate
  );
  
  // 3. 상품도 함께 추천 (통합 콘텐츠)
  const topProductIds = globalStats.contentStats.products.topPerformers.slice(0, 5);
  const products = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: {
      id: true,
      title: true,
      shortDescription: true,
      thumbnail: true,
      price: true,
      salesCount: true,
    },
  });
  
  const validatedProducts = [];
  for (const product of products) {
    const validation = await validateGlobalWaterfall(product.id, "product", globalStats);
    if (validation.isRecommended) {
      validatedProducts.push({
        ...product,
        globalValidation: {
          matchRate: Math.round(validation.matchRate * 100),
        },
      });
    }
  }
  
  return NextResponse.json({
    type: "global-content",
    posts: validatedPosts.slice(0, limit),
    products: validatedProducts,
    stats: {
      postsConversionRate: Math.round(globalStats.contentStats.posts.conversionRate * 100),
      productsConversionRate: Math.round(globalStats.contentStats.products.conversionRate * 100),
    },
    metadata: {
      algorithm: "global_waterfall_content",
      description: "사이트 전체 통계 기반 콘텐츠 추천",
      threshold: `${RECOMMENDATION_THRESHOLD * 100}%`,
      calculatedAt: globalStats.calculatedAt,
    },
  });
}

/**
 * 📊 글로벌 통계 응답 (관리자용)
 */
async function getGlobalStatisticsResponse() {
  const globalStats = await collectGlobalStatistics();
  
  return NextResponse.json({
    type: "global-stats",
    statistics: {
      contentStats: {
        products: {
          totalViews: globalStats.contentStats.products.totalViews,
          totalEngagements: globalStats.contentStats.products.totalEngagements,
          conversionRate: Math.round(globalStats.contentStats.products.conversionRate * 100) / 100,
          successRate: Math.round(globalStats.contentStats.products.successRate * 100),
          topPerformersCount: globalStats.contentStats.products.topPerformers.length,
        },
        tutorials: {
          totalViews: globalStats.contentStats.tutorials.totalViews,
          totalEngagements: globalStats.contentStats.tutorials.totalEngagements,
          conversionRate: Math.round(globalStats.contentStats.tutorials.conversionRate * 100) / 100,
          successRate: Math.round(globalStats.contentStats.tutorials.successRate * 100),
        },
        posts: {
          totalViews: globalStats.contentStats.posts.totalViews,
          totalEngagements: globalStats.contentStats.posts.totalEngagements,
          conversionRate: Math.round(globalStats.contentStats.posts.conversionRate * 100) / 100,
          successRate: Math.round(globalStats.contentStats.posts.successRate * 100),
        },
        education: {
          totalViews: globalStats.contentStats.education.totalViews,
          totalEngagements: globalStats.contentStats.education.totalEngagements,
          conversionRate: Math.round(globalStats.contentStats.education.conversionRate * 100) / 100,
          successRate: Math.round(globalStats.contentStats.education.successRate * 100),
        },
      },
      categoryCount: Object.keys(globalStats.categoryStats).length,
      topCategories: Object.values(globalStats.categoryStats)
        .sort((a, b) => b.waterfallSuccessRate - a.waterfallSuccessRate)
        .slice(0, 5)
        .map(c => ({
          id: c.categoryId,
          name: c.categoryName,
          successRate: Math.round(c.waterfallSuccessRate * 100),
          conversionRate: Math.round(c.conversionRate * 100) / 100,
        })),
      globalConversionRate: Math.round(globalStats.globalConversionRate * 10000) / 100,
      peakActivityHours: Object.entries(globalStats.timePatterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([hour, activity]) => ({ hour: `${hour}:00`, activity: Math.round(activity * 100) })),
    },
    metadata: {
      calculatedAt: globalStats.calculatedAt,
      cacheExpiry: new Date(Date.now() + GLOBAL_CACHE_TTL),
      cacheTTL: `${GLOBAL_CACHE_TTL / 1000 / 60}분`,
    },
  });
}
