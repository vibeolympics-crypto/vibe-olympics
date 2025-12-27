/**
 * 분쟁 상세 API
 * GET /api/disputes/[id] - 분쟁 상세 조회
 * POST /api/disputes/[id] - 중재 요청
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDisputeById, requestMediation } from "@/lib/trust-safety";

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

    const { id } = await params;
    const dispute = await getDisputeById(id);

    if (!dispute) {
      return NextResponse.json(
        { error: "분쟁을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 당사자 또는 관리자만 조회 가능
    const isParty = dispute.initiatorId === session.user.id ||
                    dispute.respondentId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isParty && !isAdmin) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dispute,
    });
  } catch (error) {
    console.error("Dispute fetch error:", error);
    return NextResponse.json(
      { error: "분쟁 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

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
    const { action } = body;

    if (action === "request_mediation") {
      const dispute = await requestMediation(id, session.user.id);
      return NextResponse.json({
        success: true,
        data: dispute,
        message: "중재가 요청되었습니다.",
      });
    }

    return NextResponse.json(
      { error: "유효하지 않은 액션입니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Dispute action error:", error);
    const message = error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
