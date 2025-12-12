/**
 * 프로모션 스케줄러 API
 * GET - 프로모션 목록/상세 조회
 * POST - 프로모션 생성
 * PATCH - 프로모션 취소
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createPromotion,
  cancelPromotion,
  getPromotions,
  getPromotion,
  getPromotionSummary,
  processScheduledPromotions,
  PromotionType,
} from "@/lib/promotion-scheduler";

export const dynamic = "force-dynamic";

// GET: 프로모션 목록/상세 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const promotionId = searchParams.get("id");
    const action = searchParams.get("action");

    // 판매자 권한 체크
    const isSeller = (session.user as { isSeller?: boolean })?.isSeller ?? false;
    if (session.user.role !== "ADMIN" && !isSeller) {
      return NextResponse.json(
        { error: "판매자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 요약 통계 조회
    if (action === "summary") {
      const summary = getPromotionSummary(session.user.id);
      return NextResponse.json({ success: true, data: summary });
    }

    // 단일 프로모션 조회
    if (promotionId) {
      const promotion = getPromotion(promotionId);
      if (!promotion) {
        return NextResponse.json(
          { error: "프로모션을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      // 본인 프로모션인지 확인
      if (session.user.role !== "ADMIN" && promotion.sellerId !== session.user.id) {
        return NextResponse.json(
          { error: "접근 권한이 없습니다." },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, data: promotion });
    }

    // 목록 조회
    const promotions = getPromotions(session.user.id);
    return NextResponse.json({ success: true, data: promotions });
  } catch (error) {
    console.error("Promotion fetch error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 프로모션 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 판매자 권한 체크
    const isSeller = (session.user as { isSeller?: boolean })?.isSeller ?? false;
    if (session.user.role !== "ADMIN" && !isSeller) {
      return NextResponse.json(
        { error: "판매자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // 관리자 전용: 예약 프로모션 처리
    if (action === "process") {
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "관리자 권한이 필요합니다." },
          { status: 403 }
        );
      }

      const result = await processScheduledPromotions();
      return NextResponse.json({
        success: true,
        message: `${result.started}개 시작, ${result.ended}개 종료`,
        result,
      });
    }

    // 프로모션 생성
    const { name, description, type, discountType, discountValue, productIds, startDate, endDate } = body;

    if (!name || !type || !discountType || discountValue === undefined || !productIds || !startDate || !endDate) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const promotion = await createPromotion({
      sellerId: session.user.id,
      name,
      description,
      type: type as PromotionType,
      discountType,
      discountValue: Number(discountValue),
      productIds,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    return NextResponse.json({
      success: true,
      message: "프로모션이 생성되었습니다.",
      data: promotion,
    });
  } catch (error) {
    console.error("Promotion create error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// PATCH: 프로모션 취소
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { promotionId, action } = body;

    if (!promotionId) {
      return NextResponse.json(
        { error: "프로모션 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (action === "cancel") {
      await cancelPromotion(promotionId, session.user.id);
      return NextResponse.json({
        success: true,
        message: "프로모션이 취소되었습니다.",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Promotion cancel error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
