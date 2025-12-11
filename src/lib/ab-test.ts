/**
 * A/B 테스트 서비스
 * - 실험 할당
 * - 이벤트 추적
 * - 통계 계산
 */

import { prisma } from '@/lib/prisma';
import { ExperimentStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';

// ============================================
// 타입 정의
// ============================================

export interface ExperimentConfig {
  [key: string]: string | number | boolean | object;
}

export interface VariantAssignment {
  experimentId: string;
  experimentName: string;
  variantId: string;
  variantName: string;
  isControl: boolean;
  config: ExperimentConfig;
}

export interface ExperimentStats {
  variantId: string;
  variantName: string;
  isControl: boolean;
  users: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenuePerUser: number;
  improvement?: number; // 대조군 대비 개선율
  confidence?: number;  // 통계적 유의성
  isWinner?: boolean;
}

// ============================================
// A/B 테스트 서비스 클래스
// ============================================

export class ABTestService {
  /**
   * 실험 할당 - 사용자에게 변형 배정
   */
  static async assignVariant(
    experimentKey: string,
    userId?: string,
    sessionId?: string
  ): Promise<VariantAssignment | null> {
    // 식별자 확인
    if (!userId && !sessionId) {
      console.warn('[ABTest] No user or session ID provided');
      return null;
    }

    // 실험 조회
    const experiment = await prisma.experiment.findFirst({
      where: {
        targetKey: experimentKey,
        status: ExperimentStatus.RUNNING,
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
        ],
      },
      include: {
        variants: true,
      },
    });

    if (!experiment) {
      return null;
    }

    // 트래픽 필터링
    if (experiment.trafficPercentage < 100) {
      const hash = this.hashIdentifier(userId || sessionId || '');
      const hashPercentage = (hash % 100) + 1;
      if (hashPercentage > experiment.trafficPercentage) {
        return null; // 실험 대상 아님
      }
    }

    // 기존 할당 확인
    const existingAssignment = await prisma.experimentAssignment.findFirst({
      where: {
        experimentId: experiment.id,
        OR: [
          { userId: userId || undefined },
          { sessionId: sessionId || undefined },
        ],
      },
      include: {
        variant: true,
      },
    });

    if (existingAssignment) {
      return {
        experimentId: experiment.id,
        experimentName: experiment.name,
        variantId: existingAssignment.variantId,
        variantName: existingAssignment.variant.name,
        isControl: existingAssignment.variant.isControl,
        config: existingAssignment.variant.config as ExperimentConfig,
      };
    }

    // 새 할당 - 가중치 기반 랜덤 선택
    const variant = this.selectVariantByWeight(experiment.variants);

    if (!variant) {
      return null;
    }

    // 할당 저장
    await prisma.experimentAssignment.create({
      data: {
        experimentId: experiment.id,
        variantId: variant.id,
        userId: userId || null,
        sessionId: userId ? null : sessionId,
      },
    });

    // 변형 통계 업데이트
    await prisma.experimentVariant.update({
      where: { id: variant.id },
      data: { totalUsers: { increment: 1 } },
    });

    return {
      experimentId: experiment.id,
      experimentName: experiment.name,
      variantId: variant.id,
      variantName: variant.name,
      isControl: variant.isControl,
      config: variant.config as ExperimentConfig,
    };
  }

  /**
   * 이벤트 추적
   */
  static async trackEvent(
    experimentId: string,
    variantId: string,
    eventType: string,
    userId?: string,
    sessionId?: string,
    eventValue?: number,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      // 이벤트 기록
      await prisma.experimentEvent.create({
        data: {
          experimentId,
          variantId,
          userId: userId || null,
          sessionId: sessionId || null,
          eventType,
          eventValue: eventValue || null,
          metadata: (metadata || {}) as Prisma.InputJsonValue,
        },
      });

      // 전환 이벤트인 경우 할당 업데이트
      if (eventType === 'conversion') {
        await prisma.experimentAssignment.updateMany({
          where: {
            experimentId,
            variantId,
            OR: [
              { userId: userId || undefined },
              { sessionId: sessionId || undefined },
            ],
            converted: false,
          },
          data: {
            converted: true,
            convertedAt: new Date(),
          },
        });

        // 변형 통계 업데이트
        await prisma.experimentVariant.update({
          where: { id: variantId },
          data: {
            conversions: { increment: 1 },
          },
        });
      }

      // 매출 이벤트인 경우
      if (eventType === 'revenue' && eventValue) {
        await prisma.experimentVariant.update({
          where: { id: variantId },
          data: {
            totalRevenue: { increment: eventValue },
          },
        });
      }

      return true;
    } catch (error) {
      console.error('[ABTest] Failed to track event:', error);
      return false;
    }
  }

  /**
   * 실험 통계 계산
   */
  static async getExperimentStats(experimentId: string): Promise<ExperimentStats[]> {
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: {
          include: {
            _count: {
              select: { assignments: true },
            },
          },
        },
      },
    });

    if (!experiment) {
      return [];
    }

    const stats: ExperimentStats[] = [];
    let controlStats: ExperimentStats | null = null;

    for (const variant of experiment.variants) {
      const conversionRate = variant.totalUsers > 0
        ? (variant.conversions / variant.totalUsers) * 100
        : 0;
      
      const revenuePerUser = variant.totalUsers > 0
        ? Number(variant.totalRevenue) / variant.totalUsers
        : 0;

      const variantStats: ExperimentStats = {
        variantId: variant.id,
        variantName: variant.name,
        isControl: variant.isControl,
        users: variant.totalUsers,
        conversions: variant.conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        revenue: Number(variant.totalRevenue),
        revenuePerUser: Math.round(revenuePerUser * 100) / 100,
      };

      if (variant.isControl) {
        controlStats = variantStats;
      }

      stats.push(variantStats);
    }

    // 대조군 대비 개선율 계산
    if (controlStats) {
      for (const stat of stats) {
        if (!stat.isControl && controlStats.conversionRate > 0) {
          stat.improvement = Math.round(
            ((stat.conversionRate - controlStats.conversionRate) / controlStats.conversionRate) * 10000
          ) / 100;

          // 통계적 유의성 계산 (Z-test)
          stat.confidence = this.calculateConfidence(
            controlStats.users,
            controlStats.conversions,
            stat.users,
            stat.conversions
          );

          // 승자 판정 (95% 신뢰수준, 개선율 양수)
          stat.isWinner = stat.confidence >= 95 && stat.improvement > 0;
        }
      }
    }

    return stats;
  }

  /**
   * 실험 목록 조회
   */
  static async listExperiments(
    status?: ExperimentStatus,
    page = 1,
    limit = 10
  ) {
    const where: Prisma.ExperimentWhereInput = status ? { status } : {};

    const [experiments, total] = await Promise.all([
      prisma.experiment.findMany({
        where,
        include: {
          variants: true,
          _count: {
            select: { assignments: true, events: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.experiment.count({ where }),
    ]);

    return {
      experiments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 실험 생성
   */
  static async createExperiment(data: {
    name: string;
    description?: string;
    hypothesis?: string;
    targetType: string;
    targetKey: string;
    trafficPercentage?: number;
    primaryMetric?: string;
    secondaryMetrics?: string[];
    minSampleSize?: number;
    confidenceLevel?: number;
    variants: {
      name: string;
      description?: string;
      isControl: boolean;
      weight: number;
      config: ExperimentConfig;
    }[];
    createdById?: string;
  }) {
    // 가중치 합계 검증
    const totalWeight = data.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new Error(`Variant weights must sum to 100, got ${totalWeight}`);
    }

    // 대조군 검증
    const hasControl = data.variants.some(v => v.isControl);
    if (!hasControl) {
      throw new Error('At least one variant must be marked as control');
    }

    return prisma.experiment.create({
      data: {
        name: data.name,
        description: data.description,
        hypothesis: data.hypothesis,
        targetType: data.targetType,
        targetKey: data.targetKey,
        trafficPercentage: data.trafficPercentage ?? 100,
        primaryMetric: data.primaryMetric ?? 'conversion',
        secondaryMetrics: data.secondaryMetrics ?? [],
        minSampleSize: data.minSampleSize ?? 1000,
        confidenceLevel: data.confidenceLevel ?? 0.95,
        createdById: data.createdById,
        variants: {
          create: data.variants,
        },
      },
      include: {
        variants: true,
      },
    });
  }

  /**
   * 실험 상태 변경
   */
  static async updateExperimentStatus(
    experimentId: string,
    status: ExperimentStatus,
    winnerVariantId?: string,
    conclusion?: string
  ) {
    const updateData: Prisma.ExperimentUpdateInput = { status };

    if (status === ExperimentStatus.RUNNING) {
      updateData.startDate = new Date();
    }

    if (status === ExperimentStatus.COMPLETED) {
      updateData.endDate = new Date();
      if (winnerVariantId) {
        updateData.winnerVariantId = winnerVariantId;
      }
      if (conclusion) {
        updateData.conclusion = conclusion;
      }
    }

    // 전환율 갱신
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variants: true },
    });

    if (experiment) {
      for (const variant of experiment.variants) {
        const conversionRate = variant.totalUsers > 0
          ? variant.conversions / variant.totalUsers
          : 0;
        
        await prisma.experimentVariant.update({
          where: { id: variant.id },
          data: { conversionRate },
        });
      }
    }

    return prisma.experiment.update({
      where: { id: experimentId },
      data: updateData,
      include: { variants: true },
    });
  }

  // ============================================
  // Private 헬퍼 함수
  // ============================================

  /**
   * 가중치 기반 변형 선택
   */
  private static selectVariantByWeight(
    variants: { id: string; name: string; isControl: boolean; weight: number; config: Prisma.JsonValue }[]
  ) {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant;
      }
    }

    return variants[0]; // 폴백
  }

  /**
   * 식별자 해시 (일관된 할당용)
   */
  private static hashIdentifier(identifier: string): number {
    const hash = crypto.createHash('md5').update(identifier).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * 통계적 유의성 계산 (Z-test)
   */
  private static calculateConfidence(
    controlN: number,
    controlConversions: number,
    variantN: number,
    variantConversions: number
  ): number {
    if (controlN === 0 || variantN === 0) return 0;

    const pControl = controlConversions / controlN;
    const pVariant = variantConversions / variantN;
    
    // 풀링된 비율
    const pPooled = (controlConversions + variantConversions) / (controlN + variantN);
    
    // 표준 오차
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1/controlN + 1/variantN));
    
    if (se === 0) return 0;
    
    // Z 점수
    const z = Math.abs(pVariant - pControl) / se;
    
    // Z 점수를 신뢰 수준으로 변환 (근사값)
    // z=1.645 -> 90%, z=1.96 -> 95%, z=2.576 -> 99%
    if (z >= 2.576) return 99;
    if (z >= 1.96) return 95;
    if (z >= 1.645) return 90;
    if (z >= 1.28) return 80;
    
    return Math.round(this.normalCDF(z) * 200 - 100); // 대략적인 변환
  }

  /**
   * 표준 정규 분포 누적 분포 함수 (근사)
   */
  private static normalCDF(z: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
  }
}

export default ABTestService;
