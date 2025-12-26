import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';

// ============================================
// 🧠 베이지안 자동 진화 추천 시스템 v2.0
// ============================================
// 
// 📌 핵심 구성 요소:
// 
// [1] 베이지안 클러스터링 엔진
//     - 5개 사용자 클러스터 분류
//     - P(Cluster | Features) 계산
//     - 신뢰도 추적
// 
// [2] 조건부 확률 엔진
//     - P(Next | First, Cluster)
//     - 라플라스 스무딩
//     - 개인 + 그룹 가중 결합
// 
// [3] 5단계 폭포 시뮬레이터
//     - exposure → awareness → interest → desire → action
//     - 맥락 조정 (시간, 재고, 할인)
//     - 자동 페널티 조정
// 
// [4] 기댓값 기반 결정 엔진
//     - EV = P × Value - Cost
//     - 동적 임계값
//     - 추천 순위 결정
// 
// [5] 연속 피드백 프로세서
//     - 0~1 연속값
//     - 단계별 가중치
//     - 베이지안 자동 업데이트
// 
// [6] 상태 영속화 시스템
//     - Prisma DB 저장/로드
//     - 서버 재시작 내구성
// 
// ============================================

// ==========================================
// 📊 타입 정의
// ==========================================

/** 사용자 클러스터 유형 */
type UserClusterType = 
  | "PRICE_SENSITIVE"
  | "CONVENIENCE_FOCUSED"
  | "QUALITY_SEEKER"
  | "BRAND_LOYAL"
  | "IMPULSE_BUYER"
  | "UNKNOWN";

/** 피드백 유형 */
type RecommendationFeedbackType =
  | "EXPOSURE"
  | "CLICK"
  | "CART"
  | "WISHLIST"
  | "PURCHASE"
  | "SKIP"
  | "RETURN";

/** 클러스터 이름 */
const CLUSTER_NAMES: UserClusterType[] = [
  "PRICE_SENSITIVE",
  "CONVENIENCE_FOCUSED", 
  "QUALITY_SEEKER",
  "BRAND_LOYAL",
  "IMPULSE_BUYER"
];

/** 퍼널 단계 */
const FUNNEL_STAGES = ["exposure", "awareness", "interest", "desire", "action"] as const;
type FunnelStage = typeof FUNNEL_STAGES[number];

/** 피드백 가중치 (0~1 연속값 매핑) */
const FEEDBACK_WEIGHTS: Record<RecommendationFeedbackType, number> = {
  EXPOSURE: 0.1,
  CLICK: 0.3,
  CART: 0.6,
  WISHLIST: 0.5,
  PURCHASE: 1.0,
  SKIP: 0.0,
  RETURN: -0.3,
};

/** 시스템 설정 */
const CONFIG = {
  // 라플라스 스무딩 파라미터
  LAPLACE_ALPHA: 1.0,
  
  // 개인/그룹 가중치 혼합 비율 (0~1, 1에 가까울수록 개인 중시)
  PERSONAL_WEIGHT: 0.6,
  
  // 베이지안 스무딩 강도
  BAYESIAN_BETA: 2.0,
  
  // 최소 기댓값 (추천 임계값)
  MIN_EXPECTED_VALUE: 0,
  
  // 페널티 학습률
  PENALTY_LEARNING_RATE: 0.1,
  
  // 캐시 TTL (1시간)
  CACHE_TTL: 1000 * 60 * 60,
  
  // 콜드 스타트 탐색 확률
  COLD_START_EXPLORE_RATE: 0.3,
  
  // 기본 추천 개수
  DEFAULT_TOP_K: 10,
};

/** 클러스터별 특성 분포 (평균, 표준편차) */
const CLUSTER_FEATURES: Record<UserClusterType, {
  avgPrice: [number, number];
  purchaseFreq: [number, number];
  reviewRate: [number, number];
  returnRate: [number, number];
  diversityScore: [number, number];
}> = {
  PRICE_SENSITIVE: {
    avgPrice: [0.2, 0.15],
    purchaseFreq: [0.6, 0.2],
    reviewRate: [0.3, 0.2],
    returnRate: [0.4, 0.2],
    diversityScore: [0.7, 0.15],
  },
  CONVENIENCE_FOCUSED: {
    avgPrice: [0.5, 0.2],
    purchaseFreq: [0.5, 0.2],
    reviewRate: [0.2, 0.15],
    returnRate: [0.2, 0.15],
    diversityScore: [0.3, 0.2],
  },
  QUALITY_SEEKER: {
    avgPrice: [0.8, 0.15],
    purchaseFreq: [0.3, 0.15],
    reviewRate: [0.7, 0.2],
    returnRate: [0.1, 0.1],
    diversityScore: [0.4, 0.2],
  },
  BRAND_LOYAL: {
    avgPrice: [0.6, 0.2],
    purchaseFreq: [0.7, 0.15],
    reviewRate: [0.5, 0.2],
    returnRate: [0.05, 0.05],
    diversityScore: [0.2, 0.15],
  },
  IMPULSE_BUYER: {
    avgPrice: [0.5, 0.25],
    purchaseFreq: [0.8, 0.15],
    reviewRate: [0.1, 0.1],
    returnRate: [0.5, 0.2],
    diversityScore: [0.8, 0.15],
  },
  UNKNOWN: {
    avgPrice: [0.5, 0.3],
    purchaseFreq: [0.5, 0.3],
    reviewRate: [0.5, 0.3],
    returnRate: [0.5, 0.3],
    diversityScore: [0.5, 0.3],
  },
};

/** 클러스터별 기본 퍼널 전환율 */
const DEFAULT_FUNNEL_RATES: Record<UserClusterType, Record<FunnelStage, number>> = {
  PRICE_SENSITIVE: { exposure: 1.0, awareness: 0.7, interest: 0.5, desire: 0.3, action: 0.15 },
  CONVENIENCE_FOCUSED: { exposure: 1.0, awareness: 0.8, interest: 0.6, desire: 0.4, action: 0.25 },
  QUALITY_SEEKER: { exposure: 1.0, awareness: 0.9, interest: 0.7, desire: 0.5, action: 0.35 },
  BRAND_LOYAL: { exposure: 1.0, awareness: 0.95, interest: 0.8, desire: 0.7, action: 0.5 },
  IMPULSE_BUYER: { exposure: 1.0, awareness: 0.6, interest: 0.5, desire: 0.6, action: 0.4 },
  UNKNOWN: { exposure: 1.0, awareness: 0.7, interest: 0.5, desire: 0.35, action: 0.2 },
};

/** 추천 결과 인터페이스 */
interface RecommendationResult {
  productId: string;
  productName: string;
  productImage: string | null;
  productPrice: number;
  probability: number;
  expectedValue: number;
  cluster: UserClusterType;
  clusterConfidence: number;
  funnelConversion: number;
  reasoning: string;
  context: {
    isPersonalized: boolean;
    dataPoints: number;
    isColdStart: boolean;
  };
}

/** API 응답 인터페이스 */
interface RecommendationResponse {
  success: boolean;
  recommendations: RecommendationResult[];
  userId: string | null;
  cluster: UserClusterType | null;
  clusterConfidence: number;
  stats: {
    totalCandidates: number;
    filteredCount: number;
    processingTimeMs: number;
  };
  meta: {
    algorithm: string;
    version: string;
    timestamp: string;
  };
}

// ==========================================
// 🔧 유틸리티 함수
// ==========================================

/** 가우시안 확률 밀도 함수 */
function gaussianPdf(x: number, mean: number, std: number): number {
  if (std === 0) return x === mean ? 1 : 0;
  const exponent = -0.5 * Math.pow((x - mean) / std, 2);
  return Math.exp(exponent) / (std * Math.sqrt(2 * Math.PI));
}

/** 안전한 나눗셈 */
function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  return denominator === 0 ? fallback : numerator / denominator;
}

/** 값 클램핑 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 가격 범위 분류 */
function getPriceRange(price: number): string {
  if (price === 0) return "free";
  if (price < 10000) return "low";
  if (price < 50000) return "mid";
  if (price < 100000) return "high";
  return "premium";
}

// ==========================================
// 🧠 베이지안 클러스터링 엔진
// ==========================================

class BayesianClusterEngine {
  private clusterPriors: Map<UserClusterType, number> = new Map();
  
  constructor() {
    // 균등 사전 확률로 초기화
    const uniformPrior = 1 / CLUSTER_NAMES.length;
    CLUSTER_NAMES.forEach(c => this.clusterPriors.set(c, uniformPrior));
  }
  
  /** 클러스터 사전 확률 로드 */
  async loadPriors(): Promise<void> {
    try {
      const state = await prisma.recommendationState.findUnique({
        where: { key: "cluster_priors" }
      });
      
      if (state?.value) {
        const priors = state.value as Record<string, number>;
        Object.entries(priors).forEach(([cluster, prob]) => {
          this.clusterPriors.set(cluster as UserClusterType, prob);
        });
      }
    } catch {
      // 초기 상태 유지
    }
  }
  
  /** 클러스터 사전 확률 저장 */
  async savePriors(): Promise<void> {
    const priors: Record<string, number> = {};
    this.clusterPriors.forEach((prob, cluster) => {
      priors[cluster] = prob;
    });
    
    await prisma.recommendationState.upsert({
      where: { key: "cluster_priors" },
      update: { value: priors, updatedAt: new Date() },
      create: { key: "cluster_priors", value: priors }
    });
  }
  
  /** 사용자 특성 추출 */
  async extractUserFeatures(userId: string): Promise<{
    avgPrice: number;
    purchaseFreq: number;
    reviewRate: number;
    returnRate: number;
    diversityScore: number;
  } | null> {
    try {
      // 구매 내역 조회
      const purchases = await prisma.purchase.findMany({
        where: { buyerId: userId },
        include: { product: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      
      if (purchases.length === 0) return null;
      
      // 리뷰 수 조회
      const reviewCount = await prisma.review.count({
        where: { userId }
      });
      
      // 환불 수 조회
      const refundCount = await prisma.refundRequest.count({
        where: { 
          userId,
          status: { in: ["APPROVED", "COMPLETED"] }
        }
      });
      
      // 카테고리 다양성 계산
      const categories = new Set(purchases.map(p => p.product.categoryId).filter(Boolean));
      
      // 특성 계산 (0~1 정규화)
      const prices = purchases.map(p => Number(p.product.price));
      const maxPrice = 500000; // 정규화 기준
      
      const avgPrice = clamp(safeDivide(prices.reduce((a, b) => a + b, 0), prices.length) / maxPrice, 0, 1);
      const purchaseFreq = clamp(purchases.length / 50, 0, 1); // 50개 구매 = 1.0
      const reviewRate = clamp(safeDivide(reviewCount, purchases.length), 0, 1);
      const returnRate = clamp(safeDivide(refundCount, purchases.length), 0, 1);
      const diversityScore = clamp(categories.size / 10, 0, 1); // 10개 카테고리 = 1.0
      
      return { avgPrice, purchaseFreq, reviewRate, returnRate, diversityScore };
    } catch {
      return null;
    }
  }
  
  /** 베이지안 클러스터 분류: P(Cluster | Features) */
  classifyUser(features: {
    avgPrice: number;
    purchaseFreq: number;
    reviewRate: number;
    returnRate: number;
    diversityScore: number;
  }): { cluster: UserClusterType; confidence: number; probabilities: Record<UserClusterType, number> } {
    const posteriors: Map<UserClusterType, number> = new Map();
    let totalPosterior = 0;
    
    for (const cluster of CLUSTER_NAMES) {
      const prior = this.clusterPriors.get(cluster) || 0.2;
      const clusterFeatures = CLUSTER_FEATURES[cluster];
      
      // P(Features | Cluster) - 각 특성의 가우시안 확률 곱
      let likelihood = 1;
      likelihood *= gaussianPdf(features.avgPrice, clusterFeatures.avgPrice[0], clusterFeatures.avgPrice[1]);
      likelihood *= gaussianPdf(features.purchaseFreq, clusterFeatures.purchaseFreq[0], clusterFeatures.purchaseFreq[1]);
      likelihood *= gaussianPdf(features.reviewRate, clusterFeatures.reviewRate[0], clusterFeatures.reviewRate[1]);
      likelihood *= gaussianPdf(features.returnRate, clusterFeatures.returnRate[0], clusterFeatures.returnRate[1]);
      likelihood *= gaussianPdf(features.diversityScore, clusterFeatures.diversityScore[0], clusterFeatures.diversityScore[1]);
      
      const posterior = likelihood * prior;
      posteriors.set(cluster, posterior);
      totalPosterior += posterior;
    }
    
    // 정규화
    const probabilities: Record<UserClusterType, number> = {} as Record<UserClusterType, number>;
    let maxCluster: UserClusterType = "UNKNOWN";
    let maxProb = 0;
    
    posteriors.forEach((posterior, cluster) => {
      const normalizedProb = safeDivide(posterior, totalPosterior, 0.2);
      probabilities[cluster] = normalizedProb;
      
      if (normalizedProb > maxProb) {
        maxProb = normalizedProb;
        maxCluster = cluster;
      }
    });
    
    return {
      cluster: maxCluster,
      confidence: maxProb,
      probabilities
    };
  }
  
  /** 사용자 클러스터 정보 업데이트 */
  async updateUserCluster(userId: string): Promise<{
    cluster: UserClusterType;
    confidence: number;
  }> {
    const features = await this.extractUserFeatures(userId);
    
    if (!features) {
      // 콜드 스타트: UNKNOWN 클러스터
      return { cluster: "UNKNOWN", confidence: 0 };
    }
    
    const classification = this.classifyUser(features);
    
    // DB에 저장
    await prisma.userCluster.upsert({
      where: { userId },
      update: {
        cluster: classification.cluster,
        confidence: classification.confidence,
        avgPrice: features.avgPrice,
        purchaseFreq: features.purchaseFreq,
        reviewRate: features.reviewRate,
        returnRate: features.returnRate,
        diversityScore: features.diversityScore,
        clusterProbs: classification.probabilities,
        updatedAt: new Date(),
      },
      create: {
        userId,
        cluster: classification.cluster,
        confidence: classification.confidence,
        avgPrice: features.avgPrice,
        purchaseFreq: features.purchaseFreq,
        reviewRate: features.reviewRate,
        returnRate: features.returnRate,
        diversityScore: features.diversityScore,
        clusterProbs: classification.probabilities,
      }
    });
    
    return {
      cluster: classification.cluster,
      confidence: classification.confidence
    };
  }
  
  /** 클러스터 사전 확률 업데이트 (전체 사용자 기반) */
  async updateClusterPriors(): Promise<void> {
    const clusterCounts = await prisma.userCluster.groupBy({
      by: ["cluster"],
      _count: { cluster: true }
    });
    
    const total = clusterCounts.reduce((sum, c) => sum + c._count.cluster, 0);
    
    if (total > 0) {
      clusterCounts.forEach(({ cluster, _count }) => {
        // 라플라스 스무딩 적용
        const smoothedProb = (_count.cluster + CONFIG.LAPLACE_ALPHA) / 
                            (total + CONFIG.LAPLACE_ALPHA * CLUSTER_NAMES.length);
        this.clusterPriors.set(cluster, smoothedProb);
      });
      
      await this.savePriors();
    }
  }
}

// ==========================================
// 📈 조건부 확률 엔진
// ==========================================

class ConditionalProbabilityEngine {
  /** 조건부 확률 계산: P(Next | First, Cluster) with Laplace smoothing */
  async computeConditionalProbability(
    firstProductId: string,
    nextProductId: string,
    cluster: UserClusterType
  ): Promise<{ personal: number; group: number; combined: number }> {
    // 개인 레벨 전이 확률
    const transition = await prisma.transitionMatrix.findUnique({
      where: {
        firstProductId_cluster_nextProductId: {
          firstProductId,
          cluster,
          nextProductId
        }
      }
    });

    const personalCount = transition?.transitionCount || 0;
    const totalFromFirst = transition?.totalFromFirst || 0;

    // 전체 상품 수 (라플라스 스무딩용)
    const totalProducts = await prisma.product.count({ where: { status: "PUBLISHED" } });

    // 라플라스 스무딩 적용 개인 확률
    const personal = safeDivide(
      personalCount + CONFIG.LAPLACE_ALPHA,
      totalFromFirst + CONFIG.LAPLACE_ALPHA * totalProducts,
      1 / Math.max(totalProducts, 1)
    );

    // 그룹 레벨 전이 확률 (같은 클러스터의 모든 전이)
    const groupTransitions = await prisma.transitionMatrix.aggregate({
      where: { cluster, nextProductId },
      _sum: { transitionCount: true },
    });

    const groupTotal = await prisma.transitionMatrix.aggregate({
      where: { cluster },
      _sum: { transitionCount: true },
    });

    const groupCount = groupTransitions._sum.transitionCount || 0;
    const groupTotalCount = groupTotal._sum.transitionCount || 0;

    // 라플라스 스무딩 적용 그룹 확률
    const group = safeDivide(
      groupCount + CONFIG.LAPLACE_ALPHA,
      groupTotalCount + CONFIG.LAPLACE_ALPHA * totalProducts,
      1 / Math.max(totalProducts, 1)
    );

    // 개인 + 그룹 가중 결합
    const combined = CONFIG.PERSONAL_WEIGHT * personal + (1 - CONFIG.PERSONAL_WEIGHT) * group;

    return { personal, group, combined };
  }

  /** 배치 조건부 확률 계산: 여러 상품에 대해 한 번에 계산 (N+1 문제 해결) */
  async computeBatchConditionalProbabilities(
    firstProductId: string,
    nextProductIds: string[],
    cluster: UserClusterType
  ): Promise<Map<string, { personal: number; group: number; combined: number }>> {
    const result = new Map<string, { personal: number; group: number; combined: number }>();

    if (nextProductIds.length === 0) {
      return result;
    }

    // 1. 배치로 전이 행렬 조회
    const transitions = await prisma.transitionMatrix.findMany({
      where: {
        firstProductId,
        cluster,
        nextProductId: { in: nextProductIds }
      }
    });

    // 전이 맵 생성 (타입 명시)
    const transitionMap = new Map<string, typeof transitions[0]>(
      transitions.map(t => [t.nextProductId, t])
    );

    // 2. 전체 상품 수 (한 번만 조회)
    const totalProducts = await prisma.product.count({ where: { status: "PUBLISHED" } });

    // 3. 그룹 레벨 통계 배치 조회
    const groupTransitions = await prisma.transitionMatrix.groupBy({
      by: ['nextProductId'],
      where: {
        cluster,
        nextProductId: { in: nextProductIds }
      },
      _sum: { transitionCount: true },
    });

    const groupTransitionMap = new Map<string, number>(
      groupTransitions.map(g => [g.nextProductId, g._sum.transitionCount || 0])
    );

    // 4. 클러스터 전체 전이 수 (한 번만 조회)
    const groupTotal = await prisma.transitionMatrix.aggregate({
      where: { cluster },
      _sum: { transitionCount: true },
    });
    const groupTotalCount = groupTotal._sum.transitionCount || 0;

    // 5. 각 상품별 확률 계산
    for (const nextProductId of nextProductIds) {
      const transition = transitionMap.get(nextProductId);
      const personalCount = transition?.transitionCount || 0;
      const totalFromFirst = transition?.totalFromFirst || 0;

      const personal = safeDivide(
        personalCount + CONFIG.LAPLACE_ALPHA,
        totalFromFirst + CONFIG.LAPLACE_ALPHA * totalProducts,
        1 / Math.max(totalProducts, 1)
      );

      const groupCount = groupTransitionMap.get(nextProductId) || 0;
      const group = safeDivide(
        groupCount + CONFIG.LAPLACE_ALPHA,
        groupTotalCount + CONFIG.LAPLACE_ALPHA * totalProducts,
        1 / Math.max(totalProducts, 1)
      );

      const combined = CONFIG.PERSONAL_WEIGHT * personal + (1 - CONFIG.PERSONAL_WEIGHT) * group;

      result.set(nextProductId, { personal, group, combined });
    }

    return result;
  }
  
  /** 전이 행렬 업데이트 */
  async updateTransition(
    firstProductId: string,
    nextProductId: string,
    cluster: UserClusterType
  ): Promise<void> {
    // 전체 상품 수
    const totalProducts = await prisma.product.count({ where: { status: "PUBLISHED" } });
    
    // 현재 전이 카운트 조회
    const existing = await prisma.transitionMatrix.findUnique({
      where: {
        firstProductId_cluster_nextProductId: {
          firstProductId, cluster, nextProductId
        }
      }
    });
    
    // 해당 first+cluster의 총 전이 수 조회
    const totalFromFirst = await prisma.transitionMatrix.aggregate({
      where: { firstProductId, cluster },
      _sum: { transitionCount: true }
    });
    
    const newCount = (existing?.transitionCount || 0) + 1;
    const newTotal = (totalFromFirst._sum.transitionCount || 0) + 1;
    
    // 확률 계산
    const probability = safeDivide(newCount, newTotal);
    const smoothedProb = safeDivide(
      newCount + CONFIG.LAPLACE_ALPHA,
      newTotal + CONFIG.LAPLACE_ALPHA * totalProducts
    );
    
    await prisma.transitionMatrix.upsert({
      where: {
        firstProductId_cluster_nextProductId: {
          firstProductId, cluster, nextProductId
        }
      },
      update: {
        transitionCount: newCount,
        totalFromFirst: newTotal,
        probability,
        smoothedProb,
        updatedAt: new Date()
      },
      create: {
        firstProductId,
        cluster,
        nextProductId,
        transitionCount: newCount,
        totalFromFirst: newTotal,
        probability,
        smoothedProb
      }
    });
  }
  
  /** 카테고리 전이 확률 조회 */
  async getCategoryTransitionProbability(
    fromCategory: string,
    toCategory: string,
    cluster: UserClusterType
  ): Promise<number> {
    const transition = await prisma.categoryTransition.findUnique({
      where: {
        fromCategory_toCategory_cluster: {
          fromCategory, toCategory, cluster
        }
      }
    });
    
    return transition?.probability || 0.1; // 기본 10%
  }
}

// ==========================================
// 🌊 5단계 폭포 시뮬레이터
// ==========================================

class FunnelSimulator {
  /** 퍼널 전환 시뮬레이션 */
  async simulateFunnel(
    productId: string,
    cluster: UserClusterType,
    context: { hour?: number; stockLevel?: number; discountRate?: number }
  ): Promise<{ conversionRate: number; stageRates: Record<FunnelStage, number> }> {
    // DB에서 퍼널 상태 조회
    const funnelState = await prisma.funnelState.findUnique({
      where: { productId_cluster: { productId, cluster } }
    });
    
    // 기본 전환율 사용 (DB에 없으면)
    const baseRates = funnelState ? {
      exposure: funnelState.exposureRate,
      awareness: funnelState.awarenessRate,
      interest: funnelState.interestRate,
      desire: funnelState.desireRate,
      action: funnelState.actionRate,
    } : DEFAULT_FUNNEL_RATES[cluster];
    
    // 페널티 적용
    const penalties = funnelState ? {
      exposure: funnelState.exposurePenalty,
      awareness: funnelState.awarenessPenalty,
      interest: funnelState.interestPenalty,
      desire: funnelState.desirePenalty,
      action: funnelState.actionPenalty,
    } : { exposure: 0, awareness: 0, interest: 0, desire: 0, action: 0 };
    
    // 맥락 조정 계수
    const timeMultiplier = this.getTimeMultiplier(context.hour ?? new Date().getHours());
    const stockMultiplier = this.getStockMultiplier(context.stockLevel ?? 100);
    const discountMultiplier = this.getDiscountMultiplier(context.discountRate ?? 0);
    
    const contextMultiplier = timeMultiplier * stockMultiplier * discountMultiplier;
    
    // 각 단계별 최종 전환율 계산
    const stageRates: Record<FunnelStage, number> = {} as Record<FunnelStage, number>;
    let cumulativeRate = 1.0;
    
    for (const stage of FUNNEL_STAGES) {
      const baseRate = baseRates[stage];
      const penalty = penalties[stage];
      const adjustedRate = clamp(baseRate * contextMultiplier * (1 - penalty), 0, 1);
      
      cumulativeRate *= adjustedRate;
      stageRates[stage] = adjustedRate;
    }
    
    return {
      conversionRate: cumulativeRate,
      stageRates
    };
  }
  
  /** 시간대 조정 계수 */
  private getTimeMultiplier(hour: number): number {
    if (hour >= 18 && hour <= 22) return 1.2;  // 황금 시간대
    if (hour >= 10 && hour <= 17) return 1.0;  // 업무 시간
    if (hour >= 6 && hour <= 9) return 0.9;    // 아침
    return 0.7;                                 // 새벽
  }
  
  /** 재고 조정 계수 */
  private getStockMultiplier(stockLevel: number): number {
    if (stockLevel <= 5) return 1.3;   // 품절 임박 - 긴급감
    if (stockLevel <= 20) return 1.1;  // 재고 부족
    if (stockLevel >= 100) return 0.9; // 재고 충분
    return 1.0;
  }
  
  /** 할인 조정 계수 */
  private getDiscountMultiplier(discountRate: number): number {
    if (discountRate >= 50) return 1.5;  // 대폭 할인
    if (discountRate >= 30) return 1.3;  // 큰 할인
    if (discountRate >= 10) return 1.1;  // 소폭 할인
    return 1.0;
  }
  
  /** 퍼널 상태 업데이트 (노출 증가) */
  async recordExposure(productId: string, cluster: UserClusterType): Promise<void> {
    await prisma.funnelState.upsert({
      where: { productId_cluster: { productId, cluster } },
      update: {
        totalExposures: { increment: 1 },
        updatedAt: new Date()
      },
      create: {
        productId,
        cluster,
        totalExposures: 1,
        ...DEFAULT_FUNNEL_RATES[cluster],
        exposurePenalty: 0,
        awarenessPenalty: 0,
        interestPenalty: 0,
        desirePenalty: 0,
        actionPenalty: 0,
      }
    });
  }

  /** 배치 퍼널 시뮬레이션: 여러 상품에 대해 한 번에 계산 (N+1 문제 해결) */
  async simulateFunnelBatch(
    productIds: string[],
    cluster: UserClusterType,
    context: { hour?: number; stockLevel?: number; discountRate?: number }
  ): Promise<Map<string, { conversionRate: number; stageRates: Record<FunnelStage, number> }>> {
    const result = new Map<string, { conversionRate: number; stageRates: Record<FunnelStage, number> }>();

    if (productIds.length === 0) {
      return result;
    }

    // 배치로 퍼널 상태 조회
    const funnelStates = await prisma.funnelState.findMany({
      where: {
        productId: { in: productIds },
        cluster
      }
    });

    const funnelStateMap = new Map<string, typeof funnelStates[0]>(
      funnelStates.map(f => [f.productId, f])
    );

    // 맥락 조정 계수 (한 번만 계산)
    const timeMultiplier = this.getTimeMultiplier(context.hour ?? new Date().getHours());
    const stockMultiplier = this.getStockMultiplier(context.stockLevel ?? 100);
    const discountMultiplier = this.getDiscountMultiplier(context.discountRate ?? 0);
    const contextMultiplier = timeMultiplier * stockMultiplier * discountMultiplier;

    // 각 상품별 퍼널 계산
    for (const productId of productIds) {
      const funnelState = funnelStateMap.get(productId);

      const baseRates = funnelState ? {
        exposure: funnelState.exposureRate,
        awareness: funnelState.awarenessRate,
        interest: funnelState.interestRate,
        desire: funnelState.desireRate,
        action: funnelState.actionRate,
      } : DEFAULT_FUNNEL_RATES[cluster];

      const penalties = funnelState ? {
        exposure: funnelState.exposurePenalty,
        awareness: funnelState.awarenessPenalty,
        interest: funnelState.interestPenalty,
        desire: funnelState.desirePenalty,
        action: funnelState.actionPenalty,
      } : { exposure: 0, awareness: 0, interest: 0, desire: 0, action: 0 };

      const stageRates: Record<FunnelStage, number> = {} as Record<FunnelStage, number>;
      let cumulativeRate = 1.0;

      for (const stage of FUNNEL_STAGES) {
        const baseRate = baseRates[stage];
        const penalty = penalties[stage];
        const adjustedRate = clamp(baseRate * contextMultiplier * (1 - penalty), 0, 1);

        cumulativeRate *= adjustedRate;
        stageRates[stage] = adjustedRate;
      }

      result.set(productId, {
        conversionRate: cumulativeRate,
        stageRates
      });
    }

    return result;
  }

  /** 배치 노출 기록 (N+1 문제 해결) */
  async recordExposureBatch(productIds: string[], cluster: UserClusterType): Promise<void> {
    if (productIds.length === 0) return;

    // 기존 레코드 조회
    const existingStates = await prisma.funnelState.findMany({
      where: {
        productId: { in: productIds },
        cluster
      },
      select: { productId: true }
    });

    const existingIds = new Set(existingStates.map(s => s.productId));

    // 기존 레코드 업데이트 (배치)
    if (existingIds.size > 0) {
      await prisma.funnelState.updateMany({
        where: {
          productId: { in: Array.from(existingIds) },
          cluster
        },
        data: {
          totalExposures: { increment: 1 },
          updatedAt: new Date()
        }
      });
    }

    // 새 레코드 생성 (배치)
    const newProductIds = productIds.filter(id => !existingIds.has(id));
    if (newProductIds.length > 0) {
      await prisma.funnelState.createMany({
        data: newProductIds.map(productId => ({
          productId,
          cluster,
          totalExposures: 1,
          ...DEFAULT_FUNNEL_RATES[cluster],
          exposurePenalty: 0,
          awarenessPenalty: 0,
          interestPenalty: 0,
          desirePenalty: 0,
          actionPenalty: 0,
        })),
        skipDuplicates: true
      });
    }
  }
  
  /** 퍼널 페널티 업데이트 (실패 시) */
  async applyPenalty(
    productId: string,
    cluster: UserClusterType,
    failedStage: FunnelStage,
    severity: number = 0.1
  ): Promise<void> {
    const penaltyField = `${failedStage}Penalty` as const;
    
    const current = await prisma.funnelState.findUnique({
      where: { productId_cluster: { productId, cluster } }
    });
    
    if (current) {
      const currentPenalty = (current as unknown as Record<string, number>)[penaltyField] || 0;
      const newPenalty = clamp(
        currentPenalty * (1 - CONFIG.PENALTY_LEARNING_RATE) + severity * CONFIG.PENALTY_LEARNING_RATE,
        0, 0.5 // 최대 50% 페널티
      );
      
      await prisma.funnelState.update({
        where: { productId_cluster: { productId, cluster } },
        data: {
          [penaltyField]: newPenalty,
          updatedAt: new Date()
        }
      });
    }
  }
}

// ==========================================
// 💰 기댓값 기반 결정 엔진
// ==========================================

class ExpectedValueEngine {
  /** 기댓값 계산: EV = P × Value - Cost */
  calculateExpectedValue(
    probability: number,
    productValue: number,
    cost: number = 0
  ): number {
    return probability * productValue - cost;
  }
  
  /** 베이지안 스무딩 적용 */
  applyBayesianSmoothing(probability: number, prior: number = 0.1): number {
    return (probability + prior * CONFIG.BAYESIAN_BETA) / (1 + CONFIG.BAYESIAN_BETA);
  }
  
  /** 추천 여부 결정 */
  shouldRecommend(expectedValue: number, threshold: number = CONFIG.MIN_EXPECTED_VALUE): boolean {
    return expectedValue > threshold;
  }
  
  /** 추천 순위 정렬 */
  rankRecommendations(
    items: Array<{ productId: string; expectedValue: number; probability: number }>
  ): Array<{ productId: string; expectedValue: number; probability: number; rank: number }> {
    return items
      .sort((a, b) => b.expectedValue - a.expectedValue)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }
}

// ==========================================
// 📝 연속 피드백 프로세서
// ==========================================

class FeedbackProcessor {
  private clusterEngine: BayesianClusterEngine;
  private conditionalEngine: ConditionalProbabilityEngine;
  private funnelSimulator: FunnelSimulator;
  
  constructor(
    clusterEngine: BayesianClusterEngine,
    conditionalEngine: ConditionalProbabilityEngine,
    funnelSimulator: FunnelSimulator
  ) {
    this.clusterEngine = clusterEngine;
    this.conditionalEngine = conditionalEngine;
    this.funnelSimulator = funnelSimulator;
  }
  
  /** 피드백 값을 연속값(0~1)으로 변환 */
  getFeedbackValue(feedbackType: RecommendationFeedbackType): number {
    return FEEDBACK_WEIGHTS[feedbackType] ?? 0;
  }
  
  /** 실패 단계 추정 (베이지안 추론) */
  inferFailedStage(feedbackType: RecommendationFeedbackType): FunnelStage | null {
    // 피드백 유형에 따른 실패 단계 추정
    switch (feedbackType) {
      case "EXPOSURE":
        return "awareness"; // 노출만 됨 → 인지 실패
      case "CLICK":
        return "interest";  // 클릭만 → 관심 실패
      case "WISHLIST":
        return "desire";    // 위시리스트만 → 욕구 실패
      case "CART":
        return "action";    // 장바구니만 → 행동 실패
      case "SKIP":
        return "exposure";  // 스킵 → 노출 실패
      case "RETURN":
        return "action";    // 반품 → 행동 실패
      default:
        return null;        // 구매 성공
    }
  }
  
  /** 피드백 처리 및 자동 학습 */
  async processFeedback(
    userId: string,
    productId: string,
    feedbackType: RecommendationFeedbackType,
    context: Record<string, unknown> = {}
  ): Promise<void> {
    const feedbackValue = this.getFeedbackValue(feedbackType);
    const failedStage = this.inferFailedStage(feedbackType);
    const isConversion = feedbackType === "PURCHASE";
    
    // 1. 피드백 로그 저장
    await prisma.recommendationFeedback.create({
      data: {
        userId,
        productId,
        feedbackType,
        feedbackValue,
        recommendedAt: new Date(),
        actualOutcome: isConversion,
        failedStage,
        context: context as Prisma.JsonObject,
      }
    });
    
    // 2. 사용자 클러스터 정보 조회
    const userCluster = await prisma.userCluster.findUnique({
      where: { userId }
    });
    const cluster = userCluster?.cluster || "UNKNOWN";
    
    // 3. 전이 행렬 업데이트 (구매 시)
    if (isConversion && userCluster?.firstProductId) {
      await this.conditionalEngine.updateTransition(
        userCluster.firstProductId,
        productId,
        cluster
      );
    }
    
    // 4. 첫 구매 기록 업데이트
    if (isConversion && !userCluster?.firstProductId) {
      await prisma.userCluster.upsert({
        where: { userId },
        update: { firstProductId: productId, updatedAt: new Date() },
        create: { 
          userId, 
          firstProductId: productId,
          cluster: "UNKNOWN",
          confidence: 0
        }
      });
    }
    
    // 5. 퍼널 페널티 적용 (실패 시)
    if (failedStage) {
      const severity = 1 - feedbackValue; // 피드백 값이 낮을수록 높은 페널티
      await this.funnelSimulator.applyPenalty(productId, cluster, failedStage, severity * 0.2);
    }
    
    // 6. 퍼널 액션 기록 (구매 시)
    if (isConversion) {
      await prisma.funnelState.upsert({
        where: { productId_cluster: { productId, cluster } },
        update: {
          totalActions: { increment: 1 },
          updatedAt: new Date()
        },
        create: {
          productId,
          cluster,
          totalExposures: 1,
          totalActions: 1,
          ...DEFAULT_FUNNEL_RATES[cluster],
          exposurePenalty: 0,
          awarenessPenalty: 0,
          interestPenalty: 0,
          desirePenalty: 0,
          actionPenalty: 0,
        }
      });
    }
    
    // 7. 클러스터 재분류 (일정 조건 시)
    const feedbackCount = await prisma.recommendationFeedback.count({
      where: { userId }
    });
    
    if (feedbackCount % 10 === 0) { // 10개 피드백마다 재분류
      await this.clusterEngine.updateUserCluster(userId);
    }
    
    // 8. 통계 업데이트
    await this.updateStats(isConversion, productId);
  }
  
  /** 통계 업데이트 */
  private async updateStats(isConversion: boolean, productId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { price: true }
    });
    
    await prisma.recommendationStats.upsert({
      where: { date_hour: { date: today, hour: new Date().getHours() } },
      update: {
        totalRecommendations: { increment: 1 },
        totalConversions: isConversion ? { increment: 1 } : undefined,
        totalRevenue: isConversion && product ? { increment: product.price } : undefined,
        updatedAt: new Date()
      },
      create: {
        date: today,
        hour: new Date().getHours(),
        totalRecommendations: 1,
        totalConversions: isConversion ? 1 : 0,
        totalRevenue: isConversion && product ? product.price : new Prisma.Decimal(0),
      }
    });
  }
}

// ==========================================
// 🎯 통합 추천 엔진
// ==========================================

class UnifiedRecommendationEngine {
  private clusterEngine: BayesianClusterEngine;
  private conditionalEngine: ConditionalProbabilityEngine;
  private funnelSimulator: FunnelSimulator;
  private evEngine: ExpectedValueEngine;
  private feedbackProcessor: FeedbackProcessor;
  
  constructor() {
    this.clusterEngine = new BayesianClusterEngine();
    this.conditionalEngine = new ConditionalProbabilityEngine();
    this.funnelSimulator = new FunnelSimulator();
    this.evEngine = new ExpectedValueEngine();
    this.feedbackProcessor = new FeedbackProcessor(
      this.clusterEngine,
      this.conditionalEngine,
      this.funnelSimulator
    );
  }
  
  /** 초기화 (서버 시작 시 호출) */
  async initialize(): Promise<void> {
    await this.clusterEngine.loadPriors();
  }
  
  /** 메인 추천 함수 */
  async recommend(
    userId: string | null,
    options: {
      topK?: number;
      categoryId?: string;
      excludeProductIds?: string[];
      context?: { hour?: number; stockLevel?: number; discountRate?: number };
    } = {}
  ): Promise<RecommendationResult[]> {
    const {
      topK = CONFIG.DEFAULT_TOP_K,
      categoryId,
      excludeProductIds = [],
      context = {}
    } = options;
    
    // Step 1: 사용자 클러스터 분류
    let cluster: UserClusterType = "UNKNOWN";
    let clusterConfidence = 0;
    let firstProductId: string | null = null;
    let isColdStart = true;
    
    if (userId) {
      const userCluster = await prisma.userCluster.findUnique({
        where: { userId }
      });
      
      if (userCluster) {
        cluster = userCluster.cluster;
        clusterConfidence = userCluster.confidence;
        firstProductId = userCluster.firstProductId;
        isColdStart = !userCluster.firstProductId;
      } else {
        // 새 사용자 클러스터 생성 시도
        const result = await this.clusterEngine.updateUserCluster(userId);
        cluster = result.cluster;
        clusterConfidence = result.confidence;
      }
    }
    
    // Step 2: 후보 상품 조회
    const candidates = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: excludeProductIds },
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
        _count: { select: { purchases: true, reviews: true } }
      },
      take: 100, // 초기 후보 제한
    });
    
    if (candidates.length === 0) {
      return [];
    }
    
    // Step 3: 배치로 필요한 데이터 미리 로드 (N+1 문제 해결)
    const candidateIds = candidates.map(c => c.id);

    // 3.1 조건부 확률 배치 계산
    let conditionalProbMap = new Map<string, { personal: number; group: number; combined: number }>();
    if (firstProductId && !isColdStart) {
      conditionalProbMap = await this.conditionalEngine.computeBatchConditionalProbabilities(
        firstProductId,
        candidateIds,
        cluster
      );
    }

    // 3.2 퍼널 전환율 배치 계산
    const funnelMap = await this.funnelSimulator.simulateFunnelBatch(
      candidateIds,
      cluster,
      context
    );

    // Step 4: 각 후보에 대해 점수 계산 (DB 쿼리 없이 메모리에서)
    const scoredCandidates: RecommendationResult[] = [];
    const recommendedProductIds: string[] = [];

    for (const product of candidates) {
      // 조건부 확률 조회 (미리 로드된 데이터에서)
      let conditionalProb = 0.1; // 기본값

      if (firstProductId && !isColdStart) {
        const prob = conditionalProbMap.get(product.id);
        conditionalProb = prob?.combined || 0.1;
      } else if (isColdStart) {
        // 콜드 스타트: 카테고리 기반 또는 인기도 기반
        conditionalProb = 0.1 + (product._count.purchases / 1000) * 0.1;

        // 탐색 확률 추가
        if (Math.random() < CONFIG.COLD_START_EXPLORE_RATE) {
          conditionalProb += 0.1;
        }
      }

      // 퍼널 전환율 조회 (미리 로드된 데이터에서)
      const funnel = funnelMap.get(product.id) || {
        conversionRate: DEFAULT_FUNNEL_RATES[cluster].action,
        stageRates: DEFAULT_FUNNEL_RATES[cluster]
      };

      // 베이지안 스무딩
      const smoothedProb = this.evEngine.applyBayesianSmoothing(
        conditionalProb * funnel.conversionRate
      );

      // 기댓값 계산
      const productValue = Number(product.price);
      const expectedValue = this.evEngine.calculateExpectedValue(
        smoothedProb,
        productValue,
        0 // 추천 비용 (추후 확장)
      );

      // 추천 여부 결정
      if (this.evEngine.shouldRecommend(expectedValue)) {
        // 추천 이유 생성
        const reasoning = this.generateReasoning(
          cluster,
          conditionalProb,
          funnel.conversionRate,
          isColdStart
        );

        scoredCandidates.push({
          productId: product.id,
          productName: product.title,
          productImage: product.images?.[0] || null,
          productPrice: productValue,
          probability: smoothedProb,
          expectedValue,
          cluster,
          clusterConfidence,
          funnelConversion: funnel.conversionRate,
          reasoning,
          context: {
            isPersonalized: !isColdStart && !!userId,
            dataPoints: product._count.purchases,
            isColdStart,
          }
        });

        recommendedProductIds.push(product.id);
      }
    }

    // Step 5: 퍼널 노출 배치 기록 (DB 쓰기를 한 번에)
    if (userId && recommendedProductIds.length > 0) {
      await this.funnelSimulator.recordExposureBatch(recommendedProductIds, cluster);
    }
    
    // Step 4: 기댓값 기준 정렬 및 상위 K개 반환
    const ranked = this.evEngine.rankRecommendations(
      scoredCandidates.map(c => ({
        productId: c.productId,
        expectedValue: c.expectedValue,
        probability: c.probability
      }))
    );
    
    const topProducts = ranked.slice(0, topK).map(r => r.productId);
    
    return scoredCandidates
      .filter(c => topProducts.includes(c.productId))
      .sort((a, b) => b.expectedValue - a.expectedValue);
  }
  
  /** 추천 이유 생성 */
  private generateReasoning(
    cluster: UserClusterType,
    conditionalProb: number,
    funnelRate: number,
    isColdStart: boolean
  ): string {
    const clusterDescriptions: Record<UserClusterType, string> = {
      PRICE_SENSITIVE: "가격 대비 가치를 중시하는",
      CONVENIENCE_FOCUSED: "편리함을 선호하는",
      QUALITY_SEEKER: "품질을 추구하는",
      BRAND_LOYAL: "브랜드 충성도가 높은",
      IMPULSE_BUYER: "트렌드에 민감한",
      UNKNOWN: "신규",
    };
    
    if (isColdStart) {
      return `${clusterDescriptions[cluster]} 사용자를 위한 인기 상품 추천`;
    }
    
    const probPercent = (conditionalProb * 100).toFixed(1);
    const funnelPercent = (funnelRate * 100).toFixed(1);
    
    return `${clusterDescriptions[cluster]} 사용자의 구매 패턴 분석 (전환 확률: ${probPercent}%, 퍼널 전환율: ${funnelPercent}%)`;
  }
  
  /** 글로벌 추천 (비로그인 사용자용) */
  async getGlobalRecommendations(
    topK: number = CONFIG.DEFAULT_TOP_K,
    categoryId?: string
  ): Promise<RecommendationResult[]> {
    return this.recommend(null, { topK, categoryId });
  }
  
  /** 카테고리 기반 추천 */
  async getCategoryRecommendations(
    userId: string | null,
    categoryId: string,
    topK: number = CONFIG.DEFAULT_TOP_K
  ): Promise<RecommendationResult[]> {
    return this.recommend(userId, { topK, categoryId });
  }
  
  /** 피드백 처리 (외부 호출용) */
  async processFeedback(
    userId: string,
    productId: string,
    feedbackType: RecommendationFeedbackType,
    context?: Record<string, unknown>
  ): Promise<void> {
    await this.feedbackProcessor.processFeedback(userId, productId, feedbackType, context);
  }
  
  /** 통계 조회 */
  async getStatistics(days: number = 7): Promise<{
    totalRecommendations: number;
    totalConversions: number;
    conversionRate: number;
    totalRevenue: number;
    roi: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const stats = await prisma.recommendationStats.aggregate({
      where: { date: { gte: startDate } },
      _sum: {
        totalRecommendations: true,
        totalConversions: true,
        totalRevenue: true,
        totalCost: true,
      }
    });
    
    const totalRecs = stats._sum.totalRecommendations || 0;
    const totalConv = stats._sum.totalConversions || 0;
    const totalRev = Number(stats._sum.totalRevenue || 0);
    const totalCost = Number(stats._sum.totalCost || 0);
    
    return {
      totalRecommendations: totalRecs,
      totalConversions: totalConv,
      conversionRate: safeDivide(totalConv, totalRecs),
      totalRevenue: totalRev,
      roi: safeDivide(totalRev - totalCost, totalCost),
    };
  }
  
  /** 클러스터 통계 조회 */
  async getClusterStatistics(): Promise<Record<UserClusterType, {
    userCount: number;
    avgConfidence: number;
  }>> {
    const clusterStats = await prisma.userCluster.groupBy({
      by: ["cluster"],
      _count: { cluster: true },
      _avg: { confidence: true }
    });
    
    const result: Record<UserClusterType, { userCount: number; avgConfidence: number }> = {} as Record<UserClusterType, { userCount: number; avgConfidence: number }>;
    
    for (const cluster of [...CLUSTER_NAMES, "UNKNOWN" as UserClusterType]) {
      const stat = clusterStats.find(s => s.cluster === cluster);
      result[cluster] = {
        userCount: stat?._count.cluster || 0,
        avgConfidence: stat?._avg.confidence || 0
      };
    }
    
    return result;
  }
}

// ==========================================
// 🌐 싱글톤 인스턴스
// ==========================================

let engineInstance: UnifiedRecommendationEngine | null = null;

async function getEngine(): Promise<UnifiedRecommendationEngine> {
  if (!engineInstance) {
    engineInstance = new UnifiedRecommendationEngine();
    await engineInstance.initialize();
  }
  return engineInstance;
}

// ==========================================
// 🚀 API 핸들러
// ==========================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "personal";
    const categoryId = searchParams.get("categoryId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const excludeIds = searchParams.get("excludeIds")?.split(",").filter(Boolean) || [];
    
    const engine = await getEngine();
    
    let recommendations: RecommendationResult[];
    let cluster: UserClusterType | null = null;
    let clusterConfidence = 0;
    
    switch (type) {
      case "global":
        recommendations = await engine.getGlobalRecommendations(limit, categoryId);
        break;
        
      case "category":
        if (!categoryId) {
          return NextResponse.json(
            { success: false, error: "categoryId가 필요합니다." },
            { status: 400 }
          );
        }
        recommendations = await engine.getCategoryRecommendations(userId, categoryId, limit);
        break;
        
      case "personal":
      default:
        recommendations = await engine.recommend(userId, {
          topK: limit,
          categoryId,
          excludeProductIds: excludeIds,
        });
        
        if (userId) {
          const userCluster = await prisma.userCluster.findUnique({
            where: { userId }
          });
          cluster = userCluster?.cluster || null;
          clusterConfidence = userCluster?.confidence || 0;
        }
        break;
    }
    
    const response: RecommendationResponse = {
      success: true,
      recommendations,
      userId,
      cluster,
      clusterConfidence,
      stats: {
        totalCandidates: recommendations.length,
        filteredCount: recommendations.length,
        processingTimeMs: Date.now() - startTime,
      },
      meta: {
        algorithm: "bayesian-auto-evolution-v2",
        version: "2.0.0",
        timestamp: new Date().toISOString(),
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("[Recommendations API Error]", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "추천을 생성하는 중 오류가 발생했습니다.",
        recommendations: [],
        userId: null,
        cluster: null,
        clusterConfidence: 0,
        stats: {
          totalCandidates: 0,
          filteredCount: 0,
          processingTimeMs: Date.now() - startTime,
        },
        meta: {
          algorithm: "bayesian-auto-evolution-v2",
          version: "2.0.0",
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { action, productId, feedbackType, context } = body;
    
    const engine = await getEngine();
    
    switch (action) {
      case "feedback":
        if (!productId || !feedbackType) {
          return NextResponse.json(
            { success: false, error: "productId와 feedbackType이 필요합니다." },
            { status: 400 }
          );
        }
        
        await engine.processFeedback(
          session.user.id,
          productId,
          feedbackType as RecommendationFeedbackType,
          context
        );
        
        return NextResponse.json({
          success: true,
          message: "피드백이 처리되었습니다.",
          processingTimeMs: Date.now() - startTime,
        });
        
      case "stats":
        const days = body.days || 7;
        const stats = await engine.getStatistics(days);
        
        return NextResponse.json({
          success: true,
          stats,
          processingTimeMs: Date.now() - startTime,
        });
        
      case "cluster-stats":
        const clusterStats = await engine.getClusterStatistics();
        
        return NextResponse.json({
          success: true,
          clusterStats,
          processingTimeMs: Date.now() - startTime,
        });
        
      default:
        return NextResponse.json(
          { success: false, error: "알 수 없는 액션입니다." },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error("[Recommendations API POST Error]", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "요청 처리 중 오류가 발생했습니다.",
        processingTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
