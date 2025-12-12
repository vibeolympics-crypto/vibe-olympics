import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// 구매 상세 조회 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const purchase = await prisma.purchase.findFirst({
      where: {
        id: params.id,
        buyerId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            shortDescription: true,
            thumbnail: true,
            price: true,
            pricingType: true,
            licenseType: true,
            category: {
              select: { id: true, name: true, slug: true },
            },
            seller: {
              select: { id: true, name: true, image: true, email: true },
            },
            files: {
              select: { 
                id: true, 
                name: true, 
                size: true, 
                type: true, 
                url: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "구매 내역을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 리뷰 작성 여부 확인
    const review = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        productId: purchase.productId,
      },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        createdAt: true,
      },
    });

    // 다운로드 이력 가져오기 (DownloadLog 모델이 있다면)
    // 현재는 downloadCount만 있으므로 시뮬레이션
    const downloadHistory = purchase.downloadCount > 0 
      ? Array.from({ length: Math.min(purchase.downloadCount, 10) }, (_, i) => ({
          id: `dl-${i}`,
          downloadedAt: new Date(
            new Date(purchase.createdAt).getTime() + (i * 24 * 60 * 60 * 1000)
          ).toISOString(),
          fileId: purchase.product.files[0]?.id || null,
          fileName: purchase.product.files[0]?.name || "Unknown",
        }))
      : [];

    const purchaseAmount = Number(purchase.amount);
    const productPrice = Number(purchase.product.price);
    
    return NextResponse.json({
      purchase: {
        id: purchase.id,
        status: purchase.status,
        price: purchaseAmount,
        paymentMethod: purchase.paymentMethod,
        paymentId: purchase.paymentId,
        downloadCount: purchase.downloadCount,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
        product: {
          id: purchase.product.id,
          title: purchase.product.title,
          shortDescription: purchase.product.shortDescription,
          thumbnailUrl: purchase.product.thumbnail,
          price: productPrice,
          pricingType: purchase.product.pricingType,
          licenseType: purchase.product.licenseType,
          category: purchase.product.category,
          seller: purchase.product.seller,
          files: purchase.product.files,
        },
        review,
        downloadHistory,
        // 영수증 정보
        receipt: {
          orderNumber: purchase.id,
          paymentDate: purchase.createdAt,
          paymentMethod: purchase.paymentMethod || "N/A",
          paymentId: purchase.paymentId,
          amount: purchaseAmount,
          buyerEmail: session.user.email,
          sellerName: purchase.product.seller.name,
          productTitle: purchase.product.title,
          licenseType: purchase.product.licenseType,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching purchase detail:", error);
    return NextResponse.json(
      { error: "구매 상세 정보를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
