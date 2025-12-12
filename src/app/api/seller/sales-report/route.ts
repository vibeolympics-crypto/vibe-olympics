/**
 * 판매 리포트 API
 * GET - 리포트 데이터 조회 (미리보기)
 * POST - 리포트 이메일 발송
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  generateWeeklySalesReport,
  generateMonthlySalesReport,
  sendImmediateSalesReport,
  sendWeeklyReportsToAllSellers,
  sendMonthlyReportsToAllSellers,
} from "@/lib/sales-report";

export const dynamic = "force-dynamic";

// GET: 리포트 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "weekly";
    const sellerId = searchParams.get("sellerId");

    // 관리자가 아니면 자신의 리포트만 조회 가능
    const targetSellerId = session.user.role === "ADMIN" && sellerId
      ? sellerId
      : session.user.id;

    // 판매자 권한 체크
    if (session.user.role !== "ADMIN" && session.user.role !== "SELLER") {
      return NextResponse.json(
        { error: "판매자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    let report;
    if (type === "weekly") {
      report = await generateWeeklySalesReport(targetSellerId);
    } else if (type === "monthly") {
      report = await generateMonthlySalesReport(targetSellerId);
    } else {
      return NextResponse.json(
        { error: "Invalid report type" },
        { status: 400 }
      );
    }

    if (!report) {
      return NextResponse.json(
        { error: "리포트를 생성할 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      type,
      data: report,
    });
  } catch (error) {
    console.error("Sales report fetch error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 리포트 이메일 발송
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, type = "weekly", email } = body;

    // 관리자 전용: 전체 발송
    if (action === "sendAll") {
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "관리자 권한이 필요합니다." },
          { status: 403 }
        );
      }

      const result = type === "weekly"
        ? await sendWeeklyReportsToAllSellers()
        : await sendMonthlyReportsToAllSellers();

      return NextResponse.json({
        success: true,
        message: `${type === "weekly" ? "주간" : "월간"} 리포트 발송 완료`,
        result,
      });
    }

    // 개인 발송
    if (action === "send") {
      // 판매자 권한 체크
      if (session.user.role !== "ADMIN" && session.user.role !== "SELLER") {
        return NextResponse.json(
          { error: "판매자 권한이 필요합니다." },
          { status: 403 }
        );
      }

      const targetEmail = email || session.user.email;
      if (!targetEmail) {
        return NextResponse.json(
          { error: "이메일 주소가 필요합니다." },
          { status: 400 }
        );
      }

      const success = await sendImmediateSalesReport(
        session.user.id,
        targetEmail,
        type
      );

      if (success) {
        return NextResponse.json({
          success: true,
          message: `${type === "weekly" ? "주간" : "월간"} 리포트가 ${targetEmail}로 발송되었습니다.`,
        });
      } else {
        return NextResponse.json(
          { error: "리포트 발송에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Sales report send error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
