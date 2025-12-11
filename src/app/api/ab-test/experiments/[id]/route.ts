/**
 * A/B 테스트 실험 상세 API
 * GET /api/ab-test/experiments/[id] - 실험 상세 + 통계
 * PATCH /api/ab-test/experiments/[id] - 상태 변경
 * DELETE /api/ab-test/experiments/[id] - 실험 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ABTestService } from '@/lib/ab-test';
import { prisma } from '@/lib/prisma';
import { ExperimentStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 실험 상세 + 통계 조회
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const experiment = await prisma.experiment.findUnique({
      where: { id },
      include: {
        variants: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { assignments: true, events: true },
        },
      },
    });

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    // 통계 계산
    const stats = await ABTestService.getExperimentStats(id);

    // 최근 이벤트 (마지막 100개)
    const recentEvents = await prisma.experimentEvent.findMany({
      where: { experimentId: id },
      orderBy: { timestamp: 'desc' },
      take: 100,
      select: {
        id: true,
        eventType: true,
        eventValue: true,
        timestamp: true,
        variant: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      experiment,
      stats,
      recentEvents,
    });
  } catch (error) {
    console.error('[AB Test Experiment Detail API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 실험 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, winnerVariantId, conclusion } = body;

    if (!status || !Object.values(ExperimentStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

    const experiment = await ABTestService.updateExperimentStatus(
      id,
      status,
      winnerVariantId,
      conclusion
    );

    return NextResponse.json({
      success: true,
      experiment,
    });
  } catch (error) {
    console.error('[AB Test Experiment Detail API] PATCH Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 실험 삭제
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 실행 중인 실험은 삭제 불가
    const experiment = await prisma.experiment.findUnique({
      where: { id },
    });

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    if (experiment.status === ExperimentStatus.RUNNING) {
      return NextResponse.json(
        { error: 'Cannot delete a running experiment. Please pause or complete it first.' },
        { status: 400 }
      );
    }

    await prisma.experiment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[AB Test Experiment Detail API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
