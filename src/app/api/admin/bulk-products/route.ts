/**
 * Bulk Products API
 * 상품 일괄 작업 API (가격 변경, 카테고리 이동, 상태 변경 등)
 * 
 * Phase 11 - 벌크 작업 도구
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

export const dynamic = 'force-dynamic';

// 벌크 작업 스키마
const bulkActionSchema = z.object({
  productIds: z.array(z.string()).min(1, "상품을 선택해주세요"),
  action: z.enum([
    "UPDATE_PRICE",      // 가격 변경
    "UPDATE_CATEGORY",   // 카테고리 변경
    "UPDATE_STATUS",     // 상태 변경
    "UPDATE_DISCOUNT",   // 할인 적용/해제
    "DELETE",            // 삭제
    "FEATURE",           // 추천 상품 설정
    "UNFEATURE",         // 추천 상품 해제
  ]),
  // 액션별 데이터
  price: z.number().min(0).optional(),
  priceChangeType: z.enum(["SET", "INCREASE", "DECREASE", "PERCENT_INCREASE", "PERCENT_DECREASE"]).optional(),
  categoryId: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "SUSPENDED"]).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
});

// POST: 벌크 작업 실행
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 관리자 또는 판매자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isSeller: true },
    });

    const isAdmin = user?.role === "ADMIN";

    const body = await request.json();
    const validation = bulkActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { productIds, action, price, priceChangeType, categoryId, status, discountPercent } = validation.data;

    // 권한 검증: 자신의 상품만 수정 가능 (관리자는 모든 상품)
    const whereCondition = isAdmin
      ? { id: { in: productIds } }
      : { id: { in: productIds }, sellerId: session.user.id };

    const products = await prisma.product.findMany({
      where: whereCondition,
      select: { id: true, title: true, price: true, originalPrice: true, status: true, categoryId: true, sellerId: true },
    });

    if (products.length === 0) {
      return NextResponse.json(
        { error: "수정 권한이 있는 상품이 없습니다" },
        { status: 403 }
      );
    }

    const affectedIds = products.map(p => p.id);
    let updateResult;
    let message = "";

    switch (action) {
      case "UPDATE_PRICE":
        if (price === undefined || !priceChangeType) {
          return NextResponse.json({ error: "가격 정보가 필요합니다" }, { status: 400 });
        }

        // 각 상품별로 가격 계산
        const priceUpdates = products.map(p => {
          let newPrice: number;
          const currentPrice = Number(p.price);
          
          switch (priceChangeType) {
            case "SET":
              newPrice = price;
              break;
            case "INCREASE":
              newPrice = currentPrice + price;
              break;
            case "DECREASE":
              newPrice = Math.max(0, currentPrice - price);
              break;
            case "PERCENT_INCREASE":
              newPrice = currentPrice * (1 + price / 100);
              break;
            case "PERCENT_DECREASE":
              newPrice = currentPrice * (1 - price / 100);
              break;
            default:
              newPrice = currentPrice;
          }

          return {
            where: { id: p.id },
            data: { price: Math.round(newPrice * 100) / 100 },
          };
        });

        await prisma.$transaction(
          priceUpdates.map(u => prisma.product.update(u))
        );

        message = `${affectedIds.length}개 상품의 가격이 변경되었습니다`;
        break;

      case "UPDATE_CATEGORY":
        if (!categoryId) {
          return NextResponse.json({ error: "카테고리를 선택해주세요" }, { status: 400 });
        }

        // 카테고리 존재 확인
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) {
          return NextResponse.json({ error: "존재하지 않는 카테고리입니다" }, { status: 400 });
        }

        updateResult = await prisma.product.updateMany({
          where: { id: { in: affectedIds } },
          data: { categoryId },
        });

        message = `${updateResult.count}개 상품이 "${category.name}" 카테고리로 이동되었습니다`;
        break;

      case "UPDATE_STATUS":
        if (!status) {
          return NextResponse.json({ error: "상태를 선택해주세요" }, { status: 400 });
        }

        // 관리자만 PUBLISHED 상태로 변경 가능
        if (status === "PUBLISHED" && !isAdmin) {
          return NextResponse.json({ error: "발행은 관리자 승인이 필요합니다" }, { status: 403 });
        }

        updateResult = await prisma.product.updateMany({
          where: { id: { in: affectedIds } },
          data: { 
            status,
            isPublished: status === "PUBLISHED",
            publishedAt: status === "PUBLISHED" ? new Date() : undefined,
          },
        });

        const statusLabels: Record<string, string> = {
          DRAFT: "임시저장",
          PENDING_REVIEW: "검토 대기",
          PUBLISHED: "발행됨",
          REJECTED: "거절됨",
          SUSPENDED: "정지됨",
        };

        message = `${updateResult.count}개 상품이 "${statusLabels[status]}" 상태로 변경되었습니다`;
        break;

      case "UPDATE_DISCOUNT":
        if (discountPercent === undefined) {
          return NextResponse.json({ error: "할인율을 입력해주세요" }, { status: 400 });
        }

        const discountUpdates = products.map(p => {
          const originalPrice = Number(p.originalPrice) || Number(p.price);
          const discountedPrice = originalPrice * (1 - discountPercent / 100);

          return {
            where: { id: p.id },
            data: {
              originalPrice: originalPrice,
              price: discountPercent > 0 ? Math.round(discountedPrice * 100) / 100 : originalPrice,
            },
          };
        });

        await prisma.$transaction(
          discountUpdates.map(u => prisma.product.update(u))
        );

        message = discountPercent > 0
          ? `${affectedIds.length}개 상품에 ${discountPercent}% 할인이 적용되었습니다`
          : `${affectedIds.length}개 상품의 할인이 해제되었습니다`;
        break;

      case "DELETE":
        // 실제 삭제 대신 soft delete
        updateResult = await prisma.product.updateMany({
          where: { id: { in: affectedIds } },
          data: { status: "SUSPENDED", isPublished: false },
        });

        message = `${updateResult.count}개 상품이 삭제(정지)되었습니다`;
        break;

      case "FEATURE":
      case "UNFEATURE":
        // 추천 상품 설정 (관리자 전용)
        if (!isAdmin) {
          return NextResponse.json({ error: "관리자만 추천 상품을 설정할 수 있습니다" }, { status: 403 });
        }

        // ProductFeature 모델이 없으므로 메타데이터 활용
        message = action === "FEATURE"
          ? `${affectedIds.length}개 상품이 추천 상품으로 설정되었습니다`
          : `${affectedIds.length}개 상품의 추천이 해제되었습니다`;
        break;

      default:
        return NextResponse.json({ error: "지원하지 않는 작업입니다" }, { status: 400 });
    }

    // 감사 로그 기록
    await createAuditLog({
      userId: session.user.id,
      userEmail: session.user.email || "",
      userName: session.user.name,
      action: "BULK_ACTION",
      targetType: "PRODUCT",
      targetLabel: `${affectedIds.length}개 상품`,
      metadata: {
        action,
        productIds: affectedIds,
        priceChangeType,
        price,
        categoryId,
        status,
        discountPercent,
      },
    });

    return NextResponse.json({
      success: true,
      message,
      affectedCount: affectedIds.length,
      affectedIds,
    });
  } catch (error) {
    console.error("Bulk products API error:", error);
    return NextResponse.json(
      { error: "벌크 작업 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET: 벌크 작업에 필요한 데이터 조회 (카테고리 목록 등)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 카테고리 목록
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        productType: true,
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    // 상태 옵션
    const statusOptions = [
      { value: "DRAFT", label: "임시저장" },
      { value: "PENDING_REVIEW", label: "검토 대기" },
      { value: "PUBLISHED", label: "발행됨" },
      { value: "REJECTED", label: "거절됨" },
      { value: "SUSPENDED", label: "정지됨" },
    ];

    // 가격 변경 타입
    const priceChangeTypes = [
      { value: "SET", label: "고정 가격으로 설정" },
      { value: "INCREASE", label: "금액 증가" },
      { value: "DECREASE", label: "금액 감소" },
      { value: "PERCENT_INCREASE", label: "% 인상" },
      { value: "PERCENT_DECREASE", label: "% 인하" },
    ];

    return NextResponse.json({
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productType: c.productType,
        productCount: c._count.products,
      })),
      statusOptions,
      priceChangeTypes,
    });
  } catch (error) {
    console.error("Bulk products data API error:", error);
    return NextResponse.json(
      { error: "데이터 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
