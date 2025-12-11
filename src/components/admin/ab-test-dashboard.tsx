'use client';

/**
 * A/B 테스트 관리 대시보드
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BeakerIcon, 
  PlayIcon, 
  PauseIcon, 
  ArchiveBoxIcon,
  TrashIcon,
  PlusIcon,
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateExperimentDialog } from './create-experiment-dialog';
import { ExperimentDetailModal } from './experiment-detail-modal';

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

interface DashboardSummary {
  totalExperiments: number;
  runningExperiments: number;
  completedExperiments: number;
  draftExperiments: number;
  pausedExperiments: number;
  archivedExperiments: number;
  totalAssignments: number;
  totalEvents: number;
  avgAssignmentsPerExperiment: number;
}

interface TopPerformer {
  id: string;
  name: string;
  conversionRate: number;
  totalUsers: number;
  conversions: number;
  experiment: {
    id: string;
    name: string;
    status: string;
  };
}

type StatusFilter = 'ALL' | 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

const statusConfig: Record<string, { label: string; color: string; icon: typeof PlayIcon }> = {
  DRAFT: { label: '초안', color: 'secondary', icon: ClockIcon },
  RUNNING: { label: '실행 중', color: 'success', icon: PlayIcon },
  PAUSED: { label: '일시정지', color: 'warning', icon: PauseIcon },
  COMPLETED: { label: '완료', color: 'cyan', icon: CheckCircleIcon },
  ARCHIVED: { label: '보관됨', color: 'secondary', icon: ArchiveBoxIcon },
};

export function ABTestDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/ab-test');
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setTopPerformers(data.topPerformers || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  }, []);

  const fetchExperiments = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/ab-test/experiments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setExperiments(data.experiments || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchDashboardData();
    fetchExperiments();
  }, [fetchDashboardData, fetchExperiments]);

  const handleBulkAction = async (action: 'start' | 'pause' | 'resume' | 'archive' | 'delete') => {
    if (selectedIds.size === 0) return;
    
    const confirmMessages: Record<string, string> = {
      start: '선택한 실험을 시작하시겠습니까?',
      pause: '선택한 실험을 일시정지하시겠습니까?',
      resume: '선택한 실험을 재개하시겠습니까?',
      archive: '선택한 실험을 보관하시겠습니까?',
      delete: '선택한 실험을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    };

    if (!confirm(confirmMessages[action])) return;

    try {
      const response = await fetch('/api/admin/ab-test/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          experimentIds: Array.from(selectedIds),
        }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        fetchExperiments();
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const handleStatusChange = async (experimentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/ab-test/experiments/${experimentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchExperiments();
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Status change failed:', error);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === experiments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(experiments.map(e => e.id)));
    }
  };

  const getConversionImprovement = (experiment: Experiment): number | null => {
    const control = experiment.variants.find(v => v.isControl);
    const treatment = experiment.variants.find(v => !v.isControl);
    if (!control || !treatment || control.conversionRate === 0) return null;
    return ((treatment.conversionRate - control.conversionRate) / control.conversionRate) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">A/B 테스트 관리</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            실험을 생성하고 관리하며 결과를 분석합니다
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          새 실험
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--primary)]/10">
                <BeakerIcon className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">전체 실험</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {summary.totalExperiments}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <PlayIcon className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">실행 중</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {summary.runningExperiments}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <UserGroupIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">총 할당</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {summary.totalAssignments.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <ChartBarIcon className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">총 이벤트</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {summary.totalEvents.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
            최고 성과 변형
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topPerformers.map((performer) => (
              <div 
                key={performer.id} 
                className="p-3 rounded-lg bg-[var(--bg-elevated)] cursor-pointer hover:bg-[var(--bg-hover)]"
                onClick={() => {
                  const exp = experiments.find(e => e.id === performer.experiment.id);
                  if (exp) setSelectedExperiment(exp);
                }}
              >
                <p className="text-sm text-[var(--text-secondary)] truncate">
                  {performer.experiment.name}
                </p>
                <p className="font-medium text-[var(--text-primary)]">{performer.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                  <span className="text-lg font-bold text-green-500">
                    {(performer.conversionRate * 100).toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {performer.totalUsers.toLocaleString()} users
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters and Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['ALL', 'DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'ARCHIVED'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {status === 'ALL' ? '전체' : statusConfig[status]?.label || status}
            </button>
          ))}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">
              {selectedIds.size}개 선택됨
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  일괄 작업
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction('start')}>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  시작
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('pause')}>
                  <PauseIcon className="h-4 w-4 mr-2" />
                  일시정지
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('resume')}>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  재개
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
                  <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                  보관
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Experiments Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.size === experiments.length && experiments.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead>실험명</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>트래픽</TableHead>
              <TableHead>할당</TableHead>
              <TableHead>전환율</TableHead>
              <TableHead>개선율</TableHead>
              <TableHead className="w-20">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
                  </div>
                </TableCell>
              </TableRow>
            ) : experiments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-[var(--text-secondary)]">
                  실험이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              experiments.map((experiment) => {
                const improvement = getConversionImprovement(experiment);
                const control = experiment.variants.find(v => v.isControl);
                const treatment = experiment.variants.find(v => !v.isControl);
                const config = statusConfig[experiment.status];

                return (
                  <TableRow 
                    key={experiment.id}
                    className="cursor-pointer hover:bg-[var(--bg-hover)]"
                    onClick={() => setSelectedExperiment(experiment)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(experiment.id)}
                        onChange={() => toggleSelect(experiment.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">
                          {experiment.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {experiment.targetKey}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config?.color as 'success' | 'warning' | 'secondary' | 'cyan'}>
                        {config?.label || experiment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-[var(--text-primary)]">
                        {experiment.trafficPercentage}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[var(--text-primary)]">
                        {experiment._count.assignments.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--text-secondary)]">C:</span>
                          <span className="text-[var(--text-primary)]">
                            {((control?.conversionRate || 0) * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--text-secondary)]">T:</span>
                          <span className="text-[var(--text-primary)]">
                            {((treatment?.conversionRate || 0) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {improvement !== null ? (
                        <div className={`flex items-center gap-1 ${improvement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {improvement >= 0 ? (
                            <ArrowTrendingUpIcon className="h-4 w-4" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">-</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {experiment.status === 'DRAFT' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(experiment.id, 'RUNNING')}>
                              <PlayIcon className="h-4 w-4 mr-2" />
                              시작
                            </DropdownMenuItem>
                          )}
                          {experiment.status === 'RUNNING' && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(experiment.id, 'PAUSED')}>
                                <PauseIcon className="h-4 w-4 mr-2" />
                                일시정지
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(experiment.id, 'COMPLETED')}>
                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                완료
                              </DropdownMenuItem>
                            </>
                          )}
                          {experiment.status === 'PAUSED' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(experiment.id, 'RUNNING')}>
                              <PlayIcon className="h-4 w-4 mr-2" />
                              재개
                            </DropdownMenuItem>
                          )}
                          {experiment.status === 'COMPLETED' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(experiment.id, 'ARCHIVED')}>
                              <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                              보관
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-[var(--border)]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              이전
            </Button>
            <span className="text-sm text-[var(--text-secondary)]">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              다음
            </Button>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <CreateExperimentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          fetchExperiments();
          fetchDashboardData();
        }}
      />

      {selectedExperiment && (
        <ExperimentDetailModal
          experiment={selectedExperiment}
          onClose={() => setSelectedExperiment(null)}
          onStatusChange={(status) => {
            handleStatusChange(selectedExperiment.id, status);
            setSelectedExperiment(null);
          }}
        />
      )}
    </div>
  );
}
