/**
 * 번들 상세 API
 * GET: 특정 번들 조회
 * PUT: 번들 수정 (판매자 전용)
 * DELETE: 번들 삭제 (판매자 전용)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 번들 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const bundle = await prisma.bundle.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!bundle) {
      return NextResponse.json(
        { error: "번들을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 상품 정보 조회
    const productIds = bundle.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: true,
      },
    });

    // 판매자 정보 조회
    const seller = await prisma.user.findUnique({
      where: { id: bundle.sellerId },
      select: {
        id: true,
        name: true,
        image: true,
        isSeller: true,
        sellerVerified: true,
      },
    });

    return NextResponse.json({
      ...bundle,
      products,
      seller,
    });
  } catch (error) {
    console.error("Error fetching bundle:", error);
    return NextResponse.json(
      { error: "번들을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 번들 수정 (판매자 전용)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;

    // 번들 조회 및 소유자 확인
    const bundle = await prisma.bundle.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!bundle) {
      return NextResponse.json(
        { error: "번들을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (bundle.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "본인의 번들만 수정할 수 있습니다." },
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
      isActive,
      startDate,
      endDate,
    } = body;

    let updateData: Record<string, unknown> = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    // 상품 목록 업데이트
    if (productIds && productIds.length >= 2) {
      // 상품 검증
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          sellerId: session.user.id,
        },
        select: { id: true, price: true },
      });

      if (products.length !== productIds.length) {
        return NextResponse.json(
          { error: "일부 상품이 존재하지 않거나 본인의 상품이 아닙니다." },
          { status: 400 }
        );
      }

      const originalPrice = products.reduce(
        (sum, p) => sum + Number(p.price),
        0
      );

      // 기존 아이템 삭제
      await prisma.bundleItem.deleteMany({
        where: { bundleId: id },
      });

      // 새 아이템 추가
      await prisma.bundleItem.createMany({
        data: productIds.map((productId: string, index: number) => ({
          bundleId: id,
          productId,
          sortOrder: index,
        })),
      });

      updateData.originalPrice = originalPrice;

      if (bundlePrice) {
        updateData.bundlePrice = bundlePrice;
        updateData.discountPercent = Math.round(
          ((originalPrice - bundlePrice) / originalPrice) * 100
        );
      }
    } else if (bundlePrice) {
      updateData.bundlePrice = bundlePrice;
      updateData.discountPercent = Math.round(
        ((Number(bundle.originalPrice) - bundlePrice) / Number(bundle.originalPrice)) * 100
      );
    }

    const updatedBundle = await prisma.bundle.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    return NextResponse.json({
      message: "번들이 수정되었습니다.",
      bundle: updatedBundle,
    });
  } catch (error) {
    console.error("Error updating bundle:", error);
    return NextResponse.json(
      { error: "번들 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 번들 삭제 (판매자 전용)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;

    // 번들 조회 및 소유자 확인
    const bundle = await prisma.bundle.findUnique({
      where: { id },
    });

    if (!bundle) {
      return NextResponse.json(
        { error: "번들을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (bundle.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "본인의 번들만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 구매 내역 확인
    const purchaseCount = await prisma.bundlePurchase.count({
      where: { bundleId: id, status: "COMPLETED" },
    });

    if (purchaseCount > 0) {
      // 구매 내역이 있으면 비활성화만 진행
      await prisma.bundle.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: "구매 내역이 있어 비활성화 처리되었습니다.",
        deactivated: true,
      });
    }

    // 구매 내역이 없으면 완전 삭제
    await prisma.bundle.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "번들이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting bundle:", error);
    return NextResponse.json(
      { error: "번들 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
