/**
 * 재고/한정 판매 알림 시스템
 * - 한정 수량 상품 판매 현황 체크
 * - 소진 임박 알림 (이메일 + 실시간)
 * - 자동 상품 비활성화 옵션
 */

import { prisma } from "@/lib/prisma";
import { sendEmail, APP_NAME, APP_URL, baseLayout } from "@/lib/email";
import { recordEvent } from "@/lib/realtime-events";

// 알림 임계값 설정
export const STOCK_ALERT_THRESHOLDS = {
  LOW: 10,      // 10개 이하일 때 경고
  CRITICAL: 3,  // 3개 이하일 때 위험
  SOLDOUT: 0,   // 완판
};

interface LimitedProduct {
  id: string;
  title: string;
  limitedQuantity: number;  // 한정 수량
  salesCount: number;       // 판매 수량
  remaining: number;        // 남은 수량
}

interface StockAlert {
  productId: string;
  title: string;
  remaining: number;
  level: "LOW" | "CRITICAL" | "SOLDOUT";
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
}

// 한정 판매 상품 메타데이터 (JSON 필드나 별도 모델이 없으므로 tags 활용)
// 예: tags에 "limited:100" 형태로 저장
export function parseLimitedQuantity(tags: string[]): number | null {
  const limitTag = tags.find(t => t.startsWith("limited:"));
  if (!limitTag) return null;
  
  const quantity = parseInt(limitTag.split(":")[1], 10);
  return isNaN(quantity) ? null : quantity;
}

export function formatLimitedTag(quantity: number): string {
  return `limited:${quantity}`;
}

// 한정 판매 상품 조회
export async function getLimitedProducts(sellerId?: string): Promise<LimitedProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      status: "PUBLISHED",
      tags: { hasSome: ["limited"] },
      ...(sellerId ? { sellerId } : {}),
    },
    select: {
      id: true,
      title: true,
      tags: true,
      salesCount: true,
    },
  });

  return products
    .map(p => {
      const limitedQuantity = parseLimitedQuantity(p.tags);
      if (!limitedQuantity) return null;
      
      return {
        id: p.id,
        title: p.title,
        limitedQuantity,
        salesCount: p.salesCount,
        remaining: Math.max(0, limitedQuantity - p.salesCount),
      };
    })
    .filter((p): p is LimitedProduct => p !== null);
}

// 재고 알림 레벨 판정
export function getAlertLevel(remaining: number): "LOW" | "CRITICAL" | "SOLDOUT" | null {
  if (remaining <= STOCK_ALERT_THRESHOLDS.SOLDOUT) return "SOLDOUT";
  if (remaining <= STOCK_ALERT_THRESHOLDS.CRITICAL) return "CRITICAL";
  if (remaining <= STOCK_ALERT_THRESHOLDS.LOW) return "LOW";
  return null;
}

// 재고 알림 이메일 템플릿
const stockAlertEmail = (data: {
  sellerName: string;
  productTitle: string;
  remaining: number;
  level: "LOW" | "CRITICAL" | "SOLDOUT";
  productUrl: string;
}) => {
  const levelConfig = {
    LOW: {
      emoji: "⚠️",
      title: "재고 부족 알림",
      color: "#f59e0b",
      message: `남은 수량이 ${data.remaining}개입니다.`,
    },
    CRITICAL: {
      emoji: "🔴",
      title: "재고 위험 알림",
      color: "#ef4444",
      message: `남은 수량이 ${data.remaining}개뿐입니다!`,
    },
    SOLDOUT: {
      emoji: "🎉",
      title: "완판 축하합니다!",
      color: "#059669",
      message: "모든 수량이 판매되었습니다!",
    },
  };

  const config = levelConfig[data.level];

  return {
    subject: `[${APP_NAME}] ${config.emoji} ${data.productTitle} - ${config.title}`,
    html: baseLayout(`
      <h2>${config.emoji} ${config.title}</h2>
      <p>안녕하세요, <span class="highlight">${data.sellerName}</span>님!</p>
      
      <div class="info-box" style="border-left: 4px solid ${config.color};">
        <p style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${data.productTitle}</p>
        <p style="color: ${config.color}; font-weight: 600;">${config.message}</p>
        ${data.level !== "SOLDOUT" ? `
          <p style="margin-top: 12px; font-size: 14px; color: #6b7280;">
            재고 추가 또는 상품 비활성화를 고려해 주세요.
          </p>
        ` : `
          <p style="margin-top: 12px; font-size: 14px; color: #6b7280;">
            추가 수량 판매를 원하시면 한정 수량을 업데이트해 주세요.
          </p>
        `}
      </div>
      
      <p style="text-align: center; margin-top: 24px;">
        <a href="${data.productUrl}" class="button">상품 관리하기</a>
      </p>
    `),
  };
};

// 재고 알림 발송
export async function sendStockAlert(alert: StockAlert): Promise<boolean> {
  try {
    const email = stockAlertEmail({
      sellerName: alert.sellerName,
      productTitle: alert.title,
      remaining: alert.remaining,
      level: alert.level,
      productUrl: `${APP_URL}/dashboard/products/${alert.productId}`,
    });

    await sendEmail({
      to: alert.sellerEmail,
      subject: email.subject,
      html: email.html,
    });

    // 실시간 알림도 기록 (PRODUCT_CREATED 타입으로 대체)
    recordEvent("PRODUCT_CREATED", {
      description: alert.level === "SOLDOUT" 
        ? `${alert.title} 완판되었습니다!` 
        : `${alert.title} 재고 알림: 남은 수량 ${alert.remaining}개`,
      productId: alert.productId,
      productTitle: alert.title,
      metadata: {
        remaining: alert.remaining,
        level: alert.level,
        alertType: "stock_alert",
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to send stock alert:", error);
    return false;
  }
}

// 모든 한정 상품 재고 체크 및 알림 발송
export async function checkAllStockAlerts(): Promise<{
  checked: number;
  alerts: number;
}> {
  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      status: "PUBLISHED",
      tags: { hasSome: ["limited"] },
    },
    include: {
      seller: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  let alertsSent = 0;

  for (const product of products) {
    const limitedQuantity = parseLimitedQuantity(product.tags);
    if (!limitedQuantity) continue;

    const remaining = Math.max(0, limitedQuantity - product.salesCount);
    const level = getAlertLevel(remaining);
    
    if (!level) continue;

    // 이미 알림을 보냈는지 체크 (메타데이터로 관리 가능)
    // 여기서는 간단히 매번 체크하도록 구현
    
    const sent = await sendStockAlert({
      productId: product.id,
      title: product.title,
      remaining,
      level,
      sellerId: product.sellerId,
      sellerEmail: product.seller.email || "",
      sellerName: product.seller.name || "판매자",
    });

    if (sent) alertsSent++;
  }

  return { checked: products.length, alerts: alertsSent };
}

// 구매 후 재고 체크 (구매 API에서 호출)
export async function checkStockAfterPurchase(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!product) return;

  const limitedQuantity = parseLimitedQuantity(product.tags);
  if (!limitedQuantity) return;

  const remaining = Math.max(0, limitedQuantity - product.salesCount);
  const level = getAlertLevel(remaining);

  if (!level) return;

  await sendStockAlert({
    productId: product.id,
    title: product.title,
    remaining,
    level,
    sellerId: product.sellerId,
    sellerEmail: product.seller.email || "",
    sellerName: product.seller.name || "판매자",
  });

  // 완판 시 자동 비활성화 옵션
  if (level === "SOLDOUT") {
    // 태그에 auto_disable이 있으면 자동 비활성화
    if (product.tags.includes("auto_disable_on_soldout")) {
      await prisma.product.update({
        where: { id: productId },
        data: { isPublished: false },
      });
    }
  }
}

// 재고 현황 요약
export interface StockSummary {
  total: number;
  lowStock: number;
  critical: number;
  soldOut: number;
  products: Array<{
    id: string;
    title: string;
    limitedQuantity: number;
    salesCount: number;
    remaining: number;
    level: "LOW" | "CRITICAL" | "SOLDOUT" | "OK";
  }>;
}

export async function getStockSummary(sellerId: string): Promise<StockSummary> {
  const limitedProducts = await getLimitedProducts(sellerId);
  
  const summary: StockSummary = {
    total: limitedProducts.length,
    lowStock: 0,
    critical: 0,
    soldOut: 0,
    products: [],
  };

  for (const product of limitedProducts) {
    const level = getAlertLevel(product.remaining);
    
    if (level === "LOW") summary.lowStock++;
    else if (level === "CRITICAL") summary.critical++;
    else if (level === "SOLDOUT") summary.soldOut++;

    summary.products.push({
      ...product,
      level: level || "OK",
    });
  }

  // 남은 수량 적은 순으로 정렬
  summary.products.sort((a, b) => a.remaining - b.remaining);

  return summary;
}
