import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  forecastRevenue,
  analyzeTrend,
  detectAnomalies,
  analyzeGrowth,
  comparePeriods,
  mean,
  ForecastSummary,
  TrendAnalysis,
  GrowthAnalysis,
  Anomaly,
} from "@/lib/analytics";

export const dynamic = 'force-dynamic';

// ============================================
// GET: 고급 분석 데이터 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "forecast"; // forecast, trend, growth, anomaly, comparison
    const period = searchParams.get("period") || "30d";
    const productId = searchParams.get("productId");

    // 기간 계산
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
    }

    // 현재 기간 매출 데이터 조회
    const whereCondition = {
      product: { sellerId: session.user.id },
      status: "COMPLETED" as const,
      createdAt: { gte: startDate },
      ...(productId && { productId }),
    };

    const purchases = await prisma.purchase.findMany({
      where: whereCondition,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            title: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 이전 기간 매출 데이터 조회
    const previousPurchases = await prisma.purchase.findMany({
      where: {
        product: { sellerId: session.user.id },
        status: "COMPLETED" as const,
        createdAt: { gte: previousStartDate, lt: previousEndDate },
        ...(productId && { productId }),
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 일별 데이터 집계
    const dailyData = aggregateDailyData(purchases, startDate, now);
    const previousDailyData = aggregateDailyData(previousPurchases, previousStartDate, previousEndDate);

    // 분석 타입에 따른 응답
    switch (type) {
      case "forecast": {
        const forecast = forecastRevenue(
          dailyData.map(d => ({ date: d.date, value: d.revenue })),
          30 // 30일 예측
        );
        
        return NextResponse.json({
          type: "forecast",
          period,
          historical: dailyData,
          forecast,
          summary: generateForecastSummary(forecast, dailyData),
        });
      }

      case "trend": {
        const values = dailyData.map(d => d.revenue);
        const trend = analyzeTrend(values);
        
        return NextResponse.json({
          type: "trend",
          period,
          data: dailyData,
          analysis: trend,
          movingAverages: {
            sma7: calculateSMA(values, 7),
            sma21: calculateSMA(values, 21),
          },
        });
      }

      case "anomaly": {
        const values = dailyData.map(d => d.revenue);
        const anomalies = detectAnomalies(values, 2);
        
        // 이상치에 날짜 매핑
        const anomaliesWithDates = anomalies.map(a => ({
          ...a,
          date: dailyData[a.index]?.date || "",
        }));
        
        return NextResponse.json({
          type: "anomaly",
          period,
          data: dailyData,
          anomalies: anomaliesWithDates,
          stats: {
            total: anomalies.length,
            spikes: anomalies.filter(a => a.type === "spike").length,
            drops: anomalies.filter(a => a.type === "drop").length,
            highSeverity: anomalies.filter(a => a.severity === "high").length,
          },
        });
      }

      case "growth": {
        const currentValues = dailyData.map(d => d.revenue);
        const previousValues = previousDailyData.map(d => d.revenue);
        const growth = analyzeGrowth(currentValues, previousValues);
        
        return NextResponse.json({
          type: "growth",
          period,
          current: {
            data: dailyData,
            total: currentValues.reduce((a, b) => a + b, 0),
            average: mean(currentValues),
          },
          previous: {
            data: previousDailyData,
            total: previousValues.reduce((a, b) => a + b, 0),
            average: mean(previousValues),
          },
          analysis: growth,
        });
      }

      case "comparison": {
        const currentMetrics = calculateMetrics(purchases);
        const previousMetrics = calculateMetrics(previousPurchases);
        const comparison = comparePeriods(currentMetrics, previousMetrics);
        
        return NextResponse.json({
          type: "comparison",
          period,
          current: currentMetrics,
          previous: previousMetrics,
          comparison,
        });
      }

      case "comprehensive": {
        // 종합 분석
        const values = dailyData.map(d => d.revenue);
        const previousValues = previousDailyData.map(d => d.revenue);
        
        const forecast = forecastRevenue(
          dailyData.map(d => ({ date: d.date, value: d.revenue })),
          30
        );
        const trend = analyzeTrend(values);
        const anomalies = detectAnomalies(values, 2);
        const growth = analyzeGrowth(values, previousValues);
        
        return NextResponse.json({
          type: "comprehensive",
          period,
          data: dailyData,
          forecast,
          trend,
          anomalies: anomalies.map(a => ({
            ...a,
            date: dailyData[a.index]?.date || "",
          })),
          growth,
          insights: generateInsights(forecast, trend, growth, anomalies),
        });
      }

      default:
        return NextResponse.json(
          { error: "유효하지 않은 분석 타입입니다." },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Advanced analytics error:", error);
    return NextResponse.json(
      { error: "분석 데이터 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// ============================================
// 헬퍼 함수
// ============================================

interface DailyData {
  date: string;
  revenue: number;
  sales: number;
}

function aggregateDailyData(
  purchases: { amount: unknown; createdAt: Date }[],
  startDate: Date,
  endDate: Date
): DailyData[] {
  const dailyMap = new Map<string, { revenue: number; sales: number }>();
  
  // 기간 내 모든 날짜 초기화
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    dailyMap.set(dateStr, { revenue: 0, sales: 0 });
    current.setDate(current.getDate() + 1);
  }
  
  // 구매 데이터 집계
  for (const purchase of purchases) {
    const dateStr = purchase.createdAt.toISOString().split("T")[0];
    const existing = dailyMap.get(dateStr) || { revenue: 0, sales: 0 };
    const amount = typeof purchase.amount === 'object' && purchase.amount !== null
      ? Number(purchase.amount.toString())
      : Number(purchase.amount);
    dailyMap.set(dateStr, {
      revenue: existing.revenue + amount,
      sales: existing.sales + 1,
    });
  }
  
  // 배열로 변환
  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateSMA(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      const slice = values.slice(0, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    } else {
      const slice = values.slice(i - window + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / window);
    }
  }
  return result;
}

function calculateMetrics(purchases: { amount: unknown }[]): Record<string, number> {
  const amounts = purchases.map(p => {
    return typeof p.amount === 'object' && p.amount !== null
      ? Number(p.amount.toString())
      : Number(p.amount);
  });
  
  return {
    revenue: amounts.reduce((a, b) => a + b, 0),
    sales: purchases.length,
    averageOrderValue: purchases.length > 0 
      ? amounts.reduce((a, b) => a + b, 0) / purchases.length 
      : 0,
  };
}

function generateForecastSummary(
  forecast: ForecastSummary,
  historical: DailyData[]
): {
  nextWeekRevenue: number;
  nextMonthRevenue: number;
  expectedPeakDay: string;
  recommendation: string;
} {
  const nextWeekForecasts = forecast.forecasts.slice(0, 7);
  const nextWeekRevenue = nextWeekForecasts.reduce((sum, f) => sum + f.predicted, 0);
  const nextMonthRevenue = forecast.forecasts.reduce((sum, f) => sum + f.predicted, 0);
  
  // 예상 최고 매출일
  const peakForecast = forecast.forecasts.reduce((max, f) => 
    f.predicted > max.predicted ? f : max
  , forecast.forecasts[0] || { date: "", predicted: 0 });
  
  // 추천 사항
  let recommendation = "";
  if (forecast.trend === "up") {
    recommendation = "상승 추세입니다. 마케팅 활동을 강화하여 성장 모멘텀을 유지하세요.";
  } else if (forecast.trend === "down") {
    recommendation = "하락 추세입니다. 상품 가격이나 프로모션 전략을 검토해보세요.";
  } else {
    recommendation = "안정적인 추세입니다. 신규 상품 출시로 성장 동력을 확보하세요.";
  }
  
  return {
    nextWeekRevenue,
    nextMonthRevenue,
    expectedPeakDay: peakForecast?.date || "",
    recommendation,
  };
}

function generateInsights(
  forecast: ForecastSummary,
  trend: TrendAnalysis,
  growth: GrowthAnalysis,
  anomalies: Anomaly[]
): string[] {
  const insights: string[] = [];
  
  // 트렌드 인사이트
  if (trend.direction === "bullish") {
    insights.push(`📈 매출이 상승 추세입니다. 트렌드 강도: ${trend.strength.toFixed(0)}%`);
  } else if (trend.direction === "bearish") {
    insights.push(`📉 매출이 하락 추세입니다. 원인 분석이 필요합니다.`);
  }
  
  // 성장 인사이트
  if (growth.monthly > 10) {
    insights.push(`🚀 월간 성장률 ${growth.monthly.toFixed(1)}%로 빠른 성장 중입니다.`);
  } else if (growth.monthly < -10) {
    insights.push(`⚠️ 월간 ${Math.abs(growth.monthly).toFixed(1)}% 감소했습니다. 전략 수정이 필요합니다.`);
  }
  
  // 예측 인사이트
  if (forecast.expectedGrowth > 5) {
    insights.push(`🔮 다음 달 ${forecast.expectedGrowth.toFixed(1)}% 성장이 예상됩니다.`);
  }
  
  // 계절성 인사이트
  if (forecast.seasonalityDetected) {
    insights.push(`📅 주간 계절성 패턴이 감지되었습니다. 요일별 전략을 수립하세요.`);
  }
  
  // 이상치 인사이트
  const highSeverityAnomalies = anomalies.filter(a => a.severity === "high");
  if (highSeverityAnomalies.length > 0) {
    const spikes = highSeverityAnomalies.filter(a => a.type === "spike").length;
    const drops = highSeverityAnomalies.filter(a => a.type === "drop").length;
    if (spikes > 0) {
      insights.push(`⬆️ ${spikes}회의 급격한 매출 상승이 있었습니다. 성공 요인을 분석하세요.`);
    }
    if (drops > 0) {
      insights.push(`⬇️ ${drops}회의 급격한 매출 하락이 있었습니다. 원인을 파악하세요.`);
    }
  }
  
  // 변동성 인사이트
  if (trend.volatility > 50) {
    insights.push(`📊 매출 변동성이 높습니다 (${trend.volatility.toFixed(0)}%). 안정화 전략이 필요합니다.`);
  }
  
  // 성장 일관성 인사이트
  if (growth.consistency > 70) {
    insights.push(`✅ 성장이 일관적입니다 (${growth.consistency.toFixed(0)}%). 현재 전략을 유지하세요.`);
  }
  
  return insights.length > 0 
    ? insights 
    : ["분석 데이터가 충분하지 않습니다. 더 많은 판매 데이터가 필요합니다."];
}
