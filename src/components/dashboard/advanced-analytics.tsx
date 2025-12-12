"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  LineChart,
  BarChart2,
  Target,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Loader2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

// 타입 정의
interface ForecastResult {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

interface ForecastSummary {
  forecasts: ForecastResult[];
  trend: 'up' | 'down' | 'stable';
  trendStrength: number;
  expectedGrowth: number;
  seasonalityDetected: boolean;
  modelAccuracy: number;
}

interface TrendAnalysis {
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  momentum: number;
  volatility: number;
  support: number;
  resistance: number;
  signals: {
    type: 'buy' | 'sell' | 'hold';
    reason: string;
    confidence: number;
  }[];
}

interface GrowthAnalysis {
  daily: number;
  weekly: number;
  monthly: number;
  quarterlyProjection: number;
  yearlyProjection: number;
  compoundGrowthRate: number;
  consistency: number;
}

interface Anomaly {
  index: number;
  date: string;
  value: number;
  expected: number;
  deviation: number;
  type: 'spike' | 'drop';
  severity: 'low' | 'medium' | 'high';
}

interface ComprehensiveData {
  type: string;
  period: string;
  data: { date: string; revenue: number; sales: number }[];
  forecast: ForecastSummary;
  trend: TrendAnalysis;
  anomalies: Anomaly[];
  growth: GrowthAnalysis;
  insights: string[];
}

// 기간 옵션
const periodOptions = [
  { id: "7d", name: "7일" },
  { id: "30d", name: "30일" },
  { id: "90d", name: "90일" },
];

export function AdvancedAnalytics() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading, refetch, isRefetching } = useQuery<ComprehensiveData>({
    queryKey: ["advanced-analytics", period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/advanced?type=comprehensive&period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">분석 데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">고급 분석</h2>
          <p className="text-muted-foreground">AI 기반 매출 예측 및 트렌드 분석</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 기간 선택 */}
          <div className="flex bg-muted rounded-lg p-1">
            {periodOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setPeriod(option.id)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  period === option.id
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.name}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* 예측 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ForecastCard
          title="예상 트렌드"
          trend={data.forecast.trend}
          strength={data.forecast.trendStrength}
        />
        <GrowthCard
          title="예상 성장률"
          value={data.forecast.expectedGrowth}
        />
        <AccuracyCard
          title="모델 정확도"
          value={data.forecast.modelAccuracy}
        />
        <ConsistencyCard
          title="성장 일관성"
          value={data.growth.consistency}
        />
      </div>

      {/* 메인 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 매출 예측 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              매출 예측 (30일)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ForecastChart
              historical={data.data}
              forecast={data.forecast.forecasts}
            />
            <div className="mt-4 text-sm text-muted-foreground">
              {data.forecast.seasonalityDetected && (
                <p className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  주간 계절성 패턴 감지됨
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 트렌드 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              트렌드 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendIndicator trend={data.trend} />
            <div className="mt-4 space-y-3">
              <MetricRow
                label="모멘텀"
                value={`${data.trend.momentum >= 0 ? "+" : ""}${data.trend.momentum.toFixed(1)}%`}
                trend={data.trend.momentum >= 0 ? "up" : "down"}
              />
              <MetricRow
                label="변동성"
                value={`${data.trend.volatility.toFixed(1)}%`}
                trend={data.trend.volatility > 30 ? "down" : "up"}
              />
              <MetricRow
                label="지지선"
                value={formatPrice(data.trend.support)}
              />
              <MetricRow
                label="저항선"
                value={formatPrice(data.trend.resistance)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 성장률 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            성장률 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <GrowthMetric
              label="일간"
              value={data.growth.daily}
              suffix="%"
            />
            <GrowthMetric
              label="주간"
              value={data.growth.weekly}
              suffix="%"
            />
            <GrowthMetric
              label="월간"
              value={data.growth.monthly}
              suffix="%"
            />
            <GrowthMetric
              label="분기 예측"
              value={data.growth.quarterlyProjection}
              suffix="%"
            />
            <GrowthMetric
              label="연간 예측"
              value={data.growth.yearlyProjection}
              suffix="%"
            />
            <GrowthMetric
              label="복리 성장률"
              value={data.growth.compoundGrowthRate}
              suffix="%"
            />
          </div>
        </CardContent>
      </Card>

      {/* 이상치 탐지 */}
      {data.anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              이상치 탐지 ({data.anomalies.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.anomalies.slice(0, 5).map((anomaly, index) => (
                <AnomalyRow key={index} anomaly={anomaly} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI 인사이트 */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {data.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 p-3 bg-background rounded-lg"
                >
                  <ChevronRight className="w-4 h-4 mt-0.5 text-primary" />
                  <p className="text-sm">{insight}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* 트레이딩 시그널 */}
      {data.trend.signals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              액션 시그널
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.trend.signals.map((signal, index) => (
                <SignalCard key={index} signal={signal} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 서브 컴포넌트들
function ForecastCard({
  title,
  trend,
  strength,
}: {
  title: string;
  trend: "up" | "down" | "stable";
  strength: number;
}) {
  const trendConfig = {
    up: { icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", label: "상승" },
    down: { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10", label: "하락" },
    stable: { icon: Minus, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "안정" },
  };

  const config = trendConfig[trend];
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className={cn("p-2 rounded-full", config.bg)}>
            <Icon className={cn("w-4 h-4", config.color)} />
          </div>
        </div>
        <div className="mt-2">
          <p className={cn("text-2xl font-bold", config.color)}>{config.label}</p>
          <p className="text-sm text-muted-foreground">
            강도: {(strength * 100).toFixed(0)}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function GrowthCard({ title, value }: { title: string; value: number }) {
  const isPositive = value >= 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className={cn(
            "p-2 rounded-full",
            isPositive ? "bg-green-500/10" : "bg-red-500/10"
          )}>
            {isPositive ? (
              <ArrowUp className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
        <div className="mt-2">
          <p className={cn(
            "text-2xl font-bold",
            isPositive ? "text-green-500" : "text-red-500"
          )}>
            {isPositive ? "+" : ""}{value.toFixed(1)}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AccuracyCard({ title, value }: { title: string; value: number }) {
  const percentage = value * 100;
  const color = percentage >= 70 ? "text-green-500" : percentage >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="mt-2">
          <p className={cn("text-2xl font-bold", color)}>{percentage.toFixed(0)}%</p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", color.replace("text-", "bg-"))}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConsistencyCard({ title, value }: { title: string; value: number }) {
  const color = value >= 70 ? "text-green-500" : value >= 40 ? "text-yellow-500" : "text-red-500";

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="mt-2">
          <p className={cn("text-2xl font-bold", color)}>{value.toFixed(0)}%</p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", color.replace("text-", "bg-"))}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastChart({
  historical,
  forecast,
}: {
  historical: { date: string; revenue: number }[];
  forecast: ForecastResult[];
}) {
  // 간단한 SVG 차트
  interface ChartDataPoint {
    date: string;
    revenue: number;
    type: string;
    lowerBound?: number;
    upperBound?: number;
  }

  const historicalData: ChartDataPoint[] = historical.slice(-14).map(d => ({ 
    date: d.date,
    revenue: d.revenue, 
    type: "historical" 
  }));
  
  const forecastData: ChartDataPoint[] = forecast.slice(0, 14).map(d => ({
    date: d.date,
    revenue: d.predicted,
    type: "forecast",
    lowerBound: d.lowerBound,
    upperBound: d.upperBound,
  }));

  const allData: ChartDataPoint[] = [...historicalData, ...forecastData];

  const maxValue = Math.max(...allData.map(d => 
    d.upperBound !== undefined ? d.upperBound : d.revenue
  ));
  const minValue = 0;

  const width = 100;
  const height = 40;
  const padding = 2;

  const getX = (index: number) => (index / (allData.length - 1)) * (width - padding * 2) + padding;
  const getY = (value: number) => height - padding - ((value - minValue) / (maxValue - minValue)) * (height - padding * 2);

  // 히스토리컬 포인트
  const historicalPoints = allData
    .filter(d => d.type === "historical")
    .map((d, i) => `${getX(i)},${getY(d.revenue)}`)
    .join(" ");

  // 예측 포인트
  const forecastStartIndex = historical.slice(-14).length;
  const forecastPoints = allData
    .filter(d => d.type === "forecast")
    .map((d, i) => `${getX(forecastStartIndex + i)},${getY(d.revenue)}`)
    .join(" ");

  return (
    <div className="h-40">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* 히스토리컬 라인 */}
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          points={historicalPoints}
        />
        
        {/* 예측 라인 (점선) */}
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          strokeDasharray="1,1"
          points={forecastPoints}
        />
        
        {/* 신뢰 구간 */}
        {allData
          .filter(d => d.type === "forecast")
          .map((d, i) => {
            const x = getX(forecastStartIndex + i);
            const upper = d.upperBound !== undefined ? d.upperBound : d.revenue;
            const lower = d.lowerBound !== undefined ? d.lowerBound : d.revenue;
            return (
              <line
                key={i}
                x1={x}
                y1={getY(upper)}
                x2={x}
                y2={getY(lower)}
                stroke="hsl(var(--primary))"
                strokeWidth="0.3"
                opacity="0.3"
              />
            );
          })}
      </svg>
      
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-primary" />
          실제 매출
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 bg-primary border-dashed" style={{ borderTopWidth: 1 }} />
          예측 매출
        </span>
      </div>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: TrendAnalysis }) {
  const directionConfig = {
    bullish: { label: "강세", color: "text-green-500", bg: "bg-green-500" },
    bearish: { label: "약세", color: "text-red-500", bg: "bg-red-500" },
    neutral: { label: "중립", color: "text-yellow-500", bg: "bg-yellow-500" },
  };

  const config = directionConfig[trend.direction];

  return (
    <div className="flex items-center gap-4">
      <div className={cn("px-4 py-2 rounded-lg", config.bg, "bg-opacity-10")}>
        <p className={cn("text-xl font-bold", config.color)}>{config.label}</p>
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">트렌드 강도</p>
        <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full", config.bg)}
            style={{ width: `${Math.min(100, trend.strength)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn(
        "font-medium",
        trend === "up" && "text-green-500",
        trend === "down" && "text-red-500"
      )}>
        {value}
      </span>
    </div>
  );
}

function GrowthMetric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  const isPositive = value >= 0;

  return (
    <div className="text-center p-3 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn(
        "text-lg font-bold",
        isPositive ? "text-green-500" : "text-red-500"
      )}>
        {isPositive ? "+" : ""}{value.toFixed(1)}{suffix}
      </p>
    </div>
  );
}

function AnomalyRow({ anomaly }: { anomaly: Anomaly }) {
  const severityColors = {
    low: "bg-yellow-500/10 text-yellow-500",
    medium: "bg-orange-500/10 text-orange-500",
    high: "bg-red-500/10 text-red-500",
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg",
      severityColors[anomaly.severity].split(" ")[0]
    )}>
      <div className="flex items-center gap-3">
        {anomaly.type === "spike" ? (
          <ArrowUp className="w-4 h-4 text-green-500" />
        ) : (
          <ArrowDown className="w-4 h-4 text-red-500" />
        )}
        <div>
          <p className="font-medium">{anomaly.date}</p>
          <p className="text-sm text-muted-foreground">
            실제: {formatPrice(anomaly.value)} / 예상: {formatPrice(anomaly.expected)}
          </p>
        </div>
      </div>
      <span className={cn(
        "px-2 py-1 rounded text-xs font-medium",
        severityColors[anomaly.severity]
      )}>
        {anomaly.severity === "high" ? "높음" : anomaly.severity === "medium" ? "중간" : "낮음"}
      </span>
    </div>
  );
}

function SignalCard({
  signal,
}: {
  signal: { type: "buy" | "sell" | "hold"; reason: string; confidence: number };
}) {
  const typeConfig = {
    buy: { label: "매수", color: "text-green-500", bg: "bg-green-500/10" },
    sell: { label: "매도", color: "text-red-500", bg: "bg-red-500/10" },
    hold: { label: "유지", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  };

  const config = typeConfig[signal.type];

  return (
    <div className={cn("p-4 rounded-lg", config.bg)}>
      <div className="flex items-center justify-between">
        <span className={cn("font-bold", config.color)}>{config.label}</span>
        <span className="text-sm text-muted-foreground">
          신뢰도: {(signal.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <p className="mt-2 text-sm">{signal.reason}</p>
    </div>
  );
}
