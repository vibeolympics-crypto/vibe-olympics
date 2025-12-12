/**
 * 프로모션 스케줄러
 * 할인 시작/종료 시간 예약 기능
 * 
 * Phase 11 - P11-07
 */

import { prisma } from "@/lib/prisma";
import { sendEmail, APP_NAME, APP_URL, baseLayout } from "@/lib/email";
import { recordEvent } from "@/lib/realtime-events";

// 프로모션 타입
export type PromotionType = "FLASH_SALE" | "SEASONAL" | "BUNDLE" | "CLEARANCE";

// 프로모션 상태
export type PromotionStatus = "SCHEDULED" | "ACTIVE" | "ENDED" | "CANCELLED";

// 프로모션 인터페이스
export interface Promotion {
  id: string;
  sellerId: string;
  name: string;
  description?: string;
  type: PromotionType;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number; // 할인율(%) 또는 할인금액(원)
  productIds: string[];
  startDate: Date;
  endDate: Date;
  status: PromotionStatus;
  createdAt: Date;
  updatedAt: Date;
  appliedPrices?: Map<string, { original: number; discounted: number }>;
}

// 메모리 기반 프로모션 저장소 (실제로는 DB 모델로 대체해야 함)
const promotionsStore: Map<string, Promotion> = new Map();

/**
 * 고유 ID 생성
 */
function generateId(): string {
  return `promo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 프로모션 타입별 라벨
 */
export function getPromotionTypeLabel(type: PromotionType): string {
  const labels: Record<PromotionType, string> = {
    FLASH_SALE: "플래시 세일",
    SEASONAL: "시즌 할인",
    BUNDLE: "번들 할인",
    CLEARANCE: "재고 정리",
  };
  return labels[type];
}

/**
 * 새 프로모션 생성
 */
export async function createPromotion(data: {
  sellerId: string;
  name: string;
  description?: string;
  type: PromotionType;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  productIds: string[];
  startDate: Date;
  endDate: Date;
}): Promise<Promotion> {
  // 유효성 검사
  if (data.startDate >= data.endDate) {
    throw new Error("종료일은 시작일보다 이후여야 합니다.");
  }

  if (data.discountType === "PERCENTAGE" && (data.discountValue < 1 || data.discountValue > 99)) {
    throw new Error("할인율은 1% ~ 99% 사이여야 합니다.");
  }

  if (data.productIds.length === 0) {
    throw new Error("최소 1개 이상의 상품을 선택해야 합니다.");
  }

  // 상품 소유권 확인
  const products = await prisma.product.findMany({
    where: {
      id: { in: data.productIds },
      sellerId: data.sellerId,
    },
    select: { id: true },
  });

  if (products.length !== data.productIds.length) {
    throw new Error("선택한 상품 중 일부가 존재하지 않거나 권한이 없습니다.");
  }

  const now = new Date();
  const status: PromotionStatus = data.startDate <= now ? "ACTIVE" : "SCHEDULED";

  const promotion: Promotion = {
    id: generateId(),
    ...data,
    status,
    createdAt: now,
    updatedAt: now,
  };

  promotionsStore.set(promotion.id, promotion);

  // 즉시 시작되는 프로모션이면 가격 적용
  if (status === "ACTIVE") {
    await applyPromotionPrices(promotion);
  }

  return promotion;
}

/**
 * 프로모션 가격 적용
 */
async function applyPromotionPrices(promotion: Promotion): Promise<void> {
  const products = await prisma.product.findMany({
    where: { id: { in: promotion.productIds } },
    select: { id: true, price: true, originalPrice: true },
  });

  const appliedPrices = new Map<string, { original: number; discounted: number }>();

  for (const product of products) {
    const originalPrice = Number(product.originalPrice || product.price);
    let discountedPrice: number;

    if (promotion.discountType === "PERCENTAGE") {
      discountedPrice = Math.floor(originalPrice * (1 - promotion.discountValue / 100));
    } else {
      discountedPrice = Math.max(0, originalPrice - promotion.discountValue);
    }

    appliedPrices.set(product.id, { original: originalPrice, discounted: discountedPrice });

    // 가격 업데이트
    await prisma.product.update({
      where: { id: product.id },
      data: {
        originalPrice: originalPrice,
        price: discountedPrice,
      },
    });
  }

  promotion.appliedPrices = appliedPrices;
  promotion.status = "ACTIVE";
  promotion.updatedAt = new Date();
  promotionsStore.set(promotion.id, promotion);

  // 이벤트 기록
  recordEvent("PRODUCT_CREATED", {
    description: `프로모션 "${promotion.name}" 시작 (${products.length}개 상품)`,
    metadata: {
      promotionId: promotion.id,
      type: "promotion_started",
      productCount: products.length,
    },
  });
}

/**
 * 프로모션 가격 복원
 */
async function restorePromotionPrices(promotion: Promotion): Promise<void> {
  if (!promotion.appliedPrices) return;

  for (const [productId, prices] of promotion.appliedPrices) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        price: prices.original,
        originalPrice: null,
      },
    });
  }

  promotion.status = "ENDED";
  promotion.updatedAt = new Date();
  promotionsStore.set(promotion.id, promotion);

  // 이벤트 기록
  recordEvent("PRODUCT_CREATED", {
    description: `프로모션 "${promotion.name}" 종료`,
    metadata: {
      promotionId: promotion.id,
      type: "promotion_ended",
    },
  });
}

/**
 * 프로모션 취소
 */
export async function cancelPromotion(promotionId: string, sellerId: string): Promise<boolean> {
  const promotion = promotionsStore.get(promotionId);
  
  if (!promotion) {
    throw new Error("프로모션을 찾을 수 없습니다.");
  }

  if (promotion.sellerId !== sellerId) {
    throw new Error("프로모션을 취소할 권한이 없습니다.");
  }

  if (promotion.status === "ACTIVE") {
    await restorePromotionPrices(promotion);
  }

  promotion.status = "CANCELLED";
  promotion.updatedAt = new Date();
  promotionsStore.set(promotionId, promotion);

  return true;
}

/**
 * 프로모션 조회 (판매자별)
 */
export function getPromotions(sellerId: string): Promotion[] {
  return Array.from(promotionsStore.values())
    .filter(p => p.sellerId === sellerId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * 프로모션 상세 조회
 */
export function getPromotion(promotionId: string): Promotion | null {
  return promotionsStore.get(promotionId) || null;
}

/**
 * 예약된 프로모션 체크 및 실행 (크론잡 용)
 */
export async function processScheduledPromotions(): Promise<{
  started: number;
  ended: number;
}> {
  const now = new Date();
  let started = 0;
  let ended = 0;

  for (const promotion of promotionsStore.values()) {
    // 예약된 프로모션 시작
    if (promotion.status === "SCHEDULED" && promotion.startDate <= now) {
      await applyPromotionPrices(promotion);
      started++;
    }

    // 활성 프로모션 종료
    if (promotion.status === "ACTIVE" && promotion.endDate <= now) {
      await restorePromotionPrices(promotion);
      ended++;
    }
  }

  return { started, ended };
}

/**
 * 프로모션 알림 이메일 템플릿
 */
const promotionStartEmail = (data: {
  sellerName: string;
  promotionName: string;
  productCount: number;
  discountInfo: string;
  startDate: string;
  endDate: string;
}) => ({
  subject: `[${APP_NAME}] 프로모션 "${data.promotionName}" 시작 알림`,
  html: baseLayout(`
    <h2>🎉 프로모션이 시작되었습니다!</h2>
    <p>안녕하세요, <span class="highlight">${data.sellerName}</span>님!</p>
    
    <div class="info-box" style="border-left: 4px solid #059669;">
      <p style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${data.promotionName}</p>
      <p><strong>적용 상품:</strong> ${data.productCount}개</p>
      <p><strong>할인:</strong> ${data.discountInfo}</p>
      <p><strong>기간:</strong> ${data.startDate} ~ ${data.endDate}</p>
    </div>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/promotions" class="button">프로모션 관리하기</a>
    </p>
  `),
});

const promotionEndEmail = (data: {
  sellerName: string;
  promotionName: string;
  productCount: number;
  totalSales: number;
  totalRevenue: number;
}) => ({
  subject: `[${APP_NAME}] 프로모션 "${data.promotionName}" 종료 리포트`,
  html: baseLayout(`
    <h2>📊 프로모션이 종료되었습니다</h2>
    <p>안녕하세요, <span class="highlight">${data.sellerName}</span>님!</p>
    
    <div class="info-box">
      <p style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">${data.promotionName} 결과</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">적용 상품</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${data.productCount}개</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">총 판매 건수</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${data.totalSales}건</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">총 매출</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #059669;">₩${data.totalRevenue.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">
      상품 가격이 원래대로 복원되었습니다.
    </p>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${APP_URL}/dashboard/analytics" class="button">상세 분석 보기</a>
    </p>
  `),
});

/**
 * 프로모션 알림 발송
 */
export async function sendPromotionNotification(
  promotion: Promotion,
  type: "start" | "end",
  sellerEmail: string,
  sellerName: string
): Promise<boolean> {
  try {
    const discountInfo = promotion.discountType === "PERCENTAGE"
      ? `${promotion.discountValue}% 할인`
      : `₩${promotion.discountValue.toLocaleString()} 할인`;

    if (type === "start") {
      const email = promotionStartEmail({
        sellerName,
        promotionName: promotion.name,
        productCount: promotion.productIds.length,
        discountInfo,
        startDate: promotion.startDate.toLocaleDateString("ko-KR"),
        endDate: promotion.endDate.toLocaleDateString("ko-KR"),
      });

      await sendEmail({
        to: sellerEmail,
        subject: email.subject,
        html: email.html,
      });
    } else {
      // 종료 시에는 판매 통계 계산 (여기서는 기본값 사용)
      const email = promotionEndEmail({
        sellerName,
        promotionName: promotion.name,
        productCount: promotion.productIds.length,
        totalSales: 0, // 실제로는 DB에서 계산
        totalRevenue: 0,
      });

      await sendEmail({
        to: sellerEmail,
        subject: email.subject,
        html: email.html,
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to send promotion notification:", error);
    return false;
  }
}

/**
 * 활성 프로모션 조회 (상품 표시용)
 */
export function getActivePromotionsForProduct(productId: string): Promotion[] {
  return Array.from(promotionsStore.values())
    .filter(p => 
      p.status === "ACTIVE" && 
      p.productIds.includes(productId)
    );
}

/**
 * 프로모션 요약 통계
 */
export interface PromotionSummary {
  total: number;
  scheduled: number;
  active: number;
  ended: number;
  cancelled: number;
}

export function getPromotionSummary(sellerId: string): PromotionSummary {
  const promotions = getPromotions(sellerId);
  
  return {
    total: promotions.length,
    scheduled: promotions.filter(p => p.status === "SCHEDULED").length,
    active: promotions.filter(p => p.status === "ACTIVE").length,
    ended: promotions.filter(p => p.status === "ENDED").length,
    cancelled: promotions.filter(p => p.status === "CANCELLED").length,
  };
}
