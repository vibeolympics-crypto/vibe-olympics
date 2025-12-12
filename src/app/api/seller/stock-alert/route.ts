/**
 * 재고/한정 판매 알림 API
 * GET - 재고 현황 조회
 * POST - 수동 재고 체크 및 알림 발송
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getStockSummary,
  checkAllStockAlerts,
  STOCK_ALERT_THRESHOLDS,
} from "@/lib/stock-alert";

export const dynamic = "force-dynamic";

// GET: 재고 현황 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    // 관리자가 아니면 자신의 재고만 조회 가능
    const targetSellerId = session.user.role === "ADMIN" && sellerId
      ? sellerId
      : session.user.id;

    // 판매자 권한 체크
    const isSeller = (session.user as { isSeller?: boolean })?.isSeller ?? false;
    if (session.user.role !== "ADMIN" && !isSeller) {
      return NextResponse.json(
        { error: "판매자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const summary = await getStockSummary(targetSellerId);

    return NextResponse.json({
      success: true,
      thresholds: STOCK_ALERT_THRESHOLDS,
      data: summary,
    });
  } catch (error) {
    console.error("Stock alert fetch error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 수동 재고 체크 및 알림 발송 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자 전용
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "checkAll") {
      const result = await checkAllStockAlerts();
      return NextResponse.json({
        success: true,
        message: `${result.checked}개 상품 체크, ${result.alerts}개 알림 발송`,
        result,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Stock alert check error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
