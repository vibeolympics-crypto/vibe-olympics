'use client';

import { useReportWebVitals } from 'next/web-vitals';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

// Web Vitals 메트릭 타입
type WebVitalsMetric = {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
};

// 메트릭 임계값 (Google 권장)
const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },      // Cumulative Layout Shift
  FID: { good: 100, poor: 300 },        // First Input Delay (ms)
  FCP: { good: 1800, poor: 3000 },      // First Contentful Paint (ms)
  INP: { good: 200, poor: 500 },        // Interaction to Next Paint (ms)
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 },      // Time to First Byte (ms)
};

// 등급 계산
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// 메트릭을 Sentry로 전송
function sendToSentry(metric: WebVitalsMetric) {
  const { name, value, rating, id } = metric;
  
  Sentry.setMeasurement(name, value, name === 'CLS' ? '' : 'millisecond');
  
  // 성능이 좋지 않은 경우 breadcrumb 추가
  if (rating === 'poor') {
    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `Poor ${name}: ${value}`,
      level: 'warning',
      data: {
        metric: name,
        value,
        rating,
        id,
      },
    });
  }
}

// 메트릭을 Analytics로 전송 (선택)
function sendToAnalytics(metric: WebVitalsMetric) {
  const { name, value, rating, id, delta, navigationType } = metric;
  
  // Google Analytics 4 연동 (gtag가 있는 경우)
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag('event', name, {
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_category: 'Web Vitals',
      event_label: id,
      non_interaction: true,
      metric_rating: rating,
      metric_delta: delta,
      navigation_type: navigationType,
    });
  }

  // 개발 환경에서 콘솔 로그
  if (process.env.NODE_ENV === 'development') {
    const color = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
    logger.log(`${color} ${name}: ${value.toFixed(name === 'CLS' ? 3 : 0)} (${rating})`);
  }
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    const webVitalsMetric: WebVitalsMetric = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: getRating(metric.name, metric.value),
      delta: metric.delta,
      navigationType: metric.navigationType || 'navigate',
    };

    // Sentry로 전송
    sendToSentry(webVitalsMetric);
    
    // Analytics로 전송
    sendToAnalytics(webVitalsMetric);
  });

  return null;
}

// 성능 지표 요약 타입
export type PerformanceSummary = {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  inp: number | null;
};
