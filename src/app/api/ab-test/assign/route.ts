/**
 * A/B 테스트 할당 API
 * POST /api/ab-test/assign
 */

import { NextRequest, NextResponse } from 'next/server';
import { ABTestService } from '@/lib/ab-test';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { experimentKey, userId, sessionId } = body;

    if (!experimentKey) {
      return NextResponse.json(
        { error: 'experimentKey is required' },
        { status: 400 }
      );
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId or sessionId is required' },
        { status: 400 }
      );
    }

    const assignment = await ABTestService.assignVariant(
      experimentKey,
      userId,
      sessionId
    );

    return NextResponse.json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error('[AB Test Assign API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
