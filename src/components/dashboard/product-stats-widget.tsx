"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  Eye,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductStat {
  id: string;
  title: string;
  thumbnail: string | null;
  price: number;
  viewCount: number;
  salesCount: number;
  conversionRate: number;
  revenue: number;
  trend: {
    views: number;
    sales: number;
  };
}

interface ProductStatsResponse {
  products: ProductStat[];
  summary: {
    totalViews: number;
    totalSales: number;
    totalRevenue: number;
    avgConversionRate: number;
  };
}

async function fetchProductStats(period: string): Promise<ProductStatsResponse> {
  const response = await fetch(`/api/dashboard/product-stats?period=${period}`);
  if (!response.ok) {
    throw new Error("Failed to fetch product stats");
  }
  return response.json();
}

interface ProductStatsWidgetProps {
  maxItems?: number;
}

export function ProductStatsWidget({ maxItems = 5 }: ProductStatsWidgetProps) {
  const [period, setPeriod] = useState("month");
  const [sortBy, setSortBy] = useState<"views" | "sales" | "revenue">("revenue");
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["productStats", period],
    queryFn: () => fetchProductStats(period),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("ko-KR").format(value);
  };

  const sortedProducts = data?.products
    ?.sort((a, b) => {
      switch (sortBy) {
        case "views":
          return b.viewCount - a.viewCount;
        case "sales":
          return b.salesCount - a.salesCount;
        case "revenue":
        default:
          return b.revenue - a.revenue;
      }
    })
    .slice(0, isExpanded ? undefined : maxItems);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-[var(--text-secondary)]">
          상품 통계를 불러올 수 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            상품별 통계
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[100px] h-8">
                <Calendar className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">이번 주</SelectItem>
                <SelectItem value="month">이번 달</SelectItem>
                <SelectItem value="year">올해</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[90px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">매출순</SelectItem>
                <SelectItem value="sales">판매순</SelectItem>
                <SelectItem value="views">조회순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        {data?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
                <Eye className="w-3 h-3" />
                총 조회수
              </div>
              <p className="font-bold">{formatNumber(data.summary.totalViews)}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
                <ShoppingCart className="w-3 h-3" />
                총 판매
              </div>
              <p className="font-bold">{formatNumber(data.summary.totalSales)}건</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                총 매출
              </div>
              <p className="font-bold text-[var(--semantic-success)]">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
                <BarChart3 className="w-3 h-3" />
                평균 전환율
              </div>
              <p className="font-bold">{data.summary.avgConversionRate.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {/* Product List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-[var(--bg-secondary)] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sortedProducts && sortedProducts.length > 0 ? (
          <>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] border-b border-[var(--bg-border)]">
                <div className="col-span-5">상품</div>
                <div className="col-span-2 text-right">조회</div>
                <div className="col-span-2 text-right">판매</div>
                <div className="col-span-3 text-right">매출</div>
              </div>

              {/* Products */}
              {sortedProducts.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/marketplace/${product.id}`}
                  className="grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="w-10 h-10 rounded bg-[var(--bg-secondary)] overflow-hidden flex-shrink-0">
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt={product.title}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-[var(--text-secondary)]" />
                        </div>
                      )}
                    </div>
                    <span className="truncate text-sm font-medium">{product.title}</span>
                  </div>

                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Eye className="w-3 h-3 text-[var(--text-secondary)]" />
                      <span className="text-sm">{formatNumber(product.viewCount)}</span>
                    </div>
                    {product.trend.views !== 0 && (
                      <span className={`text-xs ${
                        product.trend.views > 0
                          ? "text-[var(--semantic-success)]"
                          : "text-[var(--semantic-error)]"
                      }`}>
                        {product.trend.views > 0 ? "+" : ""}
                        {product.trend.views}%
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 text-right">
                    <span className="text-sm font-medium">{product.salesCount}건</span>
                    <div className="text-xs text-[var(--text-secondary)]">
                      ({product.conversionRate.toFixed(1)}%)
                    </div>
                  </div>

                  <div className="col-span-3 text-right">
                    <span className="font-bold text-sm text-[var(--semantic-success)]">
                      {formatCurrency(product.revenue)}
                    </span>
                    {product.trend.sales !== 0 && (
                      <div className={`text-xs flex items-center justify-end gap-0.5 ${
                        product.trend.sales > 0
                          ? "text-[var(--semantic-success)]"
                          : "text-[var(--semantic-error)]"
                      }`}>
                        {product.trend.sales > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {product.trend.sales > 0 ? "+" : ""}
                        {product.trend.sales}%
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {data && data.products.length > maxItems && (
              <Button
                variant="ghost"
                className="w-full mt-3"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    더보기 ({data.products.length - maxItems}개)
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-[var(--text-secondary)]">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>등록된 상품이 없습니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
