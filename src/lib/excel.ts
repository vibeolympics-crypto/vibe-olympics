/**
 * Excel Export Utility
 * 거래 내역, 정산 내역, 구매/판매 내역을 엑셀로 내보내기
 */

import * as XLSX from "xlsx";

// ==========================================
// 타입 정의
// ==========================================

// Index signature를 포함한 기본 Row 타입
export type ExcelRow = Record<string, string | number | boolean | null | undefined>;

export interface TransactionRow extends ExcelRow {
  거래번호: string;
  거래일시: string;
  상품명: string;
  판매자: string;
  구매자: string;
  결제금액: number;
  결제수단: string;
  상태: string;
  결제ID: string;
}

export interface PurchaseRow extends ExcelRow {
  구매번호: string;
  구매일시: string;
  상품명: string;
  판매자: string;
  결제금액: number;
  결제수단: string;
  상태: string;
  다운로드횟수: number;
}

export interface SaleRow extends ExcelRow {
  판매번호: string;
  판매일시: string;
  상품명: string;
  구매자: string;
  판매금액: number;
  플랫폼수수료: number;
  PG수수료: number;
  정산금액: number;
  정산상태: string;
}

export interface SettlementRow extends ExcelRow {
  정산번호: string;
  정산기간: string;
  판매자: string;
  총판매액: number;
  판매건수: number;
  플랫폼수수료: number;
  PG수수료: number;
  정산금액: number;
  상태: string;
  처리일: string;
  입금일: string;
}

export interface RefundRow extends ExcelRow {
  환불번호: string;
  요청일시: string;
  구매자: string;
  상품명: string;
  환불금액: number;
  환불사유: string;
  상태: string;
  처리일: string;
}

export interface MonthlyStatementRow extends ExcelRow {
  월: string;
  총판매액: number;
  총판매건수: number;
  플랫폼수수료: number;
  PG수수료: number;
  총정산액: number;
  환불액: number;
  순수익: number;
}

// ==========================================
// 엑셀 생성 함수
// ==========================================

/**
 * 데이터를 엑셀 버퍼로 변환
 */
export function createExcelBuffer<T extends ExcelRow>(
  data: T[],
  sheetName: string = "Sheet1"
): Buffer {
  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // 컬럼 너비 자동 조정
  const columnWidths = calculateColumnWidths(data);
  worksheet["!cols"] = columnWidths;
  
  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // 버퍼로 변환
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  
  return buffer;
}

/**
 * 여러 시트가 있는 엑셀 생성
 */
export function createMultiSheetExcel(
  sheets: { name: string; data: ExcelRow[] }[]
): Buffer {
  const workbook = XLSX.utils.book_new();
  
  for (const sheet of sheets) {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);
    worksheet["!cols"] = calculateColumnWidths(sheet.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }
  
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * 컬럼 너비 계산
 */
function calculateColumnWidths<T extends ExcelRow>(
  data: T[]
): XLSX.ColInfo[] {
  if (data.length === 0) return [];
  
  const keys = Object.keys(data[0]);
  return keys.map((key) => {
    // 헤더 길이
    let maxWidth = key.length;
    
    // 데이터 중 가장 긴 값 찾기
    for (const row of data) {
      const value = row[key];
      const valueLength = value != null ? String(value).length : 0;
      if (valueLength > maxWidth) {
        maxWidth = valueLength;
      }
    }
    
    // 한글은 2배 너비 적용 (대략적)
    const hasKorean = /[가-힣]/.test(key);
    const width = hasKorean ? Math.min(maxWidth * 1.5, 50) : Math.min(maxWidth + 2, 50);
    
    return { wch: width };
  });
}

// ==========================================
// 상태 변환 함수
// ==========================================

export const purchaseStatusKorean: Record<string, string> = {
  PENDING: "결제 대기",
  COMPLETED: "완료",
  FAILED: "결제 실패",
  REFUNDED: "환불됨",
  CANCELLED: "취소됨",
};

export const settlementStatusKorean: Record<string, string> = {
  PENDING: "정산 대기",
  READY: "정산 준비",
  PROCESSING: "처리 중",
  COMPLETED: "정산 완료",
  FAILED: "실패",
  CANCELLED: "취소",
};

export const refundStatusKorean: Record<string, string> = {
  PENDING: "검토 대기",
  REVIEWING: "검토 중",
  APPROVED: "승인",
  COMPLETED: "환불 완료",
  REJECTED: "거절",
  CANCELLED: "취소",
};

export const refundReasonKorean: Record<string, string> = {
  PRODUCT_MISMATCH: "상품 설명과 다름",
  DOWNLOAD_ISSUE: "다운로드 불가",
  DUPLICATE_PURCHASE: "중복 결제",
  COPYRIGHT_ISSUE: "저작권 문제",
  TECHNICAL_ISSUE: "기술적 문제",
  OTHER: "기타",
};

// ==========================================
// 날짜 포맷 함수
// ==========================================

export function formatDateKorean(date: Date | string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(date: Date | string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatPeriod(start: Date | string, end: Date | string): string {
  return `${formatDateOnly(start)} ~ ${formatDateOnly(end)}`;
}

// ==========================================
// 금액 계산 함수
// ==========================================

const PLATFORM_FEE_RATE = 0.10;  // 10%
const PAYMENT_FEE_RATE = 0.035; // 3.5%

export function calculateFees(amount: number): {
  platformFee: number;
  paymentFee: number;
  netAmount: number;
} {
  const platformFee = Math.round(amount * PLATFORM_FEE_RATE);
  const paymentFee = Math.round(amount * PAYMENT_FEE_RATE);
  const netAmount = amount - platformFee - paymentFee;
  
  return { platformFee, paymentFee, netAmount };
}

// ==========================================
// 파일명 생성 함수
// ==========================================

export function generateFileName(
  type: "transactions" | "purchases" | "sales" | "settlements" | "refunds" | "monthly",
  options?: { startDate?: string; endDate?: string; userId?: string }
): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  
  let prefix = "";
  switch (type) {
    case "transactions":
      prefix = "전체거래내역";
      break;
    case "purchases":
      prefix = "구매내역";
      break;
    case "sales":
      prefix = "판매내역";
      break;
    case "settlements":
      prefix = "정산내역";
      break;
    case "refunds":
      prefix = "환불내역";
      break;
    case "monthly":
      prefix = "월간정산";
      break;
  }
  
  let suffix = timestamp;
  if (options?.startDate && options?.endDate) {
    suffix = `${options.startDate.replace(/-/g, "")}_${options.endDate.replace(/-/g, "")}`;
  }
  
  return `${prefix}_${suffix}.xlsx`;
}

// ==========================================
// Response 헤더 생성
// ==========================================

export function getExcelResponseHeaders(filename: string): HeadersInit {
  // 파일명 URL 인코딩 (한글 지원)
  const encodedFilename = encodeURIComponent(filename);
  
  return {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
    "Cache-Control": "no-cache",
  };
}
