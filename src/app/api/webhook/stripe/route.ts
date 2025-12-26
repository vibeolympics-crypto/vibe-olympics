import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendPurchaseConfirmationEmail, sendSaleNotificationEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { securityLogger } from "@/lib/security";
import { replayProtection } from "@/lib/security/webhook";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';

// Webhook 시크릿
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const context = securityLogger.extractContext(request);

  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature || !webhookSecret) {
      securityLogger.log({
        type: 'WEBHOOK_INVALID',
        severity: 'high',
        ...context,
        details: { reason: 'Missing signature or webhook secret', provider: 'stripe' },
      });
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      securityLogger.log({
        type: 'WEBHOOK_INVALID',
        severity: 'critical',
        ...context,
        details: { reason: 'Signature verification failed', provider: 'stripe', error: err instanceof Error ? err.message : 'Unknown' },
      });
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Replay Attack 방어: 이벤트 ID로 중복 체크
    if (replayProtection.isDuplicate(event.id)) {
      securityLogger.log({
        type: 'WEBHOOK_INVALID',
        severity: 'high',
        ...context,
        details: { reason: 'Replay attack prevented', provider: 'stripe', eventId: event.id },
      });
      return NextResponse.json(
        { error: "Duplicate event (replay attack prevented)" },
        { status: 400 }
      );
    }
    replayProtection.record(event.id);

    // 이벤트 처리
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }
      
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        logger.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// 결제 완료 처리
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { productId, userId } = session.metadata || {};

  if (!productId || !userId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // 트랜잭션으로 구매 처리
  await prisma.$transaction(async (tx) => {
    // 기존 구매 확인 또는 생성
    const existingPurchase = await tx.purchase.findUnique({
      where: {
        buyerId_productId: {
          buyerId: userId,
          productId,
        },
      },
    });

    if (existingPurchase) {
      // 기존 구매가 있으면 상태만 업데이트
      await tx.purchase.update({
        where: { id: existingPurchase.id },
        data: {
          status: "COMPLETED",
          paymentId: session.payment_intent as string,
          paymentMethod: "stripe",
        },
      });
    } else {
      // 새 구매 생성
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { price: true, title: true },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      await tx.purchase.create({
        data: {
          buyerId: userId,
          productId,
          amount: product.price,
          status: "COMPLETED",
          paymentId: session.payment_intent as string,
          paymentMethod: "stripe",
        },
      });
    }

    // 상품 판매 수 증가
    await tx.product.update({
      where: { id: productId },
      data: { salesCount: { increment: 1 } },
    });

    // 판매자 통계 업데이트
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { sellerId: true, price: true, title: true },
    });

    if (product) {
      await tx.user.update({
        where: { id: product.sellerId },
        data: {
          totalSales: { increment: 1 },
          totalRevenue: { increment: product.price },
        },
      });

      // 판매자에게 알림 생성
      await tx.notification.create({
        data: {
          userId: product.sellerId,
          type: "SALE",
          title: "새로운 판매! 🎉",
          message: `"${product.title}" 상품이 판매되었습니다.`,
          data: { productId },
        },
      });

      // 구매자에게 알림 생성
      await tx.notification.create({
        data: {
          userId,
          type: "PURCHASE",
          title: "구매 완료! 🛒",
          message: `"${product.title}" 구매가 완료되었습니다. 다운로드 페이지에서 파일을 받아보세요.`,
          data: { productId },
        },
      });
    }
  });

  // 이메일 발송 (트랜잭션 외부에서 비동기 처리)
  try {
    const [buyer, productWithSeller] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
      prisma.product.findUnique({
        where: { id: productId },
        select: { 
          title: true, 
          price: true,
          seller: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    if (buyer?.email && productWithSeller) {
      // 구매자에게 구매 완료 이메일
      await sendPurchaseConfirmationEmail(buyer.email, {
        buyerName: buyer.name || "고객",
        productTitle: productWithSeller.title,
        price: Number(productWithSeller.price),
        purchaseId: `PUR-${userId.slice(-6)}-${productId.slice(-6)}`.toUpperCase(),
      });

      // 판매자에게 판매 알림 이메일
      if (productWithSeller.seller?.email) {
        await sendSaleNotificationEmail(productWithSeller.seller.email, {
          sellerName: productWithSeller.seller.name || "판매자",
          productTitle: productWithSeller.title,
          price: Number(productWithSeller.price),
          buyerName: buyer.name || "구매자",
        });
      }
    }
  } catch (emailError) {
    // 이메일 발송 실패는 결제 성공에 영향을 주지 않음
    console.error("Email sending failed:", emailError);
  }

  logger.log(`Purchase completed for product ${productId} by user ${userId}`);
}

// 결제 실패 처리
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { productId, userId } = paymentIntent.metadata || {};

  if (!productId || !userId) {
    return;
  }

  // 구매 상태를 FAILED로 업데이트
  await prisma.purchase.updateMany({
    where: {
      buyerId: userId,
      productId,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
    },
  });

  logger.log(`Payment failed for product ${productId} by user ${userId}`);
}
