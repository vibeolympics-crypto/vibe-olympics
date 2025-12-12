/**
 * 정산 API
 * GET /api/settlements - 정산 목록 조회
 * POST /api/settlements - 정산 생성 (관리자)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// 정산 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isSeller: true },
    });

    const isAdmin = user?.role === "ADMIN";
    const isSeller = user?.isSeller;

    if (!isAdmin && !isSeller) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");

    const where: Record<string, unknown> = {};
    
    // 관리자가 아니면 본인 정산만
    if (!isAdmin) {
      where.sellerId = session.user.id;
    } else if (sellerId) {
      where.sellerId = sellerId;
    }

    if (status) {
      where.status = status;
    }

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, email: true, image: true } },
          _count: { select: { settlementItems: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.settlement.count({ where }),
    ]);

    return NextResponse.json({
      settlements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get settlements error:", error);
    return NextResponse.json(
      { error: "정산 목록 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 정산 생성 (관리자)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { sellerId, periodStart, periodEnd, bankName, accountNumber, accountHolder } = body;

    if (!sellerId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    endDate.setHours(23, 59, 59, 999);

    // 환불 대기 기간 (7일) 이후의 구매만 정산 대상
    const refundGracePeriod = 7;
    const maxPurchaseDate = new Date();
    maxPurchaseDate.setDate(maxPurchaseDate.getDate() - refundGracePeriod);

    // 해당 기간의 정산 대상 구매 조회
    const eligiblePurchases = await prisma.purchase.findMany({
      where: {
        product: { sellerId },
        status: "COMPLETED",
        isSettled: false,
        createdAt: {
          gte: startDate,
          lte: endDate < maxPurchaseDate ? endDate : maxPurchaseDate,
        },
        // 환불 요청이 없거나 거절/취소된 경우만
        refundRequests: {
          none: {
            status: { in: ["PENDING", "REVIEWING", "APPROVED"] },
          },
        },
      },
      include: {
        product: { select: { title: true } },
      },
    });

    if (eligiblePurchases.length === 0) {
      return NextResponse.json(
        { error: "정산 대상 거래가 없습니다." },
        { status: 400 }
      );
    }

    // 수수료 계산
    const PLATFORM_FEE_RATE = 0.10;
    const PAYMENT_FEE_RATE = 0.035; // PG 수수료 3.5%

    let totalSales = 0;
    let totalPlatformFee = 0;
    let totalPaymentFee = 0;

    const settlementItemsData = eligiblePurchases.map((purchase) => {
      const amount = Number(purchase.amount);
      const platformFee = Math.round(amount * PLATFORM_FEE_RATE);
      const paymentFee = Math.round(amount * PAYMENT_FEE_RATE);
      const netAmount = amount - platformFee - paymentFee;

      totalSales += amount;
      totalPlatformFee += platformFee;
      totalPaymentFee += paymentFee;

      return {
        purchaseId: purchase.id,
        amount,
        platformFee,
        paymentFee,
        netAmount,
      };
    });

    const netAmount = totalSales - totalPlatformFee - totalPaymentFee;

    // 트랜잭션으로 정산 생성
    const settlement = await prisma.$transaction(async (tx) => {
      // 정산 레코드 생성
      const newSettlement = await tx.settlement.create({
        data: {
          sellerId,
          periodStart: startDate,
          periodEnd: endDate,
          totalSales,
          salesCount: eligiblePurchases.length,
          platformFee: totalPlatformFee,
          paymentFee: totalPaymentFee,
          netAmount,
          status: "PENDING",
          bankName,
          accountNumber,
          accountHolder,
          settlementItems: {
            create: settlementItemsData,
          },
        },
        include: {
          seller: { select: { name: true, email: true } },
          settlementItems: true,
        },
      });

      // 구매 정산 상태 업데이트
      await tx.purchase.updateMany({
        where: {
          id: { in: eligiblePurchases.map((p) => p.id) },
        },
        data: {
          isSettled: true,
          settledAt: new Date(),
        },
      });

      return newSettlement;
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    console.error("Create settlement error:", error);
    return NextResponse.json(
      { error: "정산 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
