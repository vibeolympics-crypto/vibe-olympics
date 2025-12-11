'use client';

/**
 * 실험 상세 모달
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  BeakerIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

interface ExperimentVariant {
  id: string;
  name: string;
  isControl: boolean;
  weight: number;
  totalUsers: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
}

interface Experiment {
  id: string;
  name: string;
  description: string | null;
  hypothesis: string | null;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  targetType: string;
  targetKey: string;
  trafficPercentage: number;
  primaryMetric: string;
  minSampleSize: number;
  confidenceLevel: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  variants: ExperimentVariant[];
  _count: {
    assignments: number;
  };
}

interface ExperimentStats {
  variantId: string;
  variantName: string;
  isControl: boolean;
  users: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenuePerUser: number;
  improvement?: number;
  confidence?: number;
  isWinner?: boolean;
}

interface ExperimentDetailModalProps {
  experiment: Experiment;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '초안', color: 'secondary' },
  RUNNING: { label: '실행 중', color: 'success' },
  PAUSED: { label: '일시정지', color: 'warning' },
  COMPLETED: { label: '완료', color: 'cyan' },
  ARCHIVED: { label: '보관됨', color: 'secondary' },
};

const metricLabels: Record<string, string> = {
  conversion: '전환율',
  click: '클릭률',
  revenue: '매출',
  engagement: '참여도',
};

export function ExperimentDetailModal({
  experiment,
  onClose,
  onStatusChange,
}: ExperimentDetailModalProps) {
  const [stats, setStats] = useState<ExperimentStats[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/ab-test/experiments/${experiment.id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || []);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [experiment.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCompleteWithWinner = async () => {
    if (!selectedWinner) {
      alert('승자를 선택해주세요');
      return;
    }

    try {
      const response = await fetch(`/api/ab-test/experiments/${experiment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          winnerVariantId: selectedWinner,
        }),
      });

      if (response.ok) {
        onStatusChange('COMPLETED');
      }
    } catch (error) {
      console.error('Failed to complete experiment:', error);
    }
  };

  const config = statusConfig[experiment.status];
  const control = stats.find(s => s.isControl);
  const totalUsers = stats.reduce((sum, s) => sum + s.users, 0);
  const progress = experiment.minSampleSize > 0 
    ? Math.min(100, (totalUsers / experiment.minSampleSize) * 100) 
    : 100;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <BeakerIcon className="h-5 w-5" />
                {experiment.name}
              </DialogTitle>
              <DialogDescription>
                {experiment.description || '설명 없음'}
              </DialogDescription>
            </div>
            <Badge variant={config?.color as 'success' | 'warning' | 'secondary' | 'cyan'}>
              {config?.label || experiment.status}
            </Badge>
          </div>
        </DialogHeader>

        {/* Hypothesis */}
        {experiment.hypothesis && (
          <Card className="p-4 bg-[var(--bg-elevated)]">
            <p className="text-sm text-[var(--text-secondary)]">가설</p>
            <p className="text-[var(--text-primary)] mt-1">{experiment.hypothesis}</p>
          </Card>
        )}

        {/* Experiment Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-[var(--bg-elevated)]">
            <p className="text-xs text-[var(--text-tertiary)]">타겟</p>
            <p className="font-medium text-[var(--text-primary)]">
              {experiment.targetType} / {experiment.targetKey}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-elevated)]">
            <p className="text-xs text-[var(--text-tertiary)]">트래픽</p>
            <p className="font-medium text-[var(--text-primary)]">
              {experiment.trafficPercentage}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-elevated)]">
            <p className="text-xs text-[var(--text-tertiary)]">주요 지표</p>
            <p className="font-medium text-[var(--text-primary)]">
              {metricLabels[experiment.primaryMetric] || experiment.primaryMetric}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-elevated)]">
            <p className="text-xs text-[var(--text-tertiary)]">신뢰 수준</p>
            <p className="font-medium text-[var(--text-primary)]">
              {experiment.confidenceLevel * 100}%
            </p>
          </div>
        </div>

        {/* Sample Size Progress */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-[var(--text-secondary)]" />
              <span className="text-sm text-[var(--text-secondary)]">샘플 사이즈</span>
            </div>
            <span className="text-sm text-[var(--text-primary)]">
              {totalUsers.toLocaleString()} / {experiment.minSampleSize.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progress >= 100 ? 'bg-green-500' : 'bg-[var(--primary)]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {progress >= 100 ? '최소 샘플 달성' : `${Math.round(progress)}% 달성`}
          </p>
        </Card>

        {/* Variant Stats */}
        <div className="space-y-3">
          <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            변형별 성과
          </h3>

          {isLoadingStats ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.map((stat) => {
                const improvement = stat.improvement;
                const isTopPerformer = !stat.isControl && improvement && improvement > 0 && (stat.confidence || 0) >= 95;

                return (
                  <Card
                    key={stat.variantId}
                    className={`p-4 ${
                      isTopPerformer 
                        ? 'border-green-500 bg-green-500/5' 
                        : stat.isControl 
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--text-primary)]">
                          {stat.variantName}
                        </span>
                        {stat.isControl && (
                          <Badge variant="secondary" className="text-xs">대조군</Badge>
                        )}
                        {isTopPerformer && (
                          <TrophyIcon className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      {experiment.status === 'RUNNING' && !stat.isControl && (
                        <input
                          type="radio"
                          name="winner"
                          checked={selectedWinner === stat.variantId}
                          onChange={() => setSelectedWinner(stat.variantId)}
                          className="rounded-full"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">사용자</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">
                          {stat.users.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">전환</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">
                          {stat.conversions.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">전환율</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">
                          {stat.conversionRate.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">사용자당 매출</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">
                          ₩{stat.revenuePerUser.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {!stat.isControl && improvement !== undefined && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--text-secondary)]">대조군 대비:</span>
                            <div className={`flex items-center gap-1 ${
                              improvement >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {improvement >= 0 ? (
                                <ArrowTrendingUpIcon className="h-4 w-4" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4" />
                              )}
                              <span className="font-bold">
                                {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          {stat.confidence !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--text-tertiary)]">신뢰도:</span>
                              <Badge variant={stat.confidence >= 95 ? 'success' : 'secondary'}>
                                {stat.confidence}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            생성: {new Date(experiment.createdAt).toLocaleDateString('ko-KR')}
          </div>
          {experiment.startDate && (
            <div>시작: {new Date(experiment.startDate).toLocaleDateString('ko-KR')}</div>
          )}
          {experiment.endDate && (
            <div>종료: {new Date(experiment.endDate).toLocaleDateString('ko-KR')}</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>

          {experiment.status === 'DRAFT' && (
            <Button onClick={() => onStatusChange('RUNNING')}>
              <PlayIcon className="h-4 w-4 mr-2" />
              실험 시작
            </Button>
          )}

          {experiment.status === 'RUNNING' && (
            <>
              <Button variant="outline" onClick={() => onStatusChange('PAUSED')}>
                <PauseIcon className="h-4 w-4 mr-2" />
                일시정지
              </Button>
              <Button onClick={handleCompleteWithWinner}>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                승자 선택 및 완료
              </Button>
            </>
          )}

          {experiment.status === 'PAUSED' && (
            <Button onClick={() => onStatusChange('RUNNING')}>
              <PlayIcon className="h-4 w-4 mr-2" />
              재개
            </Button>
          )}

          {experiment.status === 'COMPLETED' && (
            <Button variant="outline" onClick={() => onStatusChange('ARCHIVED')}>
              <ArchiveBoxIcon className="h-4 w-4 mr-2" />
              보관
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
