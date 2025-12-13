'use client';

/**
 * AI 인사이트 리포트 대시보드
 * 자동 비즈니스 인사이트 시각화
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Download,
  Lightbulb,
  Target,
  Shield,
  Zap,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  FileText,
  Loader2,
  ChevronRight,
  AlertCircle,
  Info,
  Star,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface InsightReport {
  id: string;
  generatedAt: string;
  period: string;
  summary: ExecutiveSummary;
  trends: TrendInsight[];
  anomalies: AnomalyInsight[];
  recommendations: Recommendation[];
  forecasts: Forecast[];
  riskAssessment: RiskAssessment;
}

interface ExecutiveSummary {
  headline: string;
  keyMetrics: KeyMetric[];
  highlights: string[];
  concerns: string[];
  overallHealth: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  healthScore: number;
}

interface KeyMetric {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface TrendInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  direction: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

interface AnomalyInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  detectedAt: string;
  possibleCauses: string[];
}

interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  actions: string[];
}

interface Forecast {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  range: { min: number; max: number };
  timeframe: string;
  trend: 'growing' | 'declining' | 'stable';
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  risks: Risk[];
}

interface Risk {
  id: string;
  category: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function AIInsightsReport() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'quarter'>('week');
  const [activeSection, setActiveSection] = useState<'summary' | 'trends' | 'anomalies' | 'recommendations' | 'forecasts' | 'risks'>('summary');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-insights', period],
    queryFn: async () => {
      const res = await fetch(`/api/ai/insights?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data as InsightReport;
    },
    refetchOnWindowFocus: false,
  });

  const sections = [
    { id: 'summary', label: '경영 요약', icon: FileText },
    { id: 'trends', label: '트렌드', icon: TrendingUp },
    { id: 'anomalies', label: '이상 탐지', icon: AlertTriangle },
    { id: 'recommendations', label: '권장사항', icon: Lightbulb },
    { id: 'forecasts', label: '예측', icon: Target },
    { id: 'risks', label: '리스크', icon: Shield },
  ] as const;

  const handleExport = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-insights-${period}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI 인사이트 리포트
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              자동 비즈니스 분석 및 권장사항
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="day">일간</option>
            <option value="week">주간</option>
            <option value="month">월간</option>
            <option value="quarter">분기</option>
          </select>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            disabled={!data}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>
      </div>

      {/* Sections Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeSection === section.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">AI가 비즈니스 데이터를 분석 중입니다...</p>
          </div>
        </div>
      ) : data ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'summary' && <SummarySection data={data.summary} />}
            {activeSection === 'trends' && <TrendsSection data={data.trends} />}
            {activeSection === 'anomalies' && <AnomaliesSection data={data.anomalies} />}
            {activeSection === 'recommendations' && <RecommendationsSection data={data.recommendations} />}
            {activeSection === 'forecasts' && <ForecastsSection data={data.forecasts} />}
            {activeSection === 'risks' && <RisksSection data={data.riskAssessment} />}
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  );
}

// ============================================================================
// Summary Section
// ============================================================================

function SummarySection({ data }: { data: ExecutiveSummary }) {
  const healthColors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    moderate: 'bg-yellow-500',
    poor: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  const healthLabels = {
    excellent: '탁월',
    good: '양호',
    moderate: '보통',
    poor: '부진',
    critical: '위기',
  };

  return (
    <div className="space-y-6">
      {/* Headline Card */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <p className="text-2xl font-bold">{data.headline}</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${healthColors[data.overallHealth]}`} />
            <span className="font-medium">{healthLabels[data.overallHealth]}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>건강 점수: {data.healthScore}/100</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.keyMetrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">{metric.name}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatMetricValue(metric.name, metric.value)}
            </p>
            <div className={`flex items-center gap-1 mt-2 ${
              metric.trend === 'up' ? 'text-green-600' :
              metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {metric.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
              {metric.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
              {metric.trend === 'stable' && <Minus className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Highlights & Concerns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Highlights */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">주요 성과</h3>
          </div>
          <ul className="space-y-3">
            {data.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Concerns */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">주의 필요</h3>
          </div>
          <ul className="space-y-3">
            {data.concerns.map((concern, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{concern}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Trends Section
// ============================================================================

function TrendsSection({ data }: { data: TrendInsight[] }) {
  const impactColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  const directionIcons = {
    positive: <TrendingUp className="w-5 h-5 text-green-500" />,
    negative: <TrendingDown className="w-5 h-5 text-red-500" />,
    neutral: <Minus className="w-5 h-5 text-gray-500" />,
  };

  return (
    <div className="space-y-4">
      {data.map((trend, index) => (
        <motion.div
          key={trend.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {directionIcons[trend.direction]}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{trend.title}</h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{trend.description}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${impactColors[trend.impact]}`}>
              {trend.impact === 'high' ? '높은 영향' : trend.impact === 'medium' ? '중간 영향' : '낮은 영향'}
            </span>
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-4 h-4" />
              <span>신뢰도: {trend.confidence.toFixed(0)}%</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// Anomalies Section
// ============================================================================

function AnomaliesSection({ data }: { data: AnomalyInsight[] }) {
  const severityStyles = {
    critical: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
  };

  if (data.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">이상 없음</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          현재 기간 동안 특별한 이상 징후가 감지되지 않았습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((anomaly, index) => {
        const style = severityStyles[anomaly.severity];
        return (
          <motion.div
            key={anomaly.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${style.bg} border ${style.border} rounded-xl p-6`}
          >
            <div className="flex items-start gap-3">
              {style.icon}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">{anomaly.title}</h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{anomaly.description}</p>
                
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">가능한 원인:</p>
                  <ul className="space-y-1">
                    {anomaly.possibleCauses.map((cause, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <ChevronRight className="w-4 h-4" />
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Recommendations Section
// ============================================================================

function RecommendationsSection({ data }: { data: Recommendation[] }) {
  const priorityStyles = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500',
  };

  const effortLabels = {
    low: '낮음',
    medium: '중간',
    high: '높음',
  };

  return (
    <div className="space-y-4">
      {data.map((rec, index) => (
        <motion.div
          key={rec.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${priorityStyles[rec.priority]} overflow-hidden`}
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {rec.priority === 'high' ? '높은 우선순위' : rec.priority === 'medium' ? '중간 우선순위' : '낮은 우선순위'}
              </span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400">{rec.description}</p>
            
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Zap className="w-4 h-4" />
                <span>{rec.expectedImpact}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{rec.timeframe}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Activity className="w-4 h-4" />
                <span>노력: {effortLabels[rec.effort]}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">실행 항목:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {rec.actions.map((action, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// Forecasts Section
// ============================================================================

function ForecastsSection({ data }: { data: Forecast[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((forecast, index) => (
        <motion.div
          key={forecast.metric}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">{forecast.metric}</h4>
            <span className={`flex items-center gap-1 text-sm ${
              forecast.trend === 'growing' ? 'text-green-600' :
              forecast.trend === 'declining' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {forecast.trend === 'growing' && <TrendingUp className="w-4 h-4" />}
              {forecast.trend === 'declining' && <TrendingDown className="w-4 h-4" />}
              {forecast.trend === 'stable' && <Minus className="w-4 h-4" />}
              {forecast.trend === 'growing' ? '성장' : forecast.trend === 'declining' ? '하락' : '안정'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">현재</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatForecastValue(forecast.metric, forecast.currentValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">예측 ({forecast.timeframe})</p>
              <p className="text-xl font-bold text-blue-600">
                {formatForecastValue(forecast.metric, forecast.predictedValue)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                범위: {formatForecastValue(forecast.metric, forecast.range.min)} ~ {formatForecastValue(forecast.metric, forecast.range.max)}
              </p>
            </div>
          </div>

          {/* Confidence Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>신뢰도</span>
              <span>{forecast.confidence.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${forecast.confidence}%` }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="h-full bg-blue-500"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// Risks Section
// ============================================================================

function RisksSection({ data }: { data: RiskAssessment }) {
  const riskLevelStyles = {
    low: { bg: 'bg-green-500', label: '낮음' },
    medium: { bg: 'bg-yellow-500', label: '중간' },
    high: { bg: 'bg-orange-500', label: '높음' },
    critical: { bg: 'bg-red-500', label: '심각' },
  };

  return (
    <div className="space-y-6">
      {/* Overall Risk */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${riskLevelStyles[data.overallRisk].bg}`}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">전체 리스크 수준</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {riskLevelStyles[data.overallRisk].label}
            </p>
          </div>
        </div>
      </div>

      {/* Individual Risks */}
      {data.risks.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">리스크 없음</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            현재 식별된 비즈니스 리스크가 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.risks.map((risk, index) => (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {risk.category}
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{risk.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">발생 가능성</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      risk.probability === 'high' ? 'bg-red-500' :
                      risk.probability === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {risk.probability === 'high' ? '높음' : risk.probability === 'medium' ? '중간' : '낮음'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">영향도</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      risk.impact === 'high' ? 'bg-red-500' :
                      risk.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {risk.impact === 'high' ? '높음' : risk.impact === 'medium' ? '중간' : '낮음'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">완화 방안:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{risk.mitigation}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function formatMetricValue(name: string, value: number): string {
  if (name.includes('매출') || name.includes('주문액')) {
    return `₩${value.toLocaleString()}`;
  }
  if (name.includes('율') || name.includes('전환')) {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString();
}

function formatForecastValue(metric: string, value: number): string {
  if (metric.includes('매출')) {
    return `₩${Math.round(value).toLocaleString()}`;
  }
  return Math.round(value).toLocaleString();
}

export default AIInsightsReport;
