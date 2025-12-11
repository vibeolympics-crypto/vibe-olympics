/**
 * A/B 테스트 일괄 작업 API
 * POST /api/admin/ab-test/bulk - 여러 실험 일괄 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExperimentStatus } from '@prisma/client';

type BulkAction = 'start' | 'pause' | 'resume' | 'archive' | 'delete';

interface BulkRequest {
  action: BulkAction;
  experimentIds: string[];
}

const actionStatusMap: Record<string, ExperimentStatus> = {
  start: ExperimentStatus.RUNNING,
  pause: ExperimentStatus.PAUSED,
  resume: ExperimentStatus.RUNNING,
  archive: ExperimentStatus.ARCHIVED,
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as BulkRequest;
    const { action, experimentIds } = body;

    if (!action || !experimentIds || !Array.isArray(experimentIds)) {
      return NextResponse.json(
        { error: 'action and experimentIds are required' },
        { status: 400 }
      );
    }

    const validActions: BulkAction[] = ['start', 'pause', 'resume', 'archive', 'delete'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    let result;

    if (action === 'delete') {
      // 삭제 작업
      // 먼저 관련 데이터 삭제 (이벤트, 할당, 변형)
      await prisma.$transaction(async (tx) => {
        // 이벤트 삭제
        await tx.experimentEvent.deleteMany({
          where: { experimentId: { in: experimentIds } },
        });
        
        // 할당 삭제
        await tx.experimentAssignment.deleteMany({
          where: { experimentId: { in: experimentIds } },
        });
        
        // 변형 삭제
        await tx.experimentVariant.deleteMany({
          where: { experimentId: { in: experimentIds } },
        });
        
        // 실험 삭제
        await tx.experiment.deleteMany({
          where: { id: { in: experimentIds } },
        });
      });

      result = {
        action: 'delete',
        affectedCount: experimentIds.length,
      };
    } else {
      // 상태 변경 작업
      const newStatus = actionStatusMap[action];
      
      const updateData: Record<string, unknown> = {
        status: newStatus,
      };

      // start 액션일 때 시작일 설정
      if (action === 'start') {
        updateData.startDate = new Date();
      }

      const updateResult = await prisma.experiment.updateMany({
        where: { id: { in: experimentIds } },
        data: updateData,
      });

      result = {
        action,
        newStatus,
        affectedCount: updateResult.count,
      };
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Admin AB Test Bulk API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
