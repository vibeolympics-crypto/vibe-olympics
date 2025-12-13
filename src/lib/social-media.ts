/**
 * 소셜 미디어 연동 유틸리티
 * 자동 홍보 포스팅 시스템
 */

// ============================================================================
// Types
// ============================================================================

export type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'threads';

export interface SocialAccount {
  id: string;
  userId: string;
  platform: SocialPlatform;
  username: string;
  displayName?: string;
  profileUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  isConnected: boolean;
  connectedAt?: Date;
  lastPostAt?: Date;
  followerCount?: number;
  settings: AccountSettings;
}

export interface AccountSettings {
  autoPost: boolean;
  postTypes: ('product' | 'promotion' | 'achievement' | 'update')[];
  postFrequency: 'immediately' | 'daily' | 'weekly';
  preferredTime?: string; // HH:mm format
  hashtags?: string[];
  includeLink: boolean;
  includeImage: boolean;
  language: 'ko' | 'en' | 'auto';
}

export interface SocialPost {
  id: string;
  userId: string;
  platform: SocialPlatform;
  type: 'product' | 'promotion' | 'achievement' | 'update' | 'custom';
  content: string;
  hashtags: string[];
  mediaUrls?: string[];
  link?: string;
  scheduledAt?: Date;
  publishedAt?: Date;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  errorMessage?: string;
  engagement?: PostEngagement;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  impressions: number;
  reach: number;
  engagementRate: number; // percentage
}

export interface PostTemplate {
  id: string;
  name: string;
  platform: SocialPlatform | 'all';
  type: SocialPost['type'];
  content: string;
  variables: string[]; // e.g., {{productName}}, {{price}}
  hashtags: string[];
  isDefault: boolean;
}

export interface ContentGenerationOptions {
  platform: SocialPlatform;
  type: SocialPost['type'];
  product?: ProductData;
  promotion?: PromotionData;
  achievement?: AchievementData;
  customData?: Record<string, string>;
  language: 'ko' | 'en';
  tone: 'formal' | 'casual' | 'excited' | 'professional';
  maxLength?: number;
}

export interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl?: string;
  productUrl: string;
  features?: string[];
}

export interface PromotionData {
  id: string;
  name: string;
  discountRate: number;
  discountAmount?: number;
  code?: string;
  validFrom: Date;
  validTo: Date;
  conditions?: string;
}

export interface AchievementData {
  type: 'sales_milestone' | 'review_count' | 'follower_count' | 'new_product' | 'ranking';
  title: string;
  value: number;
  previousValue?: number;
}

export interface SocialAnalytics {
  platform: SocialPlatform;
  period: 'day' | 'week' | 'month';
  totalPosts: number;
  totalEngagement: number;
  totalReach: number;
  totalClicks: number;
  avgEngagementRate: number;
  topPosts: SocialPost[];
  trends: TrendData[];
}

export interface TrendData {
  date: string;
  posts: number;
  engagement: number;
  reach: number;
}

// ============================================================================
// Constants
// ============================================================================

const PLATFORM_LIMITS: Record<SocialPlatform, { maxLength: number; maxHashtags: number; maxImages: number }> = {
  twitter: { maxLength: 280, maxHashtags: 5, maxImages: 4 },
  facebook: { maxLength: 63206, maxHashtags: 30, maxImages: 10 },
  instagram: { maxLength: 2200, maxHashtags: 30, maxImages: 10 },
  linkedin: { maxLength: 3000, maxHashtags: 5, maxImages: 9 },
  threads: { maxLength: 500, maxHashtags: 5, maxImages: 10 },
};

const DEFAULT_HASHTAGS: Record<string, string[]> = {
  ko: ['#디지털아트', '#온라인마켓', '#창작물', '#아티스트', '#마켓플레이스'],
  en: ['#digitalart', '#marketplace', '#creators', '#artists', '#onlineshopping'],
};

const CATEGORY_HASHTAGS: Record<string, string[]> = {
  artwork: ['#아트워크', '#디지털드로잉', '#일러스트'],
  template: ['#템플릿', '#디자인에셋', '#그래픽디자인'],
  music: ['#음악', '#배경음악', '#사운드트랙'],
  course: ['#온라인강좌', '#교육', '#스킬업'],
  plugin: ['#플러그인', '#개발자툴', '#확장프로그램'],
};

// ============================================================================
// Content Generation
// ============================================================================

/**
 * 소셜 미디어 포스트 내용 생성
 */
export function generatePostContent(options: ContentGenerationOptions): {
  content: string;
  hashtags: string[];
  suggestedMedia?: string[];
} {
  const { platform, type, language, tone, maxLength } = options;
  const limit = maxLength || PLATFORM_LIMITS[platform].maxLength;

  let content = '';
  let hashtags: string[] = [];
  const suggestedMedia: string[] = [];

  switch (type) {
    case 'product':
      if (options.product) {
        const result = generateProductPost(options.product, language, tone, platform);
        content = result.content;
        hashtags = result.hashtags;
        if (options.product.imageUrl) {
          suggestedMedia.push(options.product.imageUrl);
        }
      }
      break;

    case 'promotion':
      if (options.promotion) {
        const result = generatePromotionPost(options.promotion, language, tone, platform);
        content = result.content;
        hashtags = result.hashtags;
      }
      break;

    case 'achievement':
      if (options.achievement) {
        const result = generateAchievementPost(options.achievement, language, tone);
        content = result.content;
        hashtags = result.hashtags;
      }
      break;

    case 'update':
    case 'custom':
      if (options.customData) {
        content = options.customData.content || '';
        hashtags = (options.customData.hashtags?.split(',') || []).map(h => h.trim());
      }
      break;
  }

  // 길이 제한 적용
  if (content.length > limit - hashtags.join(' ').length - 10) {
    const maxContentLength = limit - hashtags.join(' ').length - 15;
    content = content.substring(0, maxContentLength) + '...';
  }

  // 해시태그 제한 적용
  const maxHashtags = PLATFORM_LIMITS[platform].maxHashtags;
  if (hashtags.length > maxHashtags) {
    hashtags = hashtags.slice(0, maxHashtags);
  }

  return { content, hashtags, suggestedMedia };
}

/**
 * 상품 홍보 포스트 생성
 */
function generateProductPost(
  product: ProductData,
  language: 'ko' | 'en',
  tone: string,
  platform: SocialPlatform
): { content: string; hashtags: string[] } {
  const isKorean = language === 'ko';
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountRate = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0;

  let content = '';
  const hashtags: string[] = [];

  // 플랫폼별 톤 조정
  const emoji = platform === 'linkedin' ? '' : '✨';
  const saleBadge = platform === 'linkedin' ? '[할인]' : '🔥';

  if (isKorean) {
    if (tone === 'excited') {
      content = hasDiscount
        ? `${saleBadge} ${discountRate}% 할인 중! ${emoji}\n\n"${product.name}"\n\n`
        : `${emoji} 새로운 작품이 등록되었어요!\n\n"${product.name}"\n\n`;
      content += `${product.description.substring(0, 100)}...\n\n`;
      content += `💰 ${hasDiscount ? `${formatPrice(product.originalPrice!)} → ` : ''}${formatPrice(product.price)}\n`;
      content += `🔗 ${product.productUrl}`;
    } else if (tone === 'casual') {
      content = `${product.name}\n\n`;
      content += `${product.description.substring(0, 80)}...\n\n`;
      content += hasDiscount
        ? `지금 ${discountRate}% 할인 중이에요!\n`
        : '';
      content += `가격: ${formatPrice(product.price)}\n`;
      content += product.productUrl;
    } else {
      content = `[신규 등록] ${product.name}\n\n`;
      content += `${product.description.substring(0, 120)}\n\n`;
      content += `가격: ${formatPrice(product.price)}`;
      if (hasDiscount) content += ` (${discountRate}% 할인)`;
      content += `\n\n자세히 보기: ${product.productUrl}`;
    }

    hashtags.push(...DEFAULT_HASHTAGS.ko);
    if (CATEGORY_HASHTAGS[product.category]) {
      hashtags.push(...CATEGORY_HASHTAGS[product.category]);
    }
  } else {
    if (tone === 'excited') {
      content = hasDiscount
        ? `${saleBadge} ${discountRate}% OFF! ${emoji}\n\n"${product.name}"\n\n`
        : `${emoji} New artwork available!\n\n"${product.name}"\n\n`;
      content += `${product.description.substring(0, 100)}...\n\n`;
      content += `💰 ${hasDiscount ? `$${product.originalPrice} → ` : ''}$${product.price}\n`;
      content += `🔗 ${product.productUrl}`;
    } else {
      content = `[New] ${product.name}\n\n`;
      content += `${product.description.substring(0, 120)}\n\n`;
      content += `Price: $${product.price}`;
      if (hasDiscount) content += ` (${discountRate}% off)`;
      content += `\n\nLearn more: ${product.productUrl}`;
    }

    hashtags.push(...DEFAULT_HASHTAGS.en);
  }

  return { content, hashtags };
}

/**
 * 프로모션 포스트 생성
 */
function generatePromotionPost(
  promotion: PromotionData,
  language: 'ko' | 'en',
  tone: string,
  platform: SocialPlatform
): { content: string; hashtags: string[] } {
  const isKorean = language === 'ko';
  const emoji = platform === 'linkedin' ? '' : '🎉';
  const endDate = new Date(promotion.validTo).toLocaleDateString(isKorean ? 'ko-KR' : 'en-US');

  let content = '';
  const hashtags: string[] = [];

  if (isKorean) {
    content = `${emoji} ${promotion.name}\n\n`;
    content += promotion.discountAmount
      ? `${formatPrice(promotion.discountAmount)} 할인!\n`
      : `${promotion.discountRate}% 할인!\n`;
    if (promotion.code) {
      content += `\n쿠폰 코드: ${promotion.code}\n`;
    }
    content += `\n⏰ ${endDate}까지\n`;
    if (promotion.conditions) {
      content += `\n* ${promotion.conditions}`;
    }

    hashtags.push('#할인', '#프로모션', '#쿠폰', '#이벤트', ...DEFAULT_HASHTAGS.ko.slice(0, 2));
  } else {
    content = `${emoji} ${promotion.name}\n\n`;
    content += promotion.discountAmount
      ? `Save $${promotion.discountAmount}!\n`
      : `${promotion.discountRate}% OFF!\n`;
    if (promotion.code) {
      content += `\nUse code: ${promotion.code}\n`;
    }
    content += `\n⏰ Valid until ${endDate}\n`;
    if (promotion.conditions) {
      content += `\n* ${promotion.conditions}`;
    }

    hashtags.push('#sale', '#promotion', '#discount', '#deal', ...DEFAULT_HASHTAGS.en.slice(0, 2));
  }

  return { content, hashtags };
}

/**
 * 성과 포스트 생성
 */
function generateAchievementPost(
  achievement: AchievementData,
  language: 'ko' | 'en',
  tone: string
): { content: string; hashtags: string[] } {
  const isKorean = language === 'ko';
  let content = '';
  const hashtags: string[] = [];

  const achievementTexts: Record<string, { ko: string; en: string }> = {
    sales_milestone: {
      ko: `🎊 판매 ${achievement.value}건 달성!\n\n여러분의 사랑에 감사드립니다. 앞으로도 좋은 작품으로 보답하겠습니다!`,
      en: `🎊 ${achievement.value} Sales Milestone!\n\nThank you for your support! More amazing content coming soon!`,
    },
    review_count: {
      ko: `⭐ 리뷰 ${achievement.value}개 달성!\n\n소중한 피드백 감사합니다. 더 좋은 작품으로 보답하겠습니다!`,
      en: `⭐ ${achievement.value} Reviews!\n\nThank you for all the wonderful feedback!`,
    },
    follower_count: {
      ko: `💜 팔로워 ${achievement.value}명 달성!\n\n함께해주셔서 감사합니다!`,
      en: `💜 ${achievement.value} Followers!\n\nThank you for being part of this journey!`,
    },
    new_product: {
      ko: `🆕 ${achievement.value}번째 작품 등록!\n\n꾸준히 새로운 작품을 선보이고 있습니다!`,
      en: `🆕 ${achievement.value}th Product Listed!\n\nConstantly creating new content!`,
    },
    ranking: {
      ko: `🏆 ${achievement.title}\n\n카테고리 ${achievement.value}위 달성! 감사합니다!`,
      en: `🏆 ${achievement.title}\n\nRanked #${achievement.value} in category! Thank you!`,
    },
  };

  content = isKorean
    ? achievementTexts[achievement.type]?.ko || achievement.title
    : achievementTexts[achievement.type]?.en || achievement.title;

  hashtags.push(
    ...(isKorean
      ? ['#마일스톤', '#감사합니다', '#아티스트', ...DEFAULT_HASHTAGS.ko.slice(0, 2)]
      : ['#milestone', '#thankyou', '#creator', ...DEFAULT_HASHTAGS.en.slice(0, 2)])
  );

  return { content, hashtags };
}

/**
 * 가격 포맷팅
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(price);
}

// ============================================================================
// Template Management
// ============================================================================

/**
 * 기본 템플릿 가져오기
 */
export function getDefaultTemplates(): PostTemplate[] {
  return [
    {
      id: 'product-ko-1',
      name: '신규 상품 (한국어)',
      platform: 'all',
      type: 'product',
      content: '✨ 새로운 작품이 등록되었어요!\n\n"{{productName}}"\n\n{{description}}\n\n💰 {{price}}\n🔗 {{productUrl}}',
      variables: ['productName', 'description', 'price', 'productUrl'],
      hashtags: ['#신규등록', '#디지털아트', '#마켓플레이스'],
      isDefault: true,
    },
    {
      id: 'product-en-1',
      name: 'New Product (English)',
      platform: 'all',
      type: 'product',
      content: '✨ New artwork available!\n\n"{{productName}}"\n\n{{description}}\n\n💰 {{price}}\n🔗 {{productUrl}}',
      variables: ['productName', 'description', 'price', 'productUrl'],
      hashtags: ['#newrelease', '#digitalart', '#marketplace'],
      isDefault: true,
    },
    {
      id: 'promotion-ko-1',
      name: '할인 이벤트 (한국어)',
      platform: 'all',
      type: 'promotion',
      content: '🎉 {{promotionName}}\n\n{{discountRate}}% 할인!\n\n⏰ {{validTo}}까지\n{{code}}',
      variables: ['promotionName', 'discountRate', 'validTo', 'code'],
      hashtags: ['#할인', '#이벤트', '#프로모션'],
      isDefault: true,
    },
    {
      id: 'twitter-product',
      name: 'Twitter 상품 홍보',
      platform: 'twitter',
      type: 'product',
      content: '{{productName}} 🎨\n\n{{shortDescription}}\n\n{{price}} ➡️ {{productUrl}}',
      variables: ['productName', 'shortDescription', 'price', 'productUrl'],
      hashtags: ['#art', '#digital'],
      isDefault: true,
    },
  ];
}

/**
 * 템플릿 변수 치환
 */
export function applyTemplate(
  template: PostTemplate,
  data: Record<string, string>
): string {
  let content = template.content;
  
  for (const variable of template.variables) {
    const placeholder = `{{${variable}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), data[variable] || '');
  }
  
  return content;
}

// ============================================================================
// Scheduling
// ============================================================================

/**
 * 최적 포스팅 시간 추천
 */
export function getOptimalPostingTimes(platform: SocialPlatform): {
  bestTimes: string[];
  bestDays: string[];
  reason: string;
} {
  const recommendations: Record<SocialPlatform, { bestTimes: string[]; bestDays: string[]; reason: string }> = {
    twitter: {
      bestTimes: ['09:00', '12:00', '17:00'],
      bestDays: ['화', '수', '목'],
      reason: '트위터는 출퇴근 시간과 점심 시간에 활동이 높습니다.',
    },
    facebook: {
      bestTimes: ['09:00', '13:00', '16:00'],
      bestDays: ['수', '목', '금'],
      reason: '페이스북은 주중 오후에 참여율이 높습니다.',
    },
    instagram: {
      bestTimes: ['07:00', '12:00', '21:00'],
      bestDays: ['화', '수', '금'],
      reason: '인스타그램은 아침과 저녁 시간대에 활동이 높습니다.',
    },
    linkedin: {
      bestTimes: ['08:00', '12:00', '17:00'],
      bestDays: ['화', '수', '목'],
      reason: '링크드인은 비즈니스 시간대에 활동이 높습니다.',
    },
    threads: {
      bestTimes: ['08:00', '12:00', '20:00'],
      bestDays: ['화', '수', '목'],
      reason: '쓰레드는 출퇴근 및 저녁 시간대에 활동이 높습니다.',
    },
  };

  return recommendations[platform];
}

/**
 * 포스팅 일정 생성
 */
export function generatePostingSchedule(
  frequency: 'daily' | 'weekly' | 'biweekly',
  preferredTimes: string[],
  startDate: Date,
  count: number
): Date[] {
  const schedule: Date[] = [];
  const daysInterval = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 14;

  const currentDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const time = preferredTimes[i % preferredTimes.length];
    const [hours, minutes] = time.split(':').map(Number);
    
    const postDate = new Date(currentDate);
    postDate.setHours(hours, minutes, 0, 0);
    
    schedule.push(postDate);
    currentDate.setDate(currentDate.getDate() + daysInterval);
  }

  return schedule;
}

// ============================================================================
// Analytics
// ============================================================================

/**
 * 포스트 성과 분석
 */
export function analyzePostPerformance(posts: SocialPost[]): {
  summary: {
    totalPosts: number;
    publishedPosts: number;
    failedPosts: number;
    avgEngagement: number;
    totalReach: number;
  };
  bestPerformingType: string;
  bestPerformingPlatform: SocialPlatform;
  recommendations: string[];
} {
  const publishedPosts = posts.filter(p => p.status === 'published');
  const failedPosts = posts.filter(p => p.status === 'failed');

  const totalEngagement = publishedPosts.reduce(
    (sum, p) => sum + (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0),
    0
  );

  const totalReach = publishedPosts.reduce(
    (sum, p) => sum + (p.engagement?.reach || 0),
    0
  );

  // 타입별 성과
  const typePerformance: Record<string, number> = {};
  publishedPosts.forEach(p => {
    const engagement = (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0);
    typePerformance[p.type] = (typePerformance[p.type] || 0) + engagement;
  });

  // 플랫폼별 성과
  const platformPerformance: Record<SocialPlatform, number> = {
    twitter: 0,
    facebook: 0,
    instagram: 0,
    linkedin: 0,
    threads: 0,
  };
  publishedPosts.forEach(p => {
    const engagement = (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0);
    platformPerformance[p.platform] += engagement;
  });

  const bestType = Object.entries(typePerformance).sort((a, b) => b[1] - a[1])[0]?.[0] || 'product';
  const bestPlatform = (Object.entries(platformPerformance).sort((a, b) => b[1] - a[1])[0]?.[0] || 'instagram') as SocialPlatform;

  // 추천 생성
  const recommendations: string[] = [];

  if (failedPosts.length > publishedPosts.length * 0.1) {
    recommendations.push('실패한 포스트가 많습니다. 연결 상태와 API 설정을 확인해주세요.');
  }

  if (bestType === 'promotion') {
    recommendations.push('프로모션 포스트가 좋은 성과를 보이고 있습니다. 정기적인 할인 이벤트를 고려해보세요.');
  }

  if (totalReach < publishedPosts.length * 100) {
    recommendations.push('도달률이 낮습니다. 해시태그와 포스팅 시간을 최적화해보세요.');
  }

  return {
    summary: {
      totalPosts: posts.length,
      publishedPosts: publishedPosts.length,
      failedPosts: failedPosts.length,
      avgEngagement: publishedPosts.length > 0 ? totalEngagement / publishedPosts.length : 0,
      totalReach,
    },
    bestPerformingType: bestType,
    bestPerformingPlatform: bestPlatform,
    recommendations,
  };
}

/**
 * 플랫폼별 분석 리포트 생성
 */
export function generatePlatformReport(
  platform: SocialPlatform,
  posts: SocialPost[],
  period: 'week' | 'month'
): SocialAnalytics {
  const platformPosts = posts.filter(p => p.platform === platform);
  
  const now = new Date();
  const periodStart = new Date();
  periodStart.setDate(now.getDate() - (period === 'week' ? 7 : 30));

  const periodPosts = platformPosts.filter(
    p => p.publishedAt && new Date(p.publishedAt) >= periodStart
  );

  const totalEngagement = periodPosts.reduce(
    (sum, p) => sum + (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0),
    0
  );

  const totalReach = periodPosts.reduce(
    (sum, p) => sum + (p.engagement?.reach || 0),
    0
  );

  const totalClicks = periodPosts.reduce(
    (sum, p) => sum + (p.engagement?.clicks || 0),
    0
  );

  const avgEngagementRate = periodPosts.length > 0
    ? periodPosts.reduce((sum, p) => sum + (p.engagement?.engagementRate || 0), 0) / periodPosts.length
    : 0;

  // 일별 트렌드 생성
  const trends: TrendData[] = [];
  const days = period === 'week' ? 7 : 30;

  for (let i = 0; i < days; i++) {
    const date = new Date(periodStart);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const dayPosts = periodPosts.filter(p => {
      const postDate = new Date(p.publishedAt!).toISOString().split('T')[0];
      return postDate === dateStr;
    });

    trends.push({
      date: dateStr,
      posts: dayPosts.length,
      engagement: dayPosts.reduce(
        (sum, p) => sum + (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0),
        0
      ),
      reach: dayPosts.reduce((sum, p) => sum + (p.engagement?.reach || 0), 0),
    });
  }

  // 상위 포스트
  const topPosts = [...periodPosts]
    .sort((a, b) => {
      const engA = (a.engagement?.likes || 0) + (a.engagement?.comments || 0) + (a.engagement?.shares || 0);
      const engB = (b.engagement?.likes || 0) + (b.engagement?.comments || 0) + (b.engagement?.shares || 0);
      return engB - engA;
    })
    .slice(0, 5);

  return {
    platform,
    period,
    totalPosts: periodPosts.length,
    totalEngagement,
    totalReach,
    totalClicks,
    avgEngagementRate,
    topPosts,
    trends,
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * 포스트 내용 유효성 검사
 */
export function validatePostContent(
  content: string,
  platform: SocialPlatform,
  hashtags: string[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const limits = PLATFORM_LIMITS[platform];

  // 길이 검사
  const totalLength = content.length + hashtags.join(' ').length + hashtags.length;
  if (totalLength > limits.maxLength) {
    errors.push(`내용이 너무 깁니다. (${totalLength}/${limits.maxLength}자)`);
  } else if (totalLength > limits.maxLength * 0.9) {
    warnings.push('내용이 길이 제한에 가깝습니다.');
  }

  // 해시태그 검사
  if (hashtags.length > limits.maxHashtags) {
    errors.push(`해시태그가 너무 많습니다. (${hashtags.length}/${limits.maxHashtags}개)`);
  }

  // 빈 내용 검사
  if (content.trim().length === 0) {
    errors.push('내용을 입력해주세요.');
  }

  // 플랫폼별 특수 검사
  if (platform === 'twitter' && content.length > 280) {
    errors.push('트위터는 280자 제한이 있습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
