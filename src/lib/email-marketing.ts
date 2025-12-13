/**
 * 이메일 마케팅 연동 유틸리티
 * Mailchimp/Sendgrid 스타일 이메일 캠페인 관리
 */

// ============================================================================
// Types
// ============================================================================

export type EmailProvider = 'sendgrid' | 'mailchimp' | 'ses' | 'smtp';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
export type SubscriberStatus = 'subscribed' | 'unsubscribed' | 'pending' | 'bounced' | 'complained';

export interface EmailProviderConfig {
  provider: EmailProvider;
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  isConfigured: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: SubscriberStatus;
  tags: string[];
  listIds: string[];
  metadata: Record<string, string | number | boolean>;
  subscribedAt: Date;
  lastEmailAt?: Date;
  lastOpenAt?: Date;
  lastClickAt?: Date;
  emailCount: number;
  openCount: number;
  clickCount: number;
  unsubscribedAt?: Date;
  source?: string;
}

export interface EmailList {
  id: string;
  name: string;
  description?: string;
  subscriberCount: number;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  isDefault?: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category: 'promotional' | 'transactional' | 'newsletter' | 'welcome' | 'cart-recovery';
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  templateId?: string;
  htmlContent: string;
  textContent?: string;
  listIds: string[];
  segmentIds?: string[];
  excludeListIds?: string[];
  status: CampaignStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  completedAt?: Date;
  stats?: CampaignStats;
  settings: CampaignSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignSettings {
  trackOpens: boolean;
  trackClicks: boolean;
  googleAnalytics?: {
    enabled: boolean;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  replyTo?: string;
  sendTime?: 'immediate' | 'scheduled' | 'optimal';
}

export interface CampaignStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
  openRate: number; // percentage
  clickRate: number; // percentage
  bounceRate: number; // percentage
  unsubscribeRate: number; // percentage
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  conditions: SegmentCondition[];
  conditionLogic: 'AND' | 'OR';
  subscriberCount: number;
  createdAt: Date;
}

export interface SegmentCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  isActive: boolean;
  stats: {
    totalEntered: number;
    totalCompleted: number;
    totalExited: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationTrigger {
  type: 'signup' | 'tag_added' | 'purchase' | 'cart_abandoned' | 'date_based' | 'api';
  conditions?: Record<string, unknown>;
}

export interface AutomationStep {
  id: string;
  type: 'email' | 'delay' | 'condition' | 'tag' | 'webhook';
  config: Record<string, unknown>;
  order: number;
}

export interface EmailAnalytics {
  period: 'day' | 'week' | 'month' | 'quarter';
  summary: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgBounceRate: number;
    listGrowth: number;
    unsubscribes: number;
  };
  trends: {
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }[];
  topCampaigns: Campaign[];
  subscriberGrowth: {
    date: string;
    subscribed: number;
    unsubscribed: number;
    net: number;
  }[];
}

// ============================================================================
// Email Template Generation
// ============================================================================

/**
 * 이메일 템플릿 변수 목록
 */
export const EMAIL_VARIABLES = {
  subscriber: ['{{firstName}}', '{{lastName}}', '{{email}}', '{{fullName}}'],
  product: ['{{productName}}', '{{productPrice}}', '{{productImage}}', '{{productUrl}}'],
  campaign: ['{{unsubscribeUrl}}', '{{webVersionUrl}}', '{{companyName}}', '{{companyAddress}}'],
  promotion: ['{{discountCode}}', '{{discountAmount}}', '{{expiryDate}}'],
};

/**
 * 기본 이메일 템플릿 생성
 */
export function getDefaultTemplates(): EmailTemplate[] {
  return [
    {
      id: 'welcome-1',
      name: '환영 이메일',
      subject: '{{companyName}}에 오신 것을 환영합니다!',
      preheader: '가입을 축하드립니다',
      htmlContent: generateWelcomeTemplate(),
      category: 'welcome',
      variables: ['firstName', 'companyName'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'newsletter-1',
      name: '뉴스레터 기본',
      subject: '이번 주 {{companyName}} 소식',
      htmlContent: generateNewsletterTemplate(),
      category: 'newsletter',
      variables: ['firstName', 'companyName'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'promo-1',
      name: '할인 프로모션',
      subject: '🎉 {{discountAmount}} 할인 쿠폰이 도착했어요!',
      preheader: '지금 바로 사용하세요',
      htmlContent: generatePromoTemplate(),
      category: 'promotional',
      variables: ['firstName', 'discountCode', 'discountAmount', 'expiryDate'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'cart-recovery-1',
      name: '장바구니 복구',
      subject: '{{firstName}}님, 장바구니에 담긴 상품이 기다리고 있어요',
      preheader: '구매를 완료해 주세요',
      htmlContent: generateCartRecoveryTemplate(),
      category: 'cart-recovery',
      variables: ['firstName', 'productName', 'productImage', 'productUrl'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

/**
 * 환영 이메일 템플릿
 */
function generateWelcomeTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">환영합니다! 🎉</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <p style="font-size: 16px; color: #333; margin: 0 0 20px;">안녕하세요, {{firstName}}님!</p>
        <p style="font-size: 16px; color: #333; margin: 0 0 20px;">{{companyName}}에 가입해 주셔서 감사합니다.</p>
        <p style="font-size: 16px; color: #333; margin: 0 0 30px;">지금 바로 다양한 디지털 콘텐츠를 만나보세요.</p>
        <a href="{{webVersionUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold;">둘러보기</a>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #666;">
        <p>© {{companyName}}. All rights reserved.</p>
        <p><a href="{{unsubscribeUrl}}" style="color: #666;">수신 거부</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 뉴스레터 템플릿
 */
function generateNewsletterTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 30px; text-align: center; background-color: #1a1a2e;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📬 {{companyName}} 뉴스레터</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <p style="font-size: 16px; color: #333; margin: 0 0 20px;">{{firstName}}님, 안녕하세요!</p>
        <p style="font-size: 16px; color: #333; margin: 0 0 30px;">이번 주의 새로운 소식을 전해드립니다.</p>
        
        <!-- 콘텐츠 섹션 -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1a1a2e; font-size: 20px; margin: 0 0 15px;">🆕 신규 등록 상품</h2>
          <p style="font-size: 14px; color: #666;">이번 주에 등록된 인기 상품을 확인해보세요.</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1a1a2e; font-size: 20px; margin: 0 0 15px;">🔥 인기 콘텐츠</h2>
          <p style="font-size: 14px; color: #666;">다른 회원들이 선택한 베스트셀러를 만나보세요.</p>
        </div>
        
        <a href="{{webVersionUrl}}" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold;">더 알아보기</a>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #666;">
        <p>© {{companyName}}. All rights reserved.</p>
        <p><a href="{{unsubscribeUrl}}" style="color: #666;">수신 거부</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 프로모션 템플릿
 */
function generatePromoTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎁 특별 할인!</h1>
        <p style="color: #ffffff; font-size: 48px; font-weight: bold; margin: 20px 0;">{{discountAmount}}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px; text-align: center;">
        <p style="font-size: 16px; color: #333; margin: 0 0 20px;">{{firstName}}님을 위한 특별 쿠폰이 도착했어요!</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 14px; color: #666; margin: 0 0 10px;">쿠폰 코드</p>
          <p style="font-size: 24px; font-weight: bold; color: #f5576c; margin: 0; letter-spacing: 4px;">{{discountCode}}</p>
        </div>
        <p style="font-size: 14px; color: #999; margin: 20px 0;">⏰ {{expiryDate}}까지 사용 가능</p>
        <a href="{{webVersionUrl}}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold;">지금 쇼핑하기</a>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #666;">
        <p>© {{companyName}}. All rights reserved.</p>
        <p><a href="{{unsubscribeUrl}}" style="color: #666;">수신 거부</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 장바구니 복구 템플릿
 */
function generateCartRecoveryTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px; text-align: center; background-color: #4a5568;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🛒 잊으신 게 있으신가요?</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <p style="font-size: 16px; color: #333; margin: 0 0 20px;">{{firstName}}님, 장바구니에 담긴 상품이 기다리고 있어요!</p>
        
        <!-- 상품 카드 -->
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <img src="{{productImage}}" alt="{{productName}}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 15px;">
          <h3 style="margin: 0 0 10px; color: #333;">{{productName}}</h3>
          <p style="font-size: 20px; font-weight: bold; color: #4a5568; margin: 0;">{{productPrice}}</p>
        </div>
        
        <a href="{{productUrl}}" style="display: block; text-align: center; background-color: #4a5568; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold;">구매 완료하기</a>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #666;">
        <p>© {{companyName}}. All rights reserved.</p>
        <p><a href="{{unsubscribeUrl}}" style="color: #666;">수신 거부</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// Template Variable Replacement
// ============================================================================

/**
 * 템플릿 변수 치환
 */
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;
  
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(pattern, value);
  }
  
  return result;
}

/**
 * 필요한 변수 추출
 */
export function extractVariables(content: string): string[] {
  const regex = /{{(\w+)}}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

// ============================================================================
// Campaign Management
// ============================================================================

/**
 * 캠페인 통계 계산
 */
export function calculateCampaignStats(
  sent: number,
  delivered: number,
  opened: number,
  clicked: number,
  bounced: number,
  unsubscribed: number,
  complained: number
): CampaignStats {
  return {
    totalRecipients: sent,
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    unsubscribed,
    complained,
    openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
    bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
    unsubscribeRate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0,
  };
}

/**
 * 데모 캠페인 데이터 생성
 */
export function generateDemoCampaigns(): Campaign[] {
  const now = new Date();
  
  return [
    {
      id: 'campaign_1',
      name: '12월 뉴스레터',
      subject: '🎄 12월 새로운 콘텐츠를 만나보세요!',
      preheader: '이번 달 인기 상품 모음',
      templateId: 'newsletter-1',
      htmlContent: generateNewsletterTemplate(),
      listIds: ['list_1'],
      status: 'sent',
      sentAt: new Date(now.getTime() - 86400000 * 2),
      completedAt: new Date(now.getTime() - 86400000 * 2 + 3600000),
      stats: calculateCampaignStats(1500, 1450, 580, 145, 50, 5, 1),
      settings: {
        trackOpens: true,
        trackClicks: true,
        googleAnalytics: { enabled: true, utmSource: 'email', utmMedium: 'newsletter', utmCampaign: 'december' },
      },
      createdAt: new Date(now.getTime() - 86400000 * 3),
      updatedAt: new Date(now.getTime() - 86400000 * 2),
    },
    {
      id: 'campaign_2',
      name: '연말 프로모션',
      subject: '🎁 연말 특별 할인 20% 쿠폰',
      preheader: '지금 바로 사용하세요',
      templateId: 'promo-1',
      htmlContent: generatePromoTemplate(),
      listIds: ['list_1', 'list_2'],
      status: 'sent',
      sentAt: new Date(now.getTime() - 86400000 * 5),
      completedAt: new Date(now.getTime() - 86400000 * 5 + 3600000),
      stats: calculateCampaignStats(2500, 2400, 1200, 480, 100, 12, 2),
      settings: {
        trackOpens: true,
        trackClicks: true,
        googleAnalytics: { enabled: true, utmSource: 'email', utmMedium: 'promo', utmCampaign: 'yearend' },
      },
      createdAt: new Date(now.getTime() - 86400000 * 7),
      updatedAt: new Date(now.getTime() - 86400000 * 5),
    },
    {
      id: 'campaign_3',
      name: '1월 신규 상품 안내',
      subject: '🆕 2026년 새로운 시작, 신규 상품 출시!',
      templateId: 'newsletter-1',
      htmlContent: generateNewsletterTemplate(),
      listIds: ['list_1'],
      status: 'scheduled',
      scheduledAt: new Date(now.getTime() + 86400000 * 7),
      settings: {
        trackOpens: true,
        trackClicks: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'campaign_4',
      name: '장바구니 복구 캠페인',
      subject: '{{firstName}}님, 장바구니를 확인해주세요',
      templateId: 'cart-recovery-1',
      htmlContent: generateCartRecoveryTemplate(),
      listIds: ['list_cart'],
      status: 'draft',
      settings: {
        trackOpens: true,
        trackClicks: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

// ============================================================================
// Subscriber Management
// ============================================================================

/**
 * 세그먼트 조건 평가
 */
export function evaluateSegmentCondition(
  subscriber: Subscriber,
  condition: SegmentCondition
): boolean {
  const fieldValue = subscriber.metadata[condition.field] ?? (subscriber as unknown as Record<string, unknown>)[condition.field];
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'contains':
      return String(fieldValue).includes(String(condition.value));
    case 'not_contains':
      return !String(fieldValue).includes(String(condition.value));
    case 'greater_than':
      return Number(fieldValue) > Number(condition.value);
    case 'less_than':
      return Number(fieldValue) < Number(condition.value);
    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldValue === '';
    case 'is_not_empty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    default:
      return false;
  }
}

/**
 * 세그먼트에 해당하는 구독자 필터링
 */
export function filterSubscribersBySegment(
  subscribers: Subscriber[],
  segment: Segment
): Subscriber[] {
  return subscribers.filter(subscriber => {
    const results = segment.conditions.map(condition =>
      evaluateSegmentCondition(subscriber, condition)
    );

    if (segment.conditionLogic === 'AND') {
      return results.every(r => r);
    } else {
      return results.some(r => r);
    }
  });
}

/**
 * 데모 구독자 데이터 생성
 */
export function generateDemoSubscribers(count: number = 50): Subscriber[] {
  const subscribers: Subscriber[] = [];
  const sources = ['website', 'social', 'referral', 'import'];
  const tags = ['vip', 'new', 'active', 'purchased', 'newsletter'];

  for (let i = 0; i < count; i++) {
    const subscribedDaysAgo = Math.floor(Math.random() * 180);
    const subscribedAt = new Date(Date.now() - subscribedDaysAgo * 86400000);
    const hasEngaged = Math.random() > 0.3;

    subscribers.push({
      id: `sub_${i + 1}`,
      email: `user${i + 1}@example.com`,
      firstName: `User${i + 1}`,
      lastName: `Test`,
      status: Math.random() > 0.9 ? 'unsubscribed' : 'subscribed',
      tags: tags.filter(() => Math.random() > 0.7),
      listIds: ['list_1'],
      metadata: {
        purchaseCount: Math.floor(Math.random() * 10),
        totalSpent: Math.floor(Math.random() * 500000),
        lastPurchase: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
      },
      subscribedAt,
      lastEmailAt: hasEngaged ? new Date(Date.now() - Math.random() * 30 * 86400000) : undefined,
      lastOpenAt: hasEngaged ? new Date(Date.now() - Math.random() * 14 * 86400000) : undefined,
      lastClickAt: hasEngaged && Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 86400000) : undefined,
      emailCount: Math.floor(Math.random() * 20),
      openCount: hasEngaged ? Math.floor(Math.random() * 15) : 0,
      clickCount: hasEngaged ? Math.floor(Math.random() * 5) : 0,
      source: sources[Math.floor(Math.random() * sources.length)],
    });
  }

  return subscribers;
}

// ============================================================================
// Analytics
// ============================================================================

/**
 * 이메일 분석 데이터 생성
 */
export function generateEmailAnalytics(
  campaigns: Campaign[],
  period: EmailAnalytics['period']
): EmailAnalytics {
  const sentCampaigns = campaigns.filter(c => c.status === 'sent' && c.stats);
  
  const totalSent = sentCampaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
  const totalDelivered = sentCampaigns.reduce((sum, c) => sum + (c.stats?.delivered || 0), 0);
  const totalOpened = sentCampaigns.reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
  const totalClicked = sentCampaigns.reduce((sum, c) => sum + (c.stats?.clicked || 0), 0);
  const totalBounced = sentCampaigns.reduce((sum, c) => sum + (c.stats?.bounced || 0), 0);
  const totalUnsubscribed = sentCampaigns.reduce((sum, c) => sum + (c.stats?.unsubscribed || 0), 0);

  const avgOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
  const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
  const avgBounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

  // 트렌드 데이터 생성
  const days = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 90;
  const trends: EmailAnalytics['trends'] = [];
  const subscriberGrowth: EmailAnalytics['subscriberGrowth'] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    trends.push({
      date: dateStr,
      sent: Math.floor(Math.random() * 500),
      opened: Math.floor(Math.random() * 200),
      clicked: Math.floor(Math.random() * 50),
    });

    const subscribed = Math.floor(Math.random() * 30);
    const unsubscribed = Math.floor(Math.random() * 5);
    subscriberGrowth.push({
      date: dateStr,
      subscribed,
      unsubscribed,
      net: subscribed - unsubscribed,
    });
  }

  return {
    period,
    summary: {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      avgOpenRate,
      avgClickRate,
      avgBounceRate,
      listGrowth: subscriberGrowth.reduce((sum, s) => sum + s.net, 0),
      unsubscribes: totalUnsubscribed,
    },
    trends,
    topCampaigns: [...sentCampaigns]
      .sort((a, b) => (b.stats?.openRate || 0) - (a.stats?.openRate || 0))
      .slice(0, 5),
    subscriberGrowth,
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * 이메일 주소 유효성 검사
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 캠페인 유효성 검사
 */
export function validateCampaign(campaign: Partial<Campaign>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!campaign.name?.trim()) {
    errors.push('캠페인 이름을 입력해주세요.');
  }

  if (!campaign.subject?.trim()) {
    errors.push('이메일 제목을 입력해주세요.');
  }

  if (!campaign.htmlContent?.trim()) {
    errors.push('이메일 내용을 입력해주세요.');
  }

  if (!campaign.listIds || campaign.listIds.length === 0) {
    errors.push('수신자 목록을 선택해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
