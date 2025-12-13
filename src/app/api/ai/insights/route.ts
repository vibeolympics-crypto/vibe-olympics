/**
 * AI 인사이트 리포트 API
 * 자동 비즈니스 인사이트 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generateInsightReport,
  generateDemoBusinessData,
  InsightReport,
  BusinessData,
} from '@/lib/ai-insights';

// 캐시된 리포트 (데모용)
let cachedReport: InsightReport | null = null;
let lastGeneratedAt: Date | null = null;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 관리자 또는 판매자만 접근 가능
    const userRole = session?.user?.role ?? '';
    if (!session?.user || !['ADMIN', 'SELLER'].includes(userRole)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'week') as 'day' | 'week' | 'month' | 'quarter';
    const refresh = searchParams.get('refresh') === 'true';

    // 캐시 확인 (5분 이내면 캐시 사용)
    const now = new Date();
    const cacheExpired = !lastGeneratedAt || 
      (now.getTime() - lastGeneratedAt.getTime()) > 5 * 60 * 1000;

    if (!refresh && cachedReport && !cacheExpired) {
      return NextResponse.json({
        success: true,
        data: cachedReport,
        cached: true,
        generatedAt: lastGeneratedAt?.toISOString(),
      });
    }

    // 데모 데이터 생성 (실제 환경에서는 DB에서 데이터 조회)
    const businessData: BusinessData = generateDemoBusinessData();

    // 인사이트 리포트 생성
    const report = await generateInsightReport(businessData, period);

    // 캐시 업데이트
    cachedReport = report;
    lastGeneratedAt = now;

    return NextResponse.json({
      success: true,
      data: report,
      cached: false,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('AI Insights error:', error);
    return NextResponse.json(
      { error: 'AI 인사이트 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 특정 데이터로 인사이트 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = session?.user?.role ?? '';
    if (!session?.user || !['ADMIN', 'SELLER'].includes(userRole)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { data, period = 'week' } = body as { data?: BusinessData; period?: 'day' | 'week' | 'month' | 'quarter' };

    // 데이터가 제공되지 않으면 데모 데이터 사용
    const businessData = data || generateDemoBusinessData();

    // 인사이트 리포트 생성
    const report = await generateInsightReport(businessData, period);

    return NextResponse.json({
      success: true,
      data: report,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Insights generation error:', error);
    return NextResponse.json(
      { error: 'AI 인사이트 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
