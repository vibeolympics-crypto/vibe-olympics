/**
 * 상품 번들 API
 * GET: 번들 목록 조회
 * POST: 번들 생성 (판매자 전용)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 번들 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const sellerId = searchParams.get("sellerId");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const skip = (page - 1) * limit;

    const where: Prisma.BundleWhereInput = {
      ...(sellerId && { sellerId }),
      ...(activeOnly && { 
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } }
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          }
        ]
      }),
    };

    const [bundles, total] = await Promise.all([
      prisma.bundle.findMany({
        where,
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.bundle.count({ where }),
    ]);

    // 각 번들의 상품 정보 조회
    const bundlesWithProducts = await Promise.all(
      bundles.map(async (bundle) => {
        const productIds = bundle.items.map((item) => item.productId);
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            seller: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

        return {
          ...bundle,
          products,
        };
      })
    );

    return NextResponse.json({
      bundles: bundlesWithProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching bundles:", error);
    return NextResponse.json(
      { error: "번들 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 번들 생성 (판매자 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 판매자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSeller: true },
    });

    if (!user?.isSeller) {
      return NextResponse.json(
        { error: "판매자만 번들을 생성할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      productIds,
      bundlePrice,
      thumbnail,
      startDate,
      endDate,
    } = body;

    // 필수 필드 검증
    if (!title || !productIds || productIds.length < 2) {
      return NextResponse.json(
        { error: "제목과 최소 2개 이상의 상품이 필요합니다." },
        { status: 400 }
      );
    }

    // 상품들이 해당 판매자의 것인지 확인
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        sellerId: session.user.id,
        isPublished: true,
      },
      select: { id: true, price: true, title: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "일부 상품이 존재하지 않거나 본인의 상품이 아닙니다." },
        { status: 400 }
      );
    }

    // 원래 총 가격 계산
    const originalPrice = products.reduce(
      (sum, p) => sum + Number(p.price),
      0
    );

    // 번들 가격 검증
    const finalBundlePrice = bundlePrice || originalPrice * 0.8; // 기본 20% 할인
    if (finalBundlePrice > originalPrice) {
      return NextResponse.json(
        { error: "번들 가격은 개별 가격 합계보다 낮아야 합니다." },
        { status: 400 }
      );
    }

    const discountPercent = Math.round(
      ((originalPrice - finalBundlePrice) / originalPrice) * 100
    );

    // 슬러그 생성
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-|-$/g, "");
    const uniqueSuffix = Date.now().toString(36);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    // 번들 생성
    const bundle = await prisma.bundle.create({
      data: {
        title,
        slug,
        description: description || `${products.map((p) => p.title).join(", ")} 번들`,
        sellerId: session.user.id,
        originalPrice,
        bundlePrice: finalBundlePrice,
        discountPercent,
        thumbnail,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        items: {
          create: productIds.map((productId: string, index: number) => ({
            productId,
            sortOrder: index,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      message: "번들이 생성되었습니다.",
      bundle: {
        ...bundle,
        products,
      },
    });
  } catch (error) {
    console.error("Error creating bundle:", error);
    return NextResponse.json(
      { error: "번들 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
