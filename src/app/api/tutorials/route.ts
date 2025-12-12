import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { generateTutorialMetaDescription, generateTutorialKeywords } from "@/lib/seo-utils";

export const dynamic = 'force-dynamic';

// GET: 튜토리얼 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // TUTORIAL, MAKING, TIPS, EXTERNAL
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const myOnly = searchParams.get("myOnly"); // 내 튜토리얼만 조회
    
    // 페이지네이션 파라미터 유효성 검사
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "Invalid page parameter. Page must be a positive integer." },
        { status: 400 }
      );
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit parameter. Limit must be between 1 and 100." },
        { status: 400 }
      );
    }
    
    const skip = (page - 1) * limit;

    // 필터 조건
    const where: Record<string, unknown> = {};

    // myOnly가 true이면 현재 사용자의 튜토리얼만 조회 (비공개 포함)
    if (myOnly === "true") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "로그인이 필요합니다" },
          { status: 401 }
        );
      }
      where.authorId = session.user.id;
    } else {
      // 일반 조회는 공개된 튜토리얼만
      where.isPublished = true;
    }

    if (type && type !== "all") {
      where.type = type.toUpperCase();
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    // 튜토리얼 목록 조회
    const [tutorials, total] = await Promise.all([
      prisma.tutorial.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.tutorial.count({ where }),
    ]);

    // 응답 형식 변환
    const formattedTutorials = tutorials.map((tutorial) => ({
      id: tutorial.id,
      title: tutorial.title,
      slug: tutorial.slug,
      description: tutorial.description,
      type: tutorial.type.toLowerCase(),
      thumbnail: tutorial.thumbnail,
      videoUrl: tutorial.videoUrl,
      externalUrl: tutorial.externalUrl,
      duration: tutorial.duration ? `${tutorial.duration}분` : null,
      tags: tutorial.tags,
      isFeatured: tutorial.isFeatured,
      viewCount: tutorial.viewCount,
      likeCount: tutorial._count.likes,
      author: {
        id: tutorial.author.id,
        name: tutorial.author.name || "익명",
        avatar: tutorial.author.image,
      },
      createdAt: tutorial.createdAt.toISOString(),
    }));

    return NextResponse.json({
      tutorials: formattedTutorials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("튜토리얼 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "튜토리얼 목록을 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 튜토리얼 작성
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      content,
      type,
      thumbnail,
      videoUrl,
      externalUrl,
      duration,
      tags,
    } = body;

    if (!title || !description || !content) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요" },
        { status: 400 }
      );
    }

    // 슬러그 생성 및 고유성 보장
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 100);
    
    let slug = baseSlug;
    let counter = 0;
    
    // 슬러그 고유성 확인
    while (await prisma.tutorial.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // SEO 메타데이터 자동 생성
    const tutorialType = (type?.toUpperCase() || "TUTORIAL") as "TUTORIAL" | "MAKING" | "TIPS" | "EXTERNAL";
    const tutorialTags = tags || [];
    const metaDescription = generateTutorialMetaDescription(
      title,
      description,
      tutorialType,
      tutorialTags
    );
    const keywords = generateTutorialKeywords(title, description, tutorialType, tutorialTags);

    const tutorial = await prisma.tutorial.create({
      data: {
        authorId: session.user.id,
        title,
        slug,
        description,
        content,
        metaDescription,
        keywords,
        type: tutorialType,
        thumbnail,
        videoUrl,
        externalUrl,
        duration: duration ? parseInt(duration) : null,
        tags: tutorialTags,
        isPublished: true, // 바로 게시
        publishedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      tutorial: {
        id: tutorial.id,
        title: tutorial.title,
        slug: tutorial.slug,
        description: tutorial.description,
        type: tutorial.type.toLowerCase(),
        author: {
          id: tutorial.author.id,
          name: tutorial.author.name || "익명",
          avatar: tutorial.author.image,
        },
        createdAt: tutorial.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("튜토리얼 작성 오류:", error);
    return NextResponse.json(
      { error: "튜토리얼 작성에 실패했습니다" },
      { status: 500 }
    );
  }
}
