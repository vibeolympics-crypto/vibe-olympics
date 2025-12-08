/**
 * 정산 내역 엑셀 다운로드 API
 * GET /api/export/settlements
 * 
 * 권한: 
 *   - 관리자: 전체 정산 내역
 *   - 판매자: 본인 정산 내역
 * 쿼리 파라미터:
 *   - startDate: 시작일 (YYYY-MM-DD)
 *   - endDate: 종료일 (YYYY-MM-DD)
 *   - status: 정산 상태 필터
 *   - sellerId: 판매자 ID (관리자 전용)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createExcelBuffer,
  SettlementRow,
  settlementStatusKorean,
  formatDateKorean,
  formatPeriod,
  generateFileName,
  getExcelResponseHeaders,
} from "@/lib/excel";

export async function GET(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isSeller: true },
    });

    const isAdmin = user?.role === "ADMIN";
    const isSeller = user?.isSeller;

    if (!isAdmin && !isSeller) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");

    // 필터 조건 구성
    const where: Record<string, unknown> = {};
    
    // 관리자가 아니면 본인 정산만
    if (!isAdmin) {
      where.sellerId = session.user.id;
    } else if (sellerId) {
      where.sellerId = sellerId;
    }
    
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

    // 정산 데이터 조회
    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        seller: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 엑셀 데이터 변환
    const excelData: SettlementRow[] = settlements.map((s) => ({
      정산번호: s.id,
      정산기간: formatPeriod(s.periodStart, s.periodEnd),
      판매자: s.seller.name || s.seller.email || "-",
      총판매액: Number(s.totalSales),
      판매건수: s.salesCount,
      플랫폼수수료: Number(s.platformFee),
      PG수수료: Number(s.paymentFee),
      정산금액: Number(s.netAmount),
      상태: settlementStatusKorean[s.status] || s.status,
      처리일: formatDateKorean(s.processedAt),
      입금일: formatDateKorean(s.paidAt),
    }));

    // 합계 행 추가
    const totals = excelData.reduce(
      (acc, row) => ({
        총판매액: acc.총판매액 + row.총판매액,
        판매건수: acc.판매건수 + row.판매건수,
        플랫폼수수료: acc.플랫폼수수료 + row.플랫폼수수료,
        PG수수료: acc.PG수수료 + row.PG수수료,
        정산금액: acc.정산금액 + row.정산금액,
      }),
      { 총판매액: 0, 판매건수: 0, 플랫폼수수료: 0, PG수수료: 0, 정산금액: 0 }
    );

    excelData.push({
      정산번호: "",
      정산기간: "【합계】",
      판매자: "",
      총판매액: totals.총판매액,
      판매건수: totals.판매건수,
      플랫폼수수료: totals.플랫폼수수료,
      PG수수료: totals.PG수수료,
      정산금액: totals.정산금액,
      상태: "",
      처리일: "",
      입금일: "",
    });

    // 엑셀 파일 생성
    const buffer = createExcelBuffer(excelData, "정산내역");
    const filename = generateFileName("settlements", {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    // 응답 반환 (Buffer를 Uint8Array로 변환)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: getExcelResponseHeaders(filename),
    });
  } catch (error) {
    console.error("Export settlements error:", error);
    return NextResponse.json(
      { error: "정산 내역 다운로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
