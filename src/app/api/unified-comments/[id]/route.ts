import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// PATCH /api/unified-comments/[id] - 댓글 수정
export async function PATCH(
  request: NextRequest,
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
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "내용을 입력해주세요." },
        { status: 400 }
      );
    }

    // 댓글 존재 여부 및 권한 확인
    const comment = await prisma.unifiedComment.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 댓글 수정
    const updatedComment = await prisma.unifiedComment.update({
      where: { id },
      data: { content: content.trim() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // author 필드명으로 응답 변환
    return NextResponse.json({
      success: true,
      comment: {
        ...updatedComment,
        author: updatedComment.user,
      },
    });
  } catch (error) {
    console.error("댓글 수정 오류:", error);
    return NextResponse.json(
      { error: "댓글 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/unified-comments/[id] - 댓글 삭제
export async function DELETE(
  request: NextRequest,
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

    // 댓글 존재 여부 및 권한 확인
    const comment = await prisma.unifiedComment.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 작성자 또는 관리자만 삭제 가능
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN";

    if (comment.userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 대댓글도 함께 삭제 (cascade)
    await prisma.unifiedComment.deleteMany({
      where: {
        OR: [
          { id },
          { parentId: id },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: "댓글이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    return NextResponse.json(
      { error: "댓글 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
