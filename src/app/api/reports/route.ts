/**
 * 신고 API
 * POST /api/reports - 신고 생성
 * GET /api/reports - 내 신고 목록 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createReport, getReports } from "@/lib/trust-safety";
import { ReportTargetType, ReportType } from "@prisma/client";

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
    const { targetType, targetId, type, reason, evidence } = body;

    // 유효성 검사
    if (!targetType || !targetId || !type || !reason) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    // 신고 유형 검증
    const validTargetTypes: ReportTargetType[] = [
      "USER", "PRODUCT", "REVIEW", "POST", "COMMENT", "MESSAGE"
    ];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: "유효하지 않은 신고 대상입니다." },
        { status: 400 }
      );
    }

    const validReportTypes: ReportType[] = [
      "FRAUD", "COPYRIGHT", "INAPPROPRIATE", "HARASSMENT",
      "SPAM", "DIRECT_TRADE", "QUALITY", "OTHER"
    ];
    if (!validReportTypes.includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 신고 유형입니다." },
        { status: 400 }
      );
    }

    const report = await createReport({
      reporterId: session.user.id,
      targetType,
      targetId,
      type,
      reason,
      evidence,
    });

    return NextResponse.json({
      success: true,
      data: report,
      message: "신고가 접수되었습니다.",
    });
  } catch (error) {
    console.error("Report creation error:", error);
    const message = error instanceof Error ? error.message : "신고 접수 중 오류가 발생했습니다.";
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

    // 일반 사용자는 본인이 제출한 신고만 조회 가능
    // 관리자는 getReports를 통해 전체 조회
    const reports = await getReports({
      page,
      limit,
    });

    // 본인이 제출한 신고만 필터링
    const myReports = {
      ...reports,
      items: reports.items.filter(r => r.reporterId === session.user.id),
    };

    return NextResponse.json({
      success: true,
      data: myReports,
    });
  } catch (error) {
    console.error("Reports fetch error:", error);
    return NextResponse.json(
      { error: "신고 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
