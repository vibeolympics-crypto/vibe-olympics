'use client';

/**
 * 실험 생성 다이얼로그
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CreateExperimentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface VariantInput {
  name: string;
  description: string;
  isControl: boolean;
  weight: number;
  config: Record<string, string>;
}

const defaultVariants: VariantInput[] = [
  { name: 'Control', description: '대조군', isControl: true, weight: 50, config: {} },
  { name: 'Variant A', description: '변형 A', isControl: false, weight: 50, config: {} },
];

const targetTypeOptions = [
  { value: 'page', label: '페이지' },
  { value: 'component', label: '컴포넌트' },
  { value: 'feature', label: '기능' },
  { value: 'pricing', label: '가격' },
  { value: 'cta', label: 'CTA' },
];

const metricOptions = [
  { value: 'conversion', label: '전환율' },
  { value: 'click', label: '클릭률' },
  { value: 'revenue', label: '매출' },
  { value: 'engagement', label: '참여도' },
];

export function CreateExperimentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateExperimentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [targetType, setTargetType] = useState('page');
  const [targetKey, setTargetKey] = useState('');
  const [trafficPercentage, setTrafficPercentage] = useState(100);
  const [primaryMetric, setPrimaryMetric] = useState('conversion');
  const [minSampleSize, setMinSampleSize] = useState(1000);
  const [variants, setVariants] = useState<VariantInput[]>(defaultVariants);

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const hasControl = variants.some(v => v.isControl);

  const resetForm = () => {
    setName('');
    setDescription('');
    setHypothesis('');
    setTargetType('page');
    setTargetKey('');
    setTrafficPercentage(100);
    setPrimaryMetric('conversion');
    setMinSampleSize(1000);
    setVariants(defaultVariants);
    setStep(1);
    setError(null);
  };

  const handleAddVariant = () => {
    const newVariant: VariantInput = {
      name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`,
      description: '',
      isControl: false,
      weight: 0,
      config: {},
    };
    setVariants([...variants, newVariant]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 2) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof VariantInput, value: unknown) => {
    const updated = [...variants];
    
    // isControl이 true로 변경되면 다른 모든 변형의 isControl을 false로
    if (field === 'isControl' && value === true) {
      updated.forEach((v, i) => {
        if (i !== index) v.isControl = false;
      });
    }
    
    // 타입 안전한 업데이트
    const variant = updated[index];
    switch (field) {
      case 'name':
        variant.name = value as string;
        break;
      case 'description':
        variant.description = value as string;
        break;
      case 'isControl':
        variant.isControl = value as boolean;
        break;
      case 'weight':
        variant.weight = value as number;
        break;
      case 'config':
        variant.config = value as Record<string, string>;
        break;
    }
    setVariants(updated);
  };

  const handleDistributeWeights = () => {
    const evenWeight = Math.floor(100 / variants.length);
    const remainder = 100 - evenWeight * variants.length;
    
    const updated = variants.map((v, i) => ({
      ...v,
      weight: evenWeight + (i === 0 ? remainder : 0),
    }));
    setVariants(updated);
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('실험 이름을 입력해주세요');
      return;
    }
    if (!targetKey.trim()) {
      setError('타겟 키를 입력해주세요');
      return;
    }
    if (totalWeight !== 100) {
      setError(`변형 가중치 합계가 100이어야 합니다 (현재: ${totalWeight})`);
      return;
    }
    if (!hasControl) {
      setError('최소 하나의 대조군이 필요합니다');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/ab-test/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          hypothesis: hypothesis || null,
          targetType,
          targetKey,
          trafficPercentage,
          primaryMetric,
          minSampleSize,
          variants: variants.map(v => ({
            name: v.name,
            description: v.description || null,
            isControl: v.isControl,
            weight: v.weight,
            config: v.config,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create experiment');
      }

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 실험 만들기</DialogTitle>
          <DialogDescription>
            A/B 테스트 실험을 생성합니다. 모든 필수 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-elevated)]'}`}>
              1
            </div>
            <span className="text-sm font-medium">기본 정보</span>
          </div>
          <div className="w-8 h-px bg-[var(--border)]" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-elevated)]'}`}>
              2
            </div>
            <span className="text-sm font-medium">변형 설정</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">실험 이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 홈페이지 CTA 버튼 색상 테스트"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="실험에 대한 간단한 설명"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hypothesis">가설</Label>
              <Input
                id="hypothesis"
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder="예: 녹색 버튼이 파란색 버튼보다 전환율이 높을 것이다"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetType">타겟 유형 *</Label>
                <select
                  id="targetType"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                >
                  {targetTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetKey">타겟 키 *</Label>
                <Input
                  id="targetKey"
                  value={targetKey}
                  onChange={(e) => setTargetKey(e.target.value)}
                  placeholder="예: homepage-cta-button"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trafficPercentage">트래픽 비율 (%)</Label>
                <Input
                  id="trafficPercentage"
                  type="number"
                  min={1}
                  max={100}
                  value={trafficPercentage}
                  onChange={(e) => setTrafficPercentage(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryMetric">주요 지표</Label>
                <select
                  id="primaryMetric"
                  value={primaryMetric}
                  onChange={(e) => setPrimaryMetric(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)]"
                >
                  {metricOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minSampleSize">최소 샘플 수</Label>
                <Input
                  id="minSampleSize"
                  type="number"
                  min={100}
                  value={minSampleSize}
                  onChange={(e) => setMinSampleSize(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Variants */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>변형 설정</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDistributeWeights}
                >
                  가중치 균등 배분
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariant}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  변형 추가
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    variant.isControl 
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5' 
                      : 'border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={variant.isControl}
                        onChange={(e) => handleVariantChange(index, 'isControl', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-[var(--text-secondary)]">
                        {variant.isControl ? '대조군' : '처리군'}
                      </span>
                    </div>
                    {variants.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">이름</Label>
                      <Input
                        value={variant.name}
                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                        placeholder="변형 이름"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">설명</Label>
                      <Input
                        value={variant.description}
                        onChange={(e) => handleVariantChange(index, 'description', e.target.value)}
                        placeholder="변형 설명"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">가중치 (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={variant.weight}
                        onChange={(e) => handleVariantChange(index, 'weight', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`text-sm ${totalWeight === 100 ? 'text-green-500' : 'text-red-500'}`}>
              가중치 합계: {totalWeight}% {totalWeight !== 100 && '(100%가 되어야 합니다)'}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button onClick={() => setStep(2)}>
                다음
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                이전
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? '생성 중...' : '실험 생성'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
