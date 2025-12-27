/**
 * 관리자 신고 상세/처리 API
 * GET /api/admin/reports/[id] - 신고 상세 조회
 * PUT /api/admin/reports/[id] - 신고 처리
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReportById, processReport } from "@/lib/trust-safety";
import { ReportStatus, SanctionType } from "@prisma/client";

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
    const report = await getReportById(id);

    if (!report) {
      return NextResponse.json(
        { error: "신고를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json(
      { error: "신고 조회 중 오류가 발생했습니다." },
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
    const { status, reviewNote, actionTaken, sanctionType, sanctionDuration } = body;

    // 유효성 검사
    const validStatuses: ReportStatus[] = [
      "REVIEWING", "AWAITING_RESPONSE", "RESOLVED", "DISMISSED", "ON_HOLD"
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "유효하지 않은 상태입니다." },
        { status: 400 }
      );
    }

    if (sanctionType) {
      const validSanctionTypes: SanctionType[] = [
        "WARNING", "CONTENT_REMOVAL", "FEATURE_RESTRICTION",
        "TEMPORARY_SUSPENSION", "PERMANENT_BAN"
      ];
      if (!validSanctionTypes.includes(sanctionType)) {
        return NextResponse.json(
          { error: "유효하지 않은 제재 유형입니다." },
          { status: 400 }
        );
      }
    }

    const report = await processReport(id, session.user.id, {
      status,
      reviewNote,
      actionTaken,
      sanctionType,
      sanctionDuration,
    });

    return NextResponse.json({
      success: true,
      data: report,
      message: "신고가 처리되었습니다.",
    });
  } catch (error) {
    console.error("Report process error:", error);
    const message = error instanceof Error ? error.message : "신고 처리 중 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
