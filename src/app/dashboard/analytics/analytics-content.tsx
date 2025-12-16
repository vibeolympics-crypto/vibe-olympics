"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Eye,
  Users,
  ArrowUp,
  ArrowDown,
  Loader2,
  Download,
  PieChart as PieChartIcon,
  BarChart2,
  Activity,
  FileSpreadsheet,
  Book,
  Film,
  Music,
  Package,
  Layers,
  Brain,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdvancedAnalytics } from "@/components/dashboard/advanced-analytics";
import { cn, formatPrice } from "@/lib/utils";
import {
  RevenueLineChart,
  SalesBarChart,
  CategoryPieChart,
  ConversionChart,
  Sparkline,
} from "@/components/ui/charts";
import {
  ProductTypeRevenuePieChart,
  ProductTypeTrendChart,
  ProductTypeBarChart,
  ProductTypeRadarChart,
  PeriodComparisonChart,
  ProductTypeStatCard,
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_ICONS,
  PRODUCT_TYPE_COLORS,
} from "@/components/ui/product-type-charts";

// 기간 옵션
const periodOptions = [
  { id: "7d", name: "7일" },
  { id: "30d", name: "30일" },
  { id: "90d", name: "90일" },
  { id: "1y", name: "1년" },
];

// ProductType 필터 옵션
const productTypeOptions = [
  { id: "all", name: "전체", icon: Layers },
  { id: "DIGITAL_PRODUCT", name: "디지털 상품", icon: Package },
  { id: "BOOK", name: "도서", icon: Book },
  { id: "VIDEO_SERIES", name: "영상 시리즈", icon: Film },
  { id: "MUSIC_ALBUM", name: "음악 앨범", icon: Music },
];

interface ProductTypeAnalytics {
  revenue: {
    productType: string;
    name: string;
    revenue: number;
    sales: number;
    percentage: number;
  }[];
  growth: {
    productType: string;
    name: string;
    current: number;
    previous: number;
    change: number;
  }[];
  dailyTrend: {
    date: string;
    DIGITAL_PRODUCT: number;
    BOOK: number;
    VIDEO_SERIES: number;
    MUSIC_ALBUM: number;
  }[];
  weeklyComparison: {
    period: string;
    DIGITAL_PRODUCT: number;
    BOOK: number;
    VIDEO_SERIES: number;
    MUSIC_ALBUM: number;
  }[];
  performanceRadar: {
    metric: string;
    DIGITAL_PRODUCT: number;
    BOOK: number;
    VIDEO_SERIES: number;
    MUSIC_ALBUM: number;
    fullMark: number;
  }[];
  stats: Record<string, {
    revenue: number;
    sales: number;
    previousRevenue: number;
    previousSales: number;
    viewCount: number;
    growth: number;
    conversionRate: number;
  }>;
}

interface AnalyticsData {
  stats: {
    revenue: { current: number; previous: number; trend: number[] };
    sales: { current: number; previous: number; trend: number[] };
    views: { current: number; previous: number; trend: number[] };
    customers: { current: number; previous: number; trend: number[] };
  };
  dailyRevenue: { date: string; revenue: number; sales: number }[];
  productPerformance: {
    id: string;
    title: string;
    revenue: number;
    sales: number;
    views: number;
    conversionRate: number;
  }[];
  categoryBreakdown: { name: string; value: number }[];
  conversionData: { date: string; views: number; conversions: number; rate: number }[];
  weeklyComparison: { name: string; sales: number; revenue: number }[];
  productTypeAnalytics?: ProductTypeAnalytics;
}

type ChartTabType = "revenue" | "conversion" | "category" | "weekly" | "productType" | "productTypeTrend" | "productTypeWeekly" | "productTypeRadar" | "advanced";

type ViewMode = "basic" | "advanced";

export function AnalyticsContent() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedProductType, setSelectedProductType] = useState("all");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<ChartTabType>("revenue");
  const [showProductTypeCards, setShowProductTypeCards] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("basic");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const productTypeParam = selectedProductType !== "all" ? `&productType=${selectedProductType}` : "";
        const response = await fetch(`/api/analytics?period=${selectedPeriod}${productTypeParam}`);
        if (response.ok) {
          const analyticsData = await response.json();
          
          // 서버 응답에 추가 데이터가 없으면 생성
          const enhancedData: AnalyticsData = {
            ...analyticsData,
            stats: {
              ...analyticsData.stats,
              revenue: {
                ...analyticsData.stats.revenue,
                trend: analyticsData.stats.revenue.trend || generateTrend(7, analyticsData.stats.revenue.current),
              },
              sales: {
                ...analyticsData.stats.sales,
                trend: analyticsData.stats.sales.trend || generateTrend(7, analyticsData.stats.sales.current),
              },
              views: {
                ...analyticsData.stats.views,
                trend: analyticsData.stats.views.trend || generateTrend(7, analyticsData.stats.views.current),
              },
              customers: {
                ...analyticsData.stats.customers,
                trend: analyticsData.stats.customers.trend || generateTrend(7, analyticsData.stats.customers.current),
              },
            },
            categoryBreakdown: analyticsData.categoryBreakdown || generateCategoryData(),
            conversionData: analyticsData.conversionData || generateConversionData(analyticsData.dailyRevenue),
            weeklyComparison: analyticsData.weeklyComparison || generateWeeklyData(),
            productTypeAnalytics: analyticsData.productTypeAnalytics,
          };
          
          setData(enhancedData);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedPeriod, selectedProductType]);

  // 트렌드 데이터 생성 (서버에서 안올 경우)
  function generateTrend(days: number, currentValue: number): number[] {
    const trend: number[] = [];
    for (let i = 0; i < days; i++) {
      const variance = Math.random() * 0.3 - 0.15;
      trend.push(Math.max(0, Math.round(currentValue * (0.7 + variance + (i * 0.04)))));
    }
    return trend;
  }

  function generateCategoryData() {
    return [
      { name: "비즈니스", value: 45000 },
      { name: "자동화", value: 35000 },
      { name: "데이터 분석", value: 28000 },
      { name: "교육", value: 22000 },
      { name: "기타", value: 15000 },
    ];
  }

  function generateConversionData(dailyRevenue: { date: string; revenue: number; sales: number }[]) {
    return dailyRevenue.map((day) => ({
      date: day.date,
      views: Math.round(day.sales * (10 + Math.random() * 20)),
      conversions: day.sales,
      rate: day.sales > 0 ? Math.round(day.sales / (day.sales * (10 + Math.random() * 20)) * 100 * 10) / 10 : 0,
    }));
  }

  function generateWeeklyData() {
    const weeks = ["1주차", "2주차", "3주차", "4주차"];
    return weeks.map((name) => ({
      name,
      sales: Math.round(Math.random() * 50 + 10),
      revenue: Math.round(Math.random() * 500 + 100),
    }));
  }

  // 통계 카드 데이터
  const stats = data
    ? [
        {
          name: "총 수익",
          value: data.stats.revenue.current,
          previousValue: data.stats.revenue.previous,
          icon: DollarSign,
          format: "currency" as const,
          trend: data.stats.revenue.trend,
          color: "#8B5CF6",
        },
        {
          name: "판매 건수",
          value: data.stats.sales.current,
          previousValue: data.stats.sales.previous,
          icon: ShoppingBag,
          format: "number" as const,
          trend: data.stats.sales.trend,
          color: "#06B6D4",
        },
        {
          name: "조회수",
          value: data.stats.views.current,
          previousValue: data.stats.views.previous,
          icon: Eye,
          format: "number" as const,
          trend: data.stats.views.trend,
          color: "#10B981",
        },
        {
          name: "신규 고객",
          value: data.stats.customers.current,
          previousValue: data.stats.customers.previous,
          icon: Users,
          format: "number" as const,
          trend: data.stats.customers.trend,
          color: "#F59E0B",
        },
      ]
    : [];

  const dailyRevenue = data?.dailyRevenue || [];
  const productPerformance = data?.productPerformance || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const conversionData = data?.conversionData || [];
  const weeklyComparison = data?.weeklyComparison || [];
  const productTypeAnalytics = data?.productTypeAnalytics;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            수익/통계
          </h1>
          <p className="text-[var(--text-tertiary)] mt-1">
            판매 현황과 수익을 분석하세요
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex gap-1 p-1 bg-[var(--bg-elevated)] rounded-lg">
            <Button
              variant={viewMode === "basic" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("basic")}
              className="gap-1.5"
            >
              <BarChart2 className="w-4 h-4" />
              기본
            </Button>
            <Button
              variant={viewMode === "advanced" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("advanced")}
              className="gap-1.5"
            >
              <Brain className="w-4 h-4" />
              AI 분석
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = "/api/export/sales"}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            판매 내역 다운로드
          </Button>
          <div className="flex gap-2">
            {periodOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedPeriod === option.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(option.id)}
                disabled={isLoading}
              >
                {option.name}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            내보내기
          </Button>
        </div>
      </div>

      {/* ProductType Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <span className="text-sm text-[var(--text-tertiary)] whitespace-nowrap">상품 유형:</span>
        {productTypeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.id}
              variant={selectedProductType === option.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedProductType(option.id)}
              disabled={isLoading}
              className="gap-1.5 whitespace-nowrap"
            >
              <Icon className="w-4 h-4" />
              {option.name}
            </Button>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : viewMode === "advanced" ? (
        /* Advanced Analytics Mode */
        <AdvancedAnalytics />
      ) : (
        <>
          {/* Stats Grid with Sparklines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
              const change =
                stat.previousValue > 0
                  ? ((stat.value - stat.previousValue) / stat.previousValue) * 100
                  : 0;
              const isPositive = change >= 0;

              return (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="glass" className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                          <stat.icon className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        {stat.previousValue > 0 && (
                          <div
                            className={cn(
                              "flex items-center gap-1 text-sm font-medium",
                              isPositive
                                ? "text-[var(--accent-green)]"
                                : "text-[var(--semantic-error)]"
                            )}
                          >
                            {isPositive ? (
                              <ArrowUp className="w-4 h-4" />
                            ) : (
                              <ArrowDown className="w-4 h-4" />
                            )}
                            {Math.abs(change).toFixed(1)}%
                          </div>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                        {stat.format === "currency"
                          ? formatPrice(stat.value)
                          : stat.value.toLocaleString()}
                      </div>
                      <div className="text-sm text-[var(--text-tertiary)] mb-3">
                        {stat.name}
                      </div>
                      {/* 미니 스파크라인 */}
                      <div className="h-10 -mx-2">
                        <Sparkline data={stat.trend} color={stat.color} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* ProductType별 분석 카드 */}
          {productTypeAnalytics && selectedProductType === "all" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  📊 상품 유형별 분석
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProductTypeCards(!showProductTypeCards)}
                >
                  {showProductTypeCards ? "접기" : "펼치기"}
                </Button>
              </div>
              
              {showProductTypeCards && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(["DIGITAL_PRODUCT", "BOOK", "VIDEO_SERIES", "MUSIC_ALBUM"] as const).map((type) => {
                    const stats = productTypeAnalytics.stats[type];
                    if (!stats) return null;
                    return (
                      <ProductTypeStatCard
                        key={type}
                        productType={type}
                        revenue={stats.revenue}
                        sales={stats.sales}
                        growth={stats.growth}
                        viewCount={stats.viewCount}
                        conversionRate={stats.conversionRate}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Main Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Main Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card variant="glass">
                <CardContent className="p-6">
                  {/* Chart Tabs */}
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      {activeChart === "revenue" && "수익 추이"}
                      {activeChart === "conversion" && "전환율 분석"}
                      {activeChart === "category" && "카테고리별 판매"}
                      {activeChart === "weekly" && "주간 비교"}
                      {activeChart === "productType" && "상품 유형별 매출"}
                      {activeChart === "productTypeTrend" && "유형별 매출 추이"}
                      {activeChart === "productTypeWeekly" && "유형별 주간 비교"}
                      {activeChart === "productTypeRadar" && "유형별 성과 비교"}
                    </h2>
                    <div className="flex gap-1 flex-wrap">
                      {/* 기본 차트 탭 */}
                      <Button
                        variant={activeChart === "revenue" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveChart("revenue")}
                        className="gap-1"
                      >
                        <Activity className="w-4 h-4" />
                        수익
                      </Button>
                      <Button
                        variant={activeChart === "conversion" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveChart("conversion")}
                        className="gap-1"
                      >
                        <TrendingUp className="w-4 h-4" />
                        전환
                      </Button>
                      <Button
                        variant={activeChart === "category" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveChart("category")}
                        className="gap-1"
                      >
                        <PieChartIcon className="w-4 h-4" />
                        카테고리
                      </Button>
                      <Button
                        variant={activeChart === "weekly" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveChart("weekly")}
                        className="gap-1"
                      >
                        <BarChart2 className="w-4 h-4" />
                        주간
                      </Button>
                      {/* ProductType 차트 탭 */}
                      {productTypeAnalytics && (
                        <>
                          <div className="w-px h-6 bg-[var(--bg-border)] mx-1" />
                          <Button
                            variant={activeChart === "productType" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveChart("productType")}
                            className="gap-1"
                          >
                            <Package className="w-4 h-4" />
                            유형
                          </Button>
                          <Button
                            variant={activeChart === "productTypeTrend" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveChart("productTypeTrend")}
                            className="gap-1"
                          >
                            <TrendingUp className="w-4 h-4" />
                            트렌드
                          </Button>
                          <Button
                            variant={activeChart === "productTypeWeekly" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveChart("productTypeWeekly")}
                            className="gap-1"
                          >
                            <BarChart2 className="w-4 h-4" />
                            비교
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Chart Content */}
                  <div className="h-[350px]">
                    {activeChart === "revenue" && (
                      <RevenueLineChart data={dailyRevenue} height={350} />
                    )}
                    {activeChart === "conversion" && (
                      <ConversionChart data={conversionData} height={350} />
                    )}
                    {activeChart === "category" && (
                      <CategoryPieChart data={categoryBreakdown} height={350} />
                    )}
                    {activeChart === "weekly" && (
                      <SalesBarChart data={weeklyComparison} height={350} />
                    )}
                    {/* ProductType 차트들 */}
                    {activeChart === "productType" && productTypeAnalytics && (
                      <ProductTypeRevenuePieChart 
                        data={productTypeAnalytics.revenue} 
                        height={350} 
                      />
                    )}
                    {activeChart === "productTypeTrend" && productTypeAnalytics && (
                      <ProductTypeTrendChart 
                        data={productTypeAnalytics.dailyTrend} 
                        height={350}
                        metric="revenue"
                      />
                    )}
                    {activeChart === "productTypeWeekly" && productTypeAnalytics && (
                      <ProductTypeBarChart 
                        data={productTypeAnalytics.weeklyComparison} 
                        height={350}
                        stacked={false}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Product Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card variant="glass" className="h-full">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                    인기 상품
                  </h2>
                  <div className="space-y-4">
                    {productPerformance.length > 0 ? (
                      productPerformance.slice(0, 5).map((product, index) => (
                        <div
                          key={product.id}
                          className="p-4 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-border)] transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-[var(--text-primary)] truncate">
                                {product.title}
                              </h3>
                              <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-tertiary)]">
                                <span className="flex items-center gap-1">
                                  <ShoppingBag className="w-3 h-3" />
                                  {product.sales}건
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {product.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {product.conversionRate}%
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-[var(--accent-green)]">
                              {formatPrice(product.revenue)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[var(--text-tertiary)]">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>아직 판매 데이터가 없습니다</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="holographic">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      📊 기간 요약
                    </h2>
                    <p className="text-[var(--text-tertiary)]">
                      {data && data.stats.revenue.previous > 0 ? (
                        <>
                          이전 기간 대비{" "}
                          <span
                            className={cn(
                              "font-medium",
                              data.stats.revenue.current >= data.stats.revenue.previous
                                ? "text-[var(--accent-green)]"
                                : "text-[var(--semantic-error)]"
                            )}
                          >
                            {(
                              ((data.stats.revenue.current - data.stats.revenue.previous) /
                                data.stats.revenue.previous) *
                              100
                            ).toFixed(1)}
                            %
                          </span>{" "}
                          {data.stats.revenue.current >= data.stats.revenue.previous
                            ? "성장했습니다 🎉"
                            : "감소했습니다"}
                        </>
                      ) : (
                        "첫 판매를 기다리고 있습니다! 💪"
                      )}
                    </p>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[var(--text-primary)]">
                        {formatPrice(data?.stats.revenue.current || 0)}
                      </div>
                      <div className="text-sm text-[var(--text-tertiary)]">총 수익</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[var(--text-primary)]">
                        {data?.stats.sales.current || 0}건
                      </div>
                      <div className="text-sm text-[var(--text-tertiary)]">총 판매</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[var(--text-primary)]">
                        {data?.stats.views.current && data.stats.sales.current
                          ? ((data.stats.sales.current / data.stats.views.current) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </div>
                      <div className="text-sm text-[var(--text-tertiary)]">평균 전환율</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ProductType 기간 비교 차트 */}
          {productTypeAnalytics && productTypeAnalytics.growth.some(g => g.current > 0 || g.previous > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8"
            >
              <Card variant="glass">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                    📈 상품 유형별 기간 비교
                  </h2>
                  <div className="h-[300px]">
                    <PeriodComparisonChart 
                      data={productTypeAnalytics.growth.filter(g => g.current > 0 || g.previous > 0)} 
                      height={300} 
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
