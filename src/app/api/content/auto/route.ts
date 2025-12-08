import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// 자동 발행 콘텐츠 스키마
const autoPublishSchema = z.object({
  type: z.enum(["post", "tutorial"]),
  title: z.string().min(2).max(200),
  content: z.string().min(10),
  // 게시글용
  category: z.enum(["FREE", "QA", "FEEDBACK", "NOTICE"]).optional(),
  // 튜토리얼용
  tutorialType: z.enum(["TUTORIAL", "MAKING", "TIPS", "EXTERNAL"]).optional(),
  description: z.string().max(500).optional(),
  thumbnail: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  externalUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  // 공통
  publishNow: z.boolean().default(true),
  scheduledAt: z.string().datetime().optional(),
  // API 키 인증 (MCP 연동용)
  apiKey: z.string().optional(),
});

// 내부 API 키 검증
function validateInternalApiKey(apiKey: string | undefined): boolean {
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) return false;
  return apiKey === internalKey;
}

// POST /api/content/auto - 자동 콘텐츠 발행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = autoPublishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "유효하지 않은 요청입니다", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 인증 확인 (세션 또는 API 키)
    let userId: string | undefined;

    // 1. API 키 인증 (MCP/외부 서비스용)
    if (data.apiKey && validateInternalApiKey(data.apiKey)) {
      // 시스템 계정 사용 (환경변수에서 설정)
      const systemEmail = process.env.SYSTEM_USER_EMAIL;
      if (systemEmail) {
        const systemUser = await prisma.user.findUnique({
          where: { email: systemEmail },
          select: { id: true },
        });
        userId = systemUser?.id;
      }
    }

    // 2. 세션 인증 (일반 사용자)
    if (!userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "인증이 필요합니다" },
          { status: 401 }
        );
      }
      userId = session.user.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "유효한 사용자를 찾을 수 없습니다" },
        { status: 401 }
      );
    }

    // 게시글 발행
    if (data.type === "post") {
      if (!data.category) {
        return NextResponse.json(
          { error: "게시글 카테고리가 필요합니다" },
          { status: 400 }
        );
      }

      const post = await prisma.post.create({
        data: {
          title: data.title,
          content: data.content,
          category: data.category,
          authorId: userId,
          // 예약 발행 처리
          ...(data.scheduledAt && !data.publishNow
            ? { scheduledAt: new Date(data.scheduledAt), isPublished: false }
            : { isPublished: true }),
        },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        type: "post",
        id: post.id,
        title: post.title,
        url: `/community/${post.id}`,
        isPublished: data.publishNow,
        scheduledAt: data.scheduledAt,
      });
    }

    // 튜토리얼 발행
    if (data.type === "tutorial") {
      if (!data.tutorialType) {
        return NextResponse.json(
          { error: "튜토리얼 타입이 필요합니다" },
          { status: 400 }
        );
      }

      // 슬러그 생성 함수
      const generateSlug = (title: string): string => {
        const base = title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 50);
        const timestamp = Date.now().toString(36);
        return `${base}-${timestamp}`;
      };

      const slug = generateSlug(data.title);

      const tutorial = await prisma.tutorial.create({
        data: {
          title: data.title,
          slug,
          description: data.description || data.content.slice(0, 200),
          content: data.content,
          type: data.tutorialType,
          thumbnail: data.thumbnail,
          videoUrl: data.videoUrl,
          externalUrl: data.externalUrl,
          tags: data.tags || [],
          authorId: userId,
          isPublished: data.publishNow,
          publishedAt: data.publishNow ? new Date() : undefined,
        },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        type: "tutorial",
        id: tutorial.id,
        title: tutorial.title,
        slug: tutorial.slug,
        url: `/education/${tutorial.id}`,
        isPublished: data.publishNow,
        scheduledAt: data.scheduledAt,
      });
    }

    return NextResponse.json(
      { error: "지원하지 않는 콘텐츠 타입입니다" },
      { status: 400 }
    );
  } catch (error) {
    console.error("자동 발행 오류:", error);
    return NextResponse.json(
      { error: "콘텐츠 발행에 실패했습니다" },
      { status: 500 }
    );
  }
}

// GET /api/content/auto - 발행된 콘텐츠 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const results: {
      posts: unknown[];
      tutorials: unknown[];
    } = {
      posts: [],
      tutorials: [],
    };

    // 게시글 조회
    if (type === "all" || type === "post") {
      results.posts = await prisma.post.findMany({
        where: { authorId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: type === "all" ? Math.floor(limit / 2) : limit,
        select: {
          id: true,
          title: true,
          category: true,
          createdAt: true,
          viewCount: true,
          likeCount: true,
        },
      });
    }

    // 튜토리얼 조회
    if (type === "all" || type === "tutorial") {
      results.tutorials = await prisma.tutorial.findMany({
        where: { authorId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: type === "all" ? Math.floor(limit / 2) : limit,
        select: {
          id: true,
          title: true,
          type: true,
          isPublished: true,
          createdAt: true,
          viewCount: true,
        },
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("콘텐츠 조회 오류:", error);
    return NextResponse.json(
      { error: "콘텐츠 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
