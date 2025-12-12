/**
 * 경쟁 상품 분석 유틸리티
 * 유사 상품 가격/리뷰 비교
 * 
 * Phase 11 - P11-08
 */

import { prisma } from "@/lib/prisma";

// 경쟁 상품 정보
export interface CompetitorProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  discountRate: number;
  category: string;
  seller: {
    id: string;
    name: string;
    image?: string | null;
  };
  stats: {
    salesCount: number;
    viewCount: number;
    reviewCount: number;
    averageRating: number;
    conversionRate: number;
  };
  thumbnail?: string | null;
  tags: string[];
  createdAt: Date;
}

// 비교 분석 결과
export interface CompetitorAnalysis {
  myProduct: CompetitorProduct;
  competitors: CompetitorProduct[];
  insights: AnalysisInsight[];
  marketPosition: MarketPosition;
  recommendations: string[];
}

// 분석 인사이트
export interface AnalysisInsight {
  type: "PRICE" | "RATING" | "SALES" | "ENGAGEMENT";
  status: "GOOD" | "WARNING" | "CRITICAL";
  title: string;
  description: string;
  value?: number;
  benchmark?: number;
}

// 시장 포지션
export interface MarketPosition {
  priceRank: number;       // 가격 순위 (저렴한 순)
  salesRank: number;       // 판매 순위
  ratingRank: number;      // 평점 순위
  totalCompetitors: number;
  pricePercentile: number; // 가격 백분위
  position: "PREMIUM" | "MID" | "BUDGET" | "UNKNOWN";
}

/**
 * 유사 상품 조회 (같은 카테고리 + 유사 태그)
 */
export async function findSimilarProducts(
  productId: string,
  limit: number = 10
): Promise<CompetitorProduct[]> {
  // 기준 상품 조회
  const baseProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      categoryId: true,
      tags: true,
      sellerId: true,
      price: true,
      productType: true,
    },
  });

  if (!baseProduct) return [];

  // 유사 상품 조회 (같은 카테고리, 다른 판매자)
  const competitors = await prisma.product.findMany({
    where: {
      categoryId: baseProduct.categoryId,
      id: { not: productId },
      sellerId: { not: baseProduct.sellerId },
      isPublished: true,
      status: "PUBLISHED",
      productType: baseProduct.productType,
    },
    orderBy: [
      { salesCount: "desc" },
      { averageRating: "desc" },
    ],
    take: limit * 2, // 태그 매칭 후 필터링을 위해 더 많이 조회
    include: {
      seller: {
        select: { id: true, name: true, image: true },
      },
      category: {
        select: { name: true },
      },
    },
  });

  // 태그 유사도 계산 및 정렬
  const baseTags = new Set(baseProduct.tags);
  const scoredProducts = competitors.map(product => {
    const commonTags = product.tags.filter(t => baseTags.has(t)).length;
    const tagSimilarity = baseTags.size > 0 ? commonTags / baseTags.size : 0;
    return { product, tagSimilarity };
  });

  // 유사도 순 정렬 후 상위 N개
  scoredProducts.sort((a, b) => b.tagSimilarity - a.tagSimilarity);
  
  return scoredProducts.slice(0, limit).map(({ product }) => {
    const price = Number(product.price);
    const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
    const discountRate = originalPrice && originalPrice > price
      ? Math.round((1 - price / originalPrice) * 100)
      : 0;

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      price,
      originalPrice,
      discountRate,
      category: product.category.name,
      seller: {
        id: product.seller.id,
        name: product.seller.name || "Unknown",
        image: product.seller.image,
      },
      stats: {
        salesCount: product.salesCount,
        viewCount: product.viewCount,
        reviewCount: product.reviewCount,
        averageRating: product.averageRating,
        conversionRate: product.viewCount > 0 
          ? (product.salesCount / product.viewCount) * 100 
          : 0,
      },
      thumbnail: product.thumbnail,
      tags: product.tags,
      createdAt: product.createdAt,
    };
  });
}

/**
 * 상품 정보를 CompetitorProduct 형태로 변환
 */
async function getProductAsCompetitor(productId: string): Promise<CompetitorProduct | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: { select: { id: true, name: true, image: true } },
      category: { select: { name: true } },
    },
  });

  if (!product) return null;

  const price = Number(product.price);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const discountRate = originalPrice && originalPrice > price
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price,
    originalPrice,
    discountRate,
    category: product.category.name,
    seller: {
      id: product.seller.id,
      name: product.seller.name || "Unknown",
      image: product.seller.image,
    },
    stats: {
      salesCount: product.salesCount,
      viewCount: product.viewCount,
      reviewCount: product.reviewCount,
      averageRating: product.averageRating,
      conversionRate: product.viewCount > 0 
        ? (product.salesCount / product.viewCount) * 100 
        : 0,
    },
    thumbnail: product.thumbnail,
    tags: product.tags,
    createdAt: product.createdAt,
  };
}

/**
 * 경쟁 분석 수행
 */
export async function analyzeCompetitors(productId: string): Promise<CompetitorAnalysis | null> {
  const myProduct = await getProductAsCompetitor(productId);
  if (!myProduct) return null;

  const competitors = await findSimilarProducts(productId, 10);
  
  // 시장 포지션 계산
  const allProducts = [myProduct, ...competitors];
  const marketPosition = calculateMarketPosition(myProduct, allProducts);
  
  // 인사이트 생성
  const insights = generateInsights(myProduct, competitors);
  
  // 추천사항 생성
  const recommendations = generateRecommendations(myProduct, competitors, insights);

  return {
    myProduct,
    competitors,
    insights,
    marketPosition,
    recommendations,
  };
}

/**
 * 시장 포지션 계산
 */
function calculateMarketPosition(
  myProduct: CompetitorProduct,
  allProducts: CompetitorProduct[]
): MarketPosition {
  const total = allProducts.length;
  
  // 가격 순위 (저렴한 순)
  const sortedByPrice = [...allProducts].sort((a, b) => a.price - b.price);
  const priceRank = sortedByPrice.findIndex(p => p.id === myProduct.id) + 1;
  
  // 판매 순위 (높은 순)
  const sortedBySales = [...allProducts].sort((a, b) => b.stats.salesCount - a.stats.salesCount);
  const salesRank = sortedBySales.findIndex(p => p.id === myProduct.id) + 1;
  
  // 평점 순위 (높은 순)
  const sortedByRating = [...allProducts].sort((a, b) => b.stats.averageRating - a.stats.averageRating);
  const ratingRank = sortedByRating.findIndex(p => p.id === myProduct.id) + 1;
  
  // 가격 백분위
  const pricePercentile = total > 1 ? ((total - priceRank) / (total - 1)) * 100 : 50;
  
  // 포지션 결정
  let position: MarketPosition["position"] = "UNKNOWN";
  if (pricePercentile >= 70) position = "PREMIUM";
  else if (pricePercentile >= 30) position = "MID";
  else position = "BUDGET";

  return {
    priceRank,
    salesRank,
    ratingRank,
    totalCompetitors: total - 1,
    pricePercentile,
    position,
  };
}

/**
 * 인사이트 생성
 */
function generateInsights(
  myProduct: CompetitorProduct,
  competitors: CompetitorProduct[]
): AnalysisInsight[] {
  const insights: AnalysisInsight[] = [];
  
  if (competitors.length === 0) return insights;

  // 평균 계산
  const avgPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
  const avgRating = competitors.reduce((sum, c) => sum + c.stats.averageRating, 0) / competitors.length;
  const avgSales = competitors.reduce((sum, c) => sum + c.stats.salesCount, 0) / competitors.length;
  const avgConversion = competitors.reduce((sum, c) => sum + c.stats.conversionRate, 0) / competitors.length;

  // 가격 인사이트
  const priceDiff = ((myProduct.price - avgPrice) / avgPrice) * 100;
  insights.push({
    type: "PRICE",
    status: Math.abs(priceDiff) < 10 ? "GOOD" : priceDiff > 20 ? "CRITICAL" : "WARNING",
    title: "가격 경쟁력",
    description: priceDiff > 0 
      ? `시장 평균보다 ${Math.abs(priceDiff).toFixed(1)}% 비쌉니다.`
      : `시장 평균보다 ${Math.abs(priceDiff).toFixed(1)}% 저렴합니다.`,
    value: myProduct.price,
    benchmark: avgPrice,
  });

  // 평점 인사이트
  const ratingDiff = myProduct.stats.averageRating - avgRating;
  insights.push({
    type: "RATING",
    status: ratingDiff >= 0 ? "GOOD" : ratingDiff < -0.5 ? "CRITICAL" : "WARNING",
    title: "평점 비교",
    description: ratingDiff >= 0
      ? `시장 평균보다 ${ratingDiff.toFixed(1)}점 높습니다.`
      : `시장 평균보다 ${Math.abs(ratingDiff).toFixed(1)}점 낮습니다.`,
    value: myProduct.stats.averageRating,
    benchmark: avgRating,
  });

  // 판매량 인사이트
  const salesDiff = ((myProduct.stats.salesCount - avgSales) / Math.max(avgSales, 1)) * 100;
  insights.push({
    type: "SALES",
    status: salesDiff >= 0 ? "GOOD" : salesDiff < -30 ? "CRITICAL" : "WARNING",
    title: "판매 성과",
    description: salesDiff >= 0
      ? `시장 평균보다 ${Math.abs(salesDiff).toFixed(0)}% 더 많이 판매되었습니다.`
      : `시장 평균보다 ${Math.abs(salesDiff).toFixed(0)}% 적게 판매되었습니다.`,
    value: myProduct.stats.salesCount,
    benchmark: avgSales,
  });

  // 전환율 인사이트
  const convDiff = myProduct.stats.conversionRate - avgConversion;
  insights.push({
    type: "ENGAGEMENT",
    status: convDiff >= 0 ? "GOOD" : convDiff < -1 ? "CRITICAL" : "WARNING",
    title: "전환율",
    description: convDiff >= 0
      ? `시장 평균 대비 ${convDiff.toFixed(2)}%p 높은 전환율입니다.`
      : `시장 평균 대비 ${Math.abs(convDiff).toFixed(2)}%p 낮은 전환율입니다.`,
    value: myProduct.stats.conversionRate,
    benchmark: avgConversion,
  });

  return insights;
}

/**
 * 추천사항 생성
 */
function generateRecommendations(
  myProduct: CompetitorProduct,
  competitors: CompetitorProduct[],
  insights: AnalysisInsight[]
): string[] {
  const recommendations: string[] = [];

  for (const insight of insights) {
    if (insight.status === "CRITICAL" || insight.status === "WARNING") {
      switch (insight.type) {
        case "PRICE":
          if (insight.value && insight.benchmark && insight.value > insight.benchmark) {
            recommendations.push(
              `가격 조정을 고려해 보세요. 경쟁 상품 평균가 ₩${Math.round(insight.benchmark).toLocaleString()}입니다.`
            );
          }
          break;
        case "RATING":
          recommendations.push(
            "고객 리뷰에 적극적으로 응답하고, 상품 품질을 개선하여 평점을 높여보세요."
          );
          break;
        case "SALES":
          recommendations.push(
            "프로모션이나 할인 이벤트를 통해 판매량을 늘려보세요."
          );
          break;
        case "ENGAGEMENT":
          recommendations.push(
            "상품 썸네일과 설명을 개선하여 전환율을 높여보세요."
          );
          break;
      }
    }
  }

  // 기본 추천사항
  if (competitors.length > 0) {
    // 인기 태그 분석
    const tagCounts = new Map<string, number>();
    for (const comp of competitors) {
      for (const tag of comp.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    
    const myTags = new Set(myProduct.tags);
    const missingPopularTags = Array.from(tagCounts.entries())
      .filter(([tag, count]) => count >= competitors.length / 2 && !myTags.has(tag))
      .map(([tag]) => tag);

    if (missingPopularTags.length > 0) {
      recommendations.push(
        `경쟁 상품에서 자주 사용되는 태그: ${missingPopularTags.slice(0, 3).join(", ")}. 관련 태그 추가를 고려해 보세요.`
      );
    }
  }

  // 리뷰 수 체크
  if (myProduct.stats.reviewCount < 5) {
    recommendations.push(
      "리뷰 수가 적습니다. 구매 고객에게 리뷰 작성을 요청해 보세요."
    );
  }

  return recommendations;
}

/**
 * 카테고리별 가격 통계
 */
export async function getCategoryPriceStats(categoryId: string): Promise<{
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
}> {
  const products = await prisma.product.findMany({
    where: {
      categoryId,
      isPublished: true,
      status: "PUBLISHED",
    },
    select: { price: true },
    orderBy: { price: "asc" },
  });

  if (products.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0, count: 0 };
  }

  const prices = products.map(p => Number(p.price));
  const sum = prices.reduce((a, b) => a + b, 0);
  const median = prices.length % 2 === 0
    ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
    : prices[Math.floor(prices.length / 2)];

  return {
    min: prices[0],
    max: prices[prices.length - 1],
    avg: sum / prices.length,
    median,
    count: prices.length,
  };
}
