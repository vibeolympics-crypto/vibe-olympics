import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { securityLogger } from "@/lib/security";

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 상품 수정 스키마
const updateProductSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  shortDescription: z.string().min(10).max(200).optional(),
  description: z.string().min(50).optional(),
  categoryId: z.string().cuid().optional(),
  pricingType: z.enum(["FREE", "PAID"]).optional(),
  price: z.number().min(0).optional(),
  originalPrice: z.number().min(0).optional().nullable(),
  licenseType: z.enum(["PERSONAL", "COMMERCIAL", "EXTENDED"]).optional(),
  thumbnail: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED"]).optional(),
});

// 상품 상세 조회 (GET)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            totalSales: true,
            createdAt: true,
          },
        },
        files: {
          select: {
            id: true,
            name: true,
            size: true,
            type: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
            wishlists: true,
            purchases: true,
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

    // 조회수 증가 (비동기로 처리)
    prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(console.error);

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product GET error:", error);
    return NextResponse.json(
      { error: "상품을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 상품 수정 (PUT)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // 상품 조회 및 권한 확인
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (existingProduct.sellerId !== session.user.id) {
      // IDOR 시도 로깅
      securityLogger.log({
        type: 'IDOR_ATTEMPT',
        severity: 'high',
        userId: session.user.id,
        details: {
          action: 'UPDATE_PRODUCT',
          productId: id,
          actualOwnerId: existingProduct.sellerId,
        },
      });

      return NextResponse.json(
        { error: "수정 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 유효성 검사
    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 상품 업데이트
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        price: data.pricingType === "FREE" ? 0 : (data.price ?? undefined),
        // 상태가 PUBLISHED로 변경될 때 publishedAt 설정
        ...(data.status === "PUBLISHED" && {
          isPublished: true,
          publishedAt: new Date(),
        }),
      },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ message: "상품이 수정되었습니다", product });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "상품 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 상품 삭제 (DELETE)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 상품 조회 및 권한 확인
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { sellerId: true, salesCount: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (existingProduct.sellerId !== session.user.id) {
      // IDOR 시도 로깅
      securityLogger.log({
        type: 'IDOR_ATTEMPT',
        severity: 'high',
        userId: session.user.id,
        details: {
          action: 'DELETE_PRODUCT',
          productId: id,
          actualOwnerId: existingProduct.sellerId,
        },
      });

      return NextResponse.json(
        { error: "삭제 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 판매 이력이 있는 경우 삭제 불가
    if (existingProduct.salesCount > 0) {
      return NextResponse.json(
        { error: "판매 이력이 있는 상품은 삭제할 수 없습니다" },
        { status: 400 }
      );
    }

    // 상품 삭제
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ message: "상품이 삭제되었습니다" });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json(
      { error: "상품 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
