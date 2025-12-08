import Stripe from "stripe";

// Stripe 클라이언트 (lazy initialization)
let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeClient;
}

// 레거시 export (하위 호환성)
export const stripe = {
  get checkout() {
    return getStripeClient().checkout;
  },
  get refunds() {
    return getStripeClient().refunds;
  },
  get webhooks() {
    return getStripeClient().webhooks;
  },
};

// 결제 세션 생성
export async function createCheckoutSession({
  productId,
  productTitle,
  productDescription,
  productImage,
  price,
  userId,
  successUrl,
  cancelUrl,
}: {
  productId: string;
  productTitle: string;
  productDescription?: string;
  productImage?: string;
  price: number;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripeInstance = getStripeClient();
  const session = await stripeInstance.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "krw",
          product_data: {
            name: productTitle,
            description: productDescription || undefined,
            images: productImage ? [productImage] : undefined,
          },
          unit_amount: price, // KRW는 소수점 없음
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      productId,
      userId,
    },
    // 한국어 설정
    locale: "ko",
  });

  return session;
}

// 결제 검증
export async function retrieveCheckoutSession(sessionId: string) {
  const stripeInstance = getStripeClient();
  const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
  return session;
}

// 환불 처리
export async function createRefund(paymentIntentId: string, amount?: number) {
  const stripeInstance = getStripeClient();
  const refund = await stripeInstance.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount, // 부분 환불 시 금액 지정
  });
  return refund;
}
