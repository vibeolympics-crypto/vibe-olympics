"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { X, ArrowRight, Scale } from "lucide-react";
import { useCompare } from "@/hooks/use-compare";
import { productsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

// 비교 버튼 컴포넌트
interface CompareButtonProps {
  productId: string;
  className?: string;
  variant?: "icon" | "text" | "full";
}

export function CompareButton({ productId, className, variant = "icon" }: CompareButtonProps) {
  const { isInCompare, addToCompare, removeFromCompare, canAddMore } = useCompare();
  const inCompare = isInCompare(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(productId);
    } else if (canAddMore) {
      addToCompare(productId);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        disabled={!inCompare && !canAddMore}
        className={cn(
          "p-2 rounded-lg transition-all",
          inCompare
            ? "bg-[var(--primary)] text-white"
            : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]",
          !inCompare && !canAddMore && "opacity-50 cursor-not-allowed",
          className
        )}
        title={inCompare ? "비교에서 제거" : canAddMore ? "비교에 추가" : "최대 4개까지 비교 가능"}
      >
        <Scale className="w-4 h-4" />
      </button>
    );
  }

  if (variant === "text") {
    return (
      <button
        onClick={handleClick}
        disabled={!inCompare && !canAddMore}
        className={cn(
          "flex items-center gap-1.5 text-sm transition-colors",
          inCompare
            ? "text-[var(--primary)]"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
          !inCompare && !canAddMore && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <Scale className="w-4 h-4" />
        {inCompare ? "비교중" : "비교"}
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={!inCompare && !canAddMore}
      variant={inCompare ? "default" : "outline"}
      className={cn("gap-2", className)}
    >
      <Scale className="w-4 h-4" />
      {inCompare ? "비교에서 제거" : "비교에 추가"}
    </Button>
  );
}

// 비교 플로팅 바 컴포넌트
export function CompareBar() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 상품 데이터 로드
  useEffect(() => {
    const fetchProducts = async () => {
      if (compareItems.length === 0) {
        setLocalProducts([]);
        return;
      }

      // 이미 로드된 상품은 제외
      const loadedIds = localProducts.map((p) => p.id);
      const newIds = compareItems.filter((id) => !loadedIds.includes(id));
      const removedIds = loadedIds.filter((id) => !compareItems.includes(id));

      // 제거된 상품 처리
      if (removedIds.length > 0) {
        setLocalProducts((prev: Product[]) => prev.filter((p: Product) => compareItems.includes(p.id)));
      }

      // 새 상품 로드
      if (newIds.length === 0) return;

      setIsLoading(true);
      try {
        const productPromises = newIds.map((id) =>
          productsApi.getById(id).then((res) => res.product).catch(() => null)
        );
        const results = await Promise.all(productPromises);
        const validProducts = results.filter((p): p is Product => p !== null);
        setLocalProducts((prev: Product[]) => [...prev, ...validProducts]);
      } catch (error) {
        console.error("Failed to fetch compare products:", error);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, [compareItems]);

  if (compareItems.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl shadow-2xl overflow-hidden">
          {/* 미니 뷰 */}
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[var(--primary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {compareItems.length}개 상품 비교
              </span>
            </div>

            <div className="flex items-center gap-2">
              {localProducts.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="relative group"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--bg-hover)]">
                    {product.thumbnail && (
                      <Image
                        src={product.thumbnail}
                        alt={product.title}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {isLoading && (
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] animate-pulse" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link href="/marketplace/compare">
                <Button size="sm" className="gap-1.5">
                  비교하기
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <button
                onClick={clearCompare}
                className="p-2 text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors"
                title="전체 삭제"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}