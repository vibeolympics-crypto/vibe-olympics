/**
 * A/B 테스트 이벤트 추적 API
 * POST /api/ab-test/track
 */

import { NextRequest, NextResponse } from 'next/server';
import { ABTestService } from '@/lib/ab-test';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      experimentId, 
      variantId, 
      eventType, 
      userId, 
      sessionId, 
      eventValue, 
      metadata 
    } = body;

    if (!experimentId || !variantId || !eventType) {
      return NextResponse.json(
        { error: 'experimentId, variantId, and eventType are required' },
        { status: 400 }
      );
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId or sessionId is required' },
        { status: 400 }
      );
    }

    const success = await ABTestService.trackEvent(
      experimentId,
      variantId,
      eventType,
      userId,
      sessionId,
      eventValue,
      metadata
    );

    return NextResponse.json({
      success,
    });
  } catch (error) {
    console.error('[AB Test Track API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
