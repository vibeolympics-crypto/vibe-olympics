import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";
import { z } from "zod";
import { withSecurity, securityLogger } from "@/lib/security";
import { priceValidator } from "@/lib/security/business-logic";

export const dynamic = 'force-dynamic';

const checkoutSchema = z.object({
  productId: z.string().cuid(),
  submittedPrice: z.number().optional(), // 클라이언트 가격 검증용
});

// 결제 세션 생성 (POST) - 보안 강화
export async function POST(request: NextRequest) {
  return withSecurity(
    request,
    async (req) => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: "로그인이 필요합니다" },
            { status: 401 }
          );
        }

        const body = await req.json();

        const validation = checkoutSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: validation.error.issues[0].message },
            { status: 400 }
          );
        }

        const { productId, submittedPrice } = validation.data;

        // 상품 조회
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            title: true,
            shortDescription: true,
            thumbnail: true,
            price: true,
            discountPrice: true,
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

        // 가격 조작 방지: 클라이언트 가격과 서버 가격 비교
        if (submittedPrice !== undefined) {
          const priceResult = await priceValidator.validateProductPrice(
            productId,
            submittedPrice
          );

          if (!priceResult.valid) {
            securityLogger.log({
              type: 'SUSPICIOUS_ACTIVITY',
              severity: 'critical',
              userId: session.user.id,
              details: {
                reason: 'Price manipulation attempt at checkout',
                productId,
                submittedPrice,
                expectedPrice: priceResult.finalPrice,
              },
            });

            return NextResponse.json(
              { error: priceResult.error || "가격이 변경되었습니다. 페이지를 새로고침해 주세요." },
              { status: 400 }
            );
          }
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

        // 최종 결제 가격 (할인가 우선)
        const finalPrice = product.discountPrice
          ? Number(product.discountPrice)
          : Number(product.price);

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
          price: finalPrice,
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
    },
    { rateLimit: 'payment' } // 결제용 Rate Limit 적용 (1분 5회)
  );
}
