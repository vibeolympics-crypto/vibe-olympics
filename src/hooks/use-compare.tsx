"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Product } from "@/types";

const STORAGE_KEY = "vibe-olympics-compare";
const MAX_COMPARE_ITEMS = 4;

interface CompareContextType {
  compareItems: string[];
  products: Product[];
  isLoading: boolean;
  addToCompare: (productId: string) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  canAddMore: boolean;
  setProducts: (products: Product[]) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareItems, setCompareItems] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    let isMounted = true;
    
    const loadCompareItems = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored) as string[];
          setCompareItems(parsed.slice(0, MAX_COMPARE_ITEMS));
        }
      } catch (error) {
        console.error("Failed to load compare items:", error);
      }
      if (isMounted) {
        setIsLoaded(true);
      }
    };
    
    loadCompareItems();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // 데이터 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compareItems));
      } catch (error) {
        console.error("Failed to save compare items:", error);
      }
    }
  }, [compareItems, isLoaded]);

  const addToCompare = useCallback((productId: string) => {
    setCompareItems((prev) => {
      if (prev.includes(productId)) return prev;
      if (prev.length >= MAX_COMPARE_ITEMS) return prev;
      return [...prev, productId];
    });
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareItems((prev) => prev.filter((id) => id !== productId));
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
    setProducts([]);
  }, []);

  const isInCompare = useCallback((productId: string) => {
    return compareItems.includes(productId);
  }, [compareItems]);

  const canAddMore = compareItems.length < MAX_COMPARE_ITEMS;

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        products,
        isLoading,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        canAddMore,
        setProducts,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
