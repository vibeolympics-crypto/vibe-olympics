/**
 * 사용자 행동 분석 유틸리티
 * 히트맵, 클릭 추적, 스크롤 추적, 세션 분석
 */

// ============================================================================
// Types
// ============================================================================

export interface ClickEvent {
  id: string;
  x: number;
  y: number;
  pageX: number;
  pageY: number;
  target: string;
  targetId?: string;
  targetClass?: string;
  timestamp: Date;
  pageUrl: string;
  viewport: { width: number; height: number };
  normalizedX?: number; // 0-100 percentage
  normalizedY?: number; // 0-100 percentage
}

export interface ScrollEvent {
  id: string;
  scrollY: number;
  scrollPercent: number;
  timestamp: Date;
  pageUrl: string;
  viewport: { width: number; height: number };
  pageHeight: number;
}

export interface MouseMoveEvent {
  x: number;
  y: number;
  timestamp: number;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
  normalizedX: number; // 0-100 percentage
  normalizedY: number; // 0-100 percentage
}

export interface HeatmapData {
  pageUrl: string;
  viewport: { width: number; height: number };
  points: HeatmapPoint[];
  totalClicks: number;
  maxValue: number;
}

export interface SessionData {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  pages: PageVisit[];
  clicks: ClickEvent[];
  scrolls: ScrollEvent[];
  device: DeviceInfo;
  referrer?: string;
  entryPage: string;
  exitPage?: string;
  bounced: boolean;
}

export interface PageVisit {
  url: string;
  title: string;
  enterTime: Date;
  exitTime?: Date;
  duration?: number; // in seconds
  scrollDepth: number; // max scroll percentage
  clicks: number;
}

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
}

export interface BehaviorAnalytics {
  totalSessions: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
  avgScrollDepth: number;
  topPages: PageStats[];
  topClickAreas: ClickAreaStats[];
  userFlow: UserFlowNode[];
  deviceBreakdown: DeviceBreakdown;
  timeOnPage: TimeOnPageStats[];
  engagementScore: number;
}

export interface PageStats {
  url: string;
  title: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  exitRate: number;
  bounceRate: number;
}

export interface ClickAreaStats {
  area: string;
  description: string;
  clicks: number;
  uniqueClicks: number;
  percentage: number;
}

export interface UserFlowNode {
  from: string;
  to: string;
  count: number;
  percentage: number;
}

export interface DeviceBreakdown {
  desktop: number;
  tablet: number;
  mobile: number;
}

export interface TimeOnPageStats {
  url: string;
  avgTime: number;
  medianTime: number;
  minTime: number;
  maxTime: number;
}

export interface EngagementMetrics {
  activeTime: number; // actual active time in seconds
  idleTime: number; // idle time in seconds
  scrollEvents: number;
  clickEvents: number;
  keyboardEvents: number;
  focusChanges: number;
  engagementScore: number; // 0-100
}

// ============================================================================
// Session Tracking
// ============================================================================

/**
 * 고유 세션 ID 생성
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 디바이스 정보 감지
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      type: 'desktop',
      browser: 'unknown',
      os: 'unknown',
      screenWidth: 1920,
      screenHeight: 1080,
      language: 'en',
    };
  }

  const ua = navigator.userAgent;
  
  // Device type detection
  let type: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    type = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    type = 'mobile';
  }

  // Browser detection
  let browser = 'unknown';
  if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edge|edg/i.test(ua)) browser = 'Edge';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  else if (/msie|trident/i.test(ua)) browser = 'IE';

  // OS detection
  let os = 'unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';

  return {
    type,
    browser,
    os,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
  };
}

/**
 * 새 세션 데이터 초기화
 */
export function initSession(userId?: string): SessionData {
  const device = detectDevice();
  const entryPage = typeof window !== 'undefined' ? window.location.pathname : '/';
  const referrer = typeof document !== 'undefined' ? document.referrer : undefined;

  return {
    id: generateSessionId(),
    userId,
    startTime: new Date(),
    pages: [],
    clicks: [],
    scrolls: [],
    device,
    referrer,
    entryPage,
    bounced: true, // assume bounced until proven otherwise
  };
}

// ============================================================================
// Click Tracking
// ============================================================================

/**
 * 클릭 이벤트 캡처
 */
export function captureClick(event: MouseEvent): ClickEvent {
  const target = event.target as HTMLElement;
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  return {
    id: `click_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    x: event.clientX,
    y: event.clientY,
    pageX: event.pageX,
    pageY: event.pageY,
    target: target.tagName.toLowerCase(),
    targetId: target.id || undefined,
    targetClass: target.className || undefined,
    timestamp: new Date(),
    pageUrl: window.location.pathname,
    viewport,
  };
}

/**
 * 클릭 데이터로부터 히트맵 포인트 생성
 */
export function generateHeatmapPoints(clicks: ClickEvent[]): HeatmapPoint[] {
  const pointMap = new Map<string, HeatmapPoint>();

  // Group clicks by normalized position (10px grid)
  clicks.forEach((click) => {
    const normalizedX = Math.round((click.x / click.viewport.width) * 100);
    const normalizedY = Math.round((click.pageY / document.documentElement.scrollHeight) * 100);
    const key = `${normalizedX}_${normalizedY}`;

    const existing = pointMap.get(key);
    if (existing) {
      existing.value += 1;
    } else {
      pointMap.set(key, {
        x: click.x,
        y: click.pageY,
        value: 1,
        normalizedX,
        normalizedY,
      });
    }
  });

  return Array.from(pointMap.values());
}

/**
 * 히트맵 데이터 생성
 */
export function generateHeatmap(clicks: ClickEvent[], pageUrl: string): HeatmapData {
  const points = generateHeatmapPoints(clicks.filter((c) => c.pageUrl === pageUrl));
  const maxValue = Math.max(...points.map((p) => p.value), 1);

  return {
    pageUrl,
    viewport: clicks[0]?.viewport || { width: 1920, height: 1080 },
    points,
    totalClicks: clicks.length,
    maxValue,
  };
}

/**
 * 클릭 영역 통계 분석
 */
export function analyzeClickAreas(clicks: ClickEvent[]): ClickAreaStats[] {
  const areaMap = new Map<string, { description: string; clicks: Set<string>; total: number }>();

  clicks.forEach((click) => {
    // Define areas based on element type and position
    let area = 'other';
    let description = '기타 영역';

    // Navigation area
    if (click.y < 80 || click.target === 'nav' || click.targetClass?.includes('nav')) {
      area = 'navigation';
      description = '네비게이션 바';
    }
    // Header area
    else if (click.y < 200) {
      area = 'header';
      description = '헤더 영역';
    }
    // Sidebar area (left 20% or right 20%)
    else if (click.normalizedX && (click.normalizedX < 20 || click.normalizedX > 80)) {
      area = 'sidebar';
      description = '사이드바';
    }
    // CTA buttons
    else if (click.target === 'button' || click.targetClass?.includes('btn')) {
      area = 'cta';
      description = 'CTA 버튼';
    }
    // Links
    else if (click.target === 'a') {
      area = 'links';
      description = '링크';
    }
    // Images
    else if (click.target === 'img') {
      area = 'images';
      description = '이미지';
    }
    // Cards
    else if (click.targetClass?.includes('card')) {
      area = 'cards';
      description = '카드 컴포넌트';
    }
    // Forms
    else if (['input', 'select', 'textarea'].includes(click.target)) {
      area = 'forms';
      description = '폼 요소';
    }
    // Main content area
    else {
      area = 'content';
      description = '메인 콘텐츠';
    }

    const existing = areaMap.get(area);
    if (existing) {
      existing.clicks.add(click.id);
      existing.total += 1;
    } else {
      areaMap.set(area, {
        description,
        clicks: new Set([click.id]),
        total: 1,
      });
    }
  });

  const totalClicks = clicks.length;
  return Array.from(areaMap.entries())
    .map(([area, data]) => ({
      area,
      description: data.description,
      clicks: data.total,
      uniqueClicks: data.clicks.size,
      percentage: totalClicks > 0 ? (data.total / totalClicks) * 100 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

// ============================================================================
// Scroll Tracking
// ============================================================================

/**
 * 스크롤 이벤트 캡처
 */
export function captureScroll(): ScrollEvent {
  const scrollY = window.scrollY;
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = pageHeight > 0 ? (scrollY / pageHeight) * 100 : 0;

  return {
    id: `scroll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    scrollY,
    scrollPercent: Math.min(100, Math.round(scrollPercent)),
    timestamp: new Date(),
    pageUrl: window.location.pathname,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    pageHeight: document.documentElement.scrollHeight,
  };
}

/**
 * 스크롤 깊이 분석
 */
export function analyzeScrollDepth(scrolls: ScrollEvent[]): {
  avgDepth: number;
  maxDepth: number;
  reachedBottom: boolean;
  depthDistribution: { range: string; count: number; percentage: number }[];
} {
  if (scrolls.length === 0) {
    return {
      avgDepth: 0,
      maxDepth: 0,
      reachedBottom: false,
      depthDistribution: [],
    };
  }

  const maxDepth = Math.max(...scrolls.map((s) => s.scrollPercent));
  const avgDepth = scrolls.reduce((sum, s) => sum + s.scrollPercent, 0) / scrolls.length;

  // Distribution buckets
  const buckets = [
    { range: '0-25%', min: 0, max: 25 },
    { range: '25-50%', min: 25, max: 50 },
    { range: '50-75%', min: 50, max: 75 },
    { range: '75-100%', min: 75, max: 100 },
  ];

  const depthDistribution = buckets.map((bucket) => {
    const count = scrolls.filter(
      (s) => s.scrollPercent >= bucket.min && s.scrollPercent < bucket.max
    ).length;
    return {
      range: bucket.range,
      count,
      percentage: (count / scrolls.length) * 100,
    };
  });

  return {
    avgDepth: Math.round(avgDepth),
    maxDepth: Math.round(maxDepth),
    reachedBottom: maxDepth >= 90,
    depthDistribution,
  };
}

// ============================================================================
// Session Analysis
// ============================================================================

/**
 * 페이지별 통계 분석
 */
export function analyzePageStats(sessions: SessionData[]): PageStats[] {
  const pageMap = new Map<string, {
    title: string;
    views: number;
    uniqueViews: Set<string>;
    timeOnPage: number[];
    scrollDepths: number[];
    exits: number;
    bounces: number;
  }>();

  sessions.forEach((session) => {
    session.pages.forEach((page, index) => {
      const existing = pageMap.get(page.url);
      const isExit = index === session.pages.length - 1;
      const isBounce = session.bounced && index === 0;

      if (existing) {
        existing.views += 1;
        existing.uniqueViews.add(session.id);
        if (page.duration) existing.timeOnPage.push(page.duration);
        existing.scrollDepths.push(page.scrollDepth);
        if (isExit) existing.exits += 1;
        if (isBounce) existing.bounces += 1;
      } else {
        pageMap.set(page.url, {
          title: page.title,
          views: 1,
          uniqueViews: new Set([session.id]),
          timeOnPage: page.duration ? [page.duration] : [],
          scrollDepths: [page.scrollDepth],
          exits: isExit ? 1 : 0,
          bounces: isBounce ? 1 : 0,
        });
      }
    });
  });

  return Array.from(pageMap.entries())
    .map(([url, data]) => ({
      url,
      title: data.title,
      views: data.views,
      uniqueViews: data.uniqueViews.size,
      avgTimeOnPage:
        data.timeOnPage.length > 0
          ? data.timeOnPage.reduce((a, b) => a + b, 0) / data.timeOnPage.length
          : 0,
      avgScrollDepth:
        data.scrollDepths.length > 0
          ? data.scrollDepths.reduce((a, b) => a + b, 0) / data.scrollDepths.length
          : 0,
      exitRate: data.views > 0 ? (data.exits / data.views) * 100 : 0,
      bounceRate: data.views > 0 ? (data.bounces / data.views) * 100 : 0,
    }))
    .sort((a, b) => b.views - a.views);
}

/**
 * 사용자 흐름 분석
 */
export function analyzeUserFlow(sessions: SessionData[]): UserFlowNode[] {
  const flowMap = new Map<string, number>();
  let totalTransitions = 0;

  sessions.forEach((session) => {
    for (let i = 0; i < session.pages.length - 1; i++) {
      const from = session.pages[i].url;
      const to = session.pages[i + 1].url;
      const key = `${from}|${to}`;
      
      flowMap.set(key, (flowMap.get(key) || 0) + 1);
      totalTransitions += 1;
    }
  });

  return Array.from(flowMap.entries())
    .map(([key, count]) => {
      const [from, to] = key.split('|');
      return {
        from,
        to,
        count,
        percentage: totalTransitions > 0 ? (count / totalTransitions) * 100 : 0,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 flows
}

/**
 * 디바이스별 분석
 */
export function analyzeDeviceBreakdown(sessions: SessionData[]): DeviceBreakdown {
  const breakdown: DeviceBreakdown = {
    desktop: 0,
    tablet: 0,
    mobile: 0,
  };

  sessions.forEach((session) => {
    breakdown[session.device.type] += 1;
  });

  // Convert to percentages
  const total = sessions.length || 1;
  return {
    desktop: (breakdown.desktop / total) * 100,
    tablet: (breakdown.tablet / total) * 100,
    mobile: (breakdown.mobile / total) * 100,
  };
}

// ============================================================================
// Engagement Analysis
// ============================================================================

/**
 * 참여도 점수 계산
 */
export function calculateEngagementScore(session: SessionData): number {
  let score = 0;

  // Base score for visiting
  score += 10;

  // Score for page visits (max 20 points)
  score += Math.min(session.pages.length * 5, 20);

  // Score for time spent (max 20 points)
  if (session.duration) {
    score += Math.min(session.duration / 30, 20); // 30 seconds = 1 point, max 20
  }

  // Score for clicks (max 20 points)
  score += Math.min(session.clicks.length * 2, 20);

  // Score for scroll depth (max 20 points)
  const maxScrollDepth = Math.max(...session.pages.map((p) => p.scrollDepth), 0);
  score += (maxScrollDepth / 100) * 20;

  // Bonus for not bouncing (10 points)
  if (!session.bounced) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

/**
 * 전체 행동 분석 생성
 */
export function generateBehaviorAnalytics(sessions: SessionData[]): BehaviorAnalytics {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      uniqueUsers: 0,
      avgSessionDuration: 0,
      avgPagesPerSession: 0,
      bounceRate: 0,
      avgScrollDepth: 0,
      topPages: [],
      topClickAreas: [],
      userFlow: [],
      deviceBreakdown: { desktop: 0, tablet: 0, mobile: 0 },
      timeOnPage: [],
      engagementScore: 0,
    };
  }

  const uniqueUsers = new Set(sessions.map((s) => s.userId || s.id)).size;
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalPages = sessions.reduce((sum, s) => sum + s.pages.length, 0);
  const bouncedSessions = sessions.filter((s) => s.bounced).length;
  
  const allScrollDepths = sessions.flatMap((s) => s.pages.map((p) => p.scrollDepth));
  const avgScrollDepth =
    allScrollDepths.length > 0
      ? allScrollDepths.reduce((a, b) => a + b, 0) / allScrollDepths.length
      : 0;

  const allClicks = sessions.flatMap((s) => s.clicks);
  const topClickAreas = analyzeClickAreas(allClicks);

  const engagementScores = sessions.map((s) => calculateEngagementScore(s));
  const avgEngagement =
    engagementScores.length > 0
      ? engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length
      : 0;

  return {
    totalSessions: sessions.length,
    uniqueUsers,
    avgSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
    avgPagesPerSession: sessions.length > 0 ? totalPages / sessions.length : 0,
    bounceRate: sessions.length > 0 ? (bouncedSessions / sessions.length) * 100 : 0,
    avgScrollDepth,
    topPages: analyzePageStats(sessions),
    topClickAreas,
    userFlow: analyzeUserFlow(sessions),
    deviceBreakdown: analyzeDeviceBreakdown(sessions),
    timeOnPage: analyzePageStats(sessions).map((p) => ({
      url: p.url,
      avgTime: p.avgTimeOnPage,
      medianTime: p.avgTimeOnPage, // simplified
      minTime: 0,
      maxTime: p.avgTimeOnPage * 2,
    })),
    engagementScore: Math.round(avgEngagement),
  };
}

// ============================================================================
// Data Aggregation
// ============================================================================

/**
 * 기간별 세션 필터링
 */
export function filterSessionsByPeriod(
  sessions: SessionData[],
  period: 'day' | 'week' | 'month' | 'year'
): SessionData[] {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(0);
  }

  return sessions.filter((s) => new Date(s.startTime) >= startDate);
}

/**
 * 시간대별 세션 그룹화
 */
export function groupSessionsByHour(sessions: SessionData[]): Map<number, number> {
  const hourMap = new Map<number, number>();
  
  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourMap.set(i, 0);
  }

  sessions.forEach((session) => {
    const hour = new Date(session.startTime).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  return hourMap;
}

/**
 * 일별 세션 그룹화
 */
export function groupSessionsByDay(sessions: SessionData[]): Map<string, number> {
  const dayMap = new Map<string, number>();

  sessions.forEach((session) => {
    const date = new Date(session.startTime).toISOString().split('T')[0];
    dayMap.set(date, (dayMap.get(date) || 0) + 1);
  });

  return dayMap;
}

// ============================================================================
// Export Analytics Data
// ============================================================================

/**
 * 분석 데이터를 CSV로 변환
 */
export function exportAnalyticsToCSV(analytics: BehaviorAnalytics): string {
  const lines: string[] = [];

  // Summary section
  lines.push('=== 요약 ===');
  lines.push(`총 세션,${analytics.totalSessions}`);
  lines.push(`고유 사용자,${analytics.uniqueUsers}`);
  lines.push(`평균 세션 시간(초),${analytics.avgSessionDuration.toFixed(2)}`);
  lines.push(`세션당 평균 페이지,${analytics.avgPagesPerSession.toFixed(2)}`);
  lines.push(`이탈률(%),${analytics.bounceRate.toFixed(2)}`);
  lines.push(`평균 스크롤 깊이(%),${analytics.avgScrollDepth.toFixed(2)}`);
  lines.push(`참여도 점수,${analytics.engagementScore}`);
  lines.push('');

  // Top pages section
  lines.push('=== 인기 페이지 ===');
  lines.push('URL,제목,조회수,고유 조회수,평균 체류 시간,평균 스크롤 깊이,이탈률');
  analytics.topPages.forEach((page) => {
    lines.push(
      `"${page.url}","${page.title}",${page.views},${page.uniqueViews},${page.avgTimeOnPage.toFixed(2)},${page.avgScrollDepth.toFixed(2)},${page.bounceRate.toFixed(2)}`
    );
  });
  lines.push('');

  // Click areas section
  lines.push('=== 클릭 영역 ===');
  lines.push('영역,설명,클릭수,고유 클릭,비율(%)');
  analytics.topClickAreas.forEach((area) => {
    lines.push(
      `"${area.area}","${area.description}",${area.clicks},${area.uniqueClicks},${area.percentage.toFixed(2)}`
    );
  });
  lines.push('');

  // Device breakdown
  lines.push('=== 디바이스 분포 ===');
  lines.push('디바이스,비율(%)');
  lines.push(`데스크톱,${analytics.deviceBreakdown.desktop.toFixed(2)}`);
  lines.push(`태블릿,${analytics.deviceBreakdown.tablet.toFixed(2)}`);
  lines.push(`모바일,${analytics.deviceBreakdown.mobile.toFixed(2)}`);

  return lines.join('\n');
}
