import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { TargetType, ReactionType } from "@prisma/client";

// GET: 튜토리얼 상세 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tutorial = await prisma.tutorial.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!tutorial) {
      return NextResponse.json(
        { error: "튜토리얼을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 조회수 증가
    await prisma.tutorial.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // 현재 사용자의 좋아요 여부 확인 (Reaction 시스템)
    let isLiked = false;
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const reaction = await prisma.reaction.findUnique({
        where: {
          userId_targetType_targetId_type: {
            userId: session.user.id,
            targetType: TargetType.TUTORIAL,
            targetId: id,
            type: ReactionType.LIKE,
          },
        },
      });
      isLiked = !!reaction;
    }

    return NextResponse.json({
      tutorial: {
        id: tutorial.id,
        title: tutorial.title,
        slug: tutorial.slug,
        description: tutorial.description,
        content: tutorial.content,
        type: tutorial.type.toLowerCase(),
        thumbnail: tutorial.thumbnail,
        videoUrl: tutorial.videoUrl,
        externalUrl: tutorial.externalUrl,
        duration: tutorial.duration ? `${tutorial.duration}분` : null,
        tags: tutorial.tags,
        isFeatured: tutorial.isFeatured,
        viewCount: tutorial.viewCount + 1,
        likeCount: tutorial._count.likes,
        isLiked,
        author: {
          id: tutorial.author.id,
          name: tutorial.author.name || "익명",
          avatar: tutorial.author.image,
          bio: tutorial.author.bio,
        },
        createdAt: tutorial.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("튜토리얼 상세 조회 오류:", error);
    return NextResponse.json(
      { error: "튜토리얼을 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 튜토리얼 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // 튜토리얼 작성자 확인
    const tutorial = await prisma.tutorial.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!tutorial) {
      return NextResponse.json(
        { error: "튜토리얼을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (tutorial.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다" },
        { status: 403 }
      );
    }

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

    const updated = await prisma.tutorial.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(content && { content }),
        ...(type && { type: type.toUpperCase() }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(externalUrl !== undefined && { externalUrl }),
        ...(duration !== undefined && { duration: duration ? parseInt(duration) : null }),
        ...(tags && { tags }),
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
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        description: updated.description,
        type: updated.type.toLowerCase(),
        author: {
          id: updated.author.id,
          name: updated.author.name || "익명",
          avatar: updated.author.image,
        },
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("튜토리얼 수정 오류:", error);
    return NextResponse.json(
      { error: "튜토리얼 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 튜토리얼 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 튜토리얼 작성자 확인
    const tutorial = await prisma.tutorial.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!tutorial) {
      return NextResponse.json(
        { error: "튜토리얼을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (tutorial.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다" },
        { status: 403 }
      );
    }

    await prisma.tutorial.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("튜토리얼 삭제 오류:", error);
    return NextResponse.json(
      { error: "튜토리얼 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
