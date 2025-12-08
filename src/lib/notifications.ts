import { prisma } from "@/lib/prisma";
import { NotificationType, Prisma } from "@prisma/client";

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
}

// 알림 생성 헬퍼 함수
export async function createNotification(data: NotificationData) {
  try {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || undefined,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

// 판매 알림 생성 (판매자에게)
export async function createSaleNotification(
  sellerId: string,
  productTitle: string,
  buyerName: string,
  price: number,
  productId: string
) {
  return createNotification({
    userId: sellerId,
    type: NotificationType.SALE,
    title: "새로운 판매! 🎉",
    message: `${buyerName}님이 "${productTitle}"를 ₩${price.toLocaleString()}에 구매했습니다.`,
    data: { productId, buyerName, price },
  });
}

// 구매 알림 생성 (구매자에게)
export async function createPurchaseNotification(
  buyerId: string,
  productTitle: string,
  price: number,
  productId: string
) {
  return createNotification({
    userId: buyerId,
    type: NotificationType.PURCHASE,
    title: "구매 완료! 🛒",
    message: `"${productTitle}" 구매가 완료되었습니다. 다운로드 페이지에서 파일을 받아보세요.`,
    data: { productId, price },
  });
}

// 리뷰 알림 생성 (판매자에게)
export async function createReviewNotification(
  sellerId: string,
  productTitle: string,
  reviewerName: string,
  rating: number,
  productId: string
) {
  return createNotification({
    userId: sellerId,
    type: NotificationType.REVIEW,
    title: "새로운 리뷰가 등록되었어요! ⭐",
    message: `${reviewerName}님이 "${productTitle}"에 ${rating}점 리뷰를 남겼습니다.`,
    data: { productId, rating, reviewerName },
  });
}

// 시스템 알림 생성
export async function createSystemNotification(
  userId: string,
  title: string,
  message: string,
  data?: Prisma.InputJsonValue
) {
  return createNotification({
    userId,
    type: NotificationType.SYSTEM,
    title,
    message,
    data,
  });
}

// 프로모션 알림 생성
export async function createPromotionNotification(
  userId: string,
  title: string,
  message: string,
  data?: Prisma.InputJsonValue
) {
  return createNotification({
    userId,
    type: NotificationType.PROMOTION,
    title,
    message,
    data,
  });
}

// 위시리스트 상품 할인 알림
export async function createWishlistDiscountNotification(
  userId: string,
  productTitle: string,
  originalPrice: number,
  newPrice: number,
  productId: string
) {
  const discountPercent = Math.round((1 - newPrice / originalPrice) * 100);
  
  return createNotification({
    userId,
    type: NotificationType.PROMOTION,
    title: "찜한 상품 할인 중! 💰",
    message: `"${productTitle}"이(가) ${discountPercent}% 할인 중입니다! (₩${originalPrice.toLocaleString()} → ₩${newPrice.toLocaleString()})`,
    data: { productId, originalPrice, newPrice, discountPercent },
  });
}
