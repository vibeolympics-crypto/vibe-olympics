/**
 * 고급 분석 유틸리티
 * - 매출 예측 (선형 회귀 + 계절성)
 * - 트렌드 분석
 * - 이상치 탐지
 * - 성장률 예측
 */

// ============================================
// 통계 기본 함수
// ============================================

/**
 * 평균 계산
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * 표준편차 계산
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * 중앙값 계산
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * 백분위수 계산
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// ============================================
// 선형 회귀
// ============================================

interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  predict: (x: number) => number;
}

/**
 * 단순 선형 회귀
 */
export function linearRegression(x: number[], y: number[]): LinearRegressionResult {
  const n = x.length;
  if (n === 0 || n !== y.length) {
    return { slope: 0, intercept: 0, r2: 0, predict: () => 0 };
  }

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² 계산
  const yMean = mean(y);
  const ssTotal = y.reduce((total, yi) => total + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce((total, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return total + Math.pow(yi - predicted, 2);
  }, 0);
  const r2 = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return {
    slope: isNaN(slope) ? 0 : slope,
    intercept: isNaN(intercept) ? 0 : intercept,
    r2: isNaN(r2) ? 0 : r2,
    predict: (xVal: number) => {
      const result = slope * xVal + intercept;
      return isNaN(result) ? 0 : result;
    },
  };
}

// ============================================
// 이동 평균
// ============================================

/**
 * 단순 이동 평균 (SMA)
 */
export function simpleMovingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      result.push(mean(values.slice(0, i + 1)));
    } else {
      result.push(mean(values.slice(i - window + 1, i + 1)));
    }
  }
  return result;
}

/**
 * 지수 이동 평균 (EMA)
 */
export function exponentialMovingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (window + 1);
  
  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      result.push(values[0]);
    } else {
      const ema = (values[i] - result[i - 1]) * multiplier + result[i - 1];
      result.push(ema);
    }
  }
  return result;
}

// ============================================
// 매출 예측
// ============================================

export interface ForecastResult {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface ForecastSummary {
  forecasts: ForecastResult[];
  trend: 'up' | 'down' | 'stable';
  trendStrength: number;
  expectedGrowth: number;
  seasonalityDetected: boolean;
  modelAccuracy: number;
}

/**
 * 매출 예측 (선형 회귀 + 계절성 조정)
 */
export function forecastRevenue(
  historicalData: { date: string; value: number }[],
  daysToForecast: number = 30
): ForecastSummary {
  if (historicalData.length < 7) {
    return {
      forecasts: [],
      trend: 'stable',
      trendStrength: 0,
      expectedGrowth: 0,
      seasonalityDetected: false,
      modelAccuracy: 0,
    };
  }

  const values = historicalData.map(d => d.value);
  const x = values.map((_, i) => i);
  
  // 선형 회귀로 기본 트렌드 추출
  const regression = linearRegression(x, values);
  
  // 계절성 탐지 (7일 주기)
  const seasonalityFactors = detectSeasonality(values, 7);
  const seasonalityDetected = seasonalityFactors.some(f => Math.abs(f - 1) > 0.1);
  
  // 예측 생성
  const forecasts: ForecastResult[] = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const stdDev = standardDeviation(values);
  
  for (let i = 1; i <= daysToForecast; i++) {
    const futureX = values.length + i - 1;
    const basePrediction = regression.predict(futureX);
    
    // 계절성 조정
    const seasonIndex = (values.length + i - 1) % 7;
    const seasonalFactor = seasonalityFactors[seasonIndex] || 1;
    const predicted = Math.max(0, basePrediction * seasonalFactor);
    
    // 신뢰 구간 (예측 거리에 따라 확대)
    const confidenceMultiplier = 1 + (i / daysToForecast) * 0.5;
    const margin = stdDev * 1.96 * confidenceMultiplier;
    
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      predicted: Math.round(predicted),
      lowerBound: Math.max(0, Math.round(predicted - margin)),
      upperBound: Math.round(predicted + margin),
      confidence: Math.max(0.5, regression.r2 * (1 - i / (daysToForecast * 2))),
    });
  }
  
  // 트렌드 분석
  const trend = regression.slope > stdDev * 0.1 ? 'up' 
    : regression.slope < -stdDev * 0.1 ? 'down' 
    : 'stable';
  
  const trendStrength = Math.min(1, Math.abs(regression.slope) / (mean(values) || 1));
  
  // 예상 성장률
  const currentAvg = mean(values.slice(-7));
  const forecastAvg = mean(forecasts.map(f => f.predicted));
  const expectedGrowth = currentAvg > 0 ? ((forecastAvg - currentAvg) / currentAvg) * 100 : 0;
  
  return {
    forecasts,
    trend,
    trendStrength,
    expectedGrowth,
    seasonalityDetected,
    modelAccuracy: regression.r2,
  };
}

/**
 * 계절성 탐지
 */
function detectSeasonality(values: number[], period: number): number[] {
  const factors: number[] = [];
  const avgValue = mean(values);
  
  if (avgValue === 0) {
    return Array(period).fill(1);
  }
  
  for (let i = 0; i < period; i++) {
    const periodValues: number[] = [];
    for (let j = i; j < values.length; j += period) {
      periodValues.push(values[j]);
    }
    const periodAvg = mean(periodValues);
    factors.push(periodAvg / avgValue);
  }
  
  return factors;
}

// ============================================
// 트렌드 분석
// ============================================

export interface TrendAnalysis {
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  momentum: number; // 변화율
  volatility: number;
  support: number; // 지지선
  resistance: number; // 저항선
  signals: TrendSignal[];
}

export interface TrendSignal {
  type: 'buy' | 'sell' | 'hold';
  reason: string;
  confidence: number;
}

/**
 * 트렌드 분석
 */
export function analyzeTrend(values: number[]): TrendAnalysis {
  if (values.length < 5) {
    return {
      direction: 'neutral',
      strength: 0,
      momentum: 0,
      volatility: 0,
      support: 0,
      resistance: 0,
      signals: [],
    };
  }
  
  const sma7 = simpleMovingAverage(values, 7);
  const sma21 = simpleMovingAverage(values, Math.min(21, values.length));
  const _ema12 = exponentialMovingAverage(values, 12);
  
  // 방향 결정
  const lastSma7 = sma7[sma7.length - 1];
  const lastSma21 = sma21[sma21.length - 1];
  const lastValue = values[values.length - 1];
  
  let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (lastValue > lastSma7 && lastSma7 > lastSma21) {
    direction = 'bullish';
  } else if (lastValue < lastSma7 && lastSma7 < lastSma21) {
    direction = 'bearish';
  }
  
  // 강도 계산
  const recentValues = values.slice(-7);
  const regression = linearRegression(
    recentValues.map((_, i) => i),
    recentValues
  );
  const strength = Math.min(100, Math.abs(regression.slope) / (mean(values) || 1) * 1000);
  
  // 모멘텀 (최근 변화율)
  const momentum = values.length > 1 
    ? ((lastValue - values[values.length - 2]) / (values[values.length - 2] || 1)) * 100 
    : 0;
  
  // 변동성
  const volatility = (standardDeviation(values) / (mean(values) || 1)) * 100;
  
  // 지지선/저항선
  const support = percentile(values, 25);
  const resistance = percentile(values, 75);
  
  // 시그널 생성
  const signals: TrendSignal[] = [];
  
  // 골든 크로스 / 데드 크로스
  if (sma7.length > 1 && sma21.length > 1) {
    const prevSma7 = sma7[sma7.length - 2];
    const prevSma21 = sma21[sma21.length - 2];
    
    if (prevSma7 <= prevSma21 && lastSma7 > lastSma21) {
      signals.push({
        type: 'buy',
        reason: '골든 크로스 발생 (단기 이평선이 장기 이평선 상향 돌파)',
        confidence: 0.7,
      });
    } else if (prevSma7 >= prevSma21 && lastSma7 < lastSma21) {
      signals.push({
        type: 'sell',
        reason: '데드 크로스 발생 (단기 이평선이 장기 이평선 하향 돌파)',
        confidence: 0.7,
      });
    }
  }
  
  // 과매수/과매도
  if (lastValue > resistance * 1.1) {
    signals.push({
      type: 'sell',
      reason: '과매수 구간 진입 (저항선 10% 이상 상회)',
      confidence: 0.6,
    });
  } else if (lastValue < support * 0.9) {
    signals.push({
      type: 'buy',
      reason: '과매도 구간 진입 (지지선 10% 이상 하회)',
      confidence: 0.6,
    });
  }
  
  // 기본 시그널
  if (signals.length === 0) {
    signals.push({
      type: 'hold',
      reason: '명확한 매매 시그널 없음',
      confidence: 0.5,
    });
  }
  
  return {
    direction,
    strength,
    momentum,
    volatility,
    support,
    resistance,
    signals,
  };
}

// ============================================
// 이상치 탐지
// ============================================

export interface Anomaly {
  index: number;
  value: number;
  expected: number;
  deviation: number;
  type: 'spike' | 'drop';
  severity: 'low' | 'medium' | 'high';
}

/**
 * 이상치 탐지 (Z-Score 기반)
 */
export function detectAnomalies(values: number[], threshold: number = 2): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const avg = mean(values);
  const stdDev = standardDeviation(values);
  
  if (stdDev === 0) return anomalies;
  
  values.forEach((value, index) => {
    const zScore = (value - avg) / stdDev;
    
    if (Math.abs(zScore) > threshold) {
      const deviation = Math.abs(zScore);
      let severity: 'low' | 'medium' | 'high' = 'low';
      
      if (deviation > 3) severity = 'high';
      else if (deviation > 2.5) severity = 'medium';
      
      anomalies.push({
        index,
        value,
        expected: avg,
        deviation,
        type: value > avg ? 'spike' : 'drop',
        severity,
      });
    }
  });
  
  return anomalies;
}

// ============================================
// 성장률 분석
// ============================================

export interface GrowthAnalysis {
  daily: number;
  weekly: number;
  monthly: number;
  quarterlyProjection: number;
  yearlyProjection: number;
  compoundGrowthRate: number;
  consistency: number; // 성장 일관성 (0-100)
}

/**
 * 성장률 분석
 */
export function analyzeGrowth(
  currentPeriod: number[],
  previousPeriod: number[]
): GrowthAnalysis {
  const currentSum = currentPeriod.reduce((a, b) => a + b, 0);
  const previousSum = previousPeriod.reduce((a, b) => a + b, 0);
  
  // 기간별 성장률
  const periodGrowth = previousSum > 0 
    ? ((currentSum - previousSum) / previousSum) * 100 
    : 0;
  
  // 일일 성장률 (평균)
  const dailyGrowths: number[] = [];
  for (let i = 1; i < currentPeriod.length; i++) {
    if (currentPeriod[i - 1] > 0) {
      dailyGrowths.push(
        ((currentPeriod[i] - currentPeriod[i - 1]) / currentPeriod[i - 1]) * 100
      );
    }
  }
  const dailyGrowth = mean(dailyGrowths);
  
  // 주간 성장률
  const weeks = Math.floor(currentPeriod.length / 7);
  const weeklyGrowths: number[] = [];
  for (let i = 1; i < weeks; i++) {
    const thisWeek = currentPeriod.slice(i * 7, (i + 1) * 7).reduce((a, b) => a + b, 0);
    const lastWeek = currentPeriod.slice((i - 1) * 7, i * 7).reduce((a, b) => a + b, 0);
    if (lastWeek > 0) {
      weeklyGrowths.push(((thisWeek - lastWeek) / lastWeek) * 100);
    }
  }
  const weeklyGrowth = mean(weeklyGrowths);
  
  // 월간 성장률
  const monthly = periodGrowth;
  
  // 복리 성장률 (CAGR 방식)
  const compoundGrowthRate = dailyGrowths.length > 0
    ? Math.pow(1 + dailyGrowth / 100, 30) - 1
    : 0;
  
  // 분기/연간 예측
  const quarterlyProjection = monthly * 3;
  const yearlyProjection = monthly * 12;
  
  // 성장 일관성 (변동성의 역수)
  const growthStdDev = standardDeviation(dailyGrowths);
  const consistency = Math.max(0, Math.min(100, 100 - growthStdDev * 10));
  
  return {
    daily: dailyGrowth,
    weekly: weeklyGrowth,
    monthly,
    quarterlyProjection,
    yearlyProjection,
    compoundGrowthRate: compoundGrowthRate * 100,
    consistency,
  };
}

// ============================================
// 비교 분석
// ============================================

export interface ComparisonResult {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * 기간 비교 분석
 */
export function comparePeriods(
  current: Record<string, number>,
  previous: Record<string, number>
): ComparisonResult[] {
  const results: ComparisonResult[] = [];
  
  for (const [metric, currentValue] of Object.entries(current)) {
    const previousValue = previous[metric] || 0;
    const change = currentValue - previousValue;
    const changePercent = previousValue > 0 
      ? (change / previousValue) * 100 
      : currentValue > 0 ? 100 : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (changePercent > 1) trend = 'up';
    else if (changePercent < -1) trend = 'down';
    
    results.push({
      metric,
      current: currentValue,
      previous: previousValue,
      change,
      changePercent,
      trend,
    });
  }
  
  return results;
}
