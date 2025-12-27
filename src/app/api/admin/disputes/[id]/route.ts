/**
 * 관리자 분쟁 상세/처리 API
 * GET /api/admin/disputes/[id] - 분쟁 상세 조회
 * PUT /api/admin/disputes/[id] - 분쟁 처리 (중재/판정)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDisputeById, resolveDispute } from "@/lib/trust-safety";
import { prisma } from "@/lib/prisma";
import { DisputeResolution } from "@prisma/client";

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
    const dispute = await getDisputeById(id);

    if (!dispute) {
      return NextResponse.json(
        { error: "분쟁을 찾을 수 없습니다." },
        { status: 404 }
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
    const { action, status, resolution, note, amount, mediationNote, mediationProposal } = body;

    // 중재 시작
    if (action === "start_mediation") {
      const dispute = await prisma.dispute.update({
        where: { id },
        data: {
          status: "IN_MEDIATION",
          mediatorId: session.user.id,
          mediationNote,
        },
      });

      return NextResponse.json({
        success: true,
        data: dispute,
        message: "중재가 시작되었습니다.",
      });
    }

    // 중재안 제시
    if (action === "propose_mediation") {
      const dispute = await prisma.dispute.update({
        where: { id },
        data: {
          mediationProposal,
          mediationNote,
        },
      });

      return NextResponse.json({
        success: true,
        data: dispute,
        message: "중재안이 제시되었습니다.",
      });
    }

    // 판정
    if (action === "resolve") {
      const validResolutions: DisputeResolution[] = [
        "BUYER_WIN", "SELLER_WIN", "MUTUAL_AGREEMENT", "PARTIAL_REFUND", "DISMISSED"
      ];
      if (!validResolutions.includes(resolution)) {
        return NextResponse.json(
          { error: "유효하지 않은 판정 결과입니다." },
          { status: 400 }
        );
      }

      const dispute = await resolveDispute(id, session.user.id, {
        result: resolution,
        note,
        amount,
      });

      return NextResponse.json({
        success: true,
        data: dispute,
        message: "분쟁이 해결되었습니다.",
      });
    }

    // 상태 변경
    if (status) {
      const dispute = await prisma.dispute.update({
        where: { id },
        data: { status },
      });

      return NextResponse.json({
        success: true,
        data: dispute,
        message: "분쟁 상태가 변경되었습니다.",
      });
    }

    return NextResponse.json(
      { error: "유효하지 않은 요청입니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Dispute process error:", error);
    const message = error instanceof Error ? error.message : "분쟁 처리 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
