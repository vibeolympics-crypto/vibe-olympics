/**
 * 전체 거래 내역 엑셀 다운로드 API
 * GET /api/export/transactions
 * 
 * 권한: 관리자(ADMIN)만 접근 가능
 * 쿼리 파라미터:
 *   - startDate: 시작일 (YYYY-MM-DD)
 *   - endDate: 종료일 (YYYY-MM-DD)
 *   - status: 거래 상태 필터
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createExcelBuffer,
  TransactionRow,
  purchaseStatusKorean,
  formatDateKorean,
  generateFileName,
  getExcelResponseHeaders,
} from "@/lib/excel";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // 필터 조건 구성
    const where: Record<string, unknown> = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = end;
      }
    }

    if (status) {
      where.status = status;
    }

    // 거래 데이터 조회
    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        buyer: { select: { name: true, email: true } },
        product: {
          select: {
            title: true,
            seller: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 엑셀 데이터 변환
    const excelData: TransactionRow[] = purchases.map((p) => ({
      거래번호: p.id,
      거래일시: formatDateKorean(p.createdAt),
      상품명: p.product.title,
      판매자: p.product.seller?.name || p.product.seller?.email || "-",
      구매자: p.buyer.name || p.buyer.email || "-",
      결제금액: Number(p.amount),
      결제수단: p.paymentMethod || "Stripe",
      상태: purchaseStatusKorean[p.status] || p.status,
      결제ID: p.paymentId || "-",
    }));

    // 엑셀 파일 생성
    const buffer = createExcelBuffer(excelData, "전체거래내역");
    const filename = generateFileName("transactions", {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    // 응답 반환 (Buffer를 Uint8Array로 변환)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: getExcelResponseHeaders(filename),
    });
  } catch (error) {
    console.error("Export transactions error:", error);
    return NextResponse.json(
      { error: "거래 내역 다운로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
