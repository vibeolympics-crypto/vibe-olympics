"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  Eye,
  Star,
  ArrowUpRight,
  Clock,
  Loader2,
  Heart,
  ThumbsUp,
  Bookmark,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useMyProducts, usePurchases } from "@/hooks/use-api";
import { CompactRecommendation } from "@/components/ui/recommendation-section";

export function DashboardContent() {
  const { data: session } = useSession();
  
  // 내 상품 조회
  const { data: productsData, isLoading: productsLoading } = useMyProducts(session?.user?.id);
  // 구매 내역 조회
  const { data: purchasesData, isLoading: purchasesLoading } = usePurchases(1, 4);

  const products = productsData?.products || [];
  const purchases = purchasesData?.purchases || [];

  // 통계 계산
  const totalRevenue = products.reduce(
    (sum, p) => sum + (p.price || 0) * (p.salesCount || 0),
    0
  );
  const totalSales = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);
  const totalViews = products.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  
  // 상위 3개 상품 (판매량 기준)
  const topProducts = [...products]
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 3)
    .map(p => ({
      id: p.id,
      title: p.title,
      sales: p.salesCount || 0,
      revenue: (p.price || 0) * (p.salesCount || 0),
      rating: p.averageRating || 0,
      views: p.viewCount || 0,
    }));

  const stats = [
    {
      name: "총 수익",
      value: totalRevenue,
      changeType: "neutral" as const,
      icon: DollarSign,
      format: "currency" as const,
    },
    {
      name: "총 판매",
      value: totalSales,
      changeType: "neutral" as const,
      icon: ShoppingBag,
      format: "number" as const,
    },
    {
      name: "등록 상품",
      value: products.length,
      changeType: "neutral" as const,
      icon: Package,
      format: "number" as const,
    },
    {
      name: "총 조회수",
      value: totalViews,
      changeType: "neutral" as const,
      icon: Eye,
      format: "number" as const,
    },
  ];

  const isLoading = productsLoading || purchasesLoading;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          안녕하세요, {session?.user?.name || "사용자"}님! 👋
        </h1>
        <p className="text-[var(--text-tertiary)] mt-1">
          오늘의 대시보드 현황을 확인하세요.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      {stat.format === "currency"
                        ? formatPrice(stat.value)
                        : stat.value.toLocaleString()}
                    </div>
                    <div className="text-sm text-[var(--text-tertiary)]">
                      {stat.name}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Purchases */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card variant="glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      최근 구매
                    </h2>
                    <Link href="/dashboard/purchases">
                      <Button variant="ghost" size="sm" className="gap-1">
                        전체 보기
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {purchases.length > 0 ? (
                      purchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-medium">
                              {purchase.product?.title?.[0] || "?"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {purchase.product?.title || "상품 정보 없음"}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              {new Date(purchase.createdAt).toLocaleString("ko-KR")}
                            </p>
                          </div>
                          <div className="text-sm font-medium text-[var(--accent-green)]">
                            {purchase.amount === 0 ? "무료" : formatPrice(purchase.amount)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[var(--text-tertiary)]">
                        구매 내역이 없습니다
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card variant="glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      인기 상품
                    </h2>
                    <Link href="/dashboard/products">
                      <Button variant="ghost" size="sm" className="gap-1">
                        전체 보기
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {topProducts.length > 0 ? (
                      topProducts.map((product, index) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-sm font-bold text-[var(--text-tertiary)]">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {product.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3" />
                                {product.sales}
                              </span>
                              <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                                <Star className="w-3 h-3 text-[var(--accent-yellow)]" />
                                {product.rating.toFixed(1)}
                              </span>
                              <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {product.views}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            {formatPrice(product.revenue)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[var(--text-tertiary)]">
                        등록된 상품이 없습니다
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Reaction Stats & Recommendations Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Reaction Stats Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <ReactionStatsWidget />
            </motion.div>

            {/* Personalized Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card variant="glass">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      추천 상품
                    </h2>
                  </div>
                  <CompactRecommendation type="products" limit={4} />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <Card variant="glass">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              빠른 작업
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/products/new">
                <div className="p-4 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-border)] transition-colors text-center group cursor-pointer">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                    <Package className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    새 상품 등록
                  </p>
                </div>
              </Link>
              <Link href="/dashboard/analytics">
                <div className="p-4 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-border)] transition-colors text-center group cursor-pointer">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--accent-cyan)]/10 flex items-center justify-center group-hover:bg-[var(--accent-cyan)]/20 transition-colors">
                    <TrendingUp className="w-6 h-6 text-[var(--accent-cyan)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    통계 분석
                  </p>
                </div>
              </Link>
              <Link href="/dashboard/purchases">
                <div className="p-4 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-border)] transition-colors text-center group cursor-pointer">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--accent-violet)]/10 flex items-center justify-center group-hover:bg-[var(--accent-violet)]/20 transition-colors">
                    <ShoppingBag className="w-6 h-6 text-[var(--accent-violet)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    구매 내역
                  </p>
                </div>
              </Link>
              <Link href="/dashboard/settings">
                <div className="p-4 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-border)] transition-colors text-center group cursor-pointer">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--accent-magenta)]/10 flex items-center justify-center group-hover:bg-[var(--accent-magenta)]/20 transition-colors">
                    <Clock className="w-6 h-6 text-[var(--accent-magenta)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    계정 설정
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// 반응 통계 위젯 컴포넌트
function ReactionStatsWidget() {
  const [stats, setStats] = useState<{
    totalReactions: number;
    byType: Record<string, number>;
    trend: { period: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics/reactions?period=week');
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalReactions: data.totalReactions || 0,
            byType: data.byType || {},
            trend: data.trend || [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch reaction stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const reactionIcons: Record<string, { icon: typeof Heart; color: string }> = {
    LIKE: { icon: Heart, color: 'text-red-500' },
    RECOMMEND: { icon: ThumbsUp, color: 'text-blue-500' },
    HELPFUL: { icon: Star, color: 'text-yellow-500' },
    BOOKMARK: { icon: Bookmark, color: 'text-purple-500' },
  };

  if (loading) {
    return (
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            이번 주 반응 통계
          </h2>
          <Link href="/dashboard/analytics">
            <Button variant="ghost" size="sm" className="gap-1">
              상세 보기
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Total Reactions */}
        <div className="text-center mb-6">
          <p className="text-4xl font-bold text-[var(--text-primary)]">
            {stats?.totalReactions?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">총 반응</p>
        </div>

        {/* Reaction Type Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(reactionIcons).map(([type, { icon: Icon, color }]) => (
            <div
              key={type}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)]"
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {stats?.byType?.[type]?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {type === 'LIKE' ? '좋아요' :
                   type === 'RECOMMEND' ? '추천' :
                   type === 'HELPFUL' ? '도움됨' : '북마크'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
