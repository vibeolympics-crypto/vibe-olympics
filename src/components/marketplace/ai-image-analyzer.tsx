'use client';

/**
 * AI 이미지 분석기 컴포넌트
 * 상품 이미지 분석, 자동 태깅, 품질 검사
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Image as ImageIcon,
  Tag,
  Palette,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
  Download,
  Copy,
  X,
  Sparkles,
  Eye,
  BarChart3,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ImageTag {
  name: string;
  confidence: number;
  category: string;
  localized?: string;
}

interface ColorInfo {
  hex: string;
  name: string;
  percentage: number;
}

interface QualityMetric {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation?: string;
}

interface QualityAnalysis {
  overall: number;
  resolution: QualityMetric;
  sharpness: QualityMetric;
  noise: QualityMetric;
  exposure: QualityMetric;
  contrast: QualityMetric;
  saturation: QualityMetric;
}

interface ImageSuggestion {
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
}

interface AnalysisResult {
  id: string;
  imageUrl: string;
  analyzedAt: string;
  tags: ImageTag[];
  autoTags: string[];
  colors: {
    dominant: ColorInfo[];
    palette: ColorInfo[];
    mood: string;
    temperature: 'warm' | 'cool' | 'neutral';
    harmony: {
      type: string;
      score: number;
      description: string;
    };
  };
  quality: QualityAnalysis;
  composition: {
    ruleOfThirds: number;
    symmetry: number;
    balance: number;
    leadingLines: boolean;
    aspectRatio: string;
  };
  metadata: {
    width: number;
    height: number;
    format: string;
    fileSize?: number;
  };
  suggestions: ImageSuggestion[];
  confidence: number;
}

// ============================================================================
// Main Component
// ============================================================================

interface AIImageAnalyzerProps {
  onTagsGenerated?: (tags: string[]) => void;
  initialImageUrl?: string;
}

export function AIImageAnalyzer({ onTagsGenerated, initialImageUrl }: AIImageAnalyzerProps) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tags' | 'colors' | 'quality'>('tags');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      // In a real app, you'd upload the file first
      setImageUrl('demo-uploaded-image');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!imageUrl && !previewUrl) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Demo: Use API with demo data
      const res = await fetch('/api/ai/image-analysis?demo=single');
      if (!res.ok) throw new Error('분석 실패');
      
      const json = await res.json();
      setResult(json.data);
      
      if (onTagsGenerated && json.data.autoTags) {
        onTagsGenerated(json.data.autoTags);
      }
    } catch (err) {
      setError('이미지 분석 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImageUrl('');
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const handleCopyTags = () => {
    if (!result?.autoTags) return;
    navigator.clipboard.writeText(result.autoTags.join(', '));
  };

  const tabs = [
    { id: 'tags', label: '태그', icon: Tag },
    { id: 'colors', label: '색상', icon: Palette },
    { id: 'quality', label: '품질', icon: BarChart3 },
  ] as const;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI 이미지 분석</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">자동 태깅, 색상 분석, 품질 검사</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Upload Area */}
        {!result && (
          <div className="space-y-4">
            {/* Preview or Upload */}
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="block">
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    이미지를 드래그하거나<br />
                    <span className="text-blue-600 dark:text-blue-400">파일 선택</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">PNG, JPG, WebP (최대 10MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}

            {/* URL Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                placeholder="또는 이미지 URL 입력..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!imageUrl && !previewUrl)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  이미지 분석하기
                </>
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative">
              <img
                src={previewUrl || result.imageUrl}
                alt="Analyzed"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  새 이미지
                </button>
              </div>
              
              {/* Confidence Badge */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-white text-xs font-medium">
                신뢰도: {result.confidence.toFixed(0)}%
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 -mb-[2px] ${
                    activeTab === tab.id
                      ? 'text-purple-600 border-purple-600'
                      : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'tags' && <TagsTab result={result} onCopy={handleCopyTags} />}
                {activeTab === 'colors' && <ColorsTab result={result} />}
                {activeTab === 'quality' && <QualityTab result={result} />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Tabs
// ============================================================================

function TagsTab({ result, onCopy }: { result: AnalysisResult; onCopy: () => void }) {
  return (
    <div className="space-y-4">
      {/* Auto Tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 dark:text-white">추천 태그</h4>
          <button
            onClick={onCopy}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Copy className="w-4 h-4" />
            복사
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.autoTags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Detailed Tags by Category */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">상세 분석</h4>
        <div className="space-y-2">
          {result.tags.map((tag, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase w-16">
                  {tag.category}
                </span>
                <span className="text-gray-900 dark:text-white">
                  {tag.localized || tag.name}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {tag.confidence.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ColorsTab({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-4">
      {/* Color Mood */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">분위기</p>
          <p className="font-medium text-gray-900 dark:text-white">{result.colors.mood}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">색온도</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {result.colors.temperature === 'warm' ? '따뜻한' : 
             result.colors.temperature === 'cool' ? '차가운' : '중성'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">조화</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {result.colors.harmony.score.toFixed(0)}점
          </p>
        </div>
      </div>

      {/* Dominant Colors */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">주요 색상</h4>
        <div className="space-y-2">
          {result.colors.dominant.map((color, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg shadow-inner"
                style={{ backgroundColor: color.hex }}
              />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">{color.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{color.hex}</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ 
                      width: `${color.percentage}%`,
                      backgroundColor: color.hex 
                    }}
                  />
                </div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {color.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">색상 팔레트</h4>
        <div className="flex gap-2">
          {result.colors.palette.slice(0, 6).map((color, index) => (
            <div key={index} className="flex-1 text-center">
              <div
                className="h-12 rounded-lg mb-1"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">{color.hex}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Harmony Description */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <Info className="w-4 h-4 inline mr-1" />
          {result.colors.harmony.description}
        </p>
      </div>
    </div>
  );
}

function QualityTab({ result }: { result: AnalysisResult }) {
  const metrics = [
    { key: 'resolution', label: '해상도', metric: result.quality.resolution },
    { key: 'sharpness', label: '선명도', metric: result.quality.sharpness },
    { key: 'noise', label: '노이즈', metric: result.quality.noise },
    { key: 'exposure', label: '노출', metric: result.quality.exposure },
    { key: 'contrast', label: '대비', metric: result.quality.contrast },
    { key: 'saturation', label: '채도', metric: result.quality.saturation },
  ];

  const statusColors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-red-500',
  };

  const statusLabels = {
    excellent: '우수',
    good: '양호',
    fair: '보통',
    poor: '개선필요',
  };

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
        <div className="text-4xl font-bold text-gray-900 dark:text-white">
          {result.quality.overall.toFixed(0)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">전체 품질 점수</div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(({ key, label, metric }) => (
          <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
              <span className={`px-2 py-0.5 rounded text-xs text-white ${statusColors[metric.status]}`}>
                {statusLabels[metric.status]}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className={`h-full ${statusColors[metric.status]}`}
                style={{ width: `${metric.score}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
              {metric.score.toFixed(0)}/100
            </div>
          </div>
        ))}
      </div>

      {/* Metadata */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">이미지 정보</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">크기</span>
            <span className="text-gray-900 dark:text-white">{result.metadata.width} × {result.metadata.height}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">비율</span>
            <span className="text-gray-900 dark:text-white">{result.composition.aspectRatio}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">포맷</span>
            <span className="text-gray-900 dark:text-white">{result.metadata.format}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">균형</span>
            <span className="text-gray-900 dark:text-white">{result.composition.balance.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">개선 제안</h4>
          <div className="space-y-2">
            {result.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  suggestion.priority === 'high'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : suggestion.priority === 'medium'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20'
                    : 'bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                {suggestion.priority === 'high' && <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />}
                {suggestion.priority === 'medium' && <Info className="w-4 h-4 text-yellow-500 mt-0.5" />}
                {suggestion.priority === 'low' && <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />}
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion.message}</p>
                  {suggestion.action && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{suggestion.action}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIImageAnalyzer;
