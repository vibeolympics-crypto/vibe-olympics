import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * POST /api/products/[id]/view
 * 상품 조회수를 증가시킵니다.
 * GET 요청과 분리하여 명시적으로 조회수를 기록할 때 사용합니다.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 상품 존재 여부 확인
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, viewCount: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 조회수 증가
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        viewCount: updatedProduct.viewCount,
      },
    });
  } catch (error) {
    console.error("[Product View API] Error:", error);
    return NextResponse.json(
      { error: "조회수 업데이트 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/[id]/view
 * 상품의 현재 조회수를 반환합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { viewCount: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        viewCount: product.viewCount,
      },
    });
  } catch (error) {
    console.error("[Product View API] Error:", error);
    return NextResponse.json(
      { error: "조회수 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
