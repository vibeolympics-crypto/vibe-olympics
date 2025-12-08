import * as PortOne from "@portone/browser-sdk/v2";

// 결제 수단 타입
export type PaymentMethod = "CARD" | "KAKAOPAY" | "TOSSPAY" | "STRIPE";

export interface PaymentRequest {
  orderName: string;
  totalAmount: number;
  currency: string;
  productId: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  error?: string;
}

// PortOne 스토어 ID (환경변수에서 가져옴)
const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
const PORTONE_CHANNEL_KEY_KAKAOPAY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY;
const PORTONE_CHANNEL_KEY_TOSSPAY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY;
const PORTONE_CHANNEL_KEY_CARD = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD;

// 주문 ID 생성
function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `VO-${timestamp}-${randomStr}`.toUpperCase();
}

// PortOne 결제 요청
export async function requestPortOnePayment(
  method: Exclude<PaymentMethod, "STRIPE">,
  request: PaymentRequest
): Promise<PaymentResponse> {
  if (!PORTONE_STORE_ID) {
    console.error("PortOne Store ID가 설정되지 않았습니다.");
    return { success: false, error: "결제 설정 오류" };
  }

  const orderId = generateOrderId();
  
  // 결제 채널 선택
  let channelKey: string | undefined;
  let payMethod: string;
  
  switch (method) {
    case "KAKAOPAY":
      channelKey = PORTONE_CHANNEL_KEY_KAKAOPAY;
      payMethod = "EASY_PAY";
      break;
    case "TOSSPAY":
      channelKey = PORTONE_CHANNEL_KEY_TOSSPAY;
      payMethod = "EASY_PAY";
      break;
    case "CARD":
    default:
      channelKey = PORTONE_CHANNEL_KEY_CARD;
      payMethod = "CARD";
      break;
  }

  if (!channelKey) {
    console.error(`${method} 채널 키가 설정되지 않았습니다.`);
    return { success: false, error: "결제 채널 설정 오류" };
  }

  try {
    const response = await PortOne.requestPayment({
      storeId: PORTONE_STORE_ID,
      channelKey: channelKey,
      paymentId: orderId,
      orderName: request.orderName,
      totalAmount: request.totalAmount,
      currency: request.currency as "KRW" | "USD",
      payMethod: payMethod as "CARD" | "EASY_PAY",
      customer: {
        fullName: request.buyerName,
        email: request.buyerEmail,
        phoneNumber: request.buyerPhone,
      },
      customData: {
        productId: request.productId,
      },
      redirectUrl: `${window.location.origin}/api/payment/portone/callback`,
    });

    if (response?.code) {
      // 결제 실패
      return {
        success: false,
        error: response.message || "결제가 실패했습니다.",
      };
    }

    // 결제 성공 - 서버에서 검증
    return {
      success: true,
      paymentId: response?.paymentId,
      transactionId: response?.txId,
    };
  } catch (error) {
    console.error("PortOne 결제 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "결제 처리 중 오류가 발생했습니다.",
    };
  }
}

// 결제 수단 정보
export const paymentMethods = [
  {
    id: "CARD" as PaymentMethod,
    name: "신용/체크카드",
    icon: "💳",
    description: "모든 카드 결제 가능",
    available: true,
  },
  {
    id: "KAKAOPAY" as PaymentMethod,
    name: "카카오페이",
    icon: "🟡",
    description: "카카오페이로 간편 결제",
    available: !!PORTONE_CHANNEL_KEY_KAKAOPAY,
  },
  {
    id: "TOSSPAY" as PaymentMethod,
    name: "토스페이",
    icon: "🔵",
    description: "토스페이로 간편 결제",
    available: !!PORTONE_CHANNEL_KEY_TOSSPAY,
  },
  {
    id: "STRIPE" as PaymentMethod,
    name: "해외 카드",
    icon: "🌍",
    description: "Stripe로 해외 카드 결제",
    available: true,
  },
];

// 간편 결제 시작 함수 (product-detail-content에서 사용)
export interface InitiatePaymentParams {
  paymentId: string;
  productId: string;
  productName: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  method: PaymentMethod;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

export async function initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult> {
  const { paymentId, productId, productName, amount, buyerName, buyerEmail, method } = params;

  if (method === "STRIPE") {
    return { success: false, error: "Stripe는 별도 처리가 필요합니다." };
  }

  const response = await requestPortOnePayment(method, {
    orderName: productName,
    totalAmount: amount,
    currency: "KRW",
    productId,
    buyerName,
    buyerEmail,
  });

  return {
    success: response.success,
    paymentId: response.paymentId || paymentId,
    error: response.error,
  };
}

// 결제 검증 함수 (클라이언트에서 서버 API 호출)
export interface VerifyPaymentResult {
  success: boolean;
  purchase?: {
    id: string;
    status: string;
  };
  error?: string;
}

export async function verifyPayment(paymentId: string): Promise<VerifyPaymentResult> {
  try {
    const response = await fetch("/api/payment/portone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
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
    console.error("결제 검증 오류:", error);
    return {
      success: false,
      error: "결제 검증 중 오류가 발생했습니다.",
    };
  }
}
