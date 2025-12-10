"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "vibe-olympics-recently-viewed";
const MAX_ITEMS = 10;

interface RecentlyViewedItem {
  id: string;
  viewedAt: number;
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedItem[];
        // 유효한 항목만 필터링 (30일 이내)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const validItems = parsed.filter(item => item.viewedAt > thirtyDaysAgo);
        setRecentlyViewed(validItems);
      }
    } catch (error) {
      console.error("Failed to load recently viewed:", error);
    }
    setIsLoaded(true);
  }, []);

  // 데이터 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
      } catch (error) {
        console.error("Failed to save recently viewed:", error);
      }
    }
  }, [recentlyViewed, isLoaded]);

  // 상품 조회 기록 추가
  const addProduct = useCallback((productId: string) => {
    setRecentlyViewed((prev) => {
      // 이미 있으면 제거 후 맨 앞에 추가
      const filtered = prev.filter(item => item.id !== productId);
      const newItem: RecentlyViewedItem = {
        id: productId,
        viewedAt: Date.now(),
      };
      return [newItem, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  // 특정 상품 제거
  const removeProduct = useCallback((productId: string) => {
    setRecentlyViewed((prev) => prev.filter(item => item.id !== productId));
  }, []);

  // 전체 기록 삭제
  const clearAll = useCallback(() => {
    setRecentlyViewed([]);
  }, []);

  // ID 목록만 반환 (API 호출용)
  const getProductIds = useCallback(() => {
    return recentlyViewed.map(item => item.id);
  }, [recentlyViewed]);

  return {
    recentlyViewed,
    isLoaded,
    addProduct,
    removeProduct,
    clearAll,
    getProductIds,
  };
}

// 단순히 상품 ID 목록만 가져오는 유틸리티 함수 (비-hook)
export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as RecentlyViewedItem[];
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return parsed
        .filter(item => item.viewedAt > thirtyDaysAgo)
        .map(item => item.id);
    }
  } catch (error) {
    console.error("Failed to get recently viewed IDs:", error);
  }
  return [];
}
