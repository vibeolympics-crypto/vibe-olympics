import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const checkoutSchema = z.object({
  productId: z.string().cuid(),
});

// 결제 세션 생성 (POST)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { productId } = validation.data;

    // 상품 조회
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        thumbnail: true,
        price: true,
        pricingType: true,
        status: true,
        isPublished: true,
        sellerId: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (!product.isPublished || product.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "판매 중인 상품이 아닙니다" },
        { status: 400 }
      );
    }

    if (product.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "본인 상품은 구매할 수 없습니다" },
        { status: 400 }
      );
    }

    // 무료 상품 체크
    if (product.pricingType === "FREE" || Number(product.price) === 0) {
      return NextResponse.json(
        { error: "무료 상품은 결제가 필요하지 않습니다" },
        { status: 400 }
      );
    }

    // 이미 구매했는지 확인
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        buyerId_productId: {
          buyerId: session.user.id,
          productId,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: "이미 구매한 상품입니다" },
        { status: 400 }
      );
    }

    // 현재 URL 기반으로 success/cancel URL 생성
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";
    const successUrl = `${baseUrl}/dashboard/purchases?success=true&productId=${productId}`;
    const cancelUrl = `${baseUrl}/marketplace/${productId}?canceled=true`;

    // Stripe 결제 세션 생성
    const checkoutSession = await createCheckoutSession({
      productId,
      productTitle: product.title,
      productDescription: product.shortDescription,
      productImage: product.thumbnail || undefined,
      price: Number(product.price),
      userId: session.user.id,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Checkout session creation error:", error);
    return NextResponse.json(
      { error: "결제 세션 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
