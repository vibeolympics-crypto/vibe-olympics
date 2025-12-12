import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TargetType } from "@prisma/client";

export const dynamic = 'force-dynamic';

// GET: 특정 콘텐츠의 댓글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType") as TargetType;
    const targetId = searchParams.get("targetId");
    const parentId = searchParams.get("parentId"); // 대댓글 조회용
    
    // 페이지네이션 파라미터 유효성 검사
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    
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

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "targetType과 targetId가 필요합니다" },
        { status: 400 }
      );
    }

    // 유효한 TargetType인지 확인
    if (!Object.values(TargetType).includes(targetType)) {
      return NextResponse.json(
        { error: "유효하지 않은 targetType입니다" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // 댓글 조회 (최상위 댓글 또는 특정 댓글의 대댓글)
    const whereClause = {
      targetType,
      targetId,
      parentId: parentId || null, // null이면 최상위 댓글만
    };

    const [comments, totalCount] = await Promise.all([
      prisma.unifiedComment.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          // 대댓글 수 카운트
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.unifiedComment.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        user: comment.user,
        replyCount: comment._count.replies,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("댓글 조회 오류:", error);
    return NextResponse.json(
      { error: "댓글을 조회하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 댓글 작성
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
    const { targetType, targetId, content, parentId } = body;

    // 필수 필드 확인
    if (!targetType || !targetId || !content) {
      return NextResponse.json(
        { error: "targetType, targetId, content가 필요합니다" },
        { status: 400 }
      );
    }

    // 유효한 TargetType인지 확인
    if (!Object.values(TargetType).includes(targetType)) {
      return NextResponse.json(
        { error: "유효하지 않은 targetType입니다" },
        { status: 400 }
      );
    }

    // 내용 길이 확인
    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: "댓글 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "댓글은 2000자 이하로 작성해주세요" },
        { status: 400 }
      );
    }

    // 대댓글인 경우 부모 댓글 존재 확인
    if (parentId) {
      const parentComment = await prisma.unifiedComment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "원본 댓글을 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      // 대댓글의 대댓글은 허용하지 않음 (1단계 대댓글만)
      if (parentComment.parentId) {
        return NextResponse.json(
          { error: "대댓글에는 답글을 달 수 없습니다" },
          { status: 400 }
        );
      }
    }

    const comment = await prisma.unifiedComment.create({
      data: {
        userId: session.user.id,
        targetType,
        targetId,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        user: comment.user,
        replyCount: comment._count.replies,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    });
  } catch (error) {
    console.error("댓글 작성 오류:", error);
    return NextResponse.json(
      { error: "댓글을 작성하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 댓글 수정
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { commentId, content } = body;

    if (!commentId || !content) {
      return NextResponse.json(
        { error: "commentId와 content가 필요합니다" },
        { status: 400 }
      );
    }

    // 댓글 조회 및 권한 확인
    const existingComment = await prisma.unifiedComment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (existingComment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "본인의 댓글만 수정할 수 있습니다" },
        { status: 403 }
      );
    }

    // 내용 길이 확인
    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: "댓글 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "댓글은 2000자 이하로 작성해주세요" },
        { status: 400 }
      );
    }

    const updatedComment = await prisma.unifiedComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return NextResponse.json({
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        user: updatedComment.user,
        replyCount: updatedComment._count.replies,
        parentId: updatedComment.parentId,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
      },
    });
  } catch (error) {
    console.error("댓글 수정 오류:", error);
    return NextResponse.json(
      { error: "댓글을 수정하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 댓글 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId가 필요합니다" },
        { status: 400 }
      );
    }

    // 댓글 조회 및 권한 확인
    const existingComment = await prisma.unifiedComment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 본인 또는 관리자만 삭제 가능
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (existingComment.userId !== session.user.id && user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 댓글 삭제 (대댓글도 함께 삭제됨 - onDelete: Cascade)
    await prisma.unifiedComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    return NextResponse.json(
      { error: "댓글을 삭제하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
