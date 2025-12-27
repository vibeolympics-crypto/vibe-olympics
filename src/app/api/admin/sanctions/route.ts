/**
 * 관리자 제재 관리 API
 * GET /api/admin/sanctions - 제재 목록 조회
 * POST /api/admin/sanctions - 제재 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSanctions, createSanction } from "@/lib/trust-safety";
import { SanctionType, SanctionStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") as SanctionType | null;
    const status = searchParams.get("status") as SanctionStatus | null;

    const sanctions = await getSanctions({
      userId: userId ?? undefined,
      type: type ?? undefined,
      status: status ?? undefined,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: sanctions,
    });
  } catch (error) {
    console.error("Sanctions fetch error:", error);
    return NextResponse.json(
      { error: "제재 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { userId, type, reason, evidence, duration, restrictions } = body;

    // 유효성 검사
    if (!userId || !type || !reason) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    const validTypes: SanctionType[] = [
      "WARNING", "CONTENT_REMOVAL", "FEATURE_RESTRICTION",
      "TEMPORARY_SUSPENSION", "PERMANENT_BAN"
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 제재 유형입니다." },
        { status: 400 }
      );
    }

    // 기간 검증 (일시 정지의 경우 필수)
    if (type === "TEMPORARY_SUSPENSION" && !duration) {
      return NextResponse.json(
        { error: "일시 정지의 경우 기간을 입력해주세요." },
        { status: 400 }
      );
    }

    const sanction = await createSanction({
      userId,
      type,
      reason,
      issuedBy: session.user.id,
      evidence,
      duration,
      restrictions,
    });

    return NextResponse.json({
      success: true,
      data: sanction,
      message: "제재가 부과되었습니다.",
    });
  } catch (error) {
    console.error("Sanction creation error:", error);
    const message = error instanceof Error ? error.message : "제재 생성 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
