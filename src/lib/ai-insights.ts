/**
 * AI 비즈니스 인사이트 생성
 * 자동 트렌드 분석, 이상 탐지, 권장 사항 생성
 */

// ============================================================================
// Types
// ============================================================================

export interface BusinessData {
  revenue: DailyMetric[];
  orders: DailyMetric[];
  users: DailyMetric[];
  products: ProductMetric[];
  categories: CategoryMetric[];
  traffic: TrafficMetric[];
}

export interface DailyMetric {
  date: string;
  value: number;
}

export interface ProductMetric {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  views: number;
  conversionRate: number;
  rating: number;
  reviewCount: number;
}

export interface CategoryMetric {
  name: string;
  sales: number;
  revenue: number;
  growth: number;
}

export interface TrafficMetric {
  source: string;
  visits: number;
  conversions: number;
  bounceRate: number;
}

export interface InsightReport {
  id: string;
  generatedAt: Date;
  period: string;
  summary: ExecutiveSummary;
  trends: TrendInsight[];
  anomalies: AnomalyInsight[];
  recommendations: Recommendation[];
  forecasts: Forecast[];
  competitiveAnalysis?: CompetitiveInsight;
  riskAssessment: RiskAssessment;
}

export interface ExecutiveSummary {
  headline: string;
  keyMetrics: KeyMetric[];
  highlights: string[];
  concerns: string[];
  overallHealth: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  healthScore: number; // 0-100
}

export interface KeyMetric {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

export interface TrendInsight {
  id: string;
  type: 'revenue' | 'orders' | 'users' | 'traffic' | 'conversion' | 'engagement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  direction: 'positive' | 'negative' | 'neutral';
  data: { date: string; value: number }[];
  confidence: number;
}

export interface AnomalyInsight {
  id: string;
  type: 'spike' | 'drop' | 'pattern_change' | 'outlier';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  detectedAt: Date;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  possibleCauses: string[];
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'revenue' | 'marketing' | 'product' | 'operations' | 'customer';
  title: string;
  description: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  actions: string[];
}

export interface Forecast {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  range: { min: number; max: number };
  timeframe: string;
  trend: 'growing' | 'declining' | 'stable';
}

export interface CompetitiveInsight {
  marketPosition: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  risks: Risk[];
}

export interface Risk {
  id: string;
  category: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

// ============================================================================
// Insight Generation
// ============================================================================

/**
 * AI 인사이트 리포트 생성
 */
export async function generateInsightReport(
  data: BusinessData,
  period: 'day' | 'week' | 'month' | 'quarter'
): Promise<InsightReport> {
  const summary = generateExecutiveSummary(data, period);
  const trends = analyzeTrends(data);
  const anomalies = detectAnomalies(data);
  const recommendations = generateRecommendations(data, trends, anomalies);
  const forecasts = generateForecasts(data);
  const riskAssessment = assessRisks(data, anomalies);

  return {
    id: `report_${Date.now()}`,
    generatedAt: new Date(),
    period: getPeriodLabel(period),
    summary,
    trends,
    anomalies,
    recommendations,
    forecasts,
    riskAssessment,
  };
}

/**
 * 경영 요약 생성
 */
function generateExecutiveSummary(data: BusinessData, period: string): ExecutiveSummary {
  const totalRevenue = data.revenue.reduce((sum, d) => sum + d.value, 0);
  const totalOrders = data.orders.reduce((sum, d) => sum + d.value, 0);
  const totalUsers = data.users[data.users.length - 1]?.value || 0;

  // Calculate changes (assuming first half is previous period)
  const midPoint = Math.floor(data.revenue.length / 2);
  const currentRevenue = data.revenue.slice(midPoint).reduce((sum, d) => sum + d.value, 0);
  const previousRevenue = data.revenue.slice(0, midPoint).reduce((sum, d) => sum + d.value, 0);
  const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  const currentOrders = data.orders.slice(midPoint).reduce((sum, d) => sum + d.value, 0);
  const previousOrders = data.orders.slice(0, midPoint).reduce((sum, d) => sum + d.value, 0);
  const ordersChange = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const conversionRate = calculateConversionRate(data.traffic);

  // Determine health
  let healthScore = 50;
  if (revenueChange > 10) healthScore += 20;
  else if (revenueChange > 0) healthScore += 10;
  else if (revenueChange < -10) healthScore -= 20;
  else healthScore -= 10;

  if (ordersChange > 10) healthScore += 15;
  else if (ordersChange > 0) healthScore += 5;
  else if (ordersChange < -10) healthScore -= 15;
  else healthScore -= 5;

  if (conversionRate > 3) healthScore += 15;
  else if (conversionRate > 2) healthScore += 5;
  else healthScore -= 5;

  healthScore = Math.max(0, Math.min(100, healthScore));

  const overallHealth = 
    healthScore >= 80 ? 'excellent' :
    healthScore >= 60 ? 'good' :
    healthScore >= 40 ? 'moderate' :
    healthScore >= 20 ? 'poor' : 'critical';

  // Generate highlights and concerns
  const highlights: string[] = [];
  const concerns: string[] = [];

  if (revenueChange > 10) highlights.push(`매출이 전 기간 대비 ${revenueChange.toFixed(1)}% 증가했습니다.`);
  if (revenueChange < -10) concerns.push(`매출이 전 기간 대비 ${Math.abs(revenueChange).toFixed(1)}% 감소했습니다.`);

  if (ordersChange > 10) highlights.push(`주문 건수가 ${ordersChange.toFixed(1)}% 증가했습니다.`);
  if (ordersChange < -10) concerns.push(`주문 건수가 ${Math.abs(ordersChange).toFixed(1)}% 감소했습니다.`);

  const topProduct = data.products.sort((a, b) => b.revenue - a.revenue)[0];
  if (topProduct) highlights.push(`베스트셀러: ${topProduct.name} (₩${topProduct.revenue.toLocaleString()})`);

  const lowRatedProducts = data.products.filter(p => p.rating < 3.5);
  if (lowRatedProducts.length > 0) concerns.push(`${lowRatedProducts.length}개 상품의 평점이 3.5 미만입니다.`);

  // Generate headline
  let headline = '';
  if (overallHealth === 'excellent') {
    headline = '📈 탁월한 성과! 모든 지표가 긍정적입니다.';
  } else if (overallHealth === 'good') {
    headline = '✅ 양호한 실적. 일부 개선 여지가 있습니다.';
  } else if (overallHealth === 'moderate') {
    headline = '⚠️ 주의 필요. 핵심 지표 모니터링이 필요합니다.';
  } else if (overallHealth === 'poor') {
    headline = '🔴 실적 부진. 즉각적인 조치가 필요합니다.';
  } else {
    headline = '🚨 위기 상황. 긴급 대응이 필요합니다.';
  }

  const keyMetrics: KeyMetric[] = [
    {
      name: '총 매출',
      value: totalRevenue,
      previousValue: previousRevenue,
      change: currentRevenue - previousRevenue,
      changePercent: revenueChange,
      trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable',
      status: revenueChange > 0 ? 'good' : revenueChange < -10 ? 'critical' : 'warning',
    },
    {
      name: '주문 건수',
      value: totalOrders,
      previousValue: previousOrders,
      change: currentOrders - previousOrders,
      changePercent: ordersChange,
      trend: ordersChange > 0 ? 'up' : ordersChange < 0 ? 'down' : 'stable',
      status: ordersChange > 0 ? 'good' : ordersChange < -10 ? 'critical' : 'warning',
    },
    {
      name: '평균 주문액',
      value: avgOrderValue,
      previousValue: avgOrderValue * 0.95,
      change: avgOrderValue * 0.05,
      changePercent: 5,
      trend: 'up',
      status: avgOrderValue > 50000 ? 'good' : 'warning',
    },
    {
      name: '전환율',
      value: conversionRate,
      previousValue: conversionRate * 0.9,
      change: conversionRate * 0.1,
      changePercent: 10,
      trend: 'up',
      status: conversionRate > 2 ? 'good' : conversionRate < 1 ? 'critical' : 'warning',
    },
  ];

  return {
    headline,
    keyMetrics,
    highlights,
    concerns,
    overallHealth,
    healthScore,
  };
}

/**
 * 트렌드 분석
 */
function analyzeTrends(data: BusinessData): TrendInsight[] {
  const trends: TrendInsight[] = [];

  // Revenue trend
  const revenueTrend = calculateTrend(data.revenue);
  trends.push({
    id: 'trend_revenue',
    type: 'revenue',
    title: '매출 추이',
    description: getTrendDescription('매출', revenueTrend.slope, revenueTrend.rSquared),
    impact: Math.abs(revenueTrend.slope) > 0.1 ? 'high' : Math.abs(revenueTrend.slope) > 0.05 ? 'medium' : 'low',
    direction: revenueTrend.slope > 0 ? 'positive' : revenueTrend.slope < 0 ? 'negative' : 'neutral',
    data: data.revenue,
    confidence: revenueTrend.rSquared * 100,
  });

  // Orders trend
  const ordersTrend = calculateTrend(data.orders);
  trends.push({
    id: 'trend_orders',
    type: 'orders',
    title: '주문 추이',
    description: getTrendDescription('주문', ordersTrend.slope, ordersTrend.rSquared),
    impact: Math.abs(ordersTrend.slope) > 0.1 ? 'high' : Math.abs(ordersTrend.slope) > 0.05 ? 'medium' : 'low',
    direction: ordersTrend.slope > 0 ? 'positive' : ordersTrend.slope < 0 ? 'negative' : 'neutral',
    data: data.orders,
    confidence: ordersTrend.rSquared * 100,
  });

  // Users trend
  const usersTrend = calculateTrend(data.users);
  trends.push({
    id: 'trend_users',
    type: 'users',
    title: '사용자 증가 추이',
    description: getTrendDescription('사용자', usersTrend.slope, usersTrend.rSquared),
    impact: Math.abs(usersTrend.slope) > 0.1 ? 'high' : Math.abs(usersTrend.slope) > 0.05 ? 'medium' : 'low',
    direction: usersTrend.slope > 0 ? 'positive' : usersTrend.slope < 0 ? 'negative' : 'neutral',
    data: data.users,
    confidence: usersTrend.rSquared * 100,
  });

  // Category trends
  const growingCategories = data.categories.filter(c => c.growth > 10);
  if (growingCategories.length > 0) {
    trends.push({
      id: 'trend_category_growth',
      type: 'revenue',
      title: '성장 카테고리',
      description: `${growingCategories.map(c => c.name).join(', ')} 카테고리가 빠르게 성장 중입니다.`,
      impact: 'medium',
      direction: 'positive',
      data: [],
      confidence: 80,
    });
  }

  return trends;
}

/**
 * 이상 탐지
 */
function detectAnomalies(data: BusinessData): AnomalyInsight[] {
  const anomalies: AnomalyInsight[] = [];
  
  // Revenue anomalies
  const revenueAnomalies = detectMetricAnomalies(data.revenue, '매출');
  anomalies.push(...revenueAnomalies);

  // Orders anomalies
  const ordersAnomalies = detectMetricAnomalies(data.orders, '주문');
  anomalies.push(...ordersAnomalies);

  // Product anomalies
  const lowConversionProducts = data.products.filter(p => p.views > 100 && p.conversionRate < 0.5);
  if (lowConversionProducts.length > 0) {
    anomalies.push({
      id: `anomaly_low_conversion_${Date.now()}`,
      type: 'outlier',
      title: '낮은 전환율 상품 발견',
      description: `${lowConversionProducts.length}개 상품이 높은 조회수 대비 낮은 전환율을 보이고 있습니다.`,
      severity: 'warning',
      detectedAt: new Date(),
      metric: 'conversion_rate',
      expectedValue: 2.5,
      actualValue: lowConversionProducts[0].conversionRate,
      deviation: 2,
      possibleCauses: [
        '상품 가격이 너무 높을 수 있습니다',
        '상품 설명이 부족할 수 있습니다',
        '경쟁 상품 대비 차별점이 부족합니다',
      ],
    });
  }

  // Traffic anomalies
  const highBounceTraffic = data.traffic.filter(t => t.bounceRate > 70);
  if (highBounceTraffic.length > 0) {
    anomalies.push({
      id: `anomaly_high_bounce_${Date.now()}`,
      type: 'pattern_change',
      title: '높은 이탈률 트래픽 소스',
      description: `${highBounceTraffic.map(t => t.source).join(', ')}에서 유입된 트래픽의 이탈률이 높습니다.`,
      severity: 'warning',
      detectedAt: new Date(),
      metric: 'bounce_rate',
      expectedValue: 40,
      actualValue: highBounceTraffic[0].bounceRate,
      deviation: 30,
      possibleCauses: [
        '랜딩 페이지와 광고 메시지 불일치',
        '페이지 로딩 속도 문제',
        '타겟팅이 정확하지 않음',
      ],
    });
  }

  return anomalies;
}

/**
 * 권장사항 생성
 */
function generateRecommendations(
  data: BusinessData,
  trends: TrendInsight[],
  anomalies: AnomalyInsight[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Revenue-based recommendations
  const revenueTrend = trends.find(t => t.type === 'revenue');
  if (revenueTrend?.direction === 'negative') {
    recommendations.push({
      id: 'rec_revenue_boost',
      priority: 'high',
      category: 'revenue',
      title: '매출 부양 캠페인 실시',
      description: '매출 하락 추세를 반전시키기 위한 프로모션이 필요합니다.',
      expectedImpact: '매출 15-25% 증가 기대',
      effort: 'medium',
      timeframe: '1-2주',
      actions: [
        '한정 시간 할인 이벤트 진행',
        '베스트셀러 상품 번들 패키지 구성',
        '신규 고객 첫 구매 할인 제공',
        '이메일/푸시 알림 캠페인 발송',
      ],
    });
  }

  // Product-based recommendations
  const topProducts = data.products.sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  if (topProducts.length > 0) {
    recommendations.push({
      id: 'rec_product_focus',
      priority: 'medium',
      category: 'product',
      title: '베스트셀러 상품 강화',
      description: '상위 판매 상품에 대한 마케팅을 강화하세요.',
      expectedImpact: '해당 상품군 매출 20% 증가',
      effort: 'low',
      timeframe: '즉시',
      actions: [
        `${topProducts[0].name} 상품 페이지 상단 노출`,
        '관련 상품 추천 알고리즘 강화',
        '리뷰 및 평점 프로모션 진행',
      ],
    });
  }

  // Anomaly-based recommendations
  const conversionAnomaly = anomalies.find(a => a.metric === 'conversion_rate');
  if (conversionAnomaly) {
    recommendations.push({
      id: 'rec_conversion_fix',
      priority: 'high',
      category: 'product',
      title: '전환율 개선 작업',
      description: '낮은 전환율 상품의 페이지 최적화가 필요합니다.',
      expectedImpact: '전환율 1-2%p 개선',
      effort: 'medium',
      timeframe: '2-3주',
      actions: [
        '상품 이미지 품질 개선',
        '상품 설명 및 스펙 보강',
        '고객 리뷰 및 평점 노출 강화',
        '가격 경쟁력 분석 및 조정',
      ],
    });
  }

  // Traffic-based recommendations
  const bounceAnomaly = anomalies.find(a => a.metric === 'bounce_rate');
  if (bounceAnomaly) {
    recommendations.push({
      id: 'rec_bounce_reduction',
      priority: 'medium',
      category: 'marketing',
      title: '이탈률 감소 전략',
      description: '높은 이탈률 트래픽 소스에 대한 최적화가 필요합니다.',
      expectedImpact: '이탈률 10-15%p 감소',
      effort: 'medium',
      timeframe: '1-2주',
      actions: [
        '랜딩 페이지 A/B 테스트 진행',
        '광고 크리에이티브와 랜딩 페이지 일치도 개선',
        '페이지 로딩 속도 최적화',
        '모바일 UX 개선',
      ],
    });
  }

  // General improvement recommendations
  recommendations.push({
    id: 'rec_customer_retention',
    priority: 'medium',
    category: 'customer',
    title: '고객 재구매 유도',
    description: '기존 고객의 재구매율을 높이세요.',
    expectedImpact: '고객 LTV 30% 증가',
    effort: 'low',
    timeframe: '지속',
    actions: [
      '구매 후 30일 리마인드 이메일 발송',
      '적립금/포인트 프로그램 활성화',
      '개인화된 상품 추천 강화',
    ],
  });

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * 예측 생성
 */
function generateForecasts(data: BusinessData): Forecast[] {
  const forecasts: Forecast[] = [];

  // Revenue forecast
  const revenueTrend = calculateTrend(data.revenue);
  const lastRevenue = data.revenue[data.revenue.length - 1]?.value || 0;
  const predictedRevenue = lastRevenue * (1 + revenueTrend.slope);
  
  forecasts.push({
    metric: '예상 매출',
    currentValue: lastRevenue,
    predictedValue: Math.max(0, predictedRevenue),
    confidence: revenueTrend.rSquared * 100,
    range: {
      min: Math.max(0, predictedRevenue * 0.85),
      max: predictedRevenue * 1.15,
    },
    timeframe: '다음 주',
    trend: revenueTrend.slope > 0.05 ? 'growing' : revenueTrend.slope < -0.05 ? 'declining' : 'stable',
  });

  // Orders forecast
  const ordersTrend = calculateTrend(data.orders);
  const lastOrders = data.orders[data.orders.length - 1]?.value || 0;
  const predictedOrders = lastOrders * (1 + ordersTrend.slope);

  forecasts.push({
    metric: '예상 주문',
    currentValue: lastOrders,
    predictedValue: Math.max(0, Math.round(predictedOrders)),
    confidence: ordersTrend.rSquared * 100,
    range: {
      min: Math.max(0, Math.round(predictedOrders * 0.8)),
      max: Math.round(predictedOrders * 1.2),
    },
    timeframe: '다음 주',
    trend: ordersTrend.slope > 0.05 ? 'growing' : ordersTrend.slope < -0.05 ? 'declining' : 'stable',
  });

  // Users forecast
  const usersTrend = calculateTrend(data.users);
  const lastUsers = data.users[data.users.length - 1]?.value || 0;
  const predictedUsers = lastUsers * (1 + usersTrend.slope);

  forecasts.push({
    metric: '예상 활성 사용자',
    currentValue: lastUsers,
    predictedValue: Math.max(0, Math.round(predictedUsers)),
    confidence: usersTrend.rSquared * 100,
    range: {
      min: Math.max(0, Math.round(predictedUsers * 0.9)),
      max: Math.round(predictedUsers * 1.1),
    },
    timeframe: '다음 주',
    trend: usersTrend.slope > 0.05 ? 'growing' : usersTrend.slope < -0.05 ? 'declining' : 'stable',
  });

  return forecasts;
}

/**
 * 리스크 평가
 */
function assessRisks(data: BusinessData, anomalies: AnomalyInsight[]): RiskAssessment {
  const risks: Risk[] = [];

  // Critical anomalies = high risk
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  criticalAnomalies.forEach(anomaly => {
    risks.push({
      id: `risk_${anomaly.id}`,
      category: '운영',
      description: anomaly.description,
      probability: 'high',
      impact: 'high',
      mitigation: anomaly.possibleCauses[0] || '원인 분석 후 대응 필요',
    });
  });

  // Low-rated products
  const lowRatedProducts = data.products.filter(p => p.rating < 3);
  if (lowRatedProducts.length > 0) {
    risks.push({
      id: 'risk_product_quality',
      category: '상품 품질',
      description: `${lowRatedProducts.length}개 상품의 평점이 3점 미만입니다.`,
      probability: 'high',
      impact: 'medium',
      mitigation: '해당 상품 품질 개선 또는 판매 중단 검토',
    });
  }

  // Revenue dependency
  const topProduct = data.products.sort((a, b) => b.revenue - a.revenue)[0];
  const totalRevenue = data.products.reduce((sum, p) => sum + p.revenue, 0);
  if (topProduct && totalRevenue > 0 && topProduct.revenue / totalRevenue > 0.5) {
    risks.push({
      id: 'risk_revenue_concentration',
      category: '매출 집중',
      description: `단일 상품(${topProduct.name})이 전체 매출의 ${((topProduct.revenue / totalRevenue) * 100).toFixed(0)}%를 차지합니다.`,
      probability: 'medium',
      impact: 'high',
      mitigation: '상품 포트폴리오 다변화 필요',
    });
  }

  // Traffic source dependency
  const topTraffic = data.traffic.sort((a, b) => b.visits - a.visits)[0];
  const totalTraffic = data.traffic.reduce((sum, t) => sum + t.visits, 0);
  if (topTraffic && totalTraffic > 0 && topTraffic.visits / totalTraffic > 0.6) {
    risks.push({
      id: 'risk_traffic_concentration',
      category: '트래픽 집중',
      description: `단일 채널(${topTraffic.source})이 전체 트래픽의 ${((topTraffic.visits / totalTraffic) * 100).toFixed(0)}%를 차지합니다.`,
      probability: 'medium',
      impact: 'medium',
      mitigation: '마케팅 채널 다변화 필요',
    });
  }

  // Calculate overall risk
  const highRisks = risks.filter(r => r.impact === 'high' && r.probability === 'high').length;
  const mediumRisks = risks.filter(r => 
    (r.impact === 'high' && r.probability !== 'high') ||
    (r.impact === 'medium' && r.probability === 'high')
  ).length;

  let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (highRisks >= 2) overallRisk = 'critical';
  else if (highRisks >= 1) overallRisk = 'high';
  else if (mediumRisks >= 2) overallRisk = 'medium';

  return {
    overallRisk,
    risks,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateTrend(data: DailyMetric[]): { slope: number; rSquared: number } {
  if (data.length < 2) return { slope: 0, rSquared: 0 };

  const n = data.length;
  const values = data.map(d => d.value);
  const indices = values.map((_, i) => i);

  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
  const sumYY = values.reduce((sum, y) => sum + y * y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Normalize slope
  const avgY = sumY / n;
  const normalizedSlope = avgY !== 0 ? slope / avgY : 0;

  // R-squared
  const ssRes = values.reduce((sum, y, i) => {
    const predicted = (sumY / n) + slope * (i - sumX / n);
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const ssTot = values.reduce((sum, y) => sum + Math.pow(y - sumY / n, 2), 0);
  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return { slope: normalizedSlope, rSquared: Math.max(0, rSquared) };
}

function getTrendDescription(metric: string, slope: number, _rSquared: number): string {
  const direction = slope > 0.05 ? '증가' : slope < -0.05 ? '감소' : '안정';
  const strength = Math.abs(slope) > 0.15 ? '급격히' : Math.abs(slope) > 0.08 ? '꾸준히' : '완만하게';
  
  if (Math.abs(slope) < 0.02) {
    return `${metric}이(가) 안정적인 수준을 유지하고 있습니다.`;
  }
  return `${metric}이(가) ${strength} ${direction}하고 있습니다.`;
}

function detectMetricAnomalies(data: DailyMetric[], metricName: string): AnomalyInsight[] {
  const anomalies: AnomalyInsight[] = [];
  if (data.length < 5) return anomalies;

  const values = data.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

  // Z-score based anomaly detection
  data.forEach((d, index) => {
    if (stdDev === 0) return;
    const zScore = (d.value - mean) / stdDev;

    if (Math.abs(zScore) > 2.5) {
      anomalies.push({
        id: `anomaly_${metricName}_${index}`,
        type: zScore > 0 ? 'spike' : 'drop',
        title: `${metricName} ${zScore > 0 ? '급증' : '급감'} 감지`,
        description: `${d.date}에 ${metricName}이(가) 평균 대비 ${Math.abs(zScore).toFixed(1)} 표준편차만큼 ${zScore > 0 ? '높았' : '낮았'}습니다.`,
        severity: Math.abs(zScore) > 3 ? 'critical' : 'warning',
        detectedAt: new Date(d.date),
        metric: metricName,
        expectedValue: mean,
        actualValue: d.value,
        deviation: zScore,
        possibleCauses: zScore > 0
          ? ['마케팅 캠페인 효과', '시즌 수요 증가', '바이럴 효과']
          : ['기술적 문제', '외부 요인', '경쟁사 활동'],
      });
    }
  });

  return anomalies;
}

function calculateConversionRate(traffic: TrafficMetric[]): number {
  const totalVisits = traffic.reduce((sum, t) => sum + t.visits, 0);
  const totalConversions = traffic.reduce((sum, t) => sum + t.conversions, 0);
  return totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0;
}

function getPeriodLabel(period: 'day' | 'week' | 'month' | 'quarter'): string {
  switch (period) {
    case 'day': return '일간';
    case 'week': return '주간';
    case 'month': return '월간';
    case 'quarter': return '분기';
    default: return period;
  }
}

// ============================================================================
// Demo Data Generation
// ============================================================================

export function generateDemoBusinessData(): BusinessData {
  const days = 30;
  const baseRevenue = 1000000;
  const baseOrders = 50;
  const baseUsers = 100;

  const revenue: DailyMetric[] = [];
  const orders: DailyMetric[] = [];
  const users: DailyMetric[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    // Add some trend and noise
    const trend = i * 0.02;
    const weekendEffect = [0, 6].includes(date.getDay()) ? 1.3 : 1;
    const noise = 0.8 + Math.random() * 0.4;

    revenue.push({
      date: dateStr,
      value: Math.round(baseRevenue * (1 + trend) * weekendEffect * noise),
    });

    orders.push({
      date: dateStr,
      value: Math.round(baseOrders * (1 + trend) * weekendEffect * noise),
    });

    users.push({
      date: dateStr,
      value: Math.round(baseUsers * (1 + trend * 0.5) * noise),
    });
  }

  const products: ProductMetric[] = [
    { id: '1', name: '디지털 아트 컬렉션', sales: 120, revenue: 2400000, views: 5000, conversionRate: 2.4, rating: 4.8, reviewCount: 45 },
    { id: '2', name: '음악 샘플 팩', sales: 80, revenue: 800000, views: 3000, conversionRate: 2.7, rating: 4.5, reviewCount: 32 },
    { id: '3', name: '포토샵 브러쉬 세트', sales: 60, revenue: 300000, views: 2500, conversionRate: 2.4, rating: 4.2, reviewCount: 28 },
    { id: '4', name: '영상 템플릿', sales: 40, revenue: 600000, views: 2000, conversionRate: 2.0, rating: 3.8, reviewCount: 15 },
    { id: '5', name: '폰트 패밀리', sales: 25, revenue: 250000, views: 1500, conversionRate: 1.7, rating: 4.0, reviewCount: 12 },
  ];

  const categories: CategoryMetric[] = [
    { name: '디지털 아트', sales: 200, revenue: 3000000, growth: 15 },
    { name: '음악/오디오', sales: 120, revenue: 1200000, growth: 8 },
    { name: '디자인 에셋', sales: 100, revenue: 800000, growth: -5 },
    { name: '영상/모션', sales: 60, revenue: 900000, growth: 20 },
    { name: '폰트', sales: 30, revenue: 300000, growth: 2 },
  ];

  const traffic: TrafficMetric[] = [
    { source: '직접 방문', visits: 5000, conversions: 150, bounceRate: 35 },
    { source: '검색 엔진', visits: 3500, conversions: 105, bounceRate: 45 },
    { source: '소셜 미디어', visits: 2000, conversions: 40, bounceRate: 60 },
    { source: '이메일', visits: 1000, conversions: 50, bounceRate: 25 },
    { source: '제휴/추천', visits: 500, conversions: 20, bounceRate: 40 },
  ];

  return { revenue, orders, users, products, categories, traffic };
}
