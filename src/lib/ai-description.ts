/**
 * AI 상품 설명 생성 유틸리티
 * 
 * 제공 기능:
 * - 상품 설명 자동 생성
 * - SEO 최적화된 설명
 * - 다국어 설명 생성
 * - 마케팅 문구 생성
 */

// 상품 카테고리별 설명 템플릿
export const DESCRIPTION_TEMPLATES = {
  DIGITAL_PRODUCT: {
    ko: {
      intro: "디지털 상품으로 즉시 다운로드 가능합니다.",
      features: "주요 특징:",
      benefits: "이 상품을 선택해야 하는 이유:",
      cta: "지금 바로 구매하여 창작 활동을 시작하세요!",
    },
    en: {
      intro: "Instantly downloadable digital product.",
      features: "Key Features:",
      benefits: "Why choose this product:",
      cta: "Purchase now and start your creative journey!",
    },
  },
  BOOK: {
    ko: {
      intro: "전문 작가가 집필한 고품질 콘텐츠입니다.",
      features: "책 소개:",
      benefits: "독자들이 사랑하는 이유:",
      cta: "오늘 이 책으로 새로운 지식을 얻어보세요!",
    },
    en: {
      intro: "High-quality content written by professional authors.",
      features: "About this book:",
      benefits: "Why readers love it:",
      cta: "Gain new knowledge with this book today!",
    },
  },
  VIDEO_SERIES: {
    ko: {
      intro: "체계적으로 구성된 영상 시리즈입니다.",
      features: "강의 내용:",
      benefits: "수강 후 얻게 될 것:",
      cta: "지금 수강하여 실력을 한 단계 업그레이드하세요!",
    },
    en: {
      intro: "Systematically organized video series.",
      features: "Course content:",
      benefits: "What you'll gain:",
      cta: "Enroll now and upgrade your skills!",
    },
  },
  MUSIC_ALBUM: {
    ko: {
      intro: "감성적인 음악으로 특별한 순간을 만들어보세요.",
      features: "앨범 소개:",
      benefits: "이 앨범의 특별함:",
      cta: "지금 들어보고 당신만의 플레이리스트에 추가하세요!",
    },
    en: {
      intro: "Create special moments with emotional music.",
      features: "About this album:",
      benefits: "What makes this album special:",
      cta: "Listen now and add to your playlist!",
    },
  },
} as const;

// 마케팅 키워드
export const MARKETING_KEYWORDS = {
  quality: ["프리미엄", "고품질", "전문가급", "프로페셔널", "최고의"],
  urgency: ["한정", "오늘만", "특별 할인", "놓치지 마세요", "곧 종료"],
  trust: ["검증된", "인기 상품", "베스트셀러", "많은 분들이 선택한"],
  value: ["가성비", "합리적인 가격", "특별 혜택", "보너스 포함"],
};

// AI 설명 생성 결과 타입
export interface AIDescriptionResult {
  title: string;
  shortDescription: string;
  longDescription: string;
  seoDescription: string;
  features: string[];
  tags: string[];
  marketingTitle: string;
  callToAction: string;
  targetAudience: string;
  confidence: number;
}

// 입력 데이터 타입
export interface ProductDescriptionInput {
  title: string;
  category: string;
  productType: string;
  keywords?: string[];
  existingDescription?: string;
  price?: number;
  targetAudience?: string;
  language?: 'ko' | 'en';
}

/**
 * 상품 설명 생성 (로컬 알고리즘 기반)
 * Claude API가 없을 때 사용하는 폴백 로직
 */
export function generateLocalDescription(
  input: ProductDescriptionInput
): AIDescriptionResult {
  const { title, category, productType, keywords = [], price: _price, language = 'ko' } = input;
  
  // 템플릿 선택
  const template = DESCRIPTION_TEMPLATES[productType as keyof typeof DESCRIPTION_TEMPLATES] 
    || DESCRIPTION_TEMPLATES.DIGITAL_PRODUCT;
  const texts = template[language];
  
  // 키워드 기반 특징 생성
  const features = generateFeatures(keywords, language);
  
  // 설명 생성
  const shortDescription = generateShortDescription(title, category, language);
  const longDescription = generateLongDescription(title, category, features, texts, language);
  const seoDescription = generateSEODescription(title, category, features, language);
  
  // 태그 생성
  const tags = generateTags(title, category, keywords, language);
  
  // 마케팅 문구 생성
  const marketingTitle = generateMarketingTitle(title, language);
  
  // 타겟 오디언스 추론
  const targetAudience = inferTargetAudience(category, productType, language);
  
  return {
    title,
    shortDescription,
    longDescription,
    seoDescription,
    features,
    tags,
    marketingTitle,
    callToAction: texts.cta,
    targetAudience,
    confidence: 0.7, // 로컬 생성의 신뢰도
  };
}

function generateFeatures(keywords: string[], language: 'ko' | 'en'): string[] {
  const baseFeatures = language === 'ko' 
    ? [
        "고품질 콘텐츠 제공",
        "즉시 다운로드 가능",
        "지속적인 업데이트 지원",
        "상세한 사용 가이드 포함",
      ]
    : [
        "High-quality content",
        "Instant download available",
        "Continuous updates supported",
        "Detailed usage guide included",
      ];
  
  // 키워드 기반 추가 특징
  const keywordFeatures = keywords.slice(0, 2).map(kw => 
    language === 'ko' ? `${kw} 관련 콘텐츠 포함` : `Includes ${kw} related content`
  );
  
  return [...baseFeatures, ...keywordFeatures];
}

function generateShortDescription(
  title: string, 
  category: string,
  language: 'ko' | 'en'
): string {
  if (language === 'ko') {
    return `${category} 분야의 고품질 콘텐츠 "${title}". 전문가가 제작한 프리미엄 상품으로 즉시 다운로드하여 사용하실 수 있습니다.`;
  }
  return `High-quality content "${title}" in ${category}. Premium product created by professionals, available for instant download.`;
}

function generateLongDescription(
  title: string,
  category: string,
  features: string[],
  texts: { intro: string; features: string; benefits: string; cta: string },
  language: 'ko' | 'en'
): string {
  const featureList = features.map(f => `• ${f}`).join('\n');
  
  if (language === 'ko') {
    return `🎯 ${title}

${texts.intro}

${texts.features}
${featureList}

${texts.benefits}
• 시간과 비용을 절약할 수 있습니다
• 전문가 수준의 결과물을 얻을 수 있습니다
• 언제 어디서나 접근 가능합니다
• 지속적인 업데이트로 항상 최신 상태를 유지합니다

💡 ${texts.cta}

✅ 구매 즉시 다운로드 링크가 제공됩니다
✅ 문의 사항은 언제든 판매자에게 연락해주세요`;
  }
  
  return `🎯 ${title}

${texts.intro}

${texts.features}
${featureList}

${texts.benefits}
• Save time and money
• Get professional-level results
• Access anywhere, anytime
• Stay up-to-date with continuous updates

💡 ${texts.cta}

✅ Download link provided immediately upon purchase
✅ Contact the seller anytime for inquiries`;
}

function generateSEODescription(
  title: string,
  category: string,
  features: string[],
  language: 'ko' | 'en'
): string {
  const keyFeatures = features.slice(0, 2).join(', ');
  
  if (language === 'ko') {
    return `${title} - ${category} 전문 콘텐츠. ${keyFeatures}. 지금 바로 다운로드하여 사용하세요.`;
  }
  return `${title} - Professional ${category} content. ${keyFeatures}. Download and use now.`;
}

function generateTags(
  title: string,
  category: string,
  keywords: string[],
  language: 'ko' | 'en'
): string[] {
  const baseTags = language === 'ko'
    ? [category, '디지털 콘텐츠', '즉시 다운로드', '고품질']
    : [category, 'digital content', 'instant download', 'high quality'];
  
  // 제목에서 키워드 추출
  const titleWords = title.split(/\s+/).filter(w => w.length > 2);
  
  return [...new Set([...baseTags, ...keywords, ...titleWords.slice(0, 3)])];
}

function generateMarketingTitle(title: string, language: 'ko' | 'en'): string {
  const qualityWord = MARKETING_KEYWORDS.quality[Math.floor(Math.random() * MARKETING_KEYWORDS.quality.length)];
  
  if (language === 'ko') {
    return `✨ ${qualityWord} ${title} - 지금 만나보세요!`;
  }
  return `✨ Premium ${title} - Get it now!`;
}

function inferTargetAudience(
  category: string,
  productType: string,
  language: 'ko' | 'en'
): string {
  const audiences: Record<string, { ko: string; en: string }> = {
    DIGITAL_PRODUCT: {
      ko: "디지털 콘텐츠를 찾는 크리에이터 및 전문가",
      en: "Creators and professionals looking for digital content",
    },
    BOOK: {
      ko: "지식과 인사이트를 얻고자 하는 독자",
      en: "Readers seeking knowledge and insights",
    },
    VIDEO_SERIES: {
      ko: "새로운 스킬을 배우고자 하는 학습자",
      en: "Learners wanting to acquire new skills",
    },
    MUSIC_ALBUM: {
      ko: "감성적인 음악을 찾는 음악 애호가",
      en: "Music lovers looking for emotional music",
    },
  };
  
  const audience = audiences[productType] || audiences.DIGITAL_PRODUCT;
  return audience[language];
}

/**
 * AI API를 사용한 상품 설명 생성
 * Anthropic Claude API 호출
 */
export async function generateAIDescription(
  input: ProductDescriptionInput,
  apiKey?: string
): Promise<AIDescriptionResult> {
  // API 키가 없거나 환경 변수에 없으면 로컬 생성 사용
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  
  if (!key) {
    console.log('Anthropic API key not found, using local generation');
    return generateLocalDescription(input);
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: buildPrompt(input),
          },
        ],
      }),
    });
    
    if (!response.ok) {
      console.error('Anthropic API error:', await response.text());
      return generateLocalDescription(input);
    }
    
    const data = await response.json();
    const content = data.content[0]?.text;
    
    if (!content) {
      return generateLocalDescription(input);
    }
    
    // JSON 파싱 시도
    try {
      const parsed = JSON.parse(content);
      return {
        ...parsed,
        confidence: 0.95,
      };
    } catch {
      // JSON 파싱 실패시 텍스트 기반 파싱
      return parseTextResponse(content, input);
    }
  } catch (error) {
    console.error('AI description generation failed:', error);
    return generateLocalDescription(input);
  }
}

function buildPrompt(input: ProductDescriptionInput): string {
  const language = input.language || 'ko';
  
  return `당신은 전문 마케팅 카피라이터입니다. 다음 상품에 대한 설명을 생성해주세요.

상품 정보:
- 제목: ${input.title}
- 카테고리: ${input.category}
- 상품 유형: ${input.productType}
- 키워드: ${input.keywords?.join(', ') || '없음'}
- 기존 설명: ${input.existingDescription || '없음'}
- 가격: ${input.price ? `${input.price}원` : '미정'}
- 대상 언어: ${language === 'ko' ? '한국어' : 'English'}

다음 JSON 형식으로 응답해주세요:
{
  "title": "최적화된 제목",
  "shortDescription": "50자 이내의 짧은 설명",
  "longDescription": "상세 설명 (마크다운 형식, 500자 이상)",
  "seoDescription": "SEO에 최적화된 150자 이내 설명",
  "features": ["특징1", "특징2", "특징3", "특징4"],
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "marketingTitle": "마케팅용 눈에 띄는 제목",
  "callToAction": "구매 유도 문구",
  "targetAudience": "타겟 고객층 설명"
}

중요: 반드시 유효한 JSON 형식으로만 응답하세요.`;
}

function parseTextResponse(
  text: string, 
  input: ProductDescriptionInput
): AIDescriptionResult {
  // 텍스트에서 정보 추출 시도
  const local = generateLocalDescription(input);
  
  // 텍스트가 있으면 longDescription으로 사용
  if (text.length > 100) {
    return {
      ...local,
      longDescription: text,
      confidence: 0.8,
    };
  }
  
  return local;
}

/**
 * 여러 버전의 설명 생성
 */
export async function generateDescriptionVariants(
  input: ProductDescriptionInput,
  count: number = 3
): Promise<AIDescriptionResult[]> {
  const variants: AIDescriptionResult[] = [];
  
  // 첫 번째는 AI 생성 시도
  variants.push(await generateAIDescription(input));
  
  // 나머지는 로컬 변형
  for (let i = 1; i < count; i++) {
    const variant = generateLocalDescription({
      ...input,
      keywords: [...(input.keywords || []), `variant${i}`],
    });
    variants.push({
      ...variant,
      marketingTitle: `${variant.marketingTitle} (버전 ${i + 1})`,
    });
  }
  
  return variants;
}

/**
 * 기존 설명 개선 제안
 */
export function suggestImprovements(
  currentDescription: string,
  language: 'ko' | 'en' = 'ko'
): string[] {
  const suggestions: string[] = [];
  
  // 길이 체크
  if (currentDescription.length < 100) {
    suggestions.push(
      language === 'ko' 
        ? '설명이 너무 짧습니다. 최소 100자 이상 작성하세요.'
        : 'Description is too short. Write at least 100 characters.'
    );
  }
  
  // 이모지 체크
  if (!/[\u{1F300}-\u{1F9FF}]/u.test(currentDescription)) {
    suggestions.push(
      language === 'ko'
        ? '이모지를 추가하여 시각적 관심을 끌어보세요.'
        : 'Add emojis to attract visual attention.'
    );
  }
  
  // 특징 목록 체크
  if (!currentDescription.includes('•') && !currentDescription.includes('-')) {
    suggestions.push(
      language === 'ko'
        ? '불릿 포인트로 주요 특징을 나열하세요.'
        : 'List key features with bullet points.'
    );
  }
  
  // CTA 체크
  const ctaKeywords = language === 'ko' 
    ? ['지금', '바로', '구매', '다운로드', '시작']
    : ['now', 'get', 'buy', 'download', 'start'];
  
  if (!ctaKeywords.some(kw => currentDescription.toLowerCase().includes(kw))) {
    suggestions.push(
      language === 'ko'
        ? '행동 유도 문구(CTA)를 추가하세요.'
        : 'Add a call-to-action (CTA).'
    );
  }
  
  return suggestions;
}
