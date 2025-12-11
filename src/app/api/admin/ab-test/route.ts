/**
 * A/B 테스트 관리자 API
 * GET /api/admin/ab-test - 대시보드용 통계 데이터
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

    // 전체 통계 요약
    const [
      totalExperiments,
      runningExperiments,
      completedExperiments,
      totalAssignments,
      totalEvents,
      statusCounts,
      recentExperiments,
      topPerformers,
    ] = await Promise.all([
      // 전체 실험 수
      prisma.experiment.count(),
      
      // 실행 중인 실험 수
      prisma.experiment.count({
        where: { status: ExperimentStatus.RUNNING },
      }),
      
      // 완료된 실험 수
      prisma.experiment.count({
        where: { status: ExperimentStatus.COMPLETED },
      }),
      
      // 전체 할당 수
      prisma.experimentAssignment.count(),
      
      // 전체 이벤트 수
      prisma.experimentEvent.count(),
      
      // 상태별 실험 수
      prisma.experiment.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      
      // 최근 실험 (최근 5개)
      prisma.experiment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          variants: {
            select: {
              id: true,
              name: true,
              isControl: true,
              totalUsers: true,
              conversions: true,
              conversionRate: true,
            },
          },
          _count: {
            select: { assignments: true },
          },
        },
      }),
      
      // 성과 좋은 변형 (전환율 기준 상위 5개)
      prisma.experimentVariant.findMany({
        where: {
          totalUsers: { gte: 100 },
          isControl: false,
        },
        orderBy: { conversionRate: 'desc' },
        take: 5,
        include: {
          experiment: {
            select: { id: true, name: true, status: true },
          },
        },
      }),
    ]);

    // 일별 이벤트 추이 (최근 7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyEvents = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE("timestamp") as date,
        COUNT(*) as count
      FROM "ExperimentEvent"
      WHERE "timestamp" >= ${sevenDaysAgo}
      GROUP BY DATE("timestamp")
      ORDER BY date ASC
    `;

    // 일별 전환 추이 (최근 7일)
    const dailyConversions = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE("convertedAt") as date,
        COUNT(*) as count
      FROM "ExperimentAssignment"
      WHERE "converted" = true
        AND "convertedAt" >= ${sevenDaysAgo}
      GROUP BY DATE("convertedAt")
      ORDER BY date ASC
    `;

    // 상태별 카운트 맵 생성
    const statusCountMap: Record<string, number> = {};
    for (const item of statusCounts) {
      statusCountMap[item.status] = item._count._all;
    }

    return NextResponse.json({
      summary: {
        totalExperiments,
        runningExperiments,
        completedExperiments,
        draftExperiments: statusCountMap[ExperimentStatus.DRAFT] || 0,
        pausedExperiments: statusCountMap[ExperimentStatus.PAUSED] || 0,
        archivedExperiments: statusCountMap[ExperimentStatus.ARCHIVED] || 0,
        totalAssignments,
        totalEvents,
        avgAssignmentsPerExperiment: totalExperiments > 0 
          ? Math.round(totalAssignments / totalExperiments) 
          : 0,
      },
      recentExperiments,
      topPerformers,
      trends: {
        dailyEvents: dailyEvents.map(e => ({
          date: e.date,
          count: Number(e.count),
        })),
        dailyConversions: dailyConversions.map(c => ({
          date: c.date,
          count: Number(c.count),
        })),
      },
    });
  } catch (error) {
    console.error('[Admin AB Test API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
