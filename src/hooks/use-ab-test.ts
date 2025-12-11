/**
 * A/B 테스트 React 훅
 * - 클라이언트에서 실험 변형 가져오기
 * - 이벤트 추적
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

// ============================================
// 타입 정의
// ============================================

export interface VariantConfig {
  [key: string]: string | number | boolean | object;
}

export interface UseABTestResult {
  variant: string | null;       // 변형 이름 (예: 'Control', 'Variant A')
  variantId: string | null;     // 변형 ID
  isControl: boolean;           // 대조군 여부
  config: VariantConfig;        // 변형별 설정
  isLoading: boolean;
  trackConversion: (value?: number, metadata?: Record<string, unknown>) => Promise<void>;
  trackClick: (elementId?: string, metadata?: Record<string, unknown>) => Promise<void>;
  trackRevenue: (amount: number, metadata?: Record<string, unknown>) => Promise<void>;
}

// 세션 ID 생성 (익명 사용자용)
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const storageKey = 'ab_test_session_id';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

// ============================================
// useABTest 훅
// ============================================

export function useABTest(experimentKey: string): UseABTestResult {
  const { data: session } = useSession();
  const [variant, setVariant] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [isControl, setIsControl] = useState(false);
  const [config, setConfig] = useState<VariantConfig>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const hasTrackedView = useRef(false);

  // 변형 할당 가져오기
  useEffect(() => {
    const fetchVariant = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        const userId = session?.user?.id;

        const response = await fetch('/api/ab-test/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experimentKey,
            userId,
            sessionId: userId ? undefined : sessionId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.assignment) {
            setVariant(data.assignment.variantName);
            setVariantId(data.assignment.variantId);
            setExperimentId(data.assignment.experimentId);
            setIsControl(data.assignment.isControl);
            setConfig(data.assignment.config || {});
          }
        }
      } catch (error) {
        console.error('[useABTest] Failed to fetch variant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariant();
  }, [experimentKey, session?.user?.id]);

  // 뷰 이벤트 자동 추적
  useEffect(() => {
    if (variantId && experimentId && !hasTrackedView.current) {
      hasTrackedView.current = true;
      trackEvent('view');
    }
  }, [variantId, experimentId]);

  // 이벤트 추적 함수
  const trackEvent = useCallback(async (
    eventType: string,
    eventValue?: number,
    metadata?: Record<string, unknown>
  ) => {
    if (!experimentId || !variantId) return;

    try {
      const sessionId = getOrCreateSessionId();
      const userId = session?.user?.id;

      await fetch('/api/ab-test/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentId,
          variantId,
          userId,
          sessionId: userId ? undefined : sessionId,
          eventType,
          eventValue,
          metadata,
        }),
      });
    } catch (error) {
      console.error('[useABTest] Failed to track event:', error);
    }
  }, [experimentId, variantId, session?.user?.id]);

  // 전환 추적
  const trackConversion = useCallback(async (
    value?: number,
    metadata?: Record<string, unknown>
  ) => {
    await trackEvent('conversion', value, metadata);
  }, [trackEvent]);

  // 클릭 추적
  const trackClick = useCallback(async (
    elementId?: string,
    metadata?: Record<string, unknown>
  ) => {
    await trackEvent('click', undefined, { elementId, ...metadata });
  }, [trackEvent]);

  // 매출 추적
  const trackRevenue = useCallback(async (
    amount: number,
    metadata?: Record<string, unknown>
  ) => {
    await trackEvent('revenue', amount, metadata);
  }, [trackEvent]);

  return {
    variant,
    variantId,
    isControl,
    config,
    isLoading,
    trackConversion,
    trackClick,
    trackRevenue,
  };
}

// ============================================
// useExperimentConfig 훅 - 특정 설정값 가져오기
// ============================================

export function useExperimentConfig<T>(
  experimentKey: string,
  configKey: string,
  defaultValue: T
): { value: T; isLoading: boolean; variant: string | null } {
  const { config, isLoading, variant } = useABTest(experimentKey);
  
  const value = (config[configKey] as T) ?? defaultValue;
  
  return { value, isLoading, variant };
}

export default useABTest;
