/**
 * 환불 요청 API
 * GET /api/refunds - 환불 요청 목록 조회
 * POST /api/refunds - 환불 요청 생성 (구매자)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendRefundRequestedEmail } from "@/lib/email";
import { recordRefund } from "@/lib/realtime-events";

export const dynamic = 'force-dynamic';

// 환불 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN";

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    
    // 관리자가 아니면 본인 환불 요청만
    if (!isAdmin) {
      where.userId = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    const [refunds, total] = await Promise.all([
      prisma.refundRequest.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          purchase: {
            include: {
              product: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.refundRequest.count({ where }),
    ]);

    return NextResponse.json({
      refunds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get refunds error:", error);
    return NextResponse.json(
      { error: "환불 요청 목록 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 환불 요청 생성 (구매자)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { purchaseId, reason, reasonDetail } = body;

    if (!purchaseId || !reason) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 구매 확인
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: { select: { title: true } },
        refundRequests: {
          where: {
            status: { in: ["PENDING", "REVIEWING", "APPROVED"] },
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: "구매를 찾을 수 없습니다." }, { status: 404 });
    }

    // 본인 구매인지 확인
    if (purchase.buyerId !== session.user.id) {
      return NextResponse.json({ error: "본인의 구매만 환불 요청할 수 있습니다." }, { status: 403 });
    }

    // 이미 완료된 구매인지 확인
    if (purchase.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "완료된 구매만 환불 요청할 수 있습니다." },
        { status: 400 }
      );
    }

    // 이미 정산된 경우
    if (purchase.isSettled) {
      return NextResponse.json(
        { error: "이미 정산이 완료된 구매는 환불 요청할 수 없습니다." },
        { status: 400 }
      );
    }

    // 진행 중인 환불 요청이 있는지 확인
    if (purchase.refundRequests.length > 0) {
      return NextResponse.json(
        { error: "이미 진행 중인 환불 요청이 있습니다." },
        { status: 400 }
      );
    }

    // 환불 요청 기간 확인 (7일 이내)
    const refundDeadline = 7;
    const purchaseDate = new Date(purchase.createdAt);
    const deadlineDate = new Date(purchaseDate);
    deadlineDate.setDate(deadlineDate.getDate() + refundDeadline);

    if (new Date() > deadlineDate) {
      return NextResponse.json(
        { error: "환불 요청 기간(구매 후 7일)이 지났습니다." },
        { status: 400 }
      );
    }

    // 환불 요청 생성
    const refundRequest = await prisma.refundRequest.create({
      data: {
        userId: session.user.id,
        purchaseId,
        amount: purchase.amount,
        reason,
        reasonDetail,
        status: "PENDING",
      },
      include: {
        user: { select: { name: true, email: true } },
        purchase: {
          include: {
            product: { select: { title: true } },
          },
        },
      },
    });

    // 환불 요청 접수 이메일 발송
    try {
      if (refundRequest.user.email) {
        await sendRefundRequestedEmail(refundRequest.user.email, {
          buyerName: refundRequest.user.name || "고객",
          productTitle: refundRequest.purchase.product.title,
          price: Number(refundRequest.amount),
          refundId: refundRequest.id,
          reason: reason + (reasonDetail ? ` - ${reasonDetail}` : ''),
          requestDate: new Date().toLocaleDateString("ko-KR"),
        });
      }
    } catch (emailError) {
      console.error("환불 요청 이메일 발송 실패:", emailError);
    }

    // 실시간 이벤트 기록 (관리자 대시보드용)
    recordRefund(
      session.user.id,
      refundRequest.user.name || "사용자",
      purchaseId,
      refundRequest.purchase.product.title,
      Number(refundRequest.amount)
    );

    return NextResponse.json(refundRequest, { status: 201 });
  } catch (error) {
    console.error("Create refund request error:", error);
    return NextResponse.json(
      { error: "환불 요청 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
