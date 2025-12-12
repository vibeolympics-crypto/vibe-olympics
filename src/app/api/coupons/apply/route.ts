/**
 * 쿠폰 적용 API
 * POST: 쿠폰 적용 (할인 금액 계산)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { code, orderAmount, productId, bundleId, sellerId } = body;

    if (!code) {
      return NextResponse.json(
        { error: "쿠폰 코드가 필요합니다." },
        { status: 400 }
      );
    }

    if (!orderAmount || orderAmount <= 0) {
      return NextResponse.json(
        { error: "유효한 주문 금액이 필요합니다." },
        { status: 400 }
      );
    }

    // 쿠폰 조회
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "존재하지 않는 쿠폰입니다." },
        { status: 404 }
      );
    }

    // 유효성 검사
    const now = new Date();

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "비활성화된 쿠폰입니다." },
        { status: 400 }
      );
    }

    if (coupon.startDate && coupon.startDate > now) {
      return NextResponse.json(
        { error: "아직 사용할 수 없는 쿠폰입니다." },
        { status: 400 }
      );
    }

    if (coupon.endDate && coupon.endDate < now) {
      return NextResponse.json(
        { error: "만료된 쿠폰입니다." },
        { status: 400 }
      );
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "소진된 쿠폰입니다." },
        { status: 400 }
      );
    }

    // 유저당 사용 횟수 확인
    if (coupon.usageLimitPerUser) {
      const userUsageCount = await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId: session.user.id,
        },
      });

      if (userUsageCount >= coupon.usageLimitPerUser) {
        return NextResponse.json(
          { error: "이미 사용한 쿠폰입니다." },
          { status: 400 }
        );
      }
    }

    // 최소 주문 금액 확인
    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      return NextResponse.json(
        { 
          error: `최소 주문 금액은 ${Number(coupon.minOrderAmount).toLocaleString()}원입니다.`,
          minOrderAmount: Number(coupon.minOrderAmount),
        },
        { status: 400 }
      );
    }

    // 적용 대상 확인
    if (coupon.applicableType !== "ALL") {
      const applicableIds = coupon.applicableIds || [];

      switch (coupon.applicableType) {
        case "PRODUCTS":
          if (productId && !applicableIds.includes(productId)) {
            return NextResponse.json(
              { error: "이 상품에는 적용할 수 없는 쿠폰입니다." },
              { status: 400 }
            );
          }
          break;

        case "SELLER":
          if (sellerId && !applicableIds.includes(sellerId)) {
            return NextResponse.json(
              { error: "이 판매자의 상품에는 적용할 수 없는 쿠폰입니다." },
              { status: 400 }
            );
          }
          break;

        case "CATEGORIES":
          // 상품의 카테고리 확인
          if (productId) {
            const product = await prisma.product.findUnique({
              where: { id: productId },
              select: { categoryId: true },
            });

            if (product && !applicableIds.includes(product.categoryId)) {
              return NextResponse.json(
                { error: "이 카테고리에는 적용할 수 없는 쿠폰입니다." },
                { status: 400 }
              );
            }
          }
          break;
      }
    }

    // 판매자 쿠폰인 경우 해당 판매자 상품에만 적용 가능
    if (coupon.sellerId && sellerId && coupon.sellerId !== sellerId) {
      return NextResponse.json(
        { error: "이 판매자의 상품에는 적용할 수 없는 쿠폰입니다." },
        { status: 400 }
      );
    }

    // 할인 금액 계산
    let discountAmount: number;

    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = Math.floor(orderAmount * (Number(coupon.discountValue) / 100));
      
      // 최대 할인 금액 적용
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
      }
    } else {
      // FIXED_AMOUNT
      discountAmount = Math.min(Number(coupon.discountValue), orderAmount);
    }

    const finalAmount = orderAmount - discountAmount;

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      orderAmount,
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return NextResponse.json(
      { error: "쿠폰 적용에 실패했습니다." },
      { status: 500 }
    );
  }
}
