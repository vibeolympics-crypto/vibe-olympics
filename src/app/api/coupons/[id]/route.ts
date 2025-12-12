/**
 * 쿠폰 상세/수정/삭제 API
 * GET: 쿠폰 상세 조회
 * PUT: 쿠폰 수정
 * DELETE: 쿠폰 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 쿠폰 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "쿠폰을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인 (본인 쿠폰 또는 관리자)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (coupon.sellerId !== session.user.id && user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 최근 사용 내역
    const recentUsages = await prisma.couponUsage.findMany({
      where: { couponId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      coupon,
      recentUsages,
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json(
      { error: "쿠폰을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 쿠폰 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;

    // 쿠폰 조회
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "쿠폰을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (coupon.sellerId !== session.user.id && user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      usageLimitPerUser,
      startDate,
      endDate,
      isActive,
      applicableType,
      applicableIds,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount;
    if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (usageLimitPerUser !== undefined) updateData.usageLimitPerUser = usageLimitPerUser;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (applicableType !== undefined) updateData.applicableType = applicableType;
    if (applicableIds !== undefined) updateData.applicableIds = applicableIds;

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "쿠폰이 수정되었습니다.",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "쿠폰 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 쿠폰 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;

    // 쿠폰 조회
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: { select: { usages: true } },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "쿠폰을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (coupon.sellerId !== session.user.id && user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 사용 내역이 있으면 비활성화만 진행
    if (coupon._count.usages > 0) {
      await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: "사용 내역이 있어 비활성화 처리되었습니다.",
        deactivated: true,
      });
    }

    // 사용 내역이 없으면 완전 삭제
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "쿠폰이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "쿠폰 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
