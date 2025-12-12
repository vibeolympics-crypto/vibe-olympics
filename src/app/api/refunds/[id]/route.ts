/**
 * 환불 요청 상세 API
 * GET /api/refunds/[id] - 환불 요청 상세 조회
 * PATCH /api/refunds/[id] - 환불 요청 처리 (관리자)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRefund } from "@/lib/stripe";
import { 
  sendRefundCompletedEmail, 
  sendRefundRejectedEmail,
  sendRefundNotificationSellerEmail 
} from "@/lib/email";

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 환불 요청 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const refundRequest = await prisma.refundRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        purchase: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                seller: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!refundRequest) {
      return NextResponse.json({ error: "환불 요청을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인: 관리자이거나 본인 요청인 경우만
    const isAdmin = user?.role === "ADMIN";
    if (!isAdmin && refundRequest.userId !== session.user.id) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    return NextResponse.json(refundRequest);
  } catch (error) {
    console.error("Get refund detail error:", error);
    return NextResponse.json(
      { error: "환불 요청 상세 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 환불 요청 처리 (관리자)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
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
    const { status, adminNotes } = body;

    const refundRequest = await prisma.refundRequest.findUnique({
      where: { id },
      include: {
        purchase: true,
        user: { select: { email: true, name: true } },
      },
    });

    if (!refundRequest) {
      return NextResponse.json({ error: "환불 요청을 찾을 수 없습니다." }, { status: 404 });
    }

    // 이미 처리된 요청인지 확인
    if (["COMPLETED", "REJECTED", "CANCELLED"].includes(refundRequest.status)) {
      return NextResponse.json(
        { error: "이미 처리된 환불 요청입니다." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      processedAt: new Date(),
      processedBy: session.user.id,
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    // 승인인 경우 Stripe 환불 처리
    if (status === "APPROVED" || status === "COMPLETED") {
      const paymentId = refundRequest.purchase.paymentId;
      
      if (paymentId) {
        try {
          // Stripe 환불 처리
          const refund = await createRefund(paymentId, Number(refundRequest.amount));
          updateData.stripeRefundId = refund.id;
          updateData.status = "COMPLETED";
          
          // 구매 상태도 환불됨으로 변경
          await prisma.purchase.update({
            where: { id: refundRequest.purchaseId },
            data: { status: "REFUNDED" },
          });
          
          // 판매자 통계 업데이트 (판매 취소)
          const product = await prisma.product.findUnique({
            where: { id: refundRequest.purchase.productId },
            select: { sellerId: true },
          });
          
          if (product) {
            await prisma.user.update({
              where: { id: product.sellerId },
              data: {
                totalSales: { decrement: 1 },
                totalRevenue: { decrement: Number(refundRequest.amount) },
              },
            });
            
            // 상품 판매 수 감소
            await prisma.product.update({
              where: { id: refundRequest.purchase.productId },
              data: { salesCount: { decrement: 1 } },
            });
          }
        } catch (stripeError) {
          console.error("Stripe refund error:", stripeError);
          return NextResponse.json(
            { error: "Stripe 환불 처리에 실패했습니다." },
            { status: 500 }
          );
        }
      } else {
        // Stripe 결제가 아닌 경우 수동 처리
        updateData.status = status;
        
        if (status === "COMPLETED") {
          await prisma.purchase.update({
            where: { id: refundRequest.purchaseId },
            data: { status: "REFUNDED" },
          });
        }
      }
    } else {
      updateData.status = status;
    }

    const updatedRefund = await prisma.refundRequest.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        purchase: {
          include: {
            product: { 
              select: { 
                title: true,
                seller: { select: { name: true, email: true } },
              } 
            },
          },
        },
      },
    });

    // 이메일 발송 (비동기 - 에러가 처리 성공에 영향 주지 않음)
    try {
      const buyerEmail = updatedRefund.user.email;
      const buyerName = updatedRefund.user.name || "고객";
      const productTitle = updatedRefund.purchase.product.title;
      const sellerEmail = updatedRefund.purchase.product.seller?.email;
      const sellerName = updatedRefund.purchase.product.seller?.name || "판매자";

      if (updatedRefund.status === "COMPLETED" && buyerEmail) {
        // 구매자에게 환불 완료 이메일 (기존 시그니처 사용)
        await sendRefundCompletedEmail(buyerEmail, {
          buyerName,
          productTitle,
          refundAmount: Number(updatedRefund.amount),
          refundReason: updatedRefund.reason,
          processedAt: new Date().toLocaleDateString("ko-KR"),
        });

        // 판매자에게 환불 알림 이메일
        if (sellerEmail) {
          await sendRefundNotificationSellerEmail(sellerEmail, {
            sellerName,
            productTitle,
            buyerName,
            refundAmount: Number(updatedRefund.amount),
            refundReason: updatedRefund.reason,
            refundDate: new Date().toLocaleDateString("ko-KR"),
          });
        }
      } else if (updatedRefund.status === "REJECTED" && buyerEmail) {
        // 구매자에게 환불 거절 이메일 (기존 시그니처 사용)
        await sendRefundRejectedEmail(buyerEmail, {
          buyerName,
          productTitle,
          refundAmount: Number(updatedRefund.amount),
          rejectionReason: adminNotes || "환불 정책에 따라 승인되지 않았습니다.",
        });
      }
    } catch (emailError) {
      console.error("환불 처리 이메일 발송 실패:", emailError);
    }

    return NextResponse.json(updatedRefund);
  } catch (error) {
    console.error("Update refund request error:", error);
    return NextResponse.json(
      { error: "환불 요청 처리에 실패했습니다." },
      { status: 500 }
    );
  }
}
