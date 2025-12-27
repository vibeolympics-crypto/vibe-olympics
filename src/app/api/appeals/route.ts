/**
 * 이의 신청 API
 * POST /api/appeals - 이의 신청 생성
 * GET /api/appeals - 내 이의 신청 목록 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAppeal, getAppeals } from "@/lib/trust-safety";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sanctionId, reason, evidence } = body;

    // 유효성 검사
    if (!sanctionId || !reason) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    if (reason.length < 50) {
      return NextResponse.json(
        { error: "이의 신청 사유는 50자 이상 입력해주세요." },
        { status: 400 }
      );
    }

    const appeal = await createAppeal({
      sanctionId,
      userId: session.user.id,
      reason,
      evidence,
    });

    return NextResponse.json({
      success: true,
      data: appeal,
      message: "이의 신청이 접수되었습니다.",
    });
  } catch (error) {
    console.error("Appeal creation error:", error);
    const message = error instanceof Error ? error.message : "이의 신청 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const appeals = await getAppeals({
      userId: session.user.id,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: appeals,
    });
  } catch (error) {
    console.error("Appeals fetch error:", error);
    return NextResponse.json(
      { error: "이의 신청 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
