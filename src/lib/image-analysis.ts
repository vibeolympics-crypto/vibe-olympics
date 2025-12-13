/**
 * AI 이미지 분석 유틸리티
 * 상품 이미지 자동 태깅, 색상 분석, 품질 검사
 */

// ============================================================================
// Types
// ============================================================================

export interface ImageAnalysisResult {
  id: string;
  imageUrl: string;
  analyzedAt: Date;
  tags: ImageTag[];
  colors: ColorAnalysis;
  quality: QualityAnalysis;
  composition: CompositionAnalysis;
  metadata: ImageMetadata;
  suggestions: ImageSuggestion[];
  confidence: number;
}

export interface ImageTag {
  name: string;
  confidence: number;
  category: 'subject' | 'style' | 'mood' | 'technique' | 'medium' | 'theme';
  localized?: string; // Korean translation
}

export interface ColorAnalysis {
  dominant: ColorInfo[];
  palette: ColorInfo[];
  harmony: ColorHarmony;
  mood: string;
  temperature: 'warm' | 'cool' | 'neutral';
}

export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  percentage: number;
  name: string;
}

export interface ColorHarmony {
  type: 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'monochromatic';
  score: number;
  description: string;
}

export interface QualityAnalysis {
  overall: number; // 0-100
  resolution: QualityMetric;
  sharpness: QualityMetric;
  noise: QualityMetric;
  exposure: QualityMetric;
  contrast: QualityMetric;
  saturation: QualityMetric;
}

export interface QualityMetric {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation?: string;
}

export interface CompositionAnalysis {
  ruleOfThirds: number;
  symmetry: number;
  balance: number;
  leadingLines: boolean;
  focalPoint: { x: number; y: number } | null;
  aspectRatio: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  format: string;
  fileSize?: number;
  hasTransparency: boolean;
}

export interface ImageSuggestion {
  type: 'quality' | 'composition' | 'color' | 'content';
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
}

export interface BatchAnalysisResult {
  total: number;
  analyzed: number;
  failed: number;
  results: ImageAnalysisResult[];
  summary: BatchSummary;
}

export interface BatchSummary {
  avgQuality: number;
  commonTags: { tag: string; count: number }[];
  dominantColors: ColorInfo[];
  suggestionsCount: { high: number; medium: number; low: number };
}

// ============================================================================
// Color Analysis
// ============================================================================

/**
 * Hex 색상에서 RGB 추출
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * RGB에서 HSL 변환
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * 색상 이름 추정
 */
export function getColorName(hsl: { h: number; s: number; l: number }): string {
  const { h, s, l } = hsl;

  // Grayscale
  if (s < 10) {
    if (l < 20) return '검정';
    if (l < 40) return '진회색';
    if (l < 60) return '회색';
    if (l < 80) return '연회색';
    return '흰색';
  }

  // Colors
  let color = '';
  if (h < 15 || h >= 345) color = '빨강';
  else if (h < 45) color = '주황';
  else if (h < 75) color = '노랑';
  else if (h < 150) color = '초록';
  else if (h < 210) color = '청록';
  else if (h < 260) color = '파랑';
  else if (h < 290) color = '보라';
  else if (h < 345) color = '분홍';

  // Modifiers
  if (l < 30) return `어두운 ${color}`;
  if (l > 70) return `밝은 ${color}`;
  if (s < 40) return `탁한 ${color}`;
  return color;
}

/**
 * 색상 온도 분석
 */
export function analyzeColorTemperature(
  colors: ColorInfo[]
): 'warm' | 'cool' | 'neutral' {
  let warmScore = 0;
  let coolScore = 0;

  colors.forEach((color) => {
    const { h } = color.hsl;
    const weight = color.percentage / 100;

    // Warm colors: red, orange, yellow (0-60, 300-360)
    if ((h >= 0 && h <= 60) || (h >= 300 && h <= 360)) {
      warmScore += weight;
    }
    // Cool colors: green, blue, purple (150-270)
    else if (h >= 150 && h <= 270) {
      coolScore += weight;
    }
  });

  if (warmScore > coolScore + 0.2) return 'warm';
  if (coolScore > warmScore + 0.2) return 'cool';
  return 'neutral';
}

/**
 * 색상 조화 분석
 */
export function analyzeColorHarmony(colors: ColorInfo[]): ColorHarmony {
  if (colors.length < 2) {
    return {
      type: 'monochromatic',
      score: 100,
      description: '단색 구성으로 통일감 있는 이미지입니다.',
    };
  }

  const hues = colors.map((c) => c.hsl.h);
  const differences: number[] = [];
  
  for (let i = 0; i < hues.length - 1; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      let diff = Math.abs(hues[i] - hues[j]);
      if (diff > 180) diff = 360 - diff;
      differences.push(diff);
    }
  }

  const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
  const maxDiff = Math.max(...differences);

  // Determine harmony type
  let type: ColorHarmony['type'] = 'monochromatic';
  let score = 70;
  let description = '';

  if (maxDiff < 30) {
    type = 'monochromatic';
    score = 90;
    description = '단색 계열로 통일감 있는 구성입니다.';
  } else if (avgDiff > 150 && avgDiff < 180) {
    type = 'complementary';
    score = 85;
    description = '보색 대비로 강렬한 인상을 줍니다.';
  } else if (avgDiff < 60) {
    type = 'analogous';
    score = 88;
    description = '유사색 조합으로 자연스럽고 편안합니다.';
  } else if (avgDiff > 100 && avgDiff < 140) {
    type = 'triadic';
    score = 82;
    description = '삼원색 조화로 풍부하고 균형 잡힌 구성입니다.';
  } else {
    type = 'split-complementary';
    score = 80;
    description = '분열 보색 조합으로 역동적입니다.';
  }

  return { type, score, description };
}

// ============================================================================
// Image Analysis (Simulated)
// ============================================================================

/**
 * 이미지 분석 (시뮬레이션)
 * 실제 환경에서는 AI 비전 API 사용
 */
export async function analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
  // 시뮬레이션: 랜덤 분석 결과 생성
  const tags = generateSimulatedTags();
  const colors = generateSimulatedColors();
  const quality = generateSimulatedQuality();
  const composition = generateSimulatedComposition();
  const metadata = generateSimulatedMetadata();
  const suggestions = generateSuggestions(quality, composition, colors);

  return {
    id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    imageUrl,
    analyzedAt: new Date(),
    tags,
    colors,
    quality,
    composition,
    metadata,
    suggestions,
    confidence: 75 + Math.random() * 20,
  };
}

/**
 * 시뮬레이션: 태그 생성
 */
function generateSimulatedTags(): ImageTag[] {
  const tagLibrary = {
    subject: [
      { name: 'digital art', localized: '디지털 아트' },
      { name: 'illustration', localized: '일러스트' },
      { name: 'character', localized: '캐릭터' },
      { name: 'landscape', localized: '풍경' },
      { name: 'abstract', localized: '추상' },
      { name: 'portrait', localized: '인물' },
      { name: 'fantasy', localized: '판타지' },
      { name: 'nature', localized: '자연' },
    ],
    style: [
      { name: 'minimalist', localized: '미니멀' },
      { name: 'realistic', localized: '사실적' },
      { name: 'stylized', localized: '양식화' },
      { name: 'vintage', localized: '빈티지' },
      { name: 'modern', localized: '현대적' },
      { name: 'retro', localized: '레트로' },
    ],
    mood: [
      { name: 'calm', localized: '평온한' },
      { name: 'energetic', localized: '활기찬' },
      { name: 'mysterious', localized: '신비로운' },
      { name: 'cheerful', localized: '경쾌한' },
      { name: 'dramatic', localized: '드라마틱' },
    ],
    technique: [
      { name: 'hand-drawn', localized: '손그림' },
      { name: '3D render', localized: '3D 렌더' },
      { name: 'photo manipulation', localized: '사진 합성' },
      { name: 'vector', localized: '벡터' },
      { name: 'watercolor', localized: '수채화' },
    ],
    medium: [
      { name: 'digital painting', localized: '디지털 페인팅' },
      { name: 'concept art', localized: '컨셉 아트' },
      { name: 'game art', localized: '게임 아트' },
      { name: 'ui design', localized: 'UI 디자인' },
    ],
    theme: [
      { name: 'sci-fi', localized: 'SF' },
      { name: 'nature', localized: '자연' },
      { name: 'urban', localized: '도시' },
      { name: 'cultural', localized: '문화' },
    ],
  };

  const tags: ImageTag[] = [];
  const categories: Array<keyof typeof tagLibrary> = ['subject', 'style', 'mood', 'technique', 'medium', 'theme'];

  categories.forEach((category) => {
    const categoryTags = tagLibrary[category];
    const count = category === 'subject' ? 2 : 1;
    
    const shuffled = [...categoryTags].sort(() => Math.random() - 0.5);
    shuffled.slice(0, count).forEach((tag) => {
      tags.push({
        name: tag.name,
        localized: tag.localized,
        confidence: 70 + Math.random() * 25,
        category,
      });
    });
  });

  return tags.sort((a, b) => b.confidence - a.confidence);
}

/**
 * 시뮬레이션: 색상 분석 생성
 */
function generateSimulatedColors(): ColorAnalysis {
  const colorPalettes = [
    ['#2C3E50', '#E74C3C', '#ECF0F1', '#3498DB', '#1ABC9C'],
    ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    ['#6C5CE7', '#A29BFE', '#74B9FF', '#00CEC9', '#55EFC4'],
    ['#FD79A8', '#F8B739', '#00B894', '#0984E3', '#6C5CE7'],
    ['#2D3436', '#636E72', '#B2BEC3', '#DFE6E9', '#FFEAA7'],
  ];

  const selectedPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
  
  const colors: ColorInfo[] = selectedPalette.map((hex, index) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const percentage = index === 0 ? 35 + Math.random() * 15 : 15 + Math.random() * 10;
    
    return {
      hex,
      rgb,
      hsl,
      percentage,
      name: getColorName(hsl),
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Normalize percentages
  const total = colors.reduce((sum, c) => sum + c.percentage, 0);
  colors.forEach((c) => (c.percentage = (c.percentage / total) * 100));

  const dominant = colors.slice(0, 3);
  const harmony = analyzeColorHarmony(colors);
  const temperature = analyzeColorTemperature(colors);

  const moods: Record<typeof temperature, string[]> = {
    warm: ['활기찬', '따뜻한', '에너지 넘치는'],
    cool: ['차분한', '전문적인', '신뢰감 있는'],
    neutral: ['균형 잡힌', '세련된', '다목적'],
  };

  return {
    dominant,
    palette: colors,
    harmony,
    mood: moods[temperature][Math.floor(Math.random() * moods[temperature].length)],
    temperature,
  };
}

/**
 * 시뮬레이션: 품질 분석 생성
 */
function generateSimulatedQuality(): QualityAnalysis {
  const generateMetric = (base: number): QualityMetric => {
    const score = Math.min(100, Math.max(0, base + (Math.random() * 20 - 10)));
    let status: QualityMetric['status'] = 'poor';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'fair';

    const recommendations: Record<string, string> = {
      excellent: '',
      good: '약간의 개선 여지가 있습니다.',
      fair: '품질 향상을 권장합니다.',
      poor: '개선이 필요합니다.',
    };

    return {
      score,
      status,
      recommendation: recommendations[status] || undefined,
    };
  };

  const base = 60 + Math.random() * 30;
  const resolution = generateMetric(base + 5);
  const sharpness = generateMetric(base);
  const noise = generateMetric(base + 10);
  const exposure = generateMetric(base - 5);
  const contrast = generateMetric(base);
  const saturation = generateMetric(base + 5);

  const overall = (resolution.score + sharpness.score + noise.score + exposure.score + contrast.score + saturation.score) / 6;

  return {
    overall,
    resolution,
    sharpness,
    noise,
    exposure,
    contrast,
    saturation,
  };
}

/**
 * 시뮬레이션: 구도 분석 생성
 */
function generateSimulatedComposition(): CompositionAnalysis {
  return {
    ruleOfThirds: 60 + Math.random() * 35,
    symmetry: 50 + Math.random() * 40,
    balance: 60 + Math.random() * 30,
    leadingLines: Math.random() > 0.5,
    focalPoint: Math.random() > 0.3
      ? { x: 0.3 + Math.random() * 0.4, y: 0.3 + Math.random() * 0.4 }
      : null,
    aspectRatio: ['16:9', '4:3', '1:1', '3:2'][Math.floor(Math.random() * 4)],
  };
}

/**
 * 시뮬레이션: 메타데이터 생성
 */
function generateSimulatedMetadata(): ImageMetadata {
  const resolutions = [
    { width: 1920, height: 1080 },
    { width: 1200, height: 800 },
    { width: 2560, height: 1440 },
    { width: 1080, height: 1080 },
    { width: 3840, height: 2160 },
  ];

  const { width, height } = resolutions[Math.floor(Math.random() * resolutions.length)];

  return {
    width,
    height,
    aspectRatio: width / height,
    format: ['JPEG', 'PNG', 'WebP'][Math.floor(Math.random() * 3)],
    fileSize: Math.floor(500000 + Math.random() * 2000000),
    hasTransparency: Math.random() > 0.7,
  };
}

/**
 * 개선 제안 생성
 */
function generateSuggestions(
  quality: QualityAnalysis,
  composition: CompositionAnalysis,
  colors: ColorAnalysis
): ImageSuggestion[] {
  const suggestions: ImageSuggestion[] = [];

  // Quality suggestions
  if (quality.resolution.status === 'poor' || quality.resolution.status === 'fair') {
    suggestions.push({
      type: 'quality',
      priority: 'high',
      message: '해상도가 낮습니다. 더 높은 해상도의 이미지를 사용하세요.',
      action: '최소 1920x1080 이상 권장',
    });
  }

  if (quality.sharpness.status === 'poor') {
    suggestions.push({
      type: 'quality',
      priority: 'high',
      message: '이미지가 흐릿합니다. 선명한 이미지를 사용하세요.',
      action: '샤프닝 필터 적용 권장',
    });
  }

  if (quality.exposure.status === 'fair' || quality.exposure.status === 'poor') {
    suggestions.push({
      type: 'quality',
      priority: 'medium',
      message: '노출이 적절하지 않습니다.',
      action: '밝기 조정 권장',
    });
  }

  // Composition suggestions
  if (composition.ruleOfThirds < 60) {
    suggestions.push({
      type: 'composition',
      priority: 'low',
      message: '주요 요소를 삼등분 교점에 배치하면 더 매력적인 구도가 됩니다.',
      action: '이미지 크롭 고려',
    });
  }

  if (!composition.focalPoint) {
    suggestions.push({
      type: 'composition',
      priority: 'medium',
      message: '명확한 포컬 포인트가 없습니다. 주요 피사체를 강조하세요.',
    });
  }

  // Color suggestions
  if (colors.harmony.score < 70) {
    suggestions.push({
      type: 'color',
      priority: 'low',
      message: '색상 조화를 개선하면 더 보기 좋은 이미지가 됩니다.',
      action: '색상 보정 도구 사용 권장',
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================================================
// Batch Analysis
// ============================================================================

/**
 * 여러 이미지 일괄 분석
 */
export async function analyzeImages(imageUrls: string[]): Promise<BatchAnalysisResult> {
  const results: ImageAnalysisResult[] = [];
  let failed = 0;

  for (const url of imageUrls) {
    try {
      const result = await analyzeImage(url);
      results.push(result);
    } catch {
      failed++;
    }
  }

  // Generate summary
  const allTags = results.flatMap((r) => r.tags);
  const tagCounts = new Map<string, number>();
  allTags.forEach((tag) => {
    tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1);
  });
  const commonTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const allColors = results.flatMap((r) => r.colors.dominant);
  const avgQuality = results.reduce((sum, r) => sum + r.quality.overall, 0) / results.length;

  const suggestionsCount = { high: 0, medium: 0, low: 0 };
  results.forEach((r) => {
    r.suggestions.forEach((s) => {
      suggestionsCount[s.priority]++;
    });
  });

  return {
    total: imageUrls.length,
    analyzed: results.length,
    failed,
    results,
    summary: {
      avgQuality,
      commonTags,
      dominantColors: allColors.slice(0, 5),
      suggestionsCount,
    },
  };
}

// ============================================================================
// Auto-tagging
// ============================================================================

/**
 * 자동 태깅을 위한 태그 추출
 */
export function extractAutoTags(analysis: ImageAnalysisResult): string[] {
  const tags: string[] = [];

  // High confidence tags
  analysis.tags
    .filter((t) => t.confidence > 75)
    .forEach((t) => {
      if (t.localized) tags.push(t.localized);
      tags.push(t.name);
    });

  // Color-based tags
  analysis.colors.dominant.forEach((c) => {
    if (c.percentage > 20) {
      tags.push(c.name);
    }
  });

  // Temperature tag
  const tempTags: Record<string, string> = {
    warm: '따뜻한 색감',
    cool: '차가운 색감',
    neutral: '중성 색감',
  };
  tags.push(tempTags[analysis.colors.temperature]);

  // Mood tag
  tags.push(analysis.colors.mood);

  // Remove duplicates
  return [...new Set(tags)];
}
