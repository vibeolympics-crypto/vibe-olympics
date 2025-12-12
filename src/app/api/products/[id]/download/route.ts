import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/[id]/download
 * 구매한 상품의 다운로드 URL을 반환합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 상품 정보 조회 (파일 포함)
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        sellerId: true,
        files: {
          select: {
            id: true,
            name: true,
            url: true,
            size: true,
            type: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 구매 여부 확인 (판매자 본인 또는 구매자만 다운로드 가능)
    const isPurchased = await prisma.purchase.findFirst({
      where: {
        buyerId: session.user.id,
        productId: id,
        status: "COMPLETED",
      },
    });

    const isSeller = product.sellerId === session.user.id;

    if (!isPurchased && !isSeller) {
      return NextResponse.json(
        { error: "구매하지 않은 상품입니다" },
        { status: 403 }
      );
    }

    // 파일이 없는 경우
    if (!product.files || product.files.length === 0) {
      return NextResponse.json(
        { error: "다운로드 가능한 파일이 없습니다" },
        { status: 404 }
      );
    }

    // 다운로드 횟수 증가
    await prisma.product.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    // 다운로드 이력 기록 (구매자인 경우만)
    if (isPurchased) {
      await prisma.purchase.update({
        where: { id: isPurchased.id },
        data: { downloadCount: { increment: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        productTitle: product.title,
        files: product.files.map((file) => ({
          id: file.id,
          name: file.name,
          url: file.url,
          size: file.size,
          type: file.type,
        })),
      },
    });
  } catch (error) {
    console.error("[Product Download API] Error:", error);
    return NextResponse.json(
      { error: "다운로드 정보를 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
