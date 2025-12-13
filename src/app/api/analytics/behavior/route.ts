/**
 * 사용자 행동 분석 API
 * 히트맵, 클릭 추적, 세션 분석
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  ClickEvent,
  ScrollEvent,
  SessionData,
  PageVisit,
  generateBehaviorAnalytics,
  generateHeatmap,
  analyzeClickAreas,
  analyzeScrollDepth,
  analyzeUserFlow,
  filterSessionsByPeriod,
  groupSessionsByHour,
  groupSessionsByDay,
  exportAnalyticsToCSV,
} from '@/lib/behavior-tracking';

// In-memory storage for demo (production에서는 DB 사용)
const sessionsStore = new Map<string, SessionData>();
const clicksStore: ClickEvent[] = [];
const scrollsStore: ScrollEvent[] = [];

// 데모 데이터 생성
function generateDemoData(): SessionData[] {
  const pages = [
    { url: '/', title: '홈' },
    { url: '/marketplace', title: '마켓플레이스' },
    { url: '/marketplace/1', title: '상품 상세' },
    { url: '/community', title: '커뮤니티' },
    { url: '/education', title: '교육' },
    { url: '/artists', title: '아티스트' },
    { url: '/dashboard', title: '대시보드' },
  ];

  const devices: Array<'desktop' | 'tablet' | 'mobile'> = ['desktop', 'tablet', 'mobile'];
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  const sessions: SessionData[] = [];

  // 최근 30일 데이터 생성
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const startTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    startTime.setHours(Math.floor(Math.random() * 24));
    startTime.setMinutes(Math.floor(Math.random() * 60));

    const duration = Math.floor(Math.random() * 600) + 30; // 30초 ~ 10분
    const pageCount = Math.floor(Math.random() * 5) + 1;
    const bounced = pageCount === 1 && Math.random() > 0.5;

    const sessionPages: PageVisit[] = [];
    let currentTime = new Date(startTime);

    for (let j = 0; j < pageCount; j++) {
      const page = pages[Math.floor(Math.random() * pages.length)];
      const pageDuration = Math.floor(Math.random() * 120) + 10;
      
      sessionPages.push({
        url: page.url,
        title: page.title,
        enterTime: new Date(currentTime),
        exitTime: new Date(currentTime.getTime() + pageDuration * 1000),
        duration: pageDuration,
        scrollDepth: Math.floor(Math.random() * 100),
        clicks: Math.floor(Math.random() * 10),
      });

      currentTime = new Date(currentTime.getTime() + pageDuration * 1000);
    }

    const deviceType = devices[Math.floor(Math.random() * devices.length)];
    const clicks: ClickEvent[] = [];
    
    // 랜덤 클릭 생성
    const clickCount = Math.floor(Math.random() * 20) + 1;
    for (let k = 0; k < clickCount; k++) {
      const targets = ['button', 'a', 'div', 'img', 'span', 'input'];
      const targetClasses = ['btn', 'card', 'nav-link', 'product-item', 'cta-button', ''];
      
      clicks.push({
        id: `click_${i}_${k}`,
        x: Math.floor(Math.random() * 1200) + 100,
        y: Math.floor(Math.random() * 800) + 50,
        pageX: Math.floor(Math.random() * 1200) + 100,
        pageY: Math.floor(Math.random() * 2000) + 50,
        target: targets[Math.floor(Math.random() * targets.length)],
        targetClass: targetClasses[Math.floor(Math.random() * targetClasses.length)],
        timestamp: new Date(startTime.getTime() + Math.random() * duration * 1000),
        pageUrl: sessionPages[Math.floor(Math.random() * sessionPages.length)]?.url || '/',
        viewport: { width: 1920, height: 1080 },
      });
    }

    sessions.push({
      id: `session_${i}`,
      userId: Math.random() > 0.3 ? `user_${Math.floor(Math.random() * 50)}` : undefined,
      startTime,
      endTime: new Date(startTime.getTime() + duration * 1000),
      duration,
      pages: sessionPages,
      clicks,
      scrolls: [],
      device: {
        type: deviceType,
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        os: deviceType === 'mobile' ? 'iOS' : 'Windows',
        screenWidth: deviceType === 'mobile' ? 375 : deviceType === 'tablet' ? 768 : 1920,
        screenHeight: deviceType === 'mobile' ? 812 : deviceType === 'tablet' ? 1024 : 1080,
        language: Math.random() > 0.3 ? 'ko-KR' : 'en-US',
      },
      referrer: Math.random() > 0.5 ? 'https://google.com' : undefined,
      entryPage: sessionPages[0]?.url || '/',
      exitPage: sessionPages[sessionPages.length - 1]?.url,
      bounced,
    });
  }

  return sessions;
}

// 데모 데이터 캐시
let demoDataCache: SessionData[] | null = null;

function getDemoData(): SessionData[] {
  if (!demoDataCache) {
    demoDataCache = generateDemoData();
  }
  return demoDataCache;
}

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
    const type = searchParams.get('type') || 'overview';
    const period = (searchParams.get('period') || 'week') as 'day' | 'week' | 'month' | 'year';
    const pageUrl = searchParams.get('pageUrl');

    // 데모 데이터 사용
    const allSessions = getDemoData();
    const sessions = filterSessionsByPeriod(allSessions, period);

    switch (type) {
      case 'overview': {
        const analytics = generateBehaviorAnalytics(sessions);
        return NextResponse.json({
          success: true,
          data: {
            ...analytics,
            period,
            dateRange: {
              start: new Date(Date.now() - getPeriodMs(period)).toISOString(),
              end: new Date().toISOString(),
            },
          },
        });
      }

      case 'heatmap': {
        if (!pageUrl) {
          return NextResponse.json(
            { error: 'pageUrl 파라미터가 필요합니다.' },
            { status: 400 }
          );
        }

        const allClicks = sessions.flatMap((s) => s.clicks);
        const heatmap = generateHeatmap(allClicks, pageUrl);
        
        return NextResponse.json({
          success: true,
          data: heatmap,
        });
      }

      case 'clicks': {
        const allClicks = sessions.flatMap((s) => s.clicks);
        const clickAreas = analyzeClickAreas(allClicks);
        
        return NextResponse.json({
          success: true,
          data: {
            totalClicks: allClicks.length,
            clickAreas,
            recentClicks: allClicks.slice(-100), // 최근 100개
          },
        });
      }

      case 'scrolls': {
        const allScrolls = sessions.flatMap((s) => s.scrolls);
        const pageScrolls = pageUrl
          ? allScrolls.filter((s) => s.pageUrl === pageUrl)
          : allScrolls;
        
        const scrollAnalysis = analyzeScrollDepth(pageScrolls);
        
        return NextResponse.json({
          success: true,
          data: {
            ...scrollAnalysis,
            pageUrl: pageUrl || 'all',
          },
        });
      }

      case 'flow': {
        const userFlow = analyzeUserFlow(sessions);
        
        return NextResponse.json({
          success: true,
          data: {
            nodes: [...new Set(userFlow.flatMap((f) => [f.from, f.to]))],
            edges: userFlow,
          },
        });
      }

      case 'hourly': {
        const hourlyData = groupSessionsByHour(sessions);
        
        return NextResponse.json({
          success: true,
          data: Array.from(hourlyData.entries()).map(([hour, count]) => ({
            hour,
            sessions: count,
          })),
        });
      }

      case 'daily': {
        const dailyData = groupSessionsByDay(sessions);
        
        return NextResponse.json({
          success: true,
          data: Array.from(dailyData.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({
              date,
              sessions: count,
            })),
        });
      }

      case 'export': {
        const analytics = generateBehaviorAnalytics(sessions);
        const csv = exportAnalyticsToCSV(analytics);
        
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename=behavior-analytics-${period}.csv`,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: '유효하지 않은 타입입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Behavior analytics error:', error);
    return NextResponse.json(
      { error: '행동 분석 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 이벤트 기록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, sessionId } = body;

    switch (type) {
      case 'session': {
        const sessionData = data as SessionData;
        sessionsStore.set(sessionId || sessionData.id, sessionData);
        break;
      }

      case 'click': {
        const clickData = data as ClickEvent;
        clicksStore.push(clickData);
        
        // 세션에도 추가
        const session = sessionsStore.get(sessionId);
        if (session) {
          session.clicks.push(clickData);
        }
        break;
      }

      case 'scroll': {
        const scrollData = data as ScrollEvent;
        scrollsStore.push(scrollData);
        
        // 세션에도 추가
        const session = sessionsStore.get(sessionId);
        if (session) {
          session.scrolls.push(scrollData);
        }
        break;
      }

      case 'pageview': {
        const pageData = data as PageVisit;
        const session = sessionsStore.get(sessionId);
        if (session) {
          // 이전 페이지 종료 처리
          const lastPage = session.pages[session.pages.length - 1];
          if (lastPage && !lastPage.exitTime) {
            lastPage.exitTime = new Date();
            lastPage.duration = (lastPage.exitTime.getTime() - new Date(lastPage.enterTime).getTime()) / 1000;
          }
          
          session.pages.push(pageData);
          session.bounced = false; // 2페이지 이상 방문
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: '유효하지 않은 이벤트 타입입니다.' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: '이벤트가 기록되었습니다.',
    });
  } catch (error) {
    console.error('Event tracking error:', error);
    return NextResponse.json(
      { error: '이벤트 기록에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 기간을 밀리초로 변환
function getPeriodMs(period: 'day' | 'week' | 'month' | 'year'): number {
  switch (period) {
    case 'day':
      return 24 * 60 * 60 * 1000;
    case 'week':
      return 7 * 24 * 60 * 60 * 1000;
    case 'month':
      return 30 * 24 * 60 * 60 * 1000;
    case 'year':
      return 365 * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}
