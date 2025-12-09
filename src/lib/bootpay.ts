"use client";

import { Bootpay } from "@bootpay/client-js";

// 결제 수단 타입
export type BootpayPaymentMethod = 
  | "card"      // 신용/체크카드
  | "phone"     // 휴대폰 결제
  | "bank"      // 계좌이체
  | "vbank"     // 가상계좌
  | "kakao"     // 카카오페이
  | "naver"     // 네이버페이
  | "toss"      // 토스페이
  | "payco";    // 페이코

// PG사 타입 (부트페이에서 지원)
export type BootpayPG = 
  | "kcp"       // NHN KCP
  | "inicis"    // 이니시스
  | "nicepay"   // 나이스페이
  | "tosspayments" // 토스페이먼츠
  | "kakaopay"  // 카카오페이
  | "naverpay"  // 네이버페이
  | "payco";    // 페이코

export interface BootpayPaymentRequest {
  orderName: string;
  totalAmount: number;
  orderId?: string;
  productId: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface BootpayPaymentResponse {
  success: boolean;
  receiptId?: string;
  orderId?: string;
  error?: string;
  errorCode?: string;
}

export interface BootpayItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

// 환경변수에서 부트페이 설정 가져오기
const BOOTPAY_APPLICATION_ID = process.env.NEXT_PUBLIC_BOOTPAY_JS_KEY;

// 주문 ID 생성
function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `VO-${timestamp}-${randomStr}`.toUpperCase();
}

// 부트페이 결제 요청
export async function requestBootpayPayment(
  method: BootpayPaymentMethod,
  request: BootpayPaymentRequest
): Promise<BootpayPaymentResponse> {
  if (!BOOTPAY_APPLICATION_ID) {
    console.error("Bootpay Application ID가 설정되지 않았습니다.");
    return { success: false, error: "결제 설정 오류: Application ID 누락" };
  }

  const orderId = request.orderId || generateOrderId();

  // 결제 수단 매핑
  const methodMap: Record<BootpayPaymentMethod, string> = {
    card: "카드",
    phone: "휴대폰",
    bank: "계좌이체",
    vbank: "가상계좌",
    kakao: "카카오페이",
    naver: "네이버페이",
    toss: "토스",
    payco: "페이코",
  };

  try {
    const response = await Bootpay.requestPayment({
      application_id: BOOTPAY_APPLICATION_ID,
      price: request.totalAmount,
      order_name: request.orderName,
      order_id: orderId,
      tax_free: 0,
      user: {
        username: request.buyerName || "",
        phone: request.buyerPhone || "",
        email: request.buyerEmail || "",
      },
      items: [
        {
          id: request.productId,
          name: request.orderName,
          price: request.totalAmount,
          qty: 1,
        },
      ],
      extra: {
        open_type: "iframe", // iframe, popup, redirect
        card_quota: "0,2,3,4,5,6", // 일시불, 2~6개월 할부
        escrow: false, // 에스크로 결제 여부
        separately_confirmed: true, // 서버 승인을 위해 true 설정
        browser_open_type: [
          // 특정 브라우저에서 다른 방식으로 열기
          { browser: "instagram", open_type: "redirect" },
          { browser: "facebook", open_type: "redirect" },
          { browser: "kakaotalk", open_type: "popup" },
          { browser: "naver", open_type: "popup" },
        ],
      },
      metadata: {
        productId: request.productId,
        ...request.metadata,
      },
      method: methodMap[method] || "카드",
    });

    // 이벤트 처리
    switch (response.event) {
      case "issued":
        // 가상계좌 발급 완료
        return {
          success: true,
          receiptId: response.receipt_id,
          orderId: response.order_id,
        };
      
      case "done":
        // 결제 완료
        return {
          success: true,
          receiptId: response.receipt_id,
          orderId: response.order_id,
        };
      
      case "confirm":
        // 서버 승인 필요 (separately_confirmed: true인 경우)
        // 서버에서 승인 처리 후 Bootpay.confirm() 호출
        return {
          success: true,
          receiptId: response.receipt_id,
          orderId: response.order_id,
        };
      
      default:
        return {
          success: false,
          error: "알 수 없는 결제 응답",
        };
    }
  } catch (e: unknown) {
    const error = e as {
      event?: string;
      error_code?: string;
      pg_error_code?: string;
      message?: string;
    };

    console.error("Bootpay 결제 오류:", error);

    // 사용자가 결제창을 닫은 경우
    if (error.event === "cancel") {
      return {
        success: false,
        error: "결제가 취소되었습니다.",
        errorCode: "USER_CANCEL",
      };
    }

    // 결제 중 에러 발생
    return {
      success: false,
      error: error.message || "결제 처리 중 오류가 발생했습니다.",
      errorCode: error.error_code || error.pg_error_code,
    };
  }
}

// 클라이언트에서 서버 승인 처리
export async function confirmBootpayPayment(receiptId: string): Promise<BootpayPaymentResponse> {
  try {
    const confirmedData = await Bootpay.confirm();
    
    if (confirmedData.event === "done") {
      return {
        success: true,
        receiptId: confirmedData.receipt_id,
        orderId: confirmedData.order_id,
      };
    }

    return {
      success: false,
      error: "결제 승인 실패",
    };
  } catch (e: unknown) {
    const error = e as { message?: string };
    console.error("Bootpay 승인 오류:", error);
    return {
      success: false,
      error: error.message || "결제 승인 중 오류가 발생했습니다.",
    };
  }
}

// 결제창 닫기
export function destroyBootpay(): void {
  Bootpay.destroy();
}

// 결제 수단 정보
export const bootpayPaymentMethods = [
  {
    id: "card" as BootpayPaymentMethod,
    name: "신용/체크카드",
    icon: "💳",
    description: "모든 카드 결제 가능",
    available: true,
  },
  {
    id: "kakao" as BootpayPaymentMethod,
    name: "카카오페이",
    icon: "🟡",
    description: "카카오페이로 간편 결제",
    available: true,
  },
  {
    id: "naver" as BootpayPaymentMethod,
    name: "네이버페이",
    icon: "🟢",
    description: "네이버페이로 간편 결제",
    available: true,
  },
  {
    id: "toss" as BootpayPaymentMethod,
    name: "토스페이",
    icon: "🔵",
    description: "토스페이로 간편 결제",
    available: true,
  },
  {
    id: "phone" as BootpayPaymentMethod,
    name: "휴대폰 결제",
    icon: "📱",
    description: "휴대폰 소액결제",
    available: true,
  },
  {
    id: "bank" as BootpayPaymentMethod,
    name: "계좌이체",
    icon: "🏦",
    description: "실시간 계좌이체",
    available: true,
  },
  {
    id: "vbank" as BootpayPaymentMethod,
    name: "가상계좌",
    icon: "🧾",
    description: "가상계좌 입금",
    available: true,
  },
];

// 간편 결제 시작 함수
export interface InitiateBootpayParams {
  paymentId: string;
  productId: string;
  productName: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  method: BootpayPaymentMethod;
}

export interface BootpayResult {
  success: boolean;
  receiptId?: string;
  orderId?: string;
  error?: string;
}

export async function initiateBootpayPayment(params: InitiateBootpayParams): Promise<BootpayResult> {
  const { productId, productName, amount, buyerName, buyerEmail, buyerPhone, method } = params;

  const response = await requestBootpayPayment(method, {
    orderName: productName,
    totalAmount: amount,
    productId,
    buyerName,
    buyerEmail,
    buyerPhone,
  });

  return {
    success: response.success,
    receiptId: response.receiptId,
    orderId: response.orderId,
    error: response.error,
  };
}

// 결제 검증 함수 (클라이언트에서 서버 API 호출)
export interface VerifyBootpayResult {
  success: boolean;
  purchase?: {
    id: string;
    status: string;
  };
  error?: string;
}

export async function verifyBootpayPayment(
  receiptId: string,
  productId: string
): Promise<VerifyBootpayResult> {
  try {
    const response = await fetch("/api/payment/bootpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptId, productId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "결제 검증 실패",
      };
    }

    return {
      success: true,
      purchase: data.purchase,
    };
  } catch (error) {
    console.error("Bootpay 결제 검증 오류:", error);
    return {
      success: false,
      error: "결제 검증 중 오류가 발생했습니다.",
    };
  }
}
