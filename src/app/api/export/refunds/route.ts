/**
 * 환불 내역 엑셀 다운로드 API
 * GET /api/export/refunds
 * 
 * 권한: 관리자(ADMIN)만 접근 가능
 * 쿼리 파라미터:
 *   - startDate: 시작일 (YYYY-MM-DD)
 *   - endDate: 종료일 (YYYY-MM-DD)
 *   - status: 환불 상태 필터
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createExcelBuffer,
  RefundRow,
  refundStatusKorean,
  refundReasonKorean,
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

    // 환불 데이터 조회
    const refunds = await prisma.refundRequest.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        purchase: {
          include: {
            product: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 엑셀 데이터 변환
    const excelData: RefundRow[] = refunds.map((r) => ({
      환불번호: r.id,
      요청일시: formatDateKorean(r.createdAt),
      구매자: r.user.name || r.user.email || "-",
      상품명: r.purchase.product.title,
      환불금액: Number(r.amount),
      환불사유: refundReasonKorean[r.reason] || r.reason,
      상태: refundStatusKorean[r.status] || r.status,
      처리일: formatDateKorean(r.processedAt),
    }));

    // 합계 행 추가
    const totalAmount = excelData.reduce((sum, row) => sum + row.환불금액, 0);
    excelData.push({
      환불번호: "",
      요청일시: "",
      구매자: "【합계】",
      상품명: "",
      환불금액: totalAmount,
      환불사유: "",
      상태: "",
      처리일: "",
    });

    // 엑셀 파일 생성
    const buffer = createExcelBuffer(excelData, "환불내역");
    const filename = generateFileName("refunds", {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    // 응답 반환 (Buffer를 Uint8Array로 변환)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: getExcelResponseHeaders(filename),
    });
  } catch (error) {
    console.error("Export refunds error:", error);
    return NextResponse.json(
      { error: "환불 내역 다운로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
