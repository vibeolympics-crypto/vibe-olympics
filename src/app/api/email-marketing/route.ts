/**
 * 이메일 마케팅 API
 * Mailchimp/Sendgrid 스타일 이메일 캠페인 관리
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getDefaultTemplates,
  generateDemoCampaigns,
  generateDemoSubscribers,
  generateEmailAnalytics,
  replaceTemplateVariables,
  validateCampaign,
  validateEmail,
  type Campaign,
  type EmailList,
  type Subscriber,
} from '@/lib/email-marketing';

export const dynamic = 'force-dynamic';

// 메모리 저장소 (실제 구현시 DB 사용)
let campaigns = generateDemoCampaigns();
let subscribers = generateDemoSubscribers(100);
const emailLists: EmailList[] = [
  {
    id: 'list_1',
    name: '전체 구독자',
    description: '모든 뉴스레터 구독자',
    subscriberCount: 100,
    createdAt: new Date(Date.now() - 86400000 * 90),
    updatedAt: new Date(),
    isDefault: true,
  },
  {
    id: 'list_2',
    name: 'VIP 고객',
    description: '구매 이력이 있는 고객',
    subscriberCount: 35,
    tags: ['vip', 'purchased'],
    createdAt: new Date(Date.now() - 86400000 * 60),
    updatedAt: new Date(),
  },
  {
    id: 'list_cart',
    name: '장바구니 이탈 고객',
    description: '장바구니에 상품을 담고 구매하지 않은 고객',
    subscriberCount: 12,
    createdAt: new Date(Date.now() - 86400000 * 30),
    updatedAt: new Date(),
  },
];

// POST: 이메일 마케팅 작업 수행
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = session?.user?.role ?? '';
    if (!session?.user || !['ADMIN', 'SELLER'].includes(userRole)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      case 'create-campaign': {
        // 캠페인 생성
        const campaignData = body.campaign as Partial<Campaign>;
        const validation = validateCampaign(campaignData);
        
        if (!validation.isValid) {
          return NextResponse.json(
            { error: validation.errors.join(', ') },
            { status: 400 }
          );
        }

        const newCampaign: Campaign = {
          id: `campaign_${Date.now()}`,
          name: campaignData.name!,
          subject: campaignData.subject!,
          preheader: campaignData.preheader,
          templateId: campaignData.templateId,
          htmlContent: campaignData.htmlContent!,
          textContent: campaignData.textContent,
          listIds: campaignData.listIds!,
          segmentIds: campaignData.segmentIds,
          excludeListIds: campaignData.excludeListIds,
          status: 'draft',
          settings: campaignData.settings || {
            trackOpens: true,
            trackClicks: true,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        campaigns.push(newCampaign);

        return NextResponse.json({
          success: true,
          data: newCampaign,
        });
      }

      case 'update-campaign': {
        // 캠페인 수정
        const { campaignId, updates } = body as { campaignId: string; updates: Partial<Campaign> };
        const campaign = campaigns.find(c => c.id === campaignId);
        
        if (!campaign) {
          return NextResponse.json(
            { error: '캠페인을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        if (campaign.status === 'sent') {
          return NextResponse.json(
            { error: '발송된 캠페인은 수정할 수 없습니다.' },
            { status: 400 }
          );
        }

        Object.assign(campaign, updates, { updatedAt: new Date() });

        return NextResponse.json({
          success: true,
          data: campaign,
        });
      }

      case 'schedule-campaign': {
        // 캠페인 예약
        const { campaignId, scheduledAt } = body as { campaignId: string; scheduledAt: string };
        const campaign = campaigns.find(c => c.id === campaignId);
        
        if (!campaign) {
          return NextResponse.json(
            { error: '캠페인을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        campaign.status = 'scheduled';
        campaign.scheduledAt = new Date(scheduledAt);
        campaign.updatedAt = new Date();

        return NextResponse.json({
          success: true,
          data: campaign,
          message: `캠페인이 ${new Date(scheduledAt).toLocaleString('ko-KR')}에 발송 예약되었습니다.`,
        });
      }

      case 'send-campaign': {
        // 캠페인 즉시 발송 (시뮬레이션)
        const { campaignId } = body as { campaignId: string };
        const campaign = campaigns.find(c => c.id === campaignId);
        
        if (!campaign) {
          return NextResponse.json(
            { error: '캠페인을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        // 수신자 수 계산
        const recipientCount = campaign.listIds.reduce((sum, listId) => {
          const list = emailLists.find(l => l.id === listId);
          return sum + (list?.subscriberCount || 0);
        }, 0);

        // 시뮬레이션 통계
        const delivered = Math.floor(recipientCount * 0.96);
        const opened = Math.floor(delivered * (0.2 + Math.random() * 0.3));
        const clicked = Math.floor(opened * (0.1 + Math.random() * 0.2));

        campaign.status = 'sent';
        campaign.sentAt = new Date();
        campaign.completedAt = new Date(Date.now() + 3600000);
        campaign.stats = {
          totalRecipients: recipientCount,
          sent: recipientCount,
          delivered,
          opened,
          clicked,
          bounced: recipientCount - delivered,
          unsubscribed: Math.floor(delivered * 0.005),
          complained: Math.floor(delivered * 0.001),
          openRate: (opened / delivered) * 100,
          clickRate: (clicked / opened) * 100,
          bounceRate: ((recipientCount - delivered) / recipientCount) * 100,
          unsubscribeRate: (Math.floor(delivered * 0.005) / delivered) * 100,
        };
        campaign.updatedAt = new Date();

        return NextResponse.json({
          success: true,
          data: campaign,
          message: `${recipientCount}명에게 캠페인이 발송되었습니다.`,
        });
      }

      case 'add-subscriber': {
        // 구독자 추가
        const { email, firstName, lastName, listIds, tags } = body as {
          email: string;
          firstName?: string;
          lastName?: string;
          listIds: string[];
          tags?: string[];
        };

        if (!validateEmail(email)) {
          return NextResponse.json(
            { error: '유효하지 않은 이메일 주소입니다.' },
            { status: 400 }
          );
        }

        const existing = subscribers.find(s => s.email === email);
        if (existing) {
          return NextResponse.json(
            { error: '이미 등록된 이메일 주소입니다.' },
            { status: 400 }
          );
        }

        const newSubscriber: Subscriber = {
          id: `sub_${Date.now()}`,
          email,
          firstName,
          lastName,
          status: 'subscribed',
          tags: tags || [],
          listIds,
          metadata: {},
          subscribedAt: new Date(),
          emailCount: 0,
          openCount: 0,
          clickCount: 0,
          source: 'api',
        };

        subscribers.push(newSubscriber);

        // 리스트 카운트 업데이트
        listIds.forEach(listId => {
          const list = emailLists.find(l => l.id === listId);
          if (list) list.subscriberCount++;
        });

        return NextResponse.json({
          success: true,
          data: newSubscriber,
        });
      }

      case 'unsubscribe': {
        // 구독 취소
        const { email: unsubEmail } = body as { email: string };
        const subscriber = subscribers.find(s => s.email === unsubEmail);
        
        if (!subscriber) {
          return NextResponse.json(
            { error: '구독자를 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        subscriber.status = 'unsubscribed';
        subscriber.unsubscribedAt = new Date();

        return NextResponse.json({
          success: true,
          message: '구독이 취소되었습니다.',
        });
      }

      case 'create-list': {
        // 목록 생성
        const { name, description } = body as { name: string; description?: string };
        
        const newList: EmailList = {
          id: `list_${Date.now()}`,
          name,
          description,
          subscriberCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        emailLists.push(newList);

        return NextResponse.json({
          success: true,
          data: newList,
        });
      }

      case 'preview-email': {
        // 이메일 미리보기
        const { htmlContent, variables } = body as { htmlContent: string; variables: Record<string, string> };
        
        const preview = replaceTemplateVariables(htmlContent, {
          ...variables,
          unsubscribeUrl: '#unsubscribe',
          webVersionUrl: '#web-version',
          companyName: 'Vibe Olympics',
          companyAddress: '서울시 강남구',
        });

        return NextResponse.json({
          success: true,
          data: { preview },
        });
      }

      default:
        return NextResponse.json(
          { error: '지원하지 않는 작업입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Email marketing API error:', error);
    return NextResponse.json(
      { error: '이메일 마케팅 작업 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 이메일 마케팅 정보 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = session?.user?.role ?? '';
    if (!session?.user || !['ADMIN', 'SELLER'].includes(userRole)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'campaigns';

    switch (type) {
      case 'campaigns': {
        // 캠페인 목록
        const status = searchParams.get('status') as Campaign['status'] | null;
        let result = campaigns;
        
        if (status) {
          result = result.filter(c => c.status === status);
        }

        return NextResponse.json({
          success: true,
          data: result.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          count: result.length,
        });
      }

      case 'campaign': {
        // 단일 캠페인
        const campaignId = searchParams.get('id');
        if (!campaignId) {
          return NextResponse.json(
            { error: 'id 파라미터가 필요합니다.' },
            { status: 400 }
          );
        }

        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign) {
          return NextResponse.json(
            { error: '캠페인을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: campaign,
        });
      }

      case 'lists': {
        // 목록 조회
        return NextResponse.json({
          success: true,
          data: emailLists,
          count: emailLists.length,
        });
      }

      case 'subscribers': {
        // 구독자 조회
        const listId = searchParams.get('listId');
        const status = searchParams.get('status') as Subscriber['status'] | null;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        let result = subscribers;

        if (listId) {
          result = result.filter(s => s.listIds.includes(listId));
        }
        if (status) {
          result = result.filter(s => s.status === status);
        }

        const total = result.length;
        const paginated = result.slice((page - 1) * limit, page * limit);

        return NextResponse.json({
          success: true,
          data: paginated,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      case 'templates': {
        // 템플릿 조회
        return NextResponse.json({
          success: true,
          data: getDefaultTemplates(),
        });
      }

      case 'analytics': {
        // 분석 데이터
        const period = (searchParams.get('period') || 'month') as 'day' | 'week' | 'month' | 'quarter';
        const analytics = generateEmailAnalytics(campaigns, period);

        return NextResponse.json({
          success: true,
          data: analytics,
        });
      }

      case 'stats': {
        // 요약 통계
        const totalSubscribers = subscribers.filter(s => s.status === 'subscribed').length;
        const sentCampaigns = campaigns.filter(c => c.status === 'sent');
        const totalSent = sentCampaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
        const avgOpenRate = sentCampaigns.length > 0
          ? sentCampaigns.reduce((sum, c) => sum + (c.stats?.openRate || 0), 0) / sentCampaigns.length
          : 0;

        return NextResponse.json({
          success: true,
          data: {
            totalSubscribers,
            totalLists: emailLists.length,
            totalCampaigns: campaigns.length,
            sentCampaigns: sentCampaigns.length,
            scheduledCampaigns: campaigns.filter(c => c.status === 'scheduled').length,
            totalEmailsSent: totalSent,
            avgOpenRate,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: '지원하지 않는 조회 유형입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Email marketing GET error:', error);
    return NextResponse.json(
      { error: '정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
