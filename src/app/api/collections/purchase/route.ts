import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// 번들 구매 스키마
const purchaseBundleSchema = z.object({
  collectionId: z.string(),
  selectedItemIds: z.array(z.string()).optional(), // 선택적 아이템 선택 (번들 내 선택 구매)
  paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "EASY_PAY"]).default("CARD"),
});

// 타입 정의
interface CollectionItemWithProduct {
  productId: string;
  isRequired: boolean;
  itemDiscountRate: number | null;
  product: {
    id: string;
    title: string;
    price: Decimal;
    sellerId: string;
  };
}

// POST: 번들 구매
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
    const validationResult = purchaseBundleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "입력 데이터가 유효하지 않습니다", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { collectionId, selectedItemIds } = validationResult.data;

    // 컬렉션 조회
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                sellerId: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "컬렉션을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (!collection.isPublished) {
      return NextResponse.json(
        { error: "비공개 컬렉션입니다" },
        { status: 403 }
      );
    }

    // 구매할 아이템 필터링
    let itemsToPurchase: CollectionItemWithProduct[] = collection.items;
    
    if (selectedItemIds && selectedItemIds.length > 0) {
      // 선택 구매 모드: 필수 아이템 + 선택한 아이템
      itemsToPurchase = collection.items.filter(item => 
        item.isRequired || selectedItemIds.includes(item.productId)
      );
    }

    // 이미 구매한 상품 확인
    const existingPurchases = await prisma.purchase.findMany({
      where: {
        buyerId: session.user.id,
        productId: { in: itemsToPurchase.map(item => item.productId) },
        status: "COMPLETED",
      },
      select: { productId: true },
    });

    const alreadyPurchasedIds = new Set(existingPurchases.map(p => p.productId));
    
    // 중복 구매 제외
    const newItemsToPurchase = itemsToPurchase.filter(
      item => !alreadyPurchasedIds.has(item.productId)
    );

    if (newItemsToPurchase.length === 0) {
      return NextResponse.json(
        { error: "이미 모든 상품을 구매하셨습니다", alreadyPurchased: true },
        { status: 400 }
      );
    }

    // 가격 계산
    const originalTotal = itemsToPurchase.reduce(
      (sum, item) => sum + Number(item.product.price || 0),
      0
    );
    
    const newItemsTotal = newItemsToPurchase.reduce(
      (sum, item) => sum + Number(item.product.price || 0),
      0
    );

    // 번들 할인 계산
    let finalPrice: number;
    let discountAmount: number;

    if (collection.type === "BUNDLE") {
      if (collection.bundlePrice !== null && collection.bundlePrice !== undefined) {
        // 고정 번들 가격
        const bundleRatio = newItemsTotal / originalTotal;
        finalPrice = Math.round(Number(collection.bundlePrice) * bundleRatio);
        discountAmount = newItemsTotal - finalPrice;
      } else if (collection.discountRate) {
        // 할인율 적용
        discountAmount = Math.round(newItemsTotal * (collection.discountRate / 100));
        finalPrice = newItemsTotal - discountAmount;
      } else {
        // 할인 없음
        finalPrice = newItemsTotal;
        discountAmount = 0;
      }
    } else {
      // 번들이 아닌 경우 개별 아이템 할인 적용
      finalPrice = 0;
      discountAmount = 0;
      
      for (const item of newItemsToPurchase) {
        const itemPrice = Number(item.product.price || 0);
        const itemDiscount = item.itemDiscountRate 
          ? Math.round(itemPrice * (item.itemDiscountRate / 100))
          : 0;
        finalPrice += itemPrice - itemDiscount;
        discountAmount += itemDiscount;
      }
    }

    // 판매자별 수익 분배 계산
    const sellerRevenues: Record<string, number> = {};
    const platformFeeRate = 0.1; // 10% 플랫폼 수수료

    for (const item of newItemsToPurchase) {
      const itemPrice = Number(item.product.price || 0);
      const itemRatio = itemPrice / newItemsTotal;
      const itemFinalPrice = Math.round(finalPrice * itemRatio);
      const sellerRevenue = Math.round(itemFinalPrice * (1 - platformFeeRate));
      
      if (!sellerRevenues[item.product.sellerId]) {
        sellerRevenues[item.product.sellerId] = 0;
      }
      sellerRevenues[item.product.sellerId] += sellerRevenue;
    }

    // 트랜잭션으로 구매 처리
    const result = await prisma.$transaction(async (tx) => {
      // 각 상품에 대해 구매 기록 생성
      const purchases = await Promise.all(
        newItemsToPurchase.map(async (item) => {
          const itemPrice = Number(item.product.price || 0);
          const itemRatio = itemPrice / newItemsTotal;
          const itemFinalPrice = Math.round(finalPrice * itemRatio);
          const itemDiscount = Math.round(discountAmount * itemRatio);

          return tx.purchase.create({
            data: {
              buyerId: session.user.id,
              productId: item.productId,
              amount: itemFinalPrice,
              bundleId: collection.id,
              bundleDiscount: itemDiscount,
              status: "PENDING",
            },
          });
        })
      );

      // 컬렉션 판매 수 증가
      await tx.collection.update({
        where: { id: collection.id },
        data: { salesCount: { increment: 1 } },
      });

      return purchases;
    });

    return NextResponse.json({
      success: true,
      purchases: result,
      pricing: {
        originalTotal,
        newItemsTotal,
        discountAmount,
        finalPrice,
        savings: discountAmount > 0 ? Math.round((discountAmount / newItemsTotal) * 100) : 0,
        itemCount: newItemsToPurchase.length,
        skippedCount: alreadyPurchasedIds.size,
      },
      sellerRevenues,
      message: `${newItemsToPurchase.length}개 상품이 장바구니에 담겼습니다. 결제를 진행해주세요.`,
    });
  } catch (error) {
    console.error("Bundle purchase error:", error);
    return NextResponse.json(
      { error: "번들 구매 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET: 번들 가격 계산 (구매 전 미리보기)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");
    const selectedItemIds = searchParams.get("selectedItemIds")?.split(",").filter(Boolean);

    if (!collectionId) {
      return NextResponse.json(
        { error: "컬렉션 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 컬렉션 조회
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                thumbnail: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "컬렉션을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 구매할 아이템 필터링
    let itemsToPurchase = collection.items;
    
    if (selectedItemIds && selectedItemIds.length > 0) {
      itemsToPurchase = collection.items.filter(item => 
        item.isRequired || selectedItemIds.includes(item.productId)
      );
    }

    // 이미 구매한 상품 확인 (로그인한 경우)
    let alreadyPurchasedIds = new Set<string>();
    
    if (session?.user?.id) {
      const existingPurchases = await prisma.purchase.findMany({
        where: {
          buyerId: session.user.id,
          productId: { in: itemsToPurchase.map(item => item.productId) },
          status: "COMPLETED",
        },
        select: { productId: true },
      });
      alreadyPurchasedIds = new Set(existingPurchases.map(p => p.productId));
    }

    // 가격 계산
    const originalTotal = collection.items.reduce(
      (sum, item) => sum + Number(item.product.price || 0),
      0
    );

    const selectedTotal = itemsToPurchase.reduce(
      (sum, item) => sum + Number(item.product.price || 0),
      0
    );

    const newItemsTotal = itemsToPurchase
      .filter(item => !alreadyPurchasedIds.has(item.productId))
      .reduce((sum, item) => sum + Number(item.product.price || 0), 0);

    // 번들 할인 계산
    let finalPrice: number;
    let discountAmount: number;

    if (collection.type === "BUNDLE" && collection.bundlePrice !== null) {
      const bundleRatio = newItemsTotal / originalTotal;
      finalPrice = Math.round(Number(collection.bundlePrice) * bundleRatio);
      discountAmount = newItemsTotal - finalPrice;
    } else if (collection.discountRate) {
      discountAmount = Math.round(newItemsTotal * (collection.discountRate / 100));
      finalPrice = newItemsTotal - discountAmount;
    } else {
      finalPrice = newItemsTotal;
      discountAmount = 0;
    }

    // 아이템별 상세 정보
    const itemDetails = itemsToPurchase.map(item => ({
      productId: item.productId,
      title: item.product.title,
      thumbnail: item.product.thumbnail,
      originalPrice: Number(item.product.price),
      isRequired: item.isRequired,
      itemDiscountRate: item.itemDiscountRate,
      alreadyPurchased: alreadyPurchasedIds.has(item.productId),
    }));

    return NextResponse.json({
      collection: {
        id: collection.id,
        title: collection.title,
        type: collection.type,
        bundlePrice: collection.bundlePrice ? Number(collection.bundlePrice) : null,
        discountRate: collection.discountRate,
      },
      pricing: {
        originalTotal,
        selectedTotal,
        newItemsTotal,
        discountAmount,
        finalPrice,
        savings: discountAmount > 0 ? Math.round((discountAmount / newItemsTotal) * 100) : 0,
      },
      items: itemDetails,
      summary: {
        totalItems: collection.items.length,
        selectedItems: itemsToPurchase.length,
        newItems: itemsToPurchase.filter(item => !alreadyPurchasedIds.has(item.productId)).length,
        alreadyPurchased: alreadyPurchasedIds.size,
      },
    });
  } catch (error) {
    console.error("Bundle pricing error:", error);
    return NextResponse.json(
      { error: "가격 계산 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
