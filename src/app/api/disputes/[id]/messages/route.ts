/**
 * 분쟁 메시지 API
 * POST /api/disputes/[id]/messages - 메시지 전송
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendDisputeMessage } from "@/lib/trust-safety";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { content, attachments } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "메시지 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const message = await sendDisputeMessage(
      id,
      session.user.id,
      content,
      attachments
    );

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Dispute message error:", error);
    const message = error instanceof Error ? error.message : "메시지 전송 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
