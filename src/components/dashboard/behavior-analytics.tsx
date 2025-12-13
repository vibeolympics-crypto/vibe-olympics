'use client';

/**
 * 사용자 행동 분석 대시보드
 * 히트맵, 클릭 추적, 세션 분석 시각화
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointerClick,
  Eye,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Monitor,
  Tablet,
  Smartphone,
  ArrowRight,
  Download,
  RefreshCw,
  MapPin,
  Activity,
  BarChart3,
  PieChart,
  Loader2,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface BehaviorOverview {
  totalSessions: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
  avgScrollDepth: number;
  topPages: PageStats[];
  topClickAreas: ClickAreaStats[];
  userFlow: UserFlowNode[];
  deviceBreakdown: DeviceBreakdown;
  engagementScore: number;
  period: string;
  dateRange: { start: string; end: string };
}

interface PageStats {
  url: string;
  title: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  exitRate: number;
  bounceRate: number;
}

interface ClickAreaStats {
  area: string;
  description: string;
  clicks: number;
  uniqueClicks: number;
  percentage: number;
}

interface UserFlowNode {
  from: string;
  to: string;
  count: number;
  percentage: number;
}

interface DeviceBreakdown {
  desktop: number;
  tablet: number;
  mobile: number;
}

interface HourlyData {
  hour: number;
  sessions: number;
}

interface DailyData {
  date: string;
  sessions: number;
}

interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
  normalizedX: number;
  normalizedY: number;
}

interface HeatmapData {
  pageUrl: string;
  points: HeatmapPoint[];
  totalClicks: number;
  maxValue: number;
}

// ============================================================================
// Main Component
// ============================================================================

export function BehaviorAnalytics() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'flow' | 'timeline'>('overview');
  const [selectedPage, setSelectedPage] = useState('/');

  // 개요 데이터
  const { data: overviewData, isLoading: overviewLoading, refetch } = useQuery({
    queryKey: ['behavior-overview', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/behavior?type=overview&period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data as BehaviorOverview;
    },
  });

  // 시간대별 데이터
  const { data: hourlyData } = useQuery({
    queryKey: ['behavior-hourly', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/behavior?type=hourly&period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data as HourlyData[];
    },
    enabled: activeTab === 'timeline',
  });

  // 일별 데이터
  const { data: dailyData } = useQuery({
    queryKey: ['behavior-daily', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/behavior?type=daily&period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data as DailyData[];
    },
    enabled: activeTab === 'timeline',
  });

  // 히트맵 데이터
  const { data: heatmapData } = useQuery({
    queryKey: ['behavior-heatmap', selectedPage, period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/behavior?type=heatmap&period=${period}&pageUrl=${encodeURIComponent(selectedPage)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.data as HeatmapData;
    },
    enabled: activeTab === 'heatmap',
  });

  // CSV 내보내기
  const handleExport = async () => {
    const res = await fetch(`/api/analytics/behavior?type=export&period=${period}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `behavior-analytics-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: '개요', icon: BarChart3 },
    { id: 'heatmap', label: '히트맵', icon: MapPin },
    { id: 'flow', label: '사용자 흐름', icon: ArrowRight },
    { id: 'timeline', label: '시간대 분석', icon: Clock },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            사용자 행동 분석
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            히트맵, 클릭 추적, 세션 분석
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="day">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
            <option value="year">올해</option>
          </select>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="새로고침"
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {overviewLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && overviewData && (
              <OverviewTab data={overviewData} />
            )}
            {activeTab === 'heatmap' && (
              <HeatmapTab
                data={heatmapData}
                pages={overviewData?.topPages || []}
                selectedPage={selectedPage}
                onPageSelect={setSelectedPage}
              />
            )}
            {activeTab === 'flow' && overviewData && (
              <FlowTab data={overviewData.userFlow} pages={overviewData.topPages} />
            )}
            {activeTab === 'timeline' && (
              <TimelineTab hourlyData={hourlyData || []} dailyData={dailyData || []} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({ data }: { data: BehaviorOverview }) {
  const stats = [
    {
      label: '총 세션',
      value: data.totalSessions.toLocaleString(),
      icon: Activity,
      color: 'bg-blue-500',
    },
    {
      label: '고유 사용자',
      value: data.uniqueUsers.toLocaleString(),
      icon: Users,
      color: 'bg-green-500',
    },
    {
      label: '평균 세션 시간',
      value: formatDuration(data.avgSessionDuration),
      icon: Clock,
      color: 'bg-purple-500',
    },
    {
      label: '세션당 페이지',
      value: data.avgPagesPerSession.toFixed(1),
      icon: Eye,
      color: 'bg-orange-500',
    },
    {
      label: '이탈률',
      value: `${data.bounceRate.toFixed(1)}%`,
      icon: data.bounceRate > 50 ? TrendingDown : TrendingUp,
      color: data.bounceRate > 50 ? 'bg-red-500' : 'bg-green-500',
    },
    {
      label: '참여도 점수',
      value: `${data.engagementScore}/100`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
          >
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <DeviceBreakdownCard breakdown={data.deviceBreakdown} />

        {/* Top Click Areas */}
        <ClickAreasCard areas={data.topClickAreas} />
      </div>

      {/* Top Pages */}
      <TopPagesCard pages={data.topPages} />
    </div>
  );
}

// ============================================================================
// Device Breakdown Card
// ============================================================================

function DeviceBreakdownCard({ breakdown }: { breakdown: DeviceBreakdown }) {
  const devices = [
    { type: 'desktop', label: '데스크톱', value: breakdown.desktop, icon: Monitor, color: 'bg-blue-500' },
    { type: 'tablet', label: '태블릿', value: breakdown.tablet, icon: Tablet, color: 'bg-purple-500' },
    { type: 'mobile', label: '모바일', value: breakdown.mobile, icon: Smartphone, color: 'bg-green-500' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">디바이스 분포</h3>
      </div>

      <div className="space-y-4">
        {devices.map((device) => (
          <div key={device.type} className="flex items-center gap-3">
            <div className={`w-10 h-10 ${device.color} rounded-lg flex items-center justify-center`}>
              <device.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {device.label}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {device.value.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${device.value}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`h-full ${device.color}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Click Areas Card
// ============================================================================

function ClickAreasCard({ areas }: { areas: ClickAreaStats[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MousePointerClick className="w-5 h-5 text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">클릭 영역</h3>
      </div>

      <div className="space-y-3">
        {areas.slice(0, 6).map((area, index) => (
          <div key={area.area} className="flex items-center gap-3">
            <span className="w-6 h-6 flex items-center justify-center text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
              {index + 1}
            </span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {area.description}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {area.clicks.toLocaleString()} ({area.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${area.percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full bg-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Top Pages Card
// ============================================================================

function TopPagesCard({ pages }: { pages: PageStats[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">인기 페이지</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="pb-3">페이지</th>
              <th className="pb-3 text-right">조회수</th>
              <th className="pb-3 text-right">평균 체류</th>
              <th className="pb-3 text-right">스크롤 깊이</th>
              <th className="pb-3 text-right">이탈률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {pages.slice(0, 10).map((page) => (
              <tr key={page.url} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{page.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{page.url}</p>
                  </div>
                </td>
                <td className="py-3 text-right text-gray-700 dark:text-gray-300">
                  {page.views.toLocaleString()}
                </td>
                <td className="py-3 text-right text-gray-700 dark:text-gray-300">
                  {formatDuration(page.avgTimeOnPage)}
                </td>
                <td className="py-3 text-right text-gray-700 dark:text-gray-300">
                  {page.avgScrollDepth.toFixed(0)}%
                </td>
                <td className="py-3 text-right">
                  <span className={`${
                    page.bounceRate > 50 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {page.bounceRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Heatmap Tab
// ============================================================================

function HeatmapTab({
  data,
  pages,
  selectedPage,
  onPageSelect,
}: {
  data: HeatmapData | undefined;
  pages: PageStats[];
  selectedPage: string;
  onPageSelect: (page: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Page Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          페이지 선택
        </label>
        <select
          value={selectedPage}
          onChange={(e) => onPageSelect(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {pages.map((page) => (
            <option key={page.url} value={page.url}>
              {page.title} ({page.url})
            </option>
          ))}
        </select>
      </div>

      {/* Heatmap Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          클릭 히트맵 - {selectedPage}
        </h3>
        
        {data ? (
          <div className="relative w-full h-[500px] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
            {/* Heatmap Grid */}
            <div className="absolute inset-0">
              {data.points.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.7 }}
                  transition={{ delay: index * 0.01 }}
                  className="absolute rounded-full"
                  style={{
                    left: `${point.normalizedX}%`,
                    top: `${point.normalizedY}%`,
                    width: `${Math.max(20, point.value * 10)}px`,
                    height: `${Math.max(20, point.value * 10)}px`,
                    transform: 'translate(-50%, -50%)',
                    background: getHeatColor(point.value / data.maxValue),
                    filter: 'blur(8px)',
                  }}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">클릭 밀도</p>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">낮음</span>
                <div className="w-24 h-3 rounded" style={{
                  background: 'linear-gradient(to right, rgba(59, 130, 246, 0.3), rgba(239, 68, 68, 0.9))'
                }} />
                <span className="text-xs text-gray-500">높음</span>
              </div>
            </div>

            {/* Stats */}
            <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                총 클릭: {data.totalClicks.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                핫스팟: {data.points.length}개
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[500px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Flow Tab
// ============================================================================

function FlowTab({ data, pages }: { data: UserFlowNode[]; pages: PageStats[] }) {
  const topFlows = data.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">사용자 이동 경로</h3>
        
        <div className="space-y-3">
          {topFlows.map((flow, index) => (
            <motion.div
              key={`${flow.from}-${flow.to}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <span className="w-6 h-6 flex items-center justify-center text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                {index + 1}
              </span>
              
              <div className="flex-1 flex items-center gap-3">
                <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  {flow.from}
                </span>
                
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600" />
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
                
                <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  {flow.to}
                </span>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {flow.count.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {flow.percentage.toFixed(1)}%
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Entry/Exit Pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">인기 진입 페이지</h3>
          <div className="space-y-2">
            {pages.slice(0, 5).map((page, index) => (
              <div key={page.url} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{index + 1}.</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{page.url}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {page.views.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">높은 이탈률 페이지</h3>
          <div className="space-y-2">
            {pages
              .sort((a, b) => b.exitRate - a.exitRate)
              .slice(0, 5)
              .map((page, index) => (
                <div key={page.url} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{index + 1}.</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{page.url}</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    page.exitRate > 50 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {page.exitRate.toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Timeline Tab
// ============================================================================

function TimelineTab({
  hourlyData,
  dailyData,
}: {
  hourlyData: HourlyData[];
  dailyData: DailyData[];
}) {
  const maxHourly = Math.max(...hourlyData.map((d) => d.sessions), 1);
  const maxDaily = Math.max(...dailyData.map((d) => d.sessions), 1);

  return (
    <div className="space-y-6">
      {/* Hourly Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">시간대별 세션</h3>
        
        <div className="flex items-end justify-between h-40 gap-1">
          {hourlyData.map((data) => (
            <div key={data.hour} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(data.sessions / maxHourly) * 100}%` }}
                transition={{ duration: 0.5, delay: data.hour * 0.02 }}
                className="w-full bg-blue-500 rounded-t"
                title={`${data.hour}시: ${data.sessions} 세션`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {data.hour}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>오전</span>
          <span>오후</span>
          <span>밤</span>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">일별 세션 추이</h3>
        
        <div className="h-48 flex items-end gap-2">
          {dailyData.map((data, index) => (
            <div key={data.date} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(data.sessions / maxDaily) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="w-full bg-green-500 rounded-t min-h-[4px]"
                title={`${data.date}: ${data.sessions} 세션`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 rotate-45 origin-left whitespace-nowrap">
                {new Date(data.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Peak Times Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400">피크 시간대</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {getPeakHour(hourlyData)}시
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400">총 세션</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {hourlyData.reduce((sum, d) => sum + d.sessions, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400">일 평균 세션</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {dailyData.length > 0
              ? Math.round(dailyData.reduce((sum, d) => sum + d.sessions, 0) / dailyData.length).toLocaleString()
              : 0}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}초`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}분 ${secs}초`;
}

function getHeatColor(intensity: number): string {
  // Blue to Red gradient
  const r = Math.round(59 + (239 - 59) * intensity);
  const g = Math.round(130 - (130 - 68) * intensity);
  const b = Math.round(246 - (246 - 68) * intensity);
  return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.6})`;
}

function getPeakHour(data: HourlyData[]): number {
  if (data.length === 0) return 0;
  return data.reduce((peak, d) => (d.sessions > peak.sessions ? d : peak), data[0]).hour;
}

export default BehaviorAnalytics;
