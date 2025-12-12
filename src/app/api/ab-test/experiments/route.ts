/**
 * A/B 테스트 관리 API
 * GET /api/ab-test/experiments - 실험 목록
 * POST /api/ab-test/experiments - 실험 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ABTestService } from '@/lib/ab-test';
import { ExperimentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// 실험 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 관리자만 접근 가능
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ExperimentStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await ABTestService.listExperiments(
      status || undefined,
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[AB Test Experiments API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 실험 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 관리자만 접근 가능
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.name || !body.targetType || !body.targetKey || !body.variants) {
      return NextResponse.json(
        { error: 'name, targetType, targetKey, and variants are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.variants) || body.variants.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 variants are required' },
        { status: 400 }
      );
    }

    const experiment = await ABTestService.createExperiment({
      ...body,
      createdById: session.user?.id,
    });

    return NextResponse.json({
      success: true,
      experiment,
    });
  } catch (error) {
    console.error('[AB Test Experiments API] POST Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
