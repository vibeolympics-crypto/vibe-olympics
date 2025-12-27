/**
 * 분쟁 API
 * POST /api/disputes - 분쟁 생성
 * GET /api/disputes - 내 분쟁 목록 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDispute, getDisputes } from "@/lib/trust-safety";
import { DisputeType, DisputeStatus } from "@prisma/client";

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
    const { purchaseId, type, reason, evidence, requestedAmount } = body;

    // 유효성 검사
    if (!purchaseId || !type || !reason) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    // 분쟁 유형 검증
    const validDisputeTypes: DisputeType[] = [
      "NOT_AS_DESCRIBED", "NOT_DELIVERED", "QUALITY_ISSUE", "REFUND_DISPUTE", "OTHER"
    ];
    if (!validDisputeTypes.includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 분쟁 유형입니다." },
        { status: 400 }
      );
    }

    const dispute = await createDispute({
      purchaseId,
      initiatorId: session.user.id,
      type,
      reason,
      evidence,
      requestedAmount,
    });

    return NextResponse.json({
      success: true,
      data: dispute,
      message: "분쟁이 신청되었습니다.",
    });
  } catch (error) {
    console.error("Dispute creation error:", error);
    const message = error instanceof Error ? error.message : "분쟁 신청 중 오류가 발생했습니다.";
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
    const status = searchParams.get("status") as DisputeStatus | null;

    const disputes = await getDisputes({
      userId: session.user.id,
      status: status ?? undefined,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: disputes,
    });
  } catch (error) {
    console.error("Disputes fetch error:", error);
    return NextResponse.json(
      { error: "분쟁 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
