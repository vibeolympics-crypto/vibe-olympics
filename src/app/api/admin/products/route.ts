import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

// 상품 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return adminCheck.error;
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  try {
    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { seller: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...(status && { status: status as ProductStatus }),
      ...(categoryId && { categoryId }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          status: true,
          viewCount: true,
          salesCount: true,
          createdAt: true,
          updatedAt: true,
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              purchases: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin products error:", error);
    return NextResponse.json(
      { error: "상품 목록을 가져오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 상품 상태 변경
export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return adminCheck.error;
  }

  try {
    const body = await request.json();
    const { productId, status } = body;

    if (!productId || !status) {
      return NextResponse.json(
        { error: "상품 ID와 상태가 필요합니다." },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { status },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Admin product update error:", error);
    return NextResponse.json(
      { error: "상품 상태 변경에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 상품 삭제
export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return adminCheck.error;
  }

  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { error: "상품 ID가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin product delete error:", error);
    return NextResponse.json(
      { error: "상품 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
