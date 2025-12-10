/**
 * 쿠폰 API
 * GET: 쿠폰 목록 조회 / 코드로 쿠폰 조회
 * POST: 쿠폰 생성 (판매자/관리자 전용)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 쿠폰 목록 조회 또는 코드로 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    // 코드로 단일 쿠폰 조회
    const code = searchParams.get("code");
    if (code) {
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

      // 로그인한 경우 사용자 사용 횟수 확인
      if (session?.user?.id && coupon.usageLimitPerUser) {
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

      return NextResponse.json({
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscountAmount: coupon.maxDiscountAmount,
          applicableType: coupon.applicableType,
          endDate: coupon.endDate,
        },
        valid: true,
      });
    }

    // 쿠폰 목록 조회 (판매자/관리자 전용)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const sellerId = searchParams.get("sellerId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const skip = (page - 1) * limit;

    // 관리자가 아니면 본인 쿠폰만 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isSeller: true },
    });

    const where: Prisma.CouponWhereInput = {};

    if (user?.role === "ADMIN") {
      // 관리자는 모든 쿠폰 조회 가능
      if (sellerId) {
        where.sellerId = sellerId;
      }
    } else if (user?.isSeller) {
      // 판매자는 본인 쿠폰 + 플랫폼 쿠폰 조회
      where.OR = [
        { sellerId: session.user.id },
        { sellerId: null },
      ];
    } else {
      // 일반 사용자는 활성 쿠폰만
      where.isActive = true;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    return NextResponse.json({
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "쿠폰을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 쿠폰 생성 (판매자/관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isSeller: true },
    });

    if (!user?.isSeller && user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "판매자 또는 관리자만 쿠폰을 생성할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      discountType = "PERCENTAGE",
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      usageLimitPerUser = 1,
      startDate,
      endDate,
      applicableType = "ALL",
      applicableIds = [],
      isPlatformCoupon = false, // 관리자만 플랫폼 쿠폰 생성 가능
    } = body;

    // 필수 필드 검증
    if (!code || !name || discountValue === undefined) {
      return NextResponse.json(
        { error: "쿠폰 코드, 이름, 할인값은 필수입니다." },
        { status: 400 }
      );
    }

    // 코드 형식 검증
    const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalizedCode.length < 4 || normalizedCode.length > 20) {
      return NextResponse.json(
        { error: "쿠폰 코드는 4~20자의 영문/숫자만 가능합니다." },
        { status: 400 }
      );
    }

    // 중복 코드 확인
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: "이미 존재하는 쿠폰 코드입니다." },
        { status: 400 }
      );
    }

    // 할인값 검증
    if (discountType === "PERCENTAGE" && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json(
        { error: "퍼센트 할인은 1~100 사이여야 합니다." },
        { status: 400 }
      );
    }

    if (discountType === "FIXED_AMOUNT" && discountValue < 100) {
      return NextResponse.json(
        { error: "고정 금액 할인은 최소 100원 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 플랫폼 쿠폰은 관리자만 생성 가능
    const sellerId = isPlatformCoupon && user.role === "ADMIN" ? null : session.user.id;

    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        name,
        description,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        usageLimitPerUser,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        applicableType,
        applicableIds,
        sellerId,
      },
    });

    return NextResponse.json({
      message: "쿠폰이 생성되었습니다.",
      coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "쿠폰 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
