"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { X, Clock, ChevronRight, Trash2 } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { productsApi } from "@/lib/api";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

interface RecentlyViewedWidgetProps {
  className?: string;
  variant?: "sidebar" | "horizontal" | "floating";
  maxItems?: number;
}

export function RecentlyViewedWidget({
  className,
  variant = "horizontal",
  maxItems = 5,
}: RecentlyViewedWidgetProps) {
  const { recentlyViewed, isLoaded, removeProduct, clearAll } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // 최근 본 상품 데이터 로드
  useEffect(() => {
    const fetchProducts = async () => {
      if (!isLoaded || recentlyViewed.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const productIds = recentlyViewed.slice(0, maxItems).map(item => item.id);
        // 각 상품 ID로 개별 요청 (bulk API가 없으므로)
        const productPromises = productIds.map(id => 
          productsApi.getById(id).then(res => res.product).catch(() => null)
        );
        const results = await Promise.all(productPromises);
        const validProducts = results.filter((p): p is Product => p !== null);
        setProducts(validProducts);
      } catch (error) {
        console.error("Failed to fetch recently viewed products:", error);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, [recentlyViewed, isLoaded, maxItems]);

  // 표시할 상품이 없으면 렌더링하지 않음
  if (!isLoaded || (!isLoading && products.length === 0)) {
    return null;
  }

  if (variant === "floating") {
    return (
      <AnimatePresence>
        {products.length > 0 && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={cn(
              "fixed right-0 top-1/2 -translate-y-1/2 z-40",
              className
            )}
          >
            {/* 토글 버튼 */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-[var(--bg-elevated)] border border-r-0 border-[var(--bg-border)] rounded-l-lg px-2 py-4 hover:bg-[var(--bg-hover)] transition-colors"
            >
              <Clock className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--primary)] text-white text-xs rounded-full flex items-center justify-center">
                {products.length}
              </span>
            </button>

            {/* 패널 */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-l-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        최근 본 상품
                      </h3>
                      <button
                        onClick={clearAll}
                        className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {products.map((product) => (
                        <RecentlyViewedItem
                          key={product.id}
                          product={product}
                          onRemove={() => removeProduct(product.id)}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={cn("bg-[var(--bg-surface)] rounded-2xl p-4 border border-[var(--bg-border)]", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="w-4 h-4" />
            최근 본 상품
          </h3>
          {products.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-12 h-12 bg-[var(--bg-hover)] rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[var(--bg-hover)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--bg-hover)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <RecentlyViewedItem
                key={product.id}
                product={product}
                onRemove={() => removeProduct(product.id)}
                compact
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={cn("bg-[var(--bg-surface)] rounded-2xl p-4 sm:p-6 border border-[var(--bg-border)]", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--primary)]" />
          최근 본 상품
        </h3>
        <div className="flex items-center gap-2">
          {products.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors"
            >
              전체 삭제
            </button>
          )}
          <Link
            href="/marketplace?filter=recently-viewed"
            className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            전체 보기
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex-shrink-0 w-[140px]">
              <div className="w-full aspect-square bg-[var(--bg-hover)] rounded-xl mb-2" />
              <div className="h-3 bg-[var(--bg-hover)] rounded w-3/4 mb-1" />
              <div className="h-3 bg-[var(--bg-hover)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[var(--bg-border)] scrollbar-track-transparent">
          {products.map((product) => (
            <RecentlyViewedItem
              key={product.id}
              product={product}
              onRemove={() => removeProduct(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 개별 상품 아이템 컴포넌트
interface RecentlyViewedItemProps {
  product: Product;
  onRemove: () => void;
  compact?: boolean;
}

function RecentlyViewedItem({ product, onRemove, compact }: RecentlyViewedItemProps) {
  if (compact) {
    return (
      <div className="group flex gap-3 items-center">
        <Link href={`/marketplace/${product.id}`} className="flex-shrink-0">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--bg-hover)]">
            {product.thumbnail && (
              <Image
                src={product.thumbnail}
                alt={product.title}
                fill
                className="object-cover"
              />
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/marketplace/${product.id}`}>
            <p className="text-sm font-medium text-[var(--text-primary)] truncate hover:text-[var(--primary)] transition-colors">
              {product.title}
            </p>
          </Link>
          <p className="text-xs text-[var(--primary)] font-semibold">
            ₩{product.price.toLocaleString()}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--bg-hover)] rounded-full transition-all"
        >
          <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </button>
      </div>
    );
  }

  return (
    <div className="group relative flex-shrink-0 w-[140px]">
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove();
        }}
        className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 p-1 bg-black/60 hover:bg-black/80 rounded-full transition-all"
      >
        <X className="w-3 h-3 text-white" />
      </button>
      <Link href={`/marketplace/${product.id}`}>
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[var(--bg-hover)] mb-2 group-hover:ring-2 ring-[var(--primary)] transition-all">
          {product.thumbnail && (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          )}
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
          {product.title}
        </p>
        <p className="text-sm text-[var(--primary)] font-semibold">
          ₩{product.price.toLocaleString()}
        </p>
      </Link>
    </div>
  );
}
