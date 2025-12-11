/**
 * A/B 테스트 분석 API
 * GET /api/admin/ab-test/analytics - 상세 분석 데이터
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ABTestService } from '@/lib/ab-test';
import { ExperimentStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, all

    if (!experimentId) {
      return NextResponse.json(
        { error: 'experimentId is required' },
        { status: 400 }
      );
    }

    // 기간 계산
    let startDate: Date | null = null;
    if (period !== 'all') {
      const days = parseInt(period.replace('d', '')) || 7;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    // 기본 통계
    const stats = await ABTestService.getExperimentStats(experimentId);

    // 시간대별 전환 추이
    const dateFilter = startDate ? { gte: startDate } : {};
    
    const hourlyConversions = await prisma.$queryRaw<Array<{
      hour: number;
      variant_id: string;
      conversions: bigint;
    }>>`
      SELECT 
        EXTRACT(HOUR FROM "convertedAt") as hour,
        "variantId" as variant_id,
        COUNT(*) as conversions
      FROM "ExperimentAssignment"
      WHERE "experimentId" = ${experimentId}
        AND "converted" = true
        ${startDate ? prisma.$queryRaw`AND "convertedAt" >= ${startDate}` : prisma.$queryRaw``}
      GROUP BY EXTRACT(HOUR FROM "convertedAt"), "variantId"
      ORDER BY hour ASC
    `;

    // 일별 사용자 할당 추이
    const dailyAssignments = await prisma.$queryRaw<Array<{
      date: string;
      variant_id: string;
      count: bigint;
    }>>`
      SELECT 
        DATE("assignedAt") as date,
        "variantId" as variant_id,
        COUNT(*) as count
      FROM "ExperimentAssignment"
      WHERE "experimentId" = ${experimentId}
        ${startDate ? prisma.$queryRaw`AND "assignedAt" >= ${startDate}` : prisma.$queryRaw``}
      GROUP BY DATE("assignedAt"), "variantId"
      ORDER BY date ASC
    `;

    // 이벤트 유형별 분포
    const eventTypeDistribution = await prisma.experimentEvent.groupBy({
      by: ['eventType', 'variantId'],
      where: {
        experimentId,
        ...(startDate ? { timestamp: { gte: startDate } } : {}),
      },
      _count: { _all: true },
      _sum: { eventValue: true },
    });

    // 누적 전환율 추이
    const cumulativeConversions = await prisma.$queryRaw<Array<{
      date: string;
      variant_id: string;
      cumulative_users: bigint;
      cumulative_conversions: bigint;
    }>>`
      SELECT 
        DATE("assignedAt") as date,
        "variantId" as variant_id,
        SUM(COUNT(*)) OVER (PARTITION BY "variantId" ORDER BY DATE("assignedAt")) as cumulative_users,
        SUM(SUM(CASE WHEN "converted" = true THEN 1 ELSE 0 END)) OVER (PARTITION BY "variantId" ORDER BY DATE("assignedAt")) as cumulative_conversions
      FROM "ExperimentAssignment"
      WHERE "experimentId" = ${experimentId}
        ${startDate ? prisma.$queryRaw`AND "assignedAt" >= ${startDate}` : prisma.$queryRaw``}
      GROUP BY DATE("assignedAt"), "variantId"
      ORDER BY date ASC
    `;

    // 통계적 유의성 도달 예측
    const significancePrediction = calculateSignificancePrediction(stats, experiment.minSampleSize);

    // 변형별 메타데이터
    const variantMetadata = await Promise.all(
      experiment.variants.map(async (variant) => {
        const assignmentCount = await prisma.experimentAssignment.count({
          where: { variantId: variant.id },
        });
        
        const eventCount = await prisma.experimentEvent.count({
          where: { variantId: variant.id },
        });

        const avgEventValue = await prisma.experimentEvent.aggregate({
          where: { 
            variantId: variant.id,
            eventValue: { not: null },
          },
          _avg: { eventValue: true },
        });

        return {
          variantId: variant.id,
          variantName: variant.name,
          isControl: variant.isControl,
          totalAssignments: assignmentCount,
          totalEvents: eventCount,
          avgEventValue: avgEventValue._avg.eventValue || 0,
        };
      })
    );

    return NextResponse.json({
      experiment: {
        id: experiment.id,
        name: experiment.name,
        description: experiment.description,
        hypothesis: experiment.hypothesis,
        status: experiment.status,
        targetType: experiment.targetType,
        targetKey: experiment.targetKey,
        trafficPercentage: experiment.trafficPercentage,
        primaryMetric: experiment.primaryMetric,
        secondaryMetrics: experiment.secondaryMetrics,
        minSampleSize: experiment.minSampleSize,
        confidenceLevel: experiment.confidenceLevel,
        startDate: experiment.startDate,
        endDate: experiment.endDate,
        createdAt: experiment.createdAt,
        createdBy: experiment.createdBy,
      },
      stats,
      variantMetadata,
      trends: {
        hourlyConversions: hourlyConversions.map(h => ({
          hour: Number(h.hour),
          variantId: h.variant_id,
          conversions: Number(h.conversions),
        })),
        dailyAssignments: dailyAssignments.map(d => ({
          date: d.date,
          variantId: d.variant_id,
          count: Number(d.count),
        })),
        cumulativeConversions: cumulativeConversions.map(c => ({
          date: c.date,
          variantId: c.variant_id,
          cumulativeUsers: Number(c.cumulative_users),
          cumulativeConversions: Number(c.cumulative_conversions),
          cumulativeRate: Number(c.cumulative_users) > 0 
            ? (Number(c.cumulative_conversions) / Number(c.cumulative_users)) * 100 
            : 0,
        })),
      },
      eventTypeDistribution: eventTypeDistribution.map(e => ({
        eventType: e.eventType,
        variantId: e.variantId,
        count: e._count._all,
        totalValue: e._sum.eventValue || 0,
      })),
      significancePrediction,
    });
  } catch (error) {
    console.error('[Admin AB Test Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 통계적 유의성 도달 예측
function calculateSignificancePrediction(
  stats: Array<{
    variantId: string;
    variantName: string;
    isControl: boolean;
    users: number;
    conversions: number;
    conversionRate: number;
    confidence?: number;
  }>,
  minSampleSize: number
): {
  hasEnoughSample: boolean;
  currentSampleSize: number;
  requiredSampleSize: number;
  estimatedDaysToSignificance: number | null;
  currentConfidence: number;
} {
  const totalUsers = stats.reduce((sum, s) => sum + s.users, 0);
  const maxConfidence = Math.max(...stats.filter(s => !s.isControl).map(s => s.confidence || 0));
  
  // 일평균 사용자 수 추정 (단순화: 현재 사용자 수를 7일로 나눔)
  const avgDailyUsers = totalUsers / 7;
  
  // 최소 샘플 사이즈 도달까지 남은 일수 계산
  const remainingSamples = Math.max(0, minSampleSize - totalUsers);
  const estimatedDays = avgDailyUsers > 0 ? Math.ceil(remainingSamples / avgDailyUsers) : null;

  return {
    hasEnoughSample: totalUsers >= minSampleSize,
    currentSampleSize: totalUsers,
    requiredSampleSize: minSampleSize,
    estimatedDaysToSignificance: estimatedDays,
    currentConfidence: maxConfidence,
  };
}
