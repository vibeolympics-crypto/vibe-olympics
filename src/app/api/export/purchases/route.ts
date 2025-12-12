/**
 * 구매자용 구매 내역 엑셀 다운로드 API
 * GET /api/export/purchases
 * 
 * 권한: 로그인한 사용자 (본인 구매 내역만)
 * 쿼리 파라미터:
 *   - startDate: 시작일 (YYYY-MM-DD)
 *   - endDate: 종료일 (YYYY-MM-DD)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createExcelBuffer,
  PurchaseRow,
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

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 필터 조건 구성
    const where: Record<string, unknown> = {
      buyerId: session.user.id,
      status: "COMPLETED", // 완료된 구매만
    };
    
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

    // 구매 데이터 조회
    const purchases = await prisma.purchase.findMany({
      where,
      include: {
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
    const excelData: PurchaseRow[] = purchases.map((p) => ({
      구매번호: p.id,
      구매일시: formatDateKorean(p.createdAt),
      상품명: p.product.title,
      판매자: p.product.seller?.name || p.product.seller?.email || "-",
      결제금액: Number(p.amount),
      결제수단: p.paymentMethod || "Stripe",
      상태: purchaseStatusKorean[p.status] || p.status,
      다운로드횟수: p.downloadCount,
    }));

    // 합계 행 추가
    const totalAmount = excelData.reduce((sum, row) => sum + row.결제금액, 0);
    excelData.push({
      구매번호: "",
      구매일시: "",
      상품명: "【합계】",
      판매자: "",
      결제금액: totalAmount,
      결제수단: "",
      상태: "",
      다운로드횟수: 0,
    });

    // 엑셀 파일 생성
    const buffer = createExcelBuffer(excelData, "구매내역");
    const filename = generateFileName("purchases", {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userId: session.user.id,
    });

    // 응답 반환 (Buffer를 Uint8Array로 변환)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: getExcelResponseHeaders(filename),
    });
  } catch (error) {
    console.error("Export purchases error:", error);
    return NextResponse.json(
      { error: "구매 내역 다운로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
