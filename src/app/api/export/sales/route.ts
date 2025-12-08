/**
 * 판매자용 판매 내역 엑셀 다운로드 API
 * GET /api/export/sales
 * 
 * 권한: 판매자 (본인 판매 내역만)
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
  SaleRow,
  formatDateKorean,
  generateFileName,
  getExcelResponseHeaders,
  calculateFees,
} from "@/lib/excel";

export async function GET(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 판매자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSeller: true },
    });

    if (!user?.isSeller) {
      return NextResponse.json(
        { error: "판매자만 접근할 수 있습니다." },
        { status: 403 }
      );
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 필터 조건 구성
    const where: Record<string, unknown> = {
      product: {
        sellerId: session.user.id,
      },
      status: "COMPLETED", // 완료된 판매만
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

    // 판매 데이터 조회
    const sales = await prisma.purchase.findMany({
      where,
      include: {
        buyer: { select: { name: true, email: true } },
        product: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 엑셀 데이터 변환
    const excelData: SaleRow[] = sales.map((s) => {
      const amount = Number(s.amount);
      const fees = calculateFees(amount);
      
      return {
        판매번호: s.id,
        판매일시: formatDateKorean(s.createdAt),
        상품명: s.product.title,
        구매자: s.buyer.name || s.buyer.email || "-",
        판매금액: amount,
        플랫폼수수료: fees.platformFee,
        PG수수료: fees.paymentFee,
        정산금액: fees.netAmount,
        정산상태: s.isSettled ? "정산완료" : "정산대기",
      };
    });

    // 합계 행 추가
    const totals = excelData.reduce(
      (acc, row) => ({
        판매금액: acc.판매금액 + row.판매금액,
        플랫폼수수료: acc.플랫폼수수료 + row.플랫폼수수료,
        PG수수료: acc.PG수수료 + row.PG수수료,
        정산금액: acc.정산금액 + row.정산금액,
      }),
      { 판매금액: 0, 플랫폼수수료: 0, PG수수료: 0, 정산금액: 0 }
    );

    excelData.push({
      판매번호: "",
      판매일시: "",
      상품명: "【합계】",
      구매자: "",
      판매금액: totals.판매금액,
      플랫폼수수료: totals.플랫폼수수료,
      PG수수료: totals.PG수수료,
      정산금액: totals.정산금액,
      정산상태: "",
    });

    // 엑셀 파일 생성
    const buffer = createExcelBuffer(excelData, "판매내역");
    const filename = generateFileName("sales", {
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
    console.error("Export sales error:", error);
    return NextResponse.json(
      { error: "판매 내역 다운로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
