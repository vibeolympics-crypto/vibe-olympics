import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// 댓글 생성 스키마
const createCommentSchema = z.object({
  content: z.string().min(1, "내용을 입력해주세요").max(1000),
  parentId: z.string().cuid().optional(),
});

// 댓글 목록 조회 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        isDeleted: false,
        parentId: null, // 최상위 댓글만
      },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            isSeller: true,
          },
        },
        replies: {
          where: { isDeleted: false },
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                isSeller: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json(
      { error: "댓글을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 댓글 생성 (POST)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
    });

    if (!post) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content, parentId } = validation.data;

    // 대댓글인 경우 부모 댓글 확인
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId, postId, isDeleted: false },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "부모 댓글을 찾을 수 없습니다" },
          { status: 404 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        authorId: session.user.id,
        postId,
        content,
        parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            isSeller: true,
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Comment create error:", error);
    return NextResponse.json(
      { error: "댓글 작성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 댓글 삭제 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
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
        { error: "댓글 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (comment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다" },
        { status: 403 }
      );
    }

    // soft delete
    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true },
    });

    return NextResponse.json({ message: "댓글이 삭제되었습니다" });
  } catch (error) {
    console.error("Comment DELETE error:", error);
    return NextResponse.json(
      { error: "댓글 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
