'use client';

/**
 * AI 가격 추천 컴포넌트
 * 시장 분석 기반 최적 가격 제안 UI
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';

// Types
interface ProductInfo {
  id: string;
  name: string;
  category: string;
  currentPrice?: number;
  cost?: number;
  quality?: 'low' | 'medium' | 'high' | 'premium';
}

interface PricingStrategy {
  name: string;
  description: string;
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  profitMargin: number;
  competitivePosition: 'undercut' | 'match' | 'premium';
  riskLevel: 'low' | 'medium' | 'high';
  expectedSalesVolume: 'low' | 'medium' | 'high';
}

interface PricingInsight {
  type: 'opportunity' | 'warning' | 'recommendation' | 'market';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
}

interface PriceAdjustment {
  factor: string;
  description: string;
  adjustment: number;
  applied: boolean;
}

interface MarketAnalysis {
  competitorCount: number;
  averageCompetitorPrice: number;
  pricePosition: string;
  marketShare: number;
  demandScore: number;
  supplyScore: number;
  seasonalityImpact: number;
  trendImpact: number;
}

interface PriceRecommendation {
  productId: string;
  productName: string;
  currentPrice?: number;
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number;
  strategies: PricingStrategy[];
  marketAnalysis: MarketAnalysis;
  insights: PricingInsight[];
  adjustments: PriceAdjustment[];
  timestamp: string;
}

interface AIPricingRecommenderProps {
  product?: ProductInfo;
  onPriceSelect?: (price: number) => void;
}

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

// Fetch recommendation
const fetchRecommendation = async (product?: ProductInfo): Promise<PriceRecommendation> => {
  if (product) {
    const response = await fetch('/api/ai/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'single', product }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.data;
  } else {
    const response = await fetch('/api/ai/pricing');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.data;
  }
};

export function AIPricingRecommender({ product, onPriceSelect }: AIPricingRecommenderProps) {
  const [activeTab, setActiveTab] = useState<'recommendation' | 'strategies' | 'analysis' | 'insights'>('recommendation');
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);

  const { data: recommendation, isLoading, error, refetch } = useQuery({
    queryKey: ['pricing-recommendation', product?.id],
    queryFn: () => fetchRecommendation(product),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <span className="text-gray-600 dark:text-gray-300">AI가 최적 가격을 분석 중...</span>
        </div>
      </div>
    );
  }

  if (error || !recommendation) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
        <div className="text-center">
          <p className="text-red-500 mb-4">가격 분석 중 오류가 발생했습니다.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'recommendation', label: '추천 가격', icon: '💰' },
    { id: 'strategies', label: '가격 전략', icon: '📊' },
    { id: 'analysis', label: '시장 분석', icon: '📈' },
    { id: 'insights', label: '인사이트', icon: '💡' },
  ] as const;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">AI 가격 추천</h2>
            <p className="text-indigo-100 text-sm">{recommendation.productName}</p>
          </div>
          <div className="text-right">
            <div className="text-white text-sm">신뢰도</div>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${recommendation.confidence}%` }}
                />
              </div>
              <span className="text-white font-semibold">{recommendation.confidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'recommendation' && (
            <motion.div
              key="recommendation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RecommendationTab
                recommendation={recommendation}
                onPriceSelect={onPriceSelect}
              />
            </motion.div>
          )}

          {activeTab === 'strategies' && (
            <motion.div
              key="strategies"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <StrategiesTab
                strategies={recommendation.strategies}
                selectedStrategy={selectedStrategy}
                onSelectStrategy={setSelectedStrategy}
                onPriceSelect={onPriceSelect}
              />
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AnalysisTab
                analysis={recommendation.marketAnalysis}
                adjustments={recommendation.adjustments}
              />
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <InsightsTab insights={recommendation.insights} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Recommendation Tab
function RecommendationTab({
  recommendation,
  onPriceSelect,
}: {
  recommendation: PriceRecommendation;
  onPriceSelect?: (price: number) => void;
}) {
  const priceDiff = recommendation.currentPrice
    ? ((recommendation.recommendedPrice - recommendation.currentPrice) / recommendation.currentPrice) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Recommendation */}
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">AI 추천 가격</p>
        <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">
          {formatCurrency(recommendation.recommendedPrice)}
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          권장 범위: {formatCurrency(recommendation.priceRange.min)} ~ {formatCurrency(recommendation.priceRange.max)}
        </p>
      </div>

      {/* Price Comparison */}
      {recommendation.currentPrice && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">현재 가격</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(recommendation.currentPrice)}
              </p>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${priceDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {priceDiff >= 0 ? '↑' : '↓'} {Math.abs(priceDiff).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {priceDiff >= 0 ? '인상 권장' : '인하 권장'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">추천 가격</p>
              <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(recommendation.recommendedPrice)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Insights */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {recommendation.marketAnalysis.competitorCount}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">경쟁 상품</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {recommendation.marketAnalysis.demandScore}점
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">수요 지수</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(recommendation.marketAnalysis.averageCompetitorPrice)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">시장 평균</p>
        </div>
      </div>

      {/* Apply Button */}
      {onPriceSelect && (
        <button
          onClick={() => onPriceSelect(recommendation.recommendedPrice)}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          이 가격 적용하기
        </button>
      )}
    </div>
  );
}

// Strategies Tab
function StrategiesTab({
  strategies,
  selectedStrategy,
  onSelectStrategy,
  onPriceSelect,
}: {
  strategies: PricingStrategy[];
  selectedStrategy: number | null;
  onSelectStrategy: (index: number | null) => void;
  onPriceSelect?: (price: number) => void;
}) {
  const getPositionColor = (position: string) => {
    switch (position) {
      case 'undercut': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'match': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'premium': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {strategies.map((strategy, index) => (
        <motion.div
          key={index}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedStrategy === index
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
          }`}
          onClick={() => onSelectStrategy(selectedStrategy === index ? null : index)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{strategy.name}</h3>
                {strategy.name.includes('추천') && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                    추천
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {strategy.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(strategy.recommendedPrice)}
              </div>
              <div className="text-sm text-gray-500">
                마진 {strategy.profitMargin}%
              </div>
            </div>
          </div>

          <AnimatePresence>
            {selectedStrategy === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">가격 범위</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(strategy.priceRange.min)} ~ {formatCurrency(strategy.priceRange.max)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">리스크</p>
                    <p className={`text-sm font-medium ${getRiskColor(strategy.riskLevel)}`}>
                      {strategy.riskLevel === 'low' ? '낮음' : strategy.riskLevel === 'medium' ? '중간' : '높음'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">예상 판매량</p>
                    <p className="text-sm font-medium">
                      {strategy.expectedSalesVolume === 'low' ? '낮음' : strategy.expectedSalesVolume === 'medium' ? '중간' : '높음'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm ${getPositionColor(strategy.competitivePosition)}`}>
                    {strategy.competitivePosition === 'undercut' ? '저가 전략' :
                     strategy.competitivePosition === 'match' ? '시장 맞춤' : '프리미엄'}
                  </span>
                  {onPriceSelect && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPriceSelect(strategy.recommendedPrice);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                    >
                      이 전략 적용
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// Analysis Tab
function AnalysisTab({
  analysis,
  adjustments,
}: {
  analysis: MarketAnalysis;
  adjustments: PriceAdjustment[];
}) {
  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">시장 개요</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">수요 지수</span>
              <span className="font-semibold text-gray-900 dark:text-white">{analysis.demandScore}/100</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${analysis.demandScore}%` }}
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">공급 지수</span>
              <span className="font-semibold text-gray-900 dark:text-white">{analysis.supplyScore}/100</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${analysis.supplyScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Market Metrics */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">시장 지표</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">경쟁 상품 수</span>
            <span className="font-medium text-gray-900 dark:text-white">{analysis.competitorCount}개</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">시장 평균가</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(analysis.averageCompetitorPrice)}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">가격 포지션</span>
            <span className={`font-medium ${
              analysis.pricePosition === 'below' ? 'text-green-600' :
              analysis.pricePosition === 'above' ? 'text-orange-600' :
              analysis.pricePosition === 'well-above' ? 'text-red-600' : 'text-blue-600'
            }`}>
              {analysis.pricePosition === 'below' ? '평균 이하' :
               analysis.pricePosition === 'at' ? '평균 수준' :
               analysis.pricePosition === 'above' ? '평균 이상' : '프리미엄'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">예상 점유율</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {analysis.marketShare.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Impact Factors */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">영향 요인</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">계절성 영향</p>
            <p className={`text-xl font-bold ${
              analysis.seasonalityImpact >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analysis.seasonalityImpact >= 0 ? '+' : ''}{analysis.seasonalityImpact.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">트렌드 영향</p>
            <p className={`text-xl font-bold ${
              analysis.trendImpact >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analysis.trendImpact >= 0 ? '+' : ''}{analysis.trendImpact.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Price Adjustments */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">가격 조정 요인</h3>
        <div className="space-y-2">
          {adjustments.filter(a => a.applied).map((adj, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div>
                <span className="font-medium text-gray-900 dark:text-white">{adj.factor}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{adj.description}</span>
              </div>
              <span className={`font-semibold ${
                adj.adjustment >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {adj.adjustment >= 0 ? '+' : ''}{adj.adjustment.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Insights Tab
function InsightsTab({ insights }: { insights: PricingInsight[] }) {
  const getInsightIcon = (type: PricingInsight['type']) => {
    switch (type) {
      case 'opportunity': return '🎯';
      case 'warning': return '⚠️';
      case 'recommendation': return '💡';
      case 'market': return '📊';
      default: return '📝';
    }
  };

  const getInsightColor = (type: PricingInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20';
      case 'recommendation': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      case 'market': return 'border-purple-200 bg-purple-50 dark:bg-purple-900/20';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getImpactBadge = (impact: PricingInsight['impact']) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (insights.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">분석된 인사이트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
        >
          <div className="flex items-start space-x-3">
            <span className="text-2xl">{getInsightIcon(insight.type)}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h4>
                <div className="flex items-center space-x-2">
                  {insight.actionable && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs rounded-full">
                      실행 가능
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getImpactBadge(insight.impact)}`}>
                    {insight.impact === 'high' ? '높음' : insight.impact === 'medium' ? '중간' : '낮음'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{insight.description}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default AIPricingRecommender;
