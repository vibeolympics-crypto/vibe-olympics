/**
 * 관리자 이의 신청 상세/처리 API
 * GET /api/admin/appeals/[id] - 이의 신청 상세 조회
 * PUT /api/admin/appeals/[id] - 이의 신청 처리
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAppealById, processAppeal } from "@/lib/trust-safety";
import { AppealResult, SanctionType } from "@prisma/client";

export async function GET(
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const appeal = await getAppealById(id);

    if (!appeal) {
      return NextResponse.json(
        { error: "이의 신청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appeal,
    });
  } catch (error) {
    console.error("Appeal fetch error:", error);
    return NextResponse.json(
      { error: "이의 신청 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { result, note, newSanctionType, newDuration } = body;

    // 유효성 검사
    const validResults: AppealResult[] = [
      "FULL_REVERSAL", "PARTIAL_REVERSAL", "REJECTED"
    ];
    if (!validResults.includes(result)) {
      return NextResponse.json(
        { error: "유효하지 않은 판정 결과입니다." },
        { status: 400 }
      );
    }

    // 일부 인용 시 새 제재 유형 필수
    if (result === "PARTIAL_REVERSAL") {
      if (newSanctionType) {
        const validTypes: SanctionType[] = [
          "WARNING", "CONTENT_REMOVAL", "FEATURE_RESTRICTION",
          "TEMPORARY_SUSPENSION"
        ];
        if (!validTypes.includes(newSanctionType)) {
          return NextResponse.json(
            { error: "유효하지 않은 제재 유형입니다." },
            { status: 400 }
          );
        }
      }
    }

    const appeal = await processAppeal(id, session.user.id, {
      result,
      note,
      newSanctionType,
      newDuration,
    });

    const resultLabels: Record<AppealResult, string> = {
      FULL_REVERSAL: "전부 인용",
      PARTIAL_REVERSAL: "일부 인용",
      REJECTED: "기각",
    };

    return NextResponse.json({
      success: true,
      data: appeal,
      message: `이의 신청이 ${resultLabels[result]} 처리되었습니다.`,
    });
  } catch (error) {
    console.error("Appeal process error:", error);
    const message = error instanceof Error ? error.message : "이의 신청 처리 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
