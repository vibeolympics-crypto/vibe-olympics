"use client";

/**
 * A/B 테스트 관리 대시보드
 * - 실험 목록 조회
 * - 실험 생성/수정/삭제
 * - 통계 및 결과 분석
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  FlaskConical, 
  Plus, 
  Play, 
  Pause, 
  CheckCircle, 
  Archive,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronRight,
  Calendar,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// ============================================
// 타입 정의
// ============================================

interface Variant {
  id: string;
  name: string;
  isControl: boolean;
  weight: number;
  totalUsers: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: string;
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
  startDate: string | null;
  endDate: string | null;
  winnerVariantId: string | null;
  conclusion: string | null;
  variants: Variant[];
  _count: {
    assignments: number;
    events: number;
  };
  createdAt: string;
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

// ============================================
// 메인 컴포넌트
// ============================================

export default function ABTestDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [stats, setStats] = useState<ExperimentStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  // 권한 체크
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/');
      toast.error('관리자만 접근할 수 있습니다.');
    }
  }, [session, status, router]);

  // 실험 목록 로드
  useEffect(() => {
    fetchExperiments();
  }, [filter]);

  const fetchExperiments = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`/api/ab-test/experiments${params}`);
      if (response.ok) {
        const data = await response.json();
        setExperiments(data.experiments);
      }
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
      toast.error('실험 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 실험 상세 로드
  const fetchExperimentDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/ab-test/experiments/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedExperiment(data.experiment);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch experiment detail:', error);
    }
  };

  // 실험 상태 변경
  const updateExperimentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/ab-test/experiments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success('실험 상태가 변경되었습니다.');
        fetchExperiments();
        if (selectedExperiment?.id === id) {
          fetchExperimentDetail(id);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update experiment:', error);
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  // 상태 배지
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { variant: 'default' | 'success' | 'warning' | 'secondary' | 'danger'; label: string }> = {
      DRAFT: { variant: 'secondary', label: '초안' },
      RUNNING: { variant: 'success', label: '실행 중' },
      PAUSED: { variant: 'warning', label: '일시 정지' },
      COMPLETED: { variant: 'default', label: '완료' },
      ARCHIVED: { variant: 'secondary', label: '보관됨' },
    };
    const { variant, label } = config[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FlaskConical className="w-8 h-8 text-purple-500" />
              A/B 테스트 대시보드
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              실험을 통해 전환율을 최적화하세요
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            새 실험 만들기
          </Button>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: '전체' },
            { value: 'RUNNING', label: '실행 중' },
            { value: 'DRAFT', label: '초안' },
            { value: 'COMPLETED', label: '완료' },
          ].map(({ value, label }) => (
            <Button
              key={value}
              variant={filter === value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 실험 목록 */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold mb-4">실험 목록</h2>
            
            {experiments.length === 0 ? (
              <div className="text-center py-12 bg-[var(--bg-elevated)] rounded-xl">
                <FlaskConical className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
                <p className="text-[var(--text-secondary)]">아직 실험이 없습니다</p>
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => setShowCreateModal(true)}
                >
                  첫 번째 실험 만들기
                </Button>
              </div>
            ) : (
              experiments.map((exp) => (
                <div
                  key={exp.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedExperiment?.id === exp.id
                      ? 'bg-purple-500/10 border border-purple-500/30'
                      : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)]'
                  }`}
                  onClick={() => fetchExperimentDetail(exp.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium truncate">{exp.name}</h3>
                    <StatusBadge status={exp.status} />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                    {exp.description || exp.hypothesis || '설명 없음'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {exp._count.assignments}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {exp.targetKey}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 실험 상세 */}
          <div className="lg:col-span-2">
            {selectedExperiment ? (
              <div className="bg-[var(--bg-elevated)] rounded-xl p-6">
                {/* 실험 헤더 */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold">{selectedExperiment.name}</h2>
                      <StatusBadge status={selectedExperiment.status} />
                    </div>
                    {selectedExperiment.hypothesis && (
                      <p className="text-[var(--text-secondary)]">
                        <strong>가설:</strong> {selectedExperiment.hypothesis}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedExperiment.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        onClick={() => updateExperimentStatus(selectedExperiment.id, 'RUNNING')}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        시작
                      </Button>
                    )}
                    {selectedExperiment.status === 'RUNNING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateExperimentStatus(selectedExperiment.id, 'PAUSED')}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          일시정지
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateExperimentStatus(selectedExperiment.id, 'COMPLETED')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          완료
                        </Button>
                      </>
                    )}
                    {selectedExperiment.status === 'PAUSED' && (
                      <Button
                        size="sm"
                        onClick={() => updateExperimentStatus(selectedExperiment.id, 'RUNNING')}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        재개
                      </Button>
                    )}
                  </div>
                </div>

                {/* 실험 정보 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[var(--bg-base)] rounded-lg p-3">
                    <p className="text-xs text-[var(--text-muted)]">대상</p>
                    <p className="font-medium">{selectedExperiment.targetKey}</p>
                  </div>
                  <div className="bg-[var(--bg-base)] rounded-lg p-3">
                    <p className="text-xs text-[var(--text-muted)]">트래픽</p>
                    <p className="font-medium">{selectedExperiment.trafficPercentage}%</p>
                  </div>
                  <div className="bg-[var(--bg-base)] rounded-lg p-3">
                    <p className="text-xs text-[var(--text-muted)]">주요 지표</p>
                    <p className="font-medium">{selectedExperiment.primaryMetric}</p>
                  </div>
                  <div className="bg-[var(--bg-base)] rounded-lg p-3">
                    <p className="text-xs text-[var(--text-muted)]">총 참여자</p>
                    <p className="font-medium">{selectedExperiment._count.assignments.toLocaleString()}</p>
                  </div>
                </div>

                {/* 변형별 통계 */}
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  변형별 성과
                </h3>
                
                <div className="space-y-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.variantId}
                      className={`p-4 rounded-lg border ${
                        stat.isWinner
                          ? 'border-green-500/50 bg-green-500/5'
                          : 'border-[var(--border-default)] bg-[var(--bg-base)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stat.variantName}</span>
                          {stat.isControl && (
                            <Badge variant="outline" className="text-xs">대조군</Badge>
                          )}
                          {stat.isWinner && (
                            <Badge variant="success" className="text-xs">승자</Badge>
                          )}
                        </div>
                        {stat.improvement !== undefined && !stat.isControl && (
                          <div className={`flex items-center gap-1 text-sm ${
                            stat.improvement > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {stat.improvement > 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {stat.improvement > 0 ? '+' : ''}{stat.improvement}%
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-[var(--text-muted)]">참여자</p>
                          <p className="font-medium">{stat.users.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[var(--text-muted)]">전환</p>
                          <p className="font-medium">{stat.conversions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[var(--text-muted)]">전환율</p>
                          <p className="font-medium">{stat.conversionRate}%</p>
                        </div>
                        <div>
                          <p className="text-[var(--text-muted)]">신뢰도</p>
                          <p className="font-medium">
                            {stat.confidence !== undefined ? `${stat.confidence}%` : '-'}
                          </p>
                        </div>
                      </div>

                      {/* 전환율 바 */}
                      <div className="mt-3">
                        <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              stat.isControl ? 'bg-gray-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${Math.min(stat.conversionRate * 10, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 통계적 유의성 안내 */}
                {stats.some(s => s.confidence !== undefined && s.confidence < 95) && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      아직 통계적으로 유의미한 결과가 아닙니다. 더 많은 데이터가 필요합니다.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[var(--bg-elevated)] rounded-xl p-12 text-center">
                <ChevronRight className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
                <p className="text-[var(--text-secondary)]">
                  왼쪽에서 실험을 선택하면 상세 정보를 볼 수 있습니다
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 실험 생성 모달 */}
        {showCreateModal && (
          <CreateExperimentModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              fetchExperiments();
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// 실험 생성 모달
// ============================================

function CreateExperimentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hypothesis: '',
    targetType: 'page',
    targetKey: '',
    trafficPercentage: 100,
    primaryMetric: 'conversion',
    controlName: 'Control',
    variantName: 'Variant A',
    controlWeight: 50,
    variantWeight: 50,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ab-test/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          hypothesis: formData.hypothesis,
          targetType: formData.targetType,
          targetKey: formData.targetKey,
          trafficPercentage: formData.trafficPercentage,
          primaryMetric: formData.primaryMetric,
          variants: [
            {
              name: formData.controlName,
              isControl: true,
              weight: formData.controlWeight,
              config: {},
            },
            {
              name: formData.variantName,
              isControl: false,
              weight: formData.variantWeight,
              config: {},
            },
          ],
        }),
      });

      if (response.ok) {
        toast.success('실험이 생성되었습니다.');
        onCreated();
      } else {
        const data = await response.json();
        toast.error(data.error || '실험 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create experiment:', error);
      toast.error('실험 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--bg-elevated)] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">새 실험 만들기</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 기본 정보 */}
            <div>
              <label className="block text-sm font-medium mb-1">실험 이름 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]"
                placeholder="예: CTA 버튼 색상 테스트"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">가설</label>
              <textarea
                value={formData.hypothesis}
                onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]"
                placeholder="예: 빨간색 CTA 버튼이 파란색보다 전환율이 높을 것이다"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">대상 유형</label>
                <select
                  value={formData.targetType}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]"
                >
                  <option value="page">페이지</option>
                  <option value="component">컴포넌트</option>
                  <option value="feature">기능</option>
                  <option value="api">API</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">대상 키 *</label>
                <input
                  type="text"
                  value={formData.targetKey}
                  onChange={(e) => setFormData({ ...formData, targetKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]"
                  placeholder="예: cta-button"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">트래픽 비율</label>
                <input
                  type="number"
                  value={formData.trafficPercentage}
                  onChange={(e) => setFormData({ ...formData, trafficPercentage: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]"
                  min={1}
                  max={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">주요 지표</label>
                <select
                  value={formData.primaryMetric}
                  onChange={(e) => setFormData({ ...formData, primaryMetric: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]"
                >
                  <option value="conversion">전환율</option>
                  <option value="click">클릭률</option>
                  <option value="revenue">매출</option>
                  <option value="engagement">참여도</option>
                </select>
              </div>
            </div>

            {/* 변형 설정 */}
            <div className="pt-4 border-t border-[var(--border-default)]">
              <h3 className="font-medium mb-3">변형 설정</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">대조군 이름</label>
                  <input
                    type="text"
                    value={formData.controlName}
                    onChange={(e) => setFormData({ ...formData, controlName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">실험군 이름</label>
                  <input
                    type="text"
                    value={formData.variantName}
                    onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">
                  트래픽 분배: 대조군 {formData.controlWeight}% / 실험군 {formData.variantWeight}%
                </label>
                <input
                  type="range"
                  value={formData.controlWeight}
                  onChange={(e) => {
                    const control = parseInt(e.target.value);
                    setFormData({
                      ...formData,
                      controlWeight: control,
                      variantWeight: 100 - control,
                    });
                  }}
                  className="w-full"
                  min={10}
                  max={90}
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? '생성 중...' : '실험 생성'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
