import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { recordPurchase } from "@/lib/realtime-events";

export const dynamic = 'force-dynamic';

// 구매 생성 스키마
const createPurchaseSchema = z.object({
  productId: z.string().cuid(),
  paymentMethod: z.string().optional(),
  paymentId: z.string().optional(),
});

// 구매 내역 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const status = searchParams.get("status");
    const productId = searchParams.get("productId");

    // 특정 상품 구매 여부만 확인
    if (productId) {
      const purchase = await prisma.purchase.findFirst({
        where: {
          buyerId: session.user.id,
          productId,
          status: "COMPLETED",
        },
        include: {
          product: {
            include: {
              files: {
                select: { id: true, name: true, size: true, type: true, url: true },
              },
            },
          },
        },
      });

      return NextResponse.json({
        purchased: !!purchase,
        purchase: purchase ? {
          id: purchase.id,
          purchasedAt: purchase.createdAt,
          files: purchase.product.files,
        } : null,
      });
    }

    const where: Record<string, unknown> = {
      buyerId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [purchasesData, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            include: {
              category: {
                select: { id: true, name: true, slug: true },
              },
              seller: {
                select: { id: true, name: true, image: true },
              },
              files: {
                select: { id: true, name: true, size: true, type: true },
              },
            },
          },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    // 각 구매 건에 대해 리뷰 작성 여부 확인
    const purchasesWithReviewStatus = await Promise.all(
      purchasesData.map(async (purchase) => {
        const review = await prisma.review.findFirst({
          where: {
            userId: session.user.id,
            productId: purchase.productId,
          },
        });
        return {
          ...purchase,
          price: purchase.amount, // amount를 price로도 반환
          hasReviewed: !!review,
        };
      })
    );

    return NextResponse.json({
      purchases: purchasesWithReviewStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Purchases GET error:", error);
    return NextResponse.json(
      { error: "구매 내역을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 구매 처리 (POST)
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

    // 유효성 검사
    const validation = createPurchaseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { productId, paymentMethod, paymentId } = validation.data;

    // 상품 조회
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        sellerId: true,
        price: true,
        pricingType: true,
        status: true,
        isPublished: true,
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

    // 본인 상품 구매 불가
    if (product.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "본인 상품은 구매할 수 없습니다" },
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

    // 구매 처리 (트랜잭션)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const purchase = await prisma.$transaction(async (tx: any) => {
      // 구매 기록 생성
      const newPurchase = await tx.purchase.create({
        data: {
          buyerId: session.user.id,
          productId,
          amount: product.price,
          paymentMethod,
          paymentId,
          status: product.pricingType === "FREE" ? "COMPLETED" : "PENDING",
        },
        include: {
          product: {
            select: { id: true, title: true, thumbnail: true },
          },
        },
      });

      // 무료 상품이면 바로 완료 처리
      if (product.pricingType === "FREE") {
        // 상품 판매 수 증가
        await tx.product.update({
          where: { id: productId },
          data: { salesCount: { increment: 1 } },
        });

        // 판매자 통계 업데이트
        await tx.user.update({
          where: { id: product.sellerId },
          data: { totalSales: { increment: 1 } },
        });

        // 알림 생성 (판매자에게)
        await tx.notification.create({
          data: {
            userId: product.sellerId,
            type: "SALE",
            title: "새로운 판매! 🎉",
            message: `${session.user.name || "사용자"}님이 "${newPurchase.product.title}"를 구매했습니다.`,
            data: { purchaseId: newPurchase.id, productId },
          },
        });

        // 알림 생성 (구매자에게)
        await tx.notification.create({
          data: {
            userId: session.user.id,
            type: "PURCHASE",
            title: "구매 완료! 🛒",
            message: `"${newPurchase.product.title}" 구매가 완료되었습니다. 다운로드 페이지에서 파일을 받아보세요.`,
            data: { purchaseId: newPurchase.id, productId },
          },
        });

        // 실시간 이벤트 기록 (관리자 대시보드용)
        recordPurchase(
          session.user.id,
          session.user.name || "사용자",
          productId,
          newPurchase.product.title,
          Number(product.price)
        );
      }

      return newPurchase;
    });

    return NextResponse.json(
      {
        message: product.pricingType === "FREE" 
          ? "구매가 완료되었습니다" 
          : "결제를 진행해주세요",
        purchase,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Purchase create error:", error);
    return NextResponse.json(
      { error: "구매 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
