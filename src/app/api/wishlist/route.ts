import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// 위시리스트 조회 (GET)
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

    const [wishlists, total] = await Promise.all([
      prisma.wishlist.findMany({
        where: { userId: session.user.id },
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
            },
          },
        },
      }),
      prisma.wishlist.count({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      wishlists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Wishlist GET error:", error);
    return NextResponse.json(
      { error: "위시리스트를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 위시리스트 추가 (POST)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "productId가 필요합니다" },
        { status: 400 }
      );
    }

    // 상품 존재 확인
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sellerId: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 본인 상품은 위시리스트에 추가 불가
    if (product.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "본인 상품은 위시리스트에 추가할 수 없습니다" },
        { status: 400 }
      );
    }

    // 이미 추가되어 있는지 확인
    const existingWishlist = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existingWishlist) {
      return NextResponse.json(
        { error: "이미 위시리스트에 추가된 상품입니다" },
        { status: 400 }
      );
    }

    // 위시리스트에 추가
    const wishlist = await prisma.wishlist.create({
      data: {
        userId: session.user.id,
        productId,
      },
      include: {
        product: {
          select: { id: true, title: true, thumbnail: true },
        },
      },
    });

    return NextResponse.json(
      { message: "위시리스트에 추가되었습니다", wishlist },
      { status: 201 }
    );
  } catch (error) {
    console.error("Wishlist add error:", error);
    return NextResponse.json(
      { error: "위시리스트 추가 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 위시리스트 삭제 (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId가 필요합니다" },
        { status: 400 }
      );
    }

    // 위시리스트 항목 확인
    const wishlist = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (!wishlist) {
      return NextResponse.json(
        { error: "위시리스트에 없는 상품입니다" },
        { status: 404 }
      );
    }

    // 삭제
    await prisma.wishlist.delete({
      where: { id: wishlist.id },
    });

    return NextResponse.json({ message: "위시리스트에서 삭제되었습니다" });
  } catch (error) {
    console.error("Wishlist delete error:", error);
    return NextResponse.json(
      { error: "위시리스트 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
