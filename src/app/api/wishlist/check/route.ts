import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// 특정 상품의 위시리스트 상태 확인 (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ isWishlisted: false });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId가 필요합니다" },
        { status: 400 }
      );
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    return NextResponse.json({ isWishlisted: !!wishlist });
  } catch (error) {
    console.error("Wishlist check error:", error);
    return NextResponse.json(
      { error: "위시리스트 상태 확인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
