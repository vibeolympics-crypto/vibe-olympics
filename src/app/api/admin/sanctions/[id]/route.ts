/**
 * 관리자 제재 상세/관리 API
 * GET /api/admin/sanctions/[id] - 제재 상세 조회
 * PUT /api/admin/sanctions/[id] - 제재 해제
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSanctionById, revokeSanction } from "@/lib/trust-safety";

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
    const sanction = await getSanctionById(id);

    if (!sanction) {
      return NextResponse.json(
        { error: "제재를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sanction,
    });
  } catch (error) {
    console.error("Sanction fetch error:", error);
    return NextResponse.json(
      { error: "제재 조회 중 오류가 발생했습니다." },
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
    const { action, reason } = body;

    if (action === "revoke") {
      if (!reason) {
        return NextResponse.json(
          { error: "해제 사유를 입력해주세요." },
          { status: 400 }
        );
      }

      const sanction = await revokeSanction(id, session.user.id, reason);

      return NextResponse.json({
        success: true,
        data: sanction,
        message: "제재가 해제되었습니다.",
      });
    }

    return NextResponse.json(
      { error: "유효하지 않은 요청입니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Sanction update error:", error);
    const message = error instanceof Error ? error.message : "제재 수정 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
