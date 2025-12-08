// 알림 트리거 유틸리티
// 사용자 설정에 따라 이메일 및 푸시 알림 전송

import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import {
  sendSaleNotificationEmail,
  sendReviewNotificationEmail,
  sendNewFollowerEmail,
  sendNewCommentEmail,
  sendProductApprovedEmail,
  sendWishlistSaleEmail,
} from "@/lib/email";

// 기본 알림 설정값
const DEFAULT_EMAIL_SETTINGS = {
  sales: true,
  reviews: true,
  purchases: true,
  marketing: false,
  community: true,
  followers: true,
  newsletter: false,
};

const DEFAULT_PUSH_SETTINGS = {
  sales: true,
  reviews: true,
  purchases: true,
  marketing: false,
  community: true,
  followers: true,
  mentions: true,
};

// 사용자의 알림 설정 조회
async function getUserNotificationSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      notificationSettings: true,
    },
  });

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = user.notificationSettings as any || {};

  return {
    email: user.email,
    settings: {
      email: { ...DEFAULT_EMAIL_SETTINGS, ...settings.email },
      push: { ...DEFAULT_PUSH_SETTINGS, ...settings.push },
    },
  };
}

// 인앱 알림 생성
async function createInAppNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data ? JSON.parse(JSON.stringify(data.data)) : undefined,
    },
  });
}

// ==========================================
// 알림 트리거 함수들
// ==========================================

// 판매 알림 트리거
export async function triggerSaleNotification(data: {
  sellerId: string;
  productTitle: string;
  price: number;
  buyerName: string;
  purchaseId?: string;
}) {
  const userSettings = await getUserNotificationSettings(data.sellerId);
  if (!userSettings) return;

  const { email, settings } = userSettings;

  // 인앱 알림 생성
  await createInAppNotification({
    userId: data.sellerId,
    type: "SALE",
    title: "새로운 판매!",
    message: `${data.buyerName}님이 "${data.productTitle}"을 구매했습니다.`,
    data: { purchaseId: data.purchaseId },
  });

  // 이메일 알림 (설정에 따라)
  if (settings.email.sales && email) {
    try {
      const seller = await prisma.user.findUnique({
        where: { id: data.sellerId },
        select: { name: true },
      });

      await sendSaleNotificationEmail(email, {
        sellerName: seller?.name || "판매자",
        productTitle: data.productTitle,
        price: data.price,
        buyerName: data.buyerName,
      });
    } catch (error) {
      console.error("Failed to send sale notification email:", error);
    }
  }

  // TODO: 푸시 알림 (설정에 따라)
  if (settings.push.sales) {
    // await sendPushNotification(data.sellerId, { ... });
  }
}

// 리뷰 알림 트리거
export async function triggerReviewNotification(data: {
  sellerId: string;
  productTitle: string;
  rating: number;
  reviewerName: string;
  reviewContent: string;
  reviewId?: string;
}) {
  const userSettings = await getUserNotificationSettings(data.sellerId);
  if (!userSettings) return;

  const { email, settings } = userSettings;

  // 인앱 알림 생성
  await createInAppNotification({
    userId: data.sellerId,
    type: "REVIEW",
    title: "새로운 리뷰!",
    message: `${data.reviewerName}님이 "${data.productTitle}"에 ${data.rating}점 리뷰를 남겼습니다.`,
    data: { reviewId: data.reviewId },
  });

  // 이메일 알림
  if (settings.email.reviews && email) {
    try {
      const seller = await prisma.user.findUnique({
        where: { id: data.sellerId },
        select: { name: true },
      });

      await sendReviewNotificationEmail(email, {
        sellerName: seller?.name || "판매자",
        productTitle: data.productTitle,
        rating: data.rating,
        reviewerName: data.reviewerName,
        reviewContent: data.reviewContent,
      });
    } catch (error) {
      console.error("Failed to send review notification email:", error);
    }
  }
}

// 팔로우 알림 트리거
export async function triggerFollowNotification(data: {
  targetUserId: string;
  followerName: string;
  followerId: string;
}) {
  const userSettings = await getUserNotificationSettings(data.targetUserId);
  if (!userSettings) return;

  const { email, settings } = userSettings;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // 인앱 알림 생성
  await createInAppNotification({
    userId: data.targetUserId,
    type: "FOLLOWER",
    title: "새로운 팔로워!",
    message: `${data.followerName}님이 팔로우하기 시작했습니다.`,
    data: { followerId: data.followerId },
  });

  // 이메일 알림
  if (settings.email.followers && email) {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: data.targetUserId },
        select: { name: true },
      });

      await sendNewFollowerEmail(email, {
        userName: targetUser?.name || "회원",
        followerName: data.followerName,
        followerUrl: `${appUrl}/seller/${data.followerId}`,
      });
    } catch (error) {
      console.error("Failed to send follow notification email:", error);
    }
  }
}

// 댓글 알림 트리거
export async function triggerCommentNotification(data: {
  targetUserId: string;
  commenterName: string;
  contentTitle: string;
  commentContent: string;
  contentUrl: string;
}) {
  const userSettings = await getUserNotificationSettings(data.targetUserId);
  if (!userSettings) return;

  const { email, settings } = userSettings;

  // 인앱 알림 생성
  await createInAppNotification({
    userId: data.targetUserId,
    type: "COMMENT",
    title: "새로운 댓글!",
    message: `${data.commenterName}님이 "${data.contentTitle}"에 댓글을 남겼습니다.`,
    data: { url: data.contentUrl },
  });

  // 이메일 알림
  if (settings.email.community && email) {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: data.targetUserId },
        select: { name: true },
      });

      await sendNewCommentEmail(email, {
        userName: targetUser?.name || "회원",
        commenterName: data.commenterName,
        contentTitle: data.contentTitle,
        commentContent: data.commentContent.substring(0, 200),
        contentUrl: data.contentUrl,
      });
    } catch (error) {
      console.error("Failed to send comment notification email:", error);
    }
  }
}

// 상품 승인 알림 트리거
export async function triggerProductApprovedNotification(data: {
  sellerId: string;
  productTitle: string;
  productSlug: string;
}) {
  const userSettings = await getUserNotificationSettings(data.sellerId);
  if (!userSettings) return;

  const { email } = userSettings;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // 인앱 알림 생성
  await createInAppNotification({
    userId: data.sellerId,
    type: "SYSTEM",
    title: "상품이 승인되었습니다!",
    message: `"${data.productTitle}"이 마켓플레이스에 게시되었습니다.`,
    data: { productSlug: data.productSlug },
  });

  // 이메일 알림 (항상 전송 - 중요 알림)
  if (email) {
    try {
      const seller = await prisma.user.findUnique({
        where: { id: data.sellerId },
        select: { name: true },
      });

      await sendProductApprovedEmail(email, {
        sellerName: seller?.name || "판매자",
        productTitle: data.productTitle,
        productUrl: `${appUrl}/marketplace/${data.productSlug}`,
      });
    } catch (error) {
      console.error("Failed to send product approved email:", error);
    }
  }
}

// 위시리스트 할인 알림 트리거
export async function triggerWishlistSaleNotification(data: {
  userId: string;
  productTitle: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  productSlug: string;
}) {
  const userSettings = await getUserNotificationSettings(data.userId);
  if (!userSettings) return;

  const { email, settings } = userSettings;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // 인앱 알림 생성
  await createInAppNotification({
    userId: data.userId,
    type: "PROMOTION",
    title: "위시리스트 상품 할인!",
    message: `"${data.productTitle}"이 ${data.discountPercent}% 할인 중입니다!`,
    data: { productSlug: data.productSlug },
  });

  // 이메일 알림
  if (settings.email.marketing && email) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { name: true },
      });

      await sendWishlistSaleEmail(email, {
        userName: user?.name || "회원",
        productTitle: data.productTitle,
        originalPrice: data.originalPrice,
        salePrice: data.salePrice,
        discountPercent: data.discountPercent,
        productUrl: `${appUrl}/marketplace/${data.productSlug}`,
      });
    } catch (error) {
      console.error("Failed to send wishlist sale email:", error);
    }
  }
}
