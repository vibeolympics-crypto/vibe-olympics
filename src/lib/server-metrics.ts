/**
 * Server Metrics Utility
 * 서버 메트릭 수집 유틸리티
 * 
 * Phase 11 - 서버 헬스 모니터링
 */

// 메모리 내 메트릭 저장소
export const metricsStore: {
  apiCalls: { timestamp: number; endpoint: string; duration: number; status: number }[];
  errors: { timestamp: number; endpoint: string; message: string }[];
} = {
  apiCalls: [],
  errors: [],
};

// 최대 저장 개수 (메모리 관리)
const MAX_METRICS = 1000;

/**
 * API 호출 메트릭 기록
 */
export function recordApiCall(endpoint: string, duration: number, status: number) {
  metricsStore.apiCalls.push({
    timestamp: Date.now(),
    endpoint,
    duration,
    status,
  });
  
  // 오래된 데이터 제거
  if (metricsStore.apiCalls.length > MAX_METRICS) {
    metricsStore.apiCalls = metricsStore.apiCalls.slice(-MAX_METRICS);
  }
}

/**
 * 에러 메트릭 기록
 */
export function recordError(endpoint: string, message: string) {
  metricsStore.errors.push({
    timestamp: Date.now(),
    endpoint,
    message,
  });
  
  if (metricsStore.errors.length > MAX_METRICS) {
    metricsStore.errors = metricsStore.errors.slice(-MAX_METRICS);
  }
}

/**
 * 기간별 메트릭 조회
 */
export function getMetrics(since: number) {
  return {
    apiCalls: metricsStore.apiCalls.filter(c => c.timestamp >= since),
    errors: metricsStore.errors.filter(e => e.timestamp >= since),
  };
}

/**
 * 메트릭 통계 계산
 */
export function calculateStats(calls: typeof metricsStore.apiCalls) {
  const totalCalls = calls.length;
  const successCalls = calls.filter(c => c.status >= 200 && c.status < 400).length;
  const errorCalls = calls.filter(c => c.status >= 400).length;
  const avgDuration = totalCalls > 0 
    ? calls.reduce((sum, c) => sum + c.duration, 0) / totalCalls 
    : 0;

  return {
    totalCalls,
    successCalls,
    errorCalls,
    errorRate: totalCalls > 0 ? ((errorCalls / totalCalls) * 100).toFixed(2) : "0",
    avgResponseTime: Math.round(avgDuration),
  };
}

/**
 * 엔드포인트별 통계
 */
export function getEndpointStats(calls: typeof metricsStore.apiCalls) {
  const stats: Record<string, { count: number; avgDuration: number; errors: number }> = {};
  
  calls.forEach(call => {
    if (!stats[call.endpoint]) {
      stats[call.endpoint] = { count: 0, avgDuration: 0, errors: 0 };
    }
    stats[call.endpoint].count++;
    stats[call.endpoint].avgDuration += call.duration;
    if (call.status >= 400) {
      stats[call.endpoint].errors++;
    }
  });

  // 평균 계산
  Object.keys(stats).forEach(endpoint => {
    stats[endpoint].avgDuration /= stats[endpoint].count;
    stats[endpoint].avgDuration = Math.round(stats[endpoint].avgDuration);
  });

  return stats;
}

/**
 * 시간대별 호출 통계 (차트용)
 */
export function getTimeSlotStats(calls: typeof metricsStore.apiCalls, since: number, slots: number = 12) {
  const periodMs = Date.now() - since;
  const slotDuration = periodMs / slots;
  const result: { time: string; calls: number; errors: number }[] = [];

  for (let i = 0; i < slots; i++) {
    const slotStart = since + (i * slotDuration);
    const slotEnd = slotStart + slotDuration;
    const slotCalls = calls.filter(c => c.timestamp >= slotStart && c.timestamp < slotEnd);
    
    result.push({
      time: new Date(slotStart).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      calls: slotCalls.length,
      errors: slotCalls.filter(c => c.status >= 400).length,
    });
  }

  return result;
}
