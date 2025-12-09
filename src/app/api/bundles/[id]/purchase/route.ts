/**
 * 번들 구매 API
 * POST: 번들 구매 처리
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 번들 구매
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { id: bundleId } = await params;
    const body = await request.json();
    const { paymentMethod, paymentId, couponCode } = body;

    // 번들 조회
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
      include: {
        items: true,
      },
    });

    if (!bundle) {
      return NextResponse.json(
        { error: "번들을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 번들 활성 상태 확인
    const now = new Date();
    if (!bundle.isActive) {
      return NextResponse.json(
        { error: "비활성화된 번들입니다." },
        { status: 400 }
      );
    }

    if (bundle.startDate && bundle.startDate > now) {
      return NextResponse.json(
        { error: "아직 판매가 시작되지 않은 번들입니다." },
        { status: 400 }
      );
    }

    if (bundle.endDate && bundle.endDate < now) {
      return NextResponse.json(
        { error: "판매가 종료된 번들입니다." },
        { status: 400 }
      );
    }

    // 이미 구매한 번들인지 확인
    const existingPurchase = await prisma.bundlePurchase.findUnique({
      where: {
        buyerId_bundleId: {
          buyerId: session.user.id,
          bundleId,
        },
      },
    });

    if (existingPurchase && existingPurchase.status === "COMPLETED") {
      return NextResponse.json(
        { error: "이미 구매한 번들입니다." },
        { status: 400 }
      );
    }

    // 번들 내 상품들 중 이미 구매한 상품이 있는지 확인
    const productIds = bundle.items.map((item) => item.productId);
    const existingProductPurchases = await prisma.purchase.findMany({
      where: {
        buyerId: session.user.id,
        productId: { in: productIds },
        status: "COMPLETED",
      },
      select: { productId: true },
    });

    if (existingProductPurchases.length > 0) {
      return NextResponse.json(
        { 
          error: "번들에 포함된 일부 상품을 이미 구매하셨습니다.",
          alreadyPurchasedProducts: existingProductPurchases.map(p => p.productId),
        },
        { status: 400 }
      );
    }

    let finalAmount = Number(bundle.bundlePrice);
    let couponId: string | null = null;
    let discountAmount = 0;

    // 쿠폰 적용
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (coupon && coupon.isActive) {
        // 쿠폰 유효성 검사
        const couponValid = 
          (!coupon.startDate || coupon.startDate <= now) &&
          (!coupon.endDate || coupon.endDate >= now) &&
          (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
          (!coupon.minOrderAmount || finalAmount >= Number(coupon.minOrderAmount));

        if (couponValid) {
          // 유저 사용 횟수 확인
          if (coupon.usageLimitPerUser) {
            const userUsageCount = await prisma.couponUsage.count({
              where: {
                couponId: coupon.id,
                userId: session.user.id,
              },
            });

            if (userUsageCount >= coupon.usageLimitPerUser) {
              // 쿠폰 사용 불가, 그냥 진행
            } else {
              // 할인 계산
              if (coupon.discountType === "PERCENTAGE") {
                discountAmount = Math.floor(finalAmount * (Number(coupon.discountValue) / 100));
                if (coupon.maxDiscountAmount) {
                  discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
                }
              } else {
                discountAmount = Math.min(Number(coupon.discountValue), finalAmount);
              }

              couponId = coupon.id;
              finalAmount -= discountAmount;
            }
          }
        }
      }
    }

    // 트랜잭션으로 구매 처리
    const result = await prisma.$transaction(async (tx) => {
      // 번들 구매 생성
      const bundlePurchase = await tx.bundlePurchase.create({
        data: {
          buyerId: session.user.id,
          bundleId,
          amount: finalAmount,
          paymentMethod,
          paymentId,
          couponId,
          discountAmount: discountAmount > 0 ? discountAmount : null,
          status: "COMPLETED",
        },
      });

      // 개별 상품 구매 기록 생성
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true },
      });

      for (const product of products) {
        await tx.purchase.create({
          data: {
            buyerId: session.user.id,
            productId: product.id,
            amount: product.price,
            paymentMethod,
            paymentId: bundlePurchase.id, // 번들 구매 ID 참조
            status: "COMPLETED",
          },
        });

        // 상품 판매 수 증가
        await tx.product.update({
          where: { id: product.id },
          data: { salesCount: { increment: 1 } },
        });
      }

      // 번들 판매 수 증가
      await tx.bundle.update({
        where: { id: bundleId },
        data: { salesCount: { increment: 1 } },
      });

      // 쿠폰 사용 기록
      if (couponId) {
        await tx.couponUsage.create({
          data: {
            couponId,
            userId: session.user.id,
            orderId: bundlePurchase.id,
            orderType: "BUNDLE",
            discountAmount,
          },
        });

        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 판매자 통계 업데이트
      await tx.user.update({
        where: { id: bundle.sellerId },
        data: {
          totalSales: { increment: 1 },
          totalRevenue: { increment: finalAmount },
        },
      });

      return bundlePurchase;
    });

    return NextResponse.json({
      message: "번들 구매가 완료되었습니다.",
      purchase: result,
      discount: discountAmount > 0 ? {
        couponCode,
        discountAmount,
      } : null,
    });
  } catch (error) {
    console.error("Error purchasing bundle:", error);
    return NextResponse.json(
      { error: "번들 구매에 실패했습니다." },
      { status: 500 }
    );
  }
}
