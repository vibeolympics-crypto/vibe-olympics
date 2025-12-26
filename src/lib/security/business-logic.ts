/**
 * @fileoverview 비즈니스 로직 보안 검증
 * 가격 조작, 수량 조작, 환불 정책 우회 방지
 *
 * 대응 위협: S3.1 (가격 조작), S3.2 (쿠폰/포인트 악용), S3.4 (환불 정책 우회)
 */

import { prisma } from '@/lib/prisma';
import { securityLogger } from './index';

// ============================================
// 1. 가격 검증 (S3.1 방어)
// ============================================
export interface PriceValidationResult {
  valid: boolean;
  originalPrice: number;
  finalPrice: number;
  discount: number;
  error?: string;
  details?: Record<string, unknown>;
}

export const priceValidator = {
  /**
   * 상품 가격 검증 (클라이언트 제출 가격 vs 서버 가격)
   */
  validateProductPrice: async (
    productId: string,
    submittedPrice: number,
    tolerancePercent: number = 0.01 // 1% 오차 허용
  ): Promise<PriceValidationResult> => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, discountPrice: true, isPublished: true },
    });

    if (!product) {
      return {
        valid: false,
        originalPrice: 0,
        finalPrice: 0,
        discount: 0,
        error: '상품을 찾을 수 없습니다.',
      };
    }

    if (!product.isPublished) {
      return {
        valid: false,
        originalPrice: product.price,
        finalPrice: 0,
        discount: 0,
        error: '판매 중인 상품이 아닙니다.',
      };
    }

    const expectedPrice = product.discountPrice || product.price;
    const priceDiff = Math.abs(submittedPrice - expectedPrice);
    const tolerance = expectedPrice * tolerancePercent;

    if (priceDiff > tolerance) {
      securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'critical',
        details: {
          reason: 'Price manipulation attempt',
          productId,
          submittedPrice,
          expectedPrice,
          difference: priceDiff,
        },
      });

      return {
        valid: false,
        originalPrice: product.price,
        finalPrice: expectedPrice,
        discount: product.price - expectedPrice,
        error: '가격이 일치하지 않습니다. 페이지를 새로고침해 주세요.',
        details: { submittedPrice, expectedPrice },
      };
    }

    return {
      valid: true,
      originalPrice: product.price,
      finalPrice: expectedPrice,
      discount: product.price - expectedPrice,
    };
  },

  /**
   * 장바구니 총액 검증
   */
  validateCartTotal: async (
    items: Array<{ productId: string; quantity: number; price: number }>,
    submittedTotal: number
  ): Promise<PriceValidationResult> => {
    let calculatedTotal = 0;
    const details: Record<string, unknown>[] = [];

    for (const item of items) {
      const result = await priceValidator.validateProductPrice(item.productId, item.price);

      if (!result.valid) {
        return {
          ...result,
          error: `상품 가격 오류: ${result.error}`,
        };
      }

      const itemTotal = result.finalPrice * item.quantity;
      calculatedTotal += itemTotal;
      details.push({
        productId: item.productId,
        unitPrice: result.finalPrice,
        quantity: item.quantity,
        subtotal: itemTotal,
      });
    }

    const tolerance = calculatedTotal * 0.01; // 1% 오차 허용

    if (Math.abs(submittedTotal - calculatedTotal) > tolerance) {
      securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'critical',
        details: {
          reason: 'Cart total manipulation',
          submittedTotal,
          calculatedTotal,
          items: details,
        },
      });

      return {
        valid: false,
        originalPrice: calculatedTotal,
        finalPrice: calculatedTotal,
        discount: 0,
        error: '장바구니 총액이 일치하지 않습니다.',
        details: { submittedTotal, calculatedTotal },
      };
    }

    return {
      valid: true,
      originalPrice: calculatedTotal,
      finalPrice: calculatedTotal,
      discount: 0,
      details: { items: details },
    };
  },
};

// ============================================
// 2. 쿠폰/포인트 검증 (S3.2 방어)
// ============================================
export interface CouponValidationResult {
  valid: boolean;
  discountAmount: number;
  error?: string;
  couponId?: string;
}

export const couponValidator = {
  /**
   * 쿠폰 유효성 검증
   */
  validateCoupon: async (
    couponCode: string,
    userId: string,
    orderAmount: number
  ): Promise<CouponValidationResult> => {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode,
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
      },
    });

    if (!coupon) {
      return {
        valid: false,
        discountAmount: 0,
        error: '유효하지 않거나 만료된 쿠폰입니다.',
      };
    }

    // 사용 횟수 제한 확인
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return {
        valid: false,
        discountAmount: 0,
        error: '쿠폰 사용 한도가 초과되었습니다.',
      };
    }

    // 사용자별 사용 횟수 확인
    if (coupon.maxUsesPerUser) {
      const userUsageCount = await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId,
        },
      });

      if (userUsageCount >= coupon.maxUsesPerUser) {
        return {
          valid: false,
          discountAmount: 0,
          error: '이미 이 쿠폰을 사용하셨습니다.',
        };
      }
    }

    // 최소 주문 금액 확인
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        error: `최소 주문 금액은 ${coupon.minOrderAmount.toLocaleString()}원입니다.`,
      };
    }

    // 할인 금액 계산
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.floor(orderAmount * (coupon.discountValue / 100));
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // 주문 금액 초과 방지
    discountAmount = Math.min(discountAmount, orderAmount);

    return {
      valid: true,
      discountAmount,
      couponId: coupon.id,
    };
  },

  /**
   * 포인트 사용 검증
   */
  validatePointsUsage: async (
    userId: string,
    requestedPoints: number,
    orderAmount: number
  ): Promise<{ valid: boolean; error?: string; availablePoints: number }> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) {
      return {
        valid: false,
        error: '사용자를 찾을 수 없습니다.',
        availablePoints: 0,
      };
    }

    if (requestedPoints > user.points) {
      securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'high',
        userId,
        details: {
          reason: 'Points manipulation attempt',
          requestedPoints,
          availablePoints: user.points,
        },
      });

      return {
        valid: false,
        error: '보유 포인트가 부족합니다.',
        availablePoints: user.points,
      };
    }

    // 포인트로 전액 결제 방지 (최소 100원 결제)
    const MIN_PAYMENT = 100;
    if (requestedPoints > orderAmount - MIN_PAYMENT) {
      return {
        valid: false,
        error: `포인트는 최대 ${(orderAmount - MIN_PAYMENT).toLocaleString()}원까지 사용 가능합니다.`,
        availablePoints: user.points,
      };
    }

    return {
      valid: true,
      availablePoints: user.points,
    };
  },
};

// ============================================
// 3. 환불 정책 검증 (S3.4 방어)
// ============================================
export interface RefundEligibility {
  eligible: boolean;
  reason?: string;
  refundableAmount: number;
  refundType: 'FULL' | 'PARTIAL' | 'NONE';
  details?: Record<string, unknown>;
}

export const refundValidator = {
  /**
   * 환불 자격 검증
   */
  checkEligibility: async (
    purchaseId: string,
    userId: string
  ): Promise<RefundEligibility> => {
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            type: true,
            refundPolicy: true,
          },
        },
        downloads: {
          select: { id: true, createdAt: true },
        },
      },
    });

    if (!purchase) {
      return {
        eligible: false,
        reason: '구매 내역을 찾을 수 없습니다.',
        refundableAmount: 0,
        refundType: 'NONE',
      };
    }

    // 소유권 확인
    if (purchase.buyerId !== userId) {
      securityLogger.log({
        type: 'IDOR_ATTEMPT',
        severity: 'high',
        userId,
        details: {
          reason: 'Refund request for others purchase',
          purchaseId,
          actualBuyerId: purchase.buyerId,
        },
      });

      return {
        eligible: false,
        reason: '해당 구매에 대한 권한이 없습니다.',
        refundableAmount: 0,
        refundType: 'NONE',
      };
    }

    // 이미 환불된 경우
    if (purchase.status === 'REFUNDED') {
      return {
        eligible: false,
        reason: '이미 환불 처리된 구매입니다.',
        refundableAmount: 0,
        refundType: 'NONE',
      };
    }

    // 결제 미완료
    if (purchase.status !== 'COMPLETED') {
      return {
        eligible: false,
        reason: '결제가 완료되지 않은 구매입니다.',
        refundableAmount: 0,
        refundType: 'NONE',
      };
    }

    const purchaseDate = new Date(purchase.createdAt);
    const now = new Date();
    const daysSincePurchase = Math.floor(
      (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 다운로드 여부 확인
    const hasDownloaded = purchase.downloads.length > 0;

    // 디지털 상품 환불 정책
    if (purchase.product.type === 'DIGITAL_PRODUCT') {
      // 다운로드 시 환불 불가
      if (hasDownloaded) {
        return {
          eligible: false,
          reason: '다운로드한 디지털 상품은 환불이 불가능합니다.',
          refundableAmount: 0,
          refundType: 'NONE',
          details: {
            downloadedAt: purchase.downloads[0]?.createdAt,
          },
        };
      }

      // 7일 이내 환불 가능
      if (daysSincePurchase <= 7) {
        return {
          eligible: true,
          refundableAmount: purchase.amount,
          refundType: 'FULL',
          details: {
            daysSincePurchase,
            deadline: 7,
          },
        };
      }
    }

    // 구독 상품 환불 정책
    if (purchase.product.type === 'SUBSCRIPTION') {
      // 첫 24시간 내 전액 환불
      if (daysSincePurchase < 1) {
        return {
          eligible: true,
          refundableAmount: purchase.amount,
          refundType: 'FULL',
        };
      }

      // 7일 이내 일할 계산 환불
      if (daysSincePurchase <= 7) {
        const usedDays = daysSincePurchase;
        const refundableAmount = Math.floor(
          purchase.amount * ((30 - usedDays) / 30)
        );

        return {
          eligible: true,
          refundableAmount,
          refundType: 'PARTIAL',
          details: {
            usedDays,
            refundPercentage: ((30 - usedDays) / 30 * 100).toFixed(1),
          },
        };
      }
    }

    // 기본: 3일 이내 환불 가능
    if (daysSincePurchase <= 3) {
      return {
        eligible: true,
        refundableAmount: purchase.amount,
        refundType: 'FULL',
        details: { daysSincePurchase },
      };
    }

    return {
      eligible: false,
      reason: `환불 가능 기간(${purchase.product.type === 'DIGITAL_PRODUCT' ? 7 : 3}일)이 지났습니다.`,
      refundableAmount: 0,
      refundType: 'NONE',
      details: { daysSincePurchase },
    };
  },
};

// ============================================
// 4. 수량/재고 검증
// ============================================
export const inventoryValidator = {
  /**
   * 구매 수량 검증 (디지털 상품은 보통 무제한이지만, 한정판 등에 적용)
   */
  validateQuantity: async (
    productId: string,
    requestedQuantity: number,
    userId: string
  ): Promise<{ valid: boolean; error?: string; availableQuantity?: number }> => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        stock: true,
        maxPurchasePerUser: true,
        purchases: {
          where: { buyerId: userId, status: 'COMPLETED' },
          select: { id: true },
        },
      },
    });

    if (!product) {
      return { valid: false, error: '상품을 찾을 수 없습니다.' };
    }

    // 재고 확인 (null이면 무제한)
    if (product.stock !== null && requestedQuantity > product.stock) {
      return {
        valid: false,
        error: `재고가 부족합니다. 현재 재고: ${product.stock}개`,
        availableQuantity: product.stock,
      };
    }

    // 사용자별 구매 제한
    if (product.maxPurchasePerUser) {
      const currentPurchases = product.purchases.length;
      const remainingAllowed = product.maxPurchasePerUser - currentPurchases;

      if (requestedQuantity > remainingAllowed) {
        securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'medium',
          userId,
          details: {
            reason: 'Purchase limit exceeded attempt',
            productId,
            requestedQuantity,
            maxAllowed: product.maxPurchasePerUser,
            currentPurchases,
          },
        });

        return {
          valid: false,
          error: `이 상품은 최대 ${product.maxPurchasePerUser}개까지 구매 가능합니다. 이미 ${currentPurchases}개를 구매하셨습니다.`,
          availableQuantity: remainingAllowed,
        };
      }
    }

    return { valid: true };
  },
};

// ============================================
// 5. 통합 주문 검증
// ============================================
export interface OrderValidationResult {
  valid: boolean;
  errors: string[];
  finalAmount: number;
  breakdown: {
    subtotal: number;
    discount: number;
    couponDiscount: number;
    pointsUsed: number;
    total: number;
  };
}

export async function validateOrder(
  userId: string,
  items: Array<{ productId: string; quantity: number; price: number }>,
  options?: {
    couponCode?: string;
    pointsToUse?: number;
    submittedTotal?: number;
  }
): Promise<OrderValidationResult> {
  const errors: string[] = [];
  let subtotal = 0;
  let discount = 0;
  let couponDiscount = 0;
  let pointsUsed = 0;

  // 1. 각 상품 가격 및 수량 검증
  for (const item of items) {
    const priceResult = await priceValidator.validateProductPrice(
      item.productId,
      item.price
    );

    if (!priceResult.valid) {
      errors.push(`[${item.productId}] ${priceResult.error}`);
      continue;
    }

    const quantityResult = await inventoryValidator.validateQuantity(
      item.productId,
      item.quantity,
      userId
    );

    if (!quantityResult.valid) {
      errors.push(`[${item.productId}] ${quantityResult.error}`);
      continue;
    }

    subtotal += priceResult.finalPrice * item.quantity;
    discount += priceResult.discount * item.quantity;
  }

  // 2. 쿠폰 검증
  if (options?.couponCode) {
    const couponResult = await couponValidator.validateCoupon(
      options.couponCode,
      userId,
      subtotal
    );

    if (!couponResult.valid) {
      errors.push(couponResult.error!);
    } else {
      couponDiscount = couponResult.discountAmount;
    }
  }

  // 3. 포인트 검증
  if (options?.pointsToUse && options.pointsToUse > 0) {
    const pointsResult = await couponValidator.validatePointsUsage(
      userId,
      options.pointsToUse,
      subtotal - couponDiscount
    );

    if (!pointsResult.valid) {
      errors.push(pointsResult.error!);
    } else {
      pointsUsed = options.pointsToUse;
    }
  }

  const total = subtotal - couponDiscount - pointsUsed;

  // 4. 제출된 총액 검증
  if (options?.submittedTotal !== undefined) {
    const tolerance = total * 0.01;
    if (Math.abs(options.submittedTotal - total) > tolerance) {
      errors.push('결제 금액이 일치하지 않습니다. 페이지를 새로고침해 주세요.');

      securityLogger.log({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'critical',
        userId,
        details: {
          reason: 'Order total manipulation',
          submittedTotal: options.submittedTotal,
          calculatedTotal: total,
        },
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    finalAmount: total,
    breakdown: {
      subtotal,
      discount,
      couponDiscount,
      pointsUsed,
      total,
    },
  };
}

export default {
  priceValidator,
  couponValidator,
  refundValidator,
  inventoryValidator,
  validateOrder,
};
