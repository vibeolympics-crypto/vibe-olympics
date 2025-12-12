import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 구독 결제 내역 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    // 구독 확인
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json({ error: "구독을 찾을 수 없습니다" }, { status: 404 });
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const where = {
      subscriptionId: id,
      ...(status && { status }),
    };

    const [payments, total] = await Promise.all([
      prisma.subscriptionPayment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscriptionPayment.count({ where }),
    ]);

    // 총 결제 금액 계산
    const totalPaid = await prisma.subscriptionPayment.aggregate({
      where: {
        subscriptionId: id,
        status: "COMPLETED",
      },
      _sum: { amount: true },
    });

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalPaid: totalPaid._sum.amount || 0,
        paymentCount: total,
      },
    });
  } catch (error) {
    console.error("결제 내역 조회 오류:", error);
    return NextResponse.json(
      { error: "결제 내역을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
