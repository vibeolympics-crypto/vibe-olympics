import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { TargetType, ReactionType } from "@prisma/client";

// 게시글 수정 스키마
const updatePostSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  content: z.string().min(10).optional(),
  category: z.enum(["FREE", "QA", "FEEDBACK", "NOTICE"]).optional(),
});

// 게시글 상세 조회 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const post = await prisma.post.findUnique({
      where: { id, isDeleted: false },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            isSeller: true,
            bio: true,
          },
        },
        comments: {
          where: { isDeleted: false, parentId: null },
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
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 조회수 증가
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // 현재 사용자가 좋아요 했는지 확인 (Reaction 시스템)
    let isLiked = false;
    if (session?.user?.id) {
      const reaction = await prisma.reaction.findUnique({
        where: {
          userId_targetType_targetId_type: {
            userId: session.user.id,
            targetType: TargetType.POST,
            targetId: id,
            type: ReactionType.LIKE,
          },
        },
      });
      isLiked = !!reaction;
    }

    return NextResponse.json({
      post: {
        ...post,
        viewCount: post.viewCount + 1,
        commentCount: post._count.comments,
        likeCount: post._count.likes,
        isLiked,
      },
    });
  } catch (error) {
    console.error("Post GET error:", error);
    return NextResponse.json(
      { error: "게시글을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 게시글 수정 (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updatePostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: validation.data,
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

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Post PATCH error:", error);
    return NextResponse.json(
      { error: "게시글 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 게시글 삭제 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다" },
        { status: 403 }
      );
    }

    // soft delete
    await prisma.post.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ message: "게시글이 삭제되었습니다" });
  } catch (error) {
    console.error("Post DELETE error:", error);
    return NextResponse.json(
      { error: "게시글 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
