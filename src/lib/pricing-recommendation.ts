/**
 * AI 가격 추천 시스템
 * 시장 분석 기반 최적 가격 제안
 */

// ============================================================================
// Types
// ============================================================================

export interface ProductInfo {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  currentPrice?: number;
  cost?: number; // 원가
  quality?: 'low' | 'medium' | 'high' | 'premium';
  brand?: string;
  targetAudience?: 'budget' | 'mid-range' | 'premium' | 'luxury';
  uniqueFeatures?: string[];
  condition?: 'new' | 'like-new' | 'good' | 'fair';
}

export interface MarketData {
  averagePrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  priceRange: { low: number; high: number };
  competitorPrices: number[];
  demandLevel: 'low' | 'medium' | 'high' | 'very-high';
  supplyLevel: 'scarce' | 'limited' | 'adequate' | 'abundant';
  seasonality: number; // -1 to 1, where positive means high season
  trendDirection: 'declining' | 'stable' | 'rising' | 'surging';
  priceElasticity: number; // 0-1, higher = more elastic
}

export interface PricingStrategy {
  name: string;
  description: string;
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  profitMargin: number; // percentage
  competitivePosition: 'undercut' | 'match' | 'premium';
  riskLevel: 'low' | 'medium' | 'high';
  expectedSalesVolume: 'low' | 'medium' | 'high';
}

export interface PriceRecommendation {
  productId: string;
  productName: string;
  currentPrice?: number;
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number; // 0-100
  strategies: PricingStrategy[];
  marketAnalysis: MarketAnalysis;
  insights: PricingInsight[];
  adjustments: PriceAdjustment[];
  timestamp: Date;
}

export interface MarketAnalysis {
  competitorCount: number;
  averageCompetitorPrice: number;
  pricePosition: 'below' | 'at' | 'above' | 'well-above';
  marketShare: number; // estimated percentage
  demandScore: number; // 0-100
  supplyScore: number; // 0-100
  seasonalityImpact: number; // percentage adjustment
  trendImpact: number; // percentage adjustment
}

export interface PricingInsight {
  type: 'opportunity' | 'warning' | 'recommendation' | 'market';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
}

export interface PriceAdjustment {
  factor: string;
  description: string;
  adjustment: number; // percentage
  applied: boolean;
}

export interface PricingConfig {
  targetMargin?: number; // default 30%
  competitiveStrategy?: 'aggressive' | 'balanced' | 'premium';
  considerSeasonality?: boolean;
  considerTrend?: boolean;
  riskTolerance?: 'low' | 'medium' | 'high';
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_BASE_MARGINS: Record<string, number> = {
  digital: 0.70,      // 디지털 제품은 높은 마진
  artwork: 0.50,      // 아트워크
  template: 0.60,     // 템플릿
  course: 0.65,       // 강좌
  music: 0.55,        // 음악
  plugin: 0.60,       // 플러그인
  default: 0.40,
};

const QUALITY_MULTIPLIERS: Record<string, number> = {
  low: 0.7,
  medium: 1.0,
  high: 1.3,
  premium: 1.6,
};

const DEMAND_MULTIPLIERS: Record<string, number> = {
  low: 0.85,
  medium: 1.0,
  high: 1.15,
  'very-high': 1.35,
};

const SUPPLY_MULTIPLIERS: Record<string, number> = {
  scarce: 1.4,
  limited: 1.2,
  adequate: 1.0,
  abundant: 0.85,
};

const TREND_MULTIPLIERS: Record<string, number> = {
  declining: 0.9,
  stable: 1.0,
  rising: 1.1,
  surging: 1.25,
};

// ============================================================================
// Market Analysis Functions
// ============================================================================

/**
 * 경쟁사 가격 분석
 */
export function analyzeCompetitorPrices(prices: number[]): {
  average: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  quartiles: { q1: number; q2: number; q3: number };
} {
  if (prices.length === 0) {
    return {
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      standardDeviation: 0,
      quartiles: { q1: 0, q2: 0, q3: 0 },
    };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const average = sum / sorted.length;

  // 중앙값
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;

  // 표준편차
  const squaredDiffs = sorted.map(price => Math.pow(price - average, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / sorted.length;
  const standardDeviation = Math.sqrt(avgSquaredDiff);

  // 사분위수
  const q1Index = Math.floor(sorted.length * 0.25);
  const q2Index = Math.floor(sorted.length * 0.5);
  const q3Index = Math.floor(sorted.length * 0.75);

  return {
    average,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    standardDeviation,
    quartiles: {
      q1: sorted[q1Index],
      q2: sorted[q2Index],
      q3: sorted[q3Index],
    },
  };
}

/**
 * 시장 데이터 생성 (시뮬레이션)
 */
export function generateMarketData(product: ProductInfo): MarketData {
  const categoryMultiplier = product.category === 'digital' ? 1.2 
    : product.category === 'artwork' ? 1.5 
    : product.category === 'course' ? 1.3 
    : 1.0;

  const basePrice = product.currentPrice || 50000;
  
  // 경쟁사 가격 시뮬레이션 (10-20개)
  const competitorCount = 10 + Math.floor(Math.random() * 11);
  const competitorPrices: number[] = [];
  
  for (let i = 0; i < competitorCount; i++) {
    const variance = 0.3 + Math.random() * 0.4; // 30-70% variance
    const direction = Math.random() > 0.5 ? 1 : -1;
    const price = basePrice * (1 + direction * variance * 0.5);
    competitorPrices.push(Math.round(price / 1000) * 1000);
  }

  const analysis = analyzeCompetitorPrices(competitorPrices);

  // 수요/공급 레벨 시뮬레이션
  const demandLevels: ('low' | 'medium' | 'high' | 'very-high')[] = ['low', 'medium', 'high', 'very-high'];
  const supplyLevels: ('scarce' | 'limited' | 'adequate' | 'abundant')[] = ['scarce', 'limited', 'adequate', 'abundant'];
  const trendDirections: ('declining' | 'stable' | 'rising' | 'surging')[] = ['declining', 'stable', 'rising', 'surging'];

  // 카테고리별 수요 편향
  const demandBias = product.category === 'digital' ? 0.7 
    : product.category === 'course' ? 0.6 
    : 0.5;
  const demandIndex = Math.min(3, Math.floor(Math.random() * 4 * demandBias) + 1);

  return {
    averagePrice: analysis.average * categoryMultiplier,
    medianPrice: analysis.median * categoryMultiplier,
    minPrice: analysis.min,
    maxPrice: analysis.max,
    priceRange: { low: analysis.quartiles.q1, high: analysis.quartiles.q3 },
    competitorPrices,
    demandLevel: demandLevels[demandIndex],
    supplyLevel: supplyLevels[Math.floor(Math.random() * 4)],
    seasonality: Math.random() * 2 - 1, // -1 to 1
    trendDirection: trendDirections[Math.floor(Math.random() * 4)],
    priceElasticity: 0.3 + Math.random() * 0.5,
  };
}

// ============================================================================
// Price Calculation Functions
// ============================================================================

/**
 * 기본 가격 계산
 */
export function calculateBasePrice(
  product: ProductInfo,
  marketData: MarketData
): number {
  // 원가 기반 가격 (있는 경우)
  if (product.cost) {
    const categoryMargin = CATEGORY_BASE_MARGINS[product.category] || CATEGORY_BASE_MARGINS.default;
    return product.cost / (1 - categoryMargin);
  }

  // 시장 데이터 기반 가격
  return marketData.medianPrice;
}

/**
 * 품질 조정 적용
 */
export function applyQualityAdjustment(
  basePrice: number,
  quality: ProductInfo['quality']
): number {
  const multiplier = QUALITY_MULTIPLIERS[quality || 'medium'];
  return basePrice * multiplier;
}

/**
 * 수요/공급 조정 적용
 */
export function applyDemandSupplyAdjustment(
  price: number,
  marketData: MarketData
): { price: number; demandAdjustment: number; supplyAdjustment: number } {
  const demandMultiplier = DEMAND_MULTIPLIERS[marketData.demandLevel];
  const supplyMultiplier = SUPPLY_MULTIPLIERS[marketData.supplyLevel];

  const demandAdjustment = (demandMultiplier - 1) * 100;
  const supplyAdjustment = (supplyMultiplier - 1) * 100;

  return {
    price: price * demandMultiplier * supplyMultiplier,
    demandAdjustment,
    supplyAdjustment,
  };
}

/**
 * 계절성 조정 적용
 */
export function applySeasonalityAdjustment(
  price: number,
  seasonality: number
): { price: number; adjustment: number } {
  // seasonality: -1 (비수기) to 1 (성수기)
  const maxAdjustment = 0.15; // 최대 15% 조정
  const adjustment = seasonality * maxAdjustment;
  
  return {
    price: price * (1 + adjustment),
    adjustment: adjustment * 100,
  };
}

/**
 * 트렌드 조정 적용
 */
export function applyTrendAdjustment(
  price: number,
  trend: MarketData['trendDirection']
): { price: number; adjustment: number } {
  const multiplier = TREND_MULTIPLIERS[trend];
  const adjustment = (multiplier - 1) * 100;

  return {
    price: price * multiplier,
    adjustment,
  };
}

/**
 * 경쟁력 조정 적용
 */
export function applyCompetitiveAdjustment(
  price: number,
  marketData: MarketData,
  strategy: 'aggressive' | 'balanced' | 'premium'
): { price: number; adjustment: number; position: string } {
  const avgPrice = marketData.averagePrice;
  
  let targetRatio: number;
  let position: string;

  switch (strategy) {
    case 'aggressive':
      targetRatio = 0.90; // 평균 대비 10% 저렴
      position = '공격적 저가';
      break;
    case 'premium':
      targetRatio = 1.15; // 평균 대비 15% 프리미엄
      position = '프리미엄';
      break;
    case 'balanced':
    default:
      targetRatio = 1.0; // 평균 맞춤
      position = '시장 평균';
      break;
  }

  const targetPrice = avgPrice * targetRatio;
  const blendedPrice = (price + targetPrice) / 2;
  const adjustment = ((blendedPrice / price) - 1) * 100;

  return {
    price: blendedPrice,
    adjustment,
    position,
  };
}

// ============================================================================
// Strategy Generation
// ============================================================================

/**
 * 가격 전략 생성
 */
export function generatePricingStrategies(
  product: ProductInfo,
  marketData: MarketData,
  baseRecommendedPrice: number
): PricingStrategy[] {
  const strategies: PricingStrategy[] = [];

  // 1. 경쟁적 저가 전략
  const undercutPrice = marketData.averagePrice * 0.85;
  strategies.push({
    name: '경쟁적 저가 전략',
    description: '시장 평균보다 15% 낮은 가격으로 빠른 판매 유도',
    recommendedPrice: Math.round(undercutPrice / 1000) * 1000,
    priceRange: { 
      min: Math.round(undercutPrice * 0.95 / 1000) * 1000,
      max: Math.round(undercutPrice * 1.05 / 1000) * 1000,
    },
    profitMargin: calculateProfitMargin(undercutPrice, product.cost),
    competitivePosition: 'undercut',
    riskLevel: 'medium',
    expectedSalesVolume: 'high',
  });

  // 2. 시장 맞춤 전략
  const matchPrice = marketData.medianPrice;
  strategies.push({
    name: '시장 맞춤 전략',
    description: '시장 중앙값에 맞춘 안정적인 가격 책정',
    recommendedPrice: Math.round(matchPrice / 1000) * 1000,
    priceRange: {
      min: Math.round(matchPrice * 0.95 / 1000) * 1000,
      max: Math.round(matchPrice * 1.05 / 1000) * 1000,
    },
    profitMargin: calculateProfitMargin(matchPrice, product.cost),
    competitivePosition: 'match',
    riskLevel: 'low',
    expectedSalesVolume: 'medium',
  });

  // 3. 프리미엄 전략
  const premiumPrice = marketData.averagePrice * 1.25;
  strategies.push({
    name: '프리미엄 전략',
    description: '고품질/고가치 포지셔닝으로 높은 마진 확보',
    recommendedPrice: Math.round(premiumPrice / 1000) * 1000,
    priceRange: {
      min: Math.round(premiumPrice * 0.95 / 1000) * 1000,
      max: Math.round(premiumPrice * 1.10 / 1000) * 1000,
    },
    profitMargin: calculateProfitMargin(premiumPrice, product.cost),
    competitivePosition: 'premium',
    riskLevel: 'medium',
    expectedSalesVolume: 'low',
  });

  // 4. AI 최적화 전략 (추천)
  strategies.push({
    name: 'AI 최적화 전략 (추천)',
    description: '시장 분석 기반 최적화된 가격으로 수익 극대화',
    recommendedPrice: Math.round(baseRecommendedPrice / 1000) * 1000,
    priceRange: {
      min: Math.round(baseRecommendedPrice * 0.92 / 1000) * 1000,
      max: Math.round(baseRecommendedPrice * 1.08 / 1000) * 1000,
    },
    profitMargin: calculateProfitMargin(baseRecommendedPrice, product.cost),
    competitivePosition: 'match',
    riskLevel: 'low',
    expectedSalesVolume: 'medium',
  });

  return strategies;
}

/**
 * 수익률 계산
 */
function calculateProfitMargin(price: number, cost?: number): number {
  if (!cost) return 50; // 원가 정보 없으면 50% 가정
  return Math.round(((price - cost) / price) * 100);
}

// ============================================================================
// Insight Generation
// ============================================================================

/**
 * 가격 인사이트 생성
 */
export function generatePricingInsights(
  product: ProductInfo,
  marketData: MarketData,
  recommendedPrice: number
): PricingInsight[] {
  const insights: PricingInsight[] = [];

  // 현재 가격 vs 추천 가격 비교
  if (product.currentPrice) {
    const diff = ((recommendedPrice - product.currentPrice) / product.currentPrice) * 100;
    
    if (diff > 15) {
      insights.push({
        type: 'opportunity',
        title: '가격 인상 기회',
        description: `현재 가격이 최적 가격보다 ${Math.abs(diff).toFixed(0)}% 낮습니다. 가격 인상으로 수익을 개선할 수 있습니다.`,
        impact: 'high',
        actionable: true,
      });
    } else if (diff < -15) {
      insights.push({
        type: 'warning',
        title: '가격 경쟁력 저하',
        description: `현재 가격이 최적 가격보다 ${Math.abs(diff).toFixed(0)}% 높습니다. 판매량 저하 위험이 있습니다.`,
        impact: 'high',
        actionable: true,
      });
    }
  }

  // 수요 분석
  if (marketData.demandLevel === 'very-high') {
    insights.push({
      type: 'opportunity',
      title: '높은 수요',
      description: '현재 이 카테고리의 수요가 매우 높습니다. 프리미엄 가격 책정을 고려해보세요.',
      impact: 'high',
      actionable: true,
    });
  } else if (marketData.demandLevel === 'low') {
    insights.push({
      type: 'warning',
      title: '낮은 수요',
      description: '현재 수요가 낮은 편입니다. 경쟁력 있는 가격으로 판매를 촉진하세요.',
      impact: 'medium',
      actionable: true,
    });
  }

  // 공급 분석
  if (marketData.supplyLevel === 'scarce') {
    insights.push({
      type: 'opportunity',
      title: '희소성 프리미엄',
      description: '시장에 유사 상품이 적습니다. 희소성 프리미엄을 적용할 수 있습니다.',
      impact: 'high',
      actionable: true,
    });
  } else if (marketData.supplyLevel === 'abundant') {
    insights.push({
      type: 'market',
      title: '공급 과잉',
      description: '경쟁 상품이 많습니다. 차별화 포인트를 강조하여 가격을 정당화하세요.',
      impact: 'medium',
      actionable: true,
    });
  }

  // 트렌드 분석
  if (marketData.trendDirection === 'surging') {
    insights.push({
      type: 'opportunity',
      title: '급상승 트렌드',
      description: '이 카테고리가 급성장 중입니다. 시장 선점을 위한 적극적 가격 책정이 유리합니다.',
      impact: 'high',
      actionable: true,
    });
  } else if (marketData.trendDirection === 'declining') {
    insights.push({
      type: 'warning',
      title: '하락 트렌드',
      description: '시장이 하락세입니다. 재고 정리를 위한 할인 전략을 고려하세요.',
      impact: 'medium',
      actionable: true,
    });
  }

  // 계절성
  if (marketData.seasonality > 0.5) {
    insights.push({
      type: 'market',
      title: '성수기 시즌',
      description: '현재 성수기입니다. 수요 증가에 맞춰 가격 조정을 고려하세요.',
      impact: 'medium',
      actionable: false,
    });
  } else if (marketData.seasonality < -0.5) {
    insights.push({
      type: 'market',
      title: '비수기 시즌',
      description: '현재 비수기입니다. 프로모션이나 번들 판매로 판매량을 유지하세요.',
      impact: 'medium',
      actionable: true,
    });
  }

  // 품질 기반 권장
  if (product.quality === 'premium' && recommendedPrice < marketData.averagePrice) {
    insights.push({
      type: 'recommendation',
      title: '프리미엄 포지셔닝 권장',
      description: '상품 품질이 우수합니다. 프리미엄 가격 전략으로 가치를 반영하세요.',
      impact: 'medium',
      actionable: true,
    });
  }

  return insights;
}

// ============================================================================
// Main Recommendation Function
// ============================================================================

/**
 * 가격 추천 생성
 */
export function generatePriceRecommendation(
  product: ProductInfo,
  config: PricingConfig = {}
): PriceRecommendation {
  const {
    targetMargin = 0.30,
    competitiveStrategy = 'balanced',
    considerSeasonality = true,
    considerTrend = true,
    riskTolerance = 'medium',
  } = config;

  // 시장 데이터 생성
  const marketData = generateMarketData(product);

  // 기본 가격 계산
  let price = calculateBasePrice(product, marketData);
  const adjustments: PriceAdjustment[] = [];

  // 품질 조정
  const qualityAdjustedPrice = applyQualityAdjustment(price, product.quality);
  if (qualityAdjustedPrice !== price) {
    adjustments.push({
      factor: '품질 등급',
      description: `${product.quality || 'medium'} 품질 기준 조정`,
      adjustment: ((qualityAdjustedPrice / price) - 1) * 100,
      applied: true,
    });
    price = qualityAdjustedPrice;
  }

  // 수요/공급 조정
  const dsResult = applyDemandSupplyAdjustment(price, marketData);
  if (dsResult.demandAdjustment !== 0) {
    adjustments.push({
      factor: '수요 수준',
      description: `${marketData.demandLevel} 수요 반영`,
      adjustment: dsResult.demandAdjustment,
      applied: true,
    });
  }
  if (dsResult.supplyAdjustment !== 0) {
    adjustments.push({
      factor: '공급 수준',
      description: `${marketData.supplyLevel} 공급 반영`,
      adjustment: dsResult.supplyAdjustment,
      applied: true,
    });
  }
  price = dsResult.price;

  // 계절성 조정
  if (considerSeasonality) {
    const seasonResult = applySeasonalityAdjustment(price, marketData.seasonality);
    if (Math.abs(seasonResult.adjustment) > 1) {
      adjustments.push({
        factor: '계절성',
        description: marketData.seasonality > 0 ? '성수기 프리미엄' : '비수기 할인',
        adjustment: seasonResult.adjustment,
        applied: true,
      });
      price = seasonResult.price;
    }
  }

  // 트렌드 조정
  if (considerTrend) {
    const trendResult = applyTrendAdjustment(price, marketData.trendDirection);
    if (trendResult.adjustment !== 0) {
      adjustments.push({
        factor: '시장 트렌드',
        description: `${marketData.trendDirection} 트렌드 반영`,
        adjustment: trendResult.adjustment,
        applied: true,
      });
      price = trendResult.price;
    }
  }

  // 경쟁력 조정
  const compResult = applyCompetitiveAdjustment(price, marketData, competitiveStrategy);
  adjustments.push({
    factor: '경쟁 전략',
    description: compResult.position,
    adjustment: compResult.adjustment,
    applied: true,
  });
  price = compResult.price;

  // 가격 반올림
  const recommendedPrice = Math.round(price / 1000) * 1000;

  // 시장 분석 생성
  const analysis = analyzeCompetitorPrices(marketData.competitorPrices);
  const pricePosition = recommendedPrice < analysis.average * 0.9 ? 'below'
    : recommendedPrice > analysis.average * 1.15 ? 'well-above'
    : recommendedPrice > analysis.average * 1.05 ? 'above'
    : 'at';

  const marketAnalysis: MarketAnalysis = {
    competitorCount: marketData.competitorPrices.length,
    averageCompetitorPrice: Math.round(analysis.average),
    pricePosition,
    marketShare: 10 + Math.random() * 20, // 시뮬레이션
    demandScore: marketData.demandLevel === 'very-high' ? 90
      : marketData.demandLevel === 'high' ? 70
      : marketData.demandLevel === 'medium' ? 50 : 30,
    supplyScore: marketData.supplyLevel === 'scarce' ? 90
      : marketData.supplyLevel === 'limited' ? 70
      : marketData.supplyLevel === 'adequate' ? 50 : 30,
    seasonalityImpact: marketData.seasonality * 15,
    trendImpact: (TREND_MULTIPLIERS[marketData.trendDirection] - 1) * 100,
  };

  // 전략 생성
  const strategies = generatePricingStrategies(product, marketData, recommendedPrice);

  // 인사이트 생성
  const insights = generatePricingInsights(product, marketData, recommendedPrice);

  // 신뢰도 계산
  const confidence = calculateConfidence(marketData, adjustments);

  return {
    productId: product.id,
    productName: product.name,
    currentPrice: product.currentPrice,
    recommendedPrice,
    priceRange: {
      min: Math.round(recommendedPrice * 0.85 / 1000) * 1000,
      max: Math.round(recommendedPrice * 1.15 / 1000) * 1000,
    },
    confidence,
    strategies,
    marketAnalysis,
    insights,
    adjustments,
    timestamp: new Date(),
  };
}

/**
 * 신뢰도 계산
 */
function calculateConfidence(
  marketData: MarketData,
  adjustments: PriceAdjustment[]
): number {
  let confidence = 70; // 기본 신뢰도

  // 경쟁사 데이터가 많을수록 신뢰도 증가
  if (marketData.competitorPrices.length >= 15) {
    confidence += 10;
  } else if (marketData.competitorPrices.length >= 10) {
    confidence += 5;
  }

  // 안정적인 트렌드일수록 신뢰도 증가
  if (marketData.trendDirection === 'stable') {
    confidence += 5;
  }

  // 조정 요소가 적을수록 신뢰도 증가
  const appliedAdjustments = adjustments.filter(a => a.applied && Math.abs(a.adjustment) > 5);
  confidence -= appliedAdjustments.length * 3;

  // 극단적인 수요/공급 상황은 신뢰도 감소
  if (marketData.demandLevel === 'very-high' || marketData.supplyLevel === 'scarce') {
    confidence -= 5;
  }

  return Math.min(95, Math.max(50, confidence));
}

/**
 * 여러 상품 일괄 가격 추천
 */
export function generateBulkPriceRecommendations(
  products: ProductInfo[],
  config: PricingConfig = {}
): PriceRecommendation[] {
  return products.map(product => generatePriceRecommendation(product, config));
}

/**
 * 가격 히스토리 기반 최적 가격 분석
 */
export function analyzePriceHistory(
  priceHistory: { price: number; sales: number; date: Date }[]
): {
  optimalPrice: number;
  elasticity: number;
  sweetSpot: { min: number; max: number };
} {
  if (priceHistory.length < 3) {
    return {
      optimalPrice: priceHistory[0]?.price || 0,
      elasticity: 0.5,
      sweetSpot: { min: 0, max: 0 },
    };
  }

  // 가격-판매량 상관관계 분석
  const prices = priceHistory.map(h => h.price);
  const sales = priceHistory.map(h => h.sales);

  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const avgSales = sales.reduce((a, b) => a + b, 0) / sales.length;

  // 가격 탄력성 계산 (간단 버전)
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < prices.length; i++) {
    numerator += (prices[i] - avgPrice) * (sales[i] - avgSales);
    denominator += Math.pow(prices[i] - avgPrice, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const elasticity = Math.abs(slope * avgPrice / avgSales);

  // 최적 가격 (매출 극대화 지점)
  const revenueByPrice = priceHistory.map(h => ({
    price: h.price,
    revenue: h.price * h.sales,
  }));

  const maxRevenue = revenueByPrice.reduce((max, curr) => 
    curr.revenue > max.revenue ? curr : max
  );

  return {
    optimalPrice: maxRevenue.price,
    elasticity: Math.min(1, elasticity),
    sweetSpot: {
      min: Math.round(maxRevenue.price * 0.9),
      max: Math.round(maxRevenue.price * 1.1),
    },
  };
}
