import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// 게시글 생성 스키마
const createPostSchema = z.object({
  title: z.string().min(2, "제목은 2자 이상이어야 합니다").max(200),
  content: z.string().min(10, "내용은 10자 이상이어야 합니다"),
  category: z.enum(["FREE", "QA", "FEEDBACK", "NOTICE"]),
});

// 게시글 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    
    // 페이지네이션 파라미터 유효성 검사
    const page = parseInt(pageParam || "1");
    const limit = parseInt(limitParam || "20");
    
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
    
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "latest"; // latest, popular, views

    const where: Record<string, unknown> = {
      isDeleted: false,
    };

    if (category && category !== "all") {
      where.category = category.toUpperCase();
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    // 정렬
    let orderBy: Record<string, unknown>[] = [
      { isPinned: "desc" },
      { createdAt: "desc" },
    ];

    switch (sort) {
      case "popular":
        orderBy = [{ isPinned: "desc" }, { likeCount: "desc" }, { createdAt: "desc" }];
        break;
      case "views":
        orderBy = [{ isPinned: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }];
        break;
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              isSeller: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts: posts.map((post) => ({
        ...post,
        commentCount: post._count.comments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Posts GET error:", error);
    return NextResponse.json(
      { error: "게시글 목록을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 게시글 생성 (POST)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, content, category } = validation.data;

    // 공지사항은 관리자만 작성 가능 (향후 role 추가 시 활성화)
    // if (category === "NOTICE" && session.user.role !== "ADMIN") {
    //   return NextResponse.json(
    //     { error: "공지사항은 관리자만 작성할 수 있습니다" },
    //     { status: 403 }
    //   );
    // }

    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        title,
        content,
        category,
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

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Post create error:", error);
    return NextResponse.json(
      { error: "게시글 작성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
