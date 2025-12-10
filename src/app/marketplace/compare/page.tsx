"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  Star,
  ShoppingCart,
  Heart,
  Check,
  Minus,
  Download,
  Eye,
  Scale,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompare } from "@/hooks/use-compare";
import { productsApi } from "@/lib/api";
import type { Product } from "@/types";
import { cn, formatPrice } from "@/lib/utils";

export default function ComparePage() {
  const router = useRouter();
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 상품 데이터 로드
  useEffect(() => {
    const fetchProducts = async () => {
      if (compareItems.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const productPromises = compareItems.map((id) =>
          productsApi.getById(id).then((res) => res.product).catch(() => null)
        );
        const results = await Promise.all(productPromises);
        const validProducts = results.filter((p): p is Product => p !== null);
        setProducts(validProducts);
      } catch (error) {
        console.error("Failed to fetch compare products:", error);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, [compareItems]);

  // 비교할 항목이 없을 때
  if (!isLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] py-16">
        <div className="container-app">
          <div className="text-center py-20">
            <Scale className="w-16 h-16 mx-auto mb-4 text-[var(--text-disabled)]" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              비교할 상품이 없습니다
            </h2>
            <p className="text-[var(--text-tertiary)] mb-6">
              상품 카드에서 비교 버튼을 클릭하여 상품을 추가해주세요.
            </p>
            <Link href="/marketplace">
              <Button className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                마켓플레이스로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 비교 항목 데이터
  const compareFields = [
    { key: "price", label: "가격", render: (p: Product) => formatPrice(p.price) },
    {
      key: "rating",
      label: "평점",
      render: (p: Product) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span>{(p.averageRating || p.rating || 0).toFixed(1)}</span>
          <span className="text-[var(--text-tertiary)]">({p.reviewCount || 0})</span>
        </div>
      ),
    },
    { key: "salesCount", label: "판매량", render: (p: Product) => `${p.salesCount || 0}건` },
    { key: "viewCount", label: "조회수", render: (p: Product) => `${p.viewCount || 0}회` },
    { key: "downloadCount", label: "다운로드", render: (p: Product) => `${p.downloadCount || 0}회` },
    {
      key: "license",
      label: "라이선스",
      render: (p: Product) => {
        const licenseLabels = {
          PERSONAL: "개인용",
          COMMERCIAL: "상업용",
          EXTENDED: "확장",
        };
        return licenseLabels[p.licenseType as keyof typeof licenseLabels] || p.licenseType;
      },
    },
    {
      key: "category",
      label: "카테고리",
      render: (p: Product) => p.category?.name || "-",
    },
    {
      key: "techStack",
      label: "기술 스택",
      render: (p: Product) => (
        <div className="flex flex-wrap gap-1">
          {(p.techStack || []).slice(0, 3).map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
          {(p.techStack || []).length > 3 && (
            <span className="text-xs text-[var(--text-tertiary)]">
              +{(p.techStack || []).length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "features",
      label: "주요 기능",
      render: (p: Product) => (
        <ul className="space-y-1 text-sm">
          {(p.features || []).slice(0, 4).map((feature, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{feature}</span>
            </li>
          ))}
          {(p.features || []).length > 4 && (
            <li className="text-xs text-[var(--text-tertiary)]">
              +{(p.features || []).length - 4}개 더
            </li>
          )}
        </ul>
      ),
    },
    {
      key: "aiGenerated",
      label: "AI 생성",
      render: (p: Product) => (
        p.isAiGenerated ? (
          <div className="flex items-center gap-1 text-[var(--primary)]">
            <Check className="w-4 h-4" />
            <span>{p.aiTool || "AI"}</span>
          </div>
        ) : (
          <Minus className="w-4 h-4 text-[var(--text-disabled)]" />
        )
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* 헤더 */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--bg-border)]">
        <div className="container-app py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  상품 비교
                </h1>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {products.length}개 상품 비교 중
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={clearCompare} className="text-[var(--error)]">
              전체 삭제
            </Button>
          </div>
        </div>
      </div>

      {/* 비교 테이블 */}
      <div className="container-app py-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            {/* 상품 헤더 */}
            <thead>
              <tr>
                <th className="w-48 p-4 text-left text-sm font-medium text-[var(--text-tertiary)] bg-[var(--bg-surface)] sticky left-0 z-10">
                  항목
                </th>
                {products.map((product) => (
                  <th
                    key={product.id}
                    className="w-56 p-4 text-left bg-[var(--bg-surface)]"
                  >
                    <div className="relative group">
                      <button
                        onClick={() => removeFromCompare(product.id)}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <Link href={`/marketplace/${product.id}`}>
                        <div className="aspect-video rounded-xl overflow-hidden bg-[var(--bg-hover)] mb-3">
                          {product.thumbnail ? (
                            <Image
                              src={product.thumbnail}
                              alt={product.title}
                              width={224}
                              height={126}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Scale className="w-8 h-8 text-[var(--text-disabled)]" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 hover:text-[var(--primary)] transition-colors">
                          {product.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-[var(--text-tertiary)] mt-1 line-clamp-2">
                        {product.shortDescription}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" className="flex-1 gap-1">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          구매
                        </Button>
                        <Button size="sm" variant="outline" className="p-2">
                          <Heart className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </th>
                ))}
                {/* 상품 추가 슬롯 */}
                {products.length < 4 && (
                  <th className="w-56 p-4 bg-[var(--bg-surface)]">
                    <Link href="/marketplace">
                      <div className="aspect-video rounded-xl border-2 border-dashed border-[var(--bg-border)] flex items-center justify-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--bg-hover)] transition-colors">
                        <div className="text-center">
                          <Plus className="w-8 h-8 mx-auto text-[var(--text-disabled)]" />
                          <p className="text-sm text-[var(--text-tertiary)] mt-2">
                            상품 추가
                          </p>
                        </div>
                      </div>
                    </Link>
                  </th>
                )}
              </tr>
            </thead>

            {/* 비교 항목 */}
            <tbody>
              {compareFields.map((field, index) => (
                <tr
                  key={field.key}
                  className={cn(
                    "border-t border-[var(--bg-border)]",
                    index % 2 === 0 ? "bg-[var(--bg-base)]" : "bg-[var(--bg-surface)]"
                  )}
                >
                  <td className="p-4 text-sm font-medium text-[var(--text-secondary)] sticky left-0 z-10 bg-inherit">
                    {field.label}
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4 text-sm text-[var(--text-primary)]">
                      {field.render(product)}
                    </td>
                  ))}
                  {products.length < 4 && <td className="p-4" />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 하단 CTA */}
      <div className="bg-[var(--bg-surface)] border-t border-[var(--bg-border)] py-6">
        <div className="container-app">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-tertiary)]">
              비교 결과가 마음에 드셨나요? 바로 구매하세요!
            </p>
            <div className="flex gap-3">
              <Link href="/marketplace">
                <Button variant="outline">
                  더 둘러보기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
