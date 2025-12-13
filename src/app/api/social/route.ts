/**
 * 소셜 미디어 연동 API
 * 자동 홍보 포스팅 시스템
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generatePostContent,
  getDefaultTemplates,
  applyTemplate,
  getOptimalPostingTimes,
  generatePostingSchedule,
  analyzePostPerformance,
  generatePlatformReport,
  validatePostContent,
  type SocialPlatform,
  type SocialPost,
  type ContentGenerationOptions,
} from '@/lib/social-media';

export const dynamic = 'force-dynamic';

// 메모리 저장소 (실제 구현시 DB 사용)
const socialPosts: SocialPost[] = [];
const connectedAccounts: Map<string, {
  platform: SocialPlatform;
  username: string;
  isConnected: boolean;
}[]> = new Map();

// POST: 소셜 미디어 작업 수행
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
      case 'generate': {
        // 포스트 내용 생성
        const options = body.options as ContentGenerationOptions;
        const result = generatePostContent(options);
        
        // 유효성 검사
        const validation = validatePostContent(
          result.content,
          options.platform,
          result.hashtags
        );

        return NextResponse.json({
          success: true,
          data: {
            ...result,
            validation,
          },
        });
      }

      case 'create': {
        // 포스트 생성 (예약 또는 즉시)
        const { platform, content, hashtags, mediaUrls, link, scheduledAt, type } = body as {
          platform: SocialPlatform;
          content: string;
          hashtags: string[];
          mediaUrls?: string[];
          link?: string;
          scheduledAt?: string;
          type: SocialPost['type'];
        };

        const validation = validatePostContent(content, platform, hashtags);
        if (!validation.isValid) {
          return NextResponse.json(
            { error: validation.errors.join(', ') },
            { status: 400 }
          );
        }

        const newPost: SocialPost = {
          id: `post_${Date.now()}`,
          userId: session.user.id,
          platform,
          type,
          content,
          hashtags,
          mediaUrls,
          link,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          status: scheduledAt ? 'scheduled' : 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        socialPosts.push(newPost);

        return NextResponse.json({
          success: true,
          data: newPost,
        });
      }

      case 'publish': {
        // 포스트 발행 (시뮬레이션)
        const { postId } = body as { postId: string };
        const post = socialPosts.find(p => p.id === postId);

        if (!post) {
          return NextResponse.json(
            { error: '포스트를 찾을 수 없습니다.' },
            { status: 404 }
          );
        }

        // 실제 구현시 각 플랫폼 API 호출
        post.status = 'published';
        post.publishedAt = new Date();
        post.engagement = {
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 20),
          shares: Math.floor(Math.random() * 10),
          clicks: Math.floor(Math.random() * 50),
          impressions: Math.floor(Math.random() * 1000),
          reach: Math.floor(Math.random() * 500),
          engagementRate: Math.random() * 5,
        };
        post.updatedAt = new Date();

        return NextResponse.json({
          success: true,
          data: post,
          message: '포스트가 발행되었습니다.',
        });
      }

      case 'connect': {
        // 소셜 계정 연결 (시뮬레이션)
        const { platform, authCode } = body as { platform: SocialPlatform; authCode?: string };
        
        const userId = session.user.id;
        const userAccounts = connectedAccounts.get(userId) || [];
        
        // 이미 연결된 계정인지 확인
        const existingAccount = userAccounts.find(a => a.platform === platform);
        if (existingAccount) {
          return NextResponse.json(
            { error: '이미 연결된 플랫폼입니다.' },
            { status: 400 }
          );
        }

        userAccounts.push({
          platform,
          username: `demo_user_${platform}`,
          isConnected: true,
        });
        connectedAccounts.set(userId, userAccounts);

        return NextResponse.json({
          success: true,
          message: `${platform} 계정이 연결되었습니다.`,
          data: {
            platform,
            username: `demo_user_${platform}`,
            isConnected: true,
          },
        });
      }

      case 'disconnect': {
        // 소셜 계정 연결 해제
        const { platform: disconnectPlatform } = body as { platform: SocialPlatform };
        
        const userId = session.user.id;
        const userAccounts = connectedAccounts.get(userId) || [];
        
        const updatedAccounts = userAccounts.filter(a => a.platform !== disconnectPlatform);
        connectedAccounts.set(userId, updatedAccounts);

        return NextResponse.json({
          success: true,
          message: `${disconnectPlatform} 연결이 해제되었습니다.`,
        });
      }

      case 'schedule': {
        // 포스팅 일정 생성
        const { frequency, preferredTimes, startDate, count } = body as {
          frequency: 'daily' | 'weekly' | 'biweekly';
          preferredTimes: string[];
          startDate: string;
          count: number;
        };

        const schedule = generatePostingSchedule(
          frequency,
          preferredTimes,
          new Date(startDate),
          count
        );

        return NextResponse.json({
          success: true,
          data: {
            schedule: schedule.map(d => d.toISOString()),
            count: schedule.length,
          },
        });
      }

      case 'analyze': {
        // 포스트 성과 분석
        const userPosts = socialPosts.filter(p => p.userId === session.user.id);
        const analysis = analyzePostPerformance(userPosts);

        return NextResponse.json({
          success: true,
          data: analysis,
        });
      }

      case 'platform-report': {
        // 플랫폼별 리포트
        const { platform, period } = body as { platform: SocialPlatform; period: 'week' | 'month' };
        
        const userPosts = socialPosts.filter(p => p.userId === session.user.id);
        const report = generatePlatformReport(platform, userPosts, period);

        return NextResponse.json({
          success: true,
          data: report,
        });
      }

      default:
        return NextResponse.json(
          { error: '지원하지 않는 작업입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Social media API error:', error);
    return NextResponse.json(
      { error: '소셜 미디어 작업 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 소셜 미디어 정보 조회
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
    const type = searchParams.get('type') || 'accounts';

    switch (type) {
      case 'accounts': {
        // 연결된 계정 목록
        const accounts = connectedAccounts.get(session.user.id) || [];
        return NextResponse.json({
          success: true,
          data: accounts,
        });
      }

      case 'posts': {
        // 포스트 목록
        const platform = searchParams.get('platform') as SocialPlatform | null;
        const status = searchParams.get('status') as SocialPost['status'] | null;
        
        let posts = socialPosts.filter(p => p.userId === session.user.id);
        
        if (platform) {
          posts = posts.filter(p => p.platform === platform);
        }
        if (status) {
          posts = posts.filter(p => p.status === status);
        }

        return NextResponse.json({
          success: true,
          data: posts.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          count: posts.length,
        });
      }

      case 'templates': {
        // 템플릿 목록
        const templates = getDefaultTemplates();
        return NextResponse.json({
          success: true,
          data: templates,
        });
      }

      case 'optimal-times': {
        // 최적 포스팅 시간
        const platform = searchParams.get('platform') as SocialPlatform;
        if (!platform) {
          return NextResponse.json(
            { error: 'platform 파라미터가 필요합니다.' },
            { status: 400 }
          );
        }

        const times = getOptimalPostingTimes(platform);
        return NextResponse.json({
          success: true,
          data: times,
        });
      }

      case 'demo': {
        // 데모 데이터
        const demoPosts: SocialPost[] = [
          {
            id: 'demo_1',
            userId: session.user.id,
            platform: 'instagram',
            type: 'product',
            content: '✨ 새로운 디지털 아트워크가 등록되었습니다!\n\n"밤하늘의 별"\n\n몽환적인 분위기의 디지털 페인팅입니다.',
            hashtags: ['#디지털아트', '#일러스트', '#아트워크'],
            status: 'published',
            publishedAt: new Date(Date.now() - 86400000),
            engagement: { likes: 234, comments: 12, shares: 5, clicks: 45, impressions: 1200, reach: 800, engagementRate: 3.2 },
            createdAt: new Date(Date.now() - 86400000 * 2),
            updatedAt: new Date(Date.now() - 86400000),
          },
          {
            id: 'demo_2',
            userId: session.user.id,
            platform: 'twitter',
            type: 'promotion',
            content: '🎉 주말 특가 세일! 전 상품 20% 할인\n\n코드: WEEKEND20\n⏰ 일요일까지',
            hashtags: ['#할인', '#세일'],
            status: 'published',
            publishedAt: new Date(Date.now() - 172800000),
            engagement: { likes: 89, comments: 5, shares: 23, clicks: 67, impressions: 890, reach: 650, engagementRate: 4.1 },
            createdAt: new Date(Date.now() - 172800000 * 1.5),
            updatedAt: new Date(Date.now() - 172800000),
          },
          {
            id: 'demo_3',
            userId: session.user.id,
            platform: 'instagram',
            type: 'achievement',
            content: '🎊 판매 100건 달성!\n\n여러분의 사랑에 감사드립니다.',
            hashtags: ['#마일스톤', '#감사합니다'],
            status: 'scheduled',
            scheduledAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        return NextResponse.json({
          success: true,
          data: demoPosts,
          isDemo: true,
        });
      }

      default:
        return NextResponse.json(
          { error: '지원하지 않는 조회 유형입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Social media GET error:', error);
    return NextResponse.json(
      { error: '정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
