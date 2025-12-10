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
  sendSubscriptionWelcomeEmail,
  sendSubscriptionRenewalReminderEmail,
  sendSubscriptionPaymentSuccessEmail,
  sendSubscriptionPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
  sendSubscriptionExpiringEmail,
} from "@/lib/email";

// 기본 알림 설정값
const DEFAULT_EMAIL_SETTINGS = {
  enabled: true,
  sales: true,
  reviews: true,
  purchases: true,
  marketing: false,
  community: true,
  followers: true,
  newsletter: false,
  wishlistSale: true,
  weeklyDigest: false,
  subscriptionReminder: true,
  paymentFailed: true,
};

const DEFAULT_PUSH_SETTINGS = {
  enabled: false,
  sales: true,
  reviews: true,
  purchases: true,
  marketing: false,
  community: true,
  followers: true,
  mentions: true,
  promotion: false,
  subscriptionReminder: true,
  paymentFailed: true,
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

// ==========================================
// 구독 관련 알림 트리거
// ==========================================

// 구독 시작 알림 트리거
export async function triggerSubscriptionWelcomeNotification(data: {
  userId: string;
  planName: string;
  price: number;
  billingCycle: "MONTHLY" | "YEARLY";
  features: string[];
  nextBillingDate: string;
}) {
  const userSettings = await getUserNotificationSettings(data.userId);
  if (!userSettings) return;

  const { email, settings } = userSettings;

  // 인앱 알림 생성
  await createInAppNotification({
    userId: data.userId,
    type: "PURCHASE",
    title: "구독이 시작되었습니다!",
    message: `${data.planName} 플랜 구독이 시작되었습니다. 프리미엄 기능을 이용해 보세요!`,
    data: { planName: data.planName },
  });

  // 이메일 알림 (항상 전송 - 중요 알림)
  if (settings.email.enabled && email) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { name: true },
      });

      await sendSubscriptionWelcomeEmail(email, {
        userName: user?.name || "회원",
        planName: data.planName,
        price: data.price,
        billingCycle: data.billingCycle,
        features: data.features,
        nextBillingDate: data.nextBillingDate,
      });
    } catch (error) {
      console.error("Failed to send subscription welcome email:", error);
    }
  }
}

// 구독 갱신 알림 트리거
export async function triggerSubscriptionRenewalReminderNotification(data: {
  userId: string;
  planName: string;
  price: number;
  renewalDate: string;
  daysUntilRenewal: number;
}) {
  const userSettings = await getUserNotificationSettings(data.userId);
  if (!userSettings) return;

  const { email, settings } = userSettings;

  // 인앱 알림 생성
  await createInAppNotification({
    userId: data.userId,
    type: "SYSTEM",
    title: "구독 갱신 예정",
    message: `${data.daysUntilRenewal}일 후 ${data.planName} 구독이 자동 갱신됩니다.`,
    data: { planName: data.planName, daysUntilRenewal: data.daysUntilRenewal },
  });

  // 이메일 알림
  if (settings.email.subscriptionReminder && email) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { name: true },
      });

      await sendSubscriptionRenewalReminderEmail(email, {
        userName: user?.name || "회원",
        planName: data.planName,
        price: data.price,
        renewalDate: data.renewalDate,
        daysUntilRenewal: data.daysUntilRenewal,
      });
    } catch (error) {
      console.error("Failed to send subscription renewal reminder email:", error);
    }
  }
}

// 구독 결제 성공 알림 트리거
export async function triggerSubscriptionPaymentSuccessNotification(data: {
  userId: string;
  planName: string;
  amount: number;
  paymentDate: string;
  nextBillingDate: string;
  receiptId?: string;
}) {
  const userSettings = await getUserNotificationSettings(data.userId);
  if (!userSettings) return;

  const { email, settings } = userSettings;

  // 인앱 알림 생성
  await createInAppNotification({
    userId: data.userId,
    type: "PURCHASE",
    title: "구독 결제 완료",
    message: `${data.planName} 구독 결제가 완료되었습니다. (₩${data.amount.toLocaleString()})`,
    data: { amount: data.amount, receiptId: data.receiptId },
  });

  // 이메일 알림
  if (settings.email.purchases && email) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { name: true },
      });

      await sendSubscriptionPaymentSuccessEmail(email, {
        userName: user?.name || "회원",
        planName: data.planName,
        amount: data.amount,
        paymentDate: data.paymentDate,
        nextBillingDate: data.nextBillingDate,
        receiptId: data.receiptId,
      });
    } catch (error) {
      console.error("Failed to send subscription payment success email:", error);
    }
  }
}

// 구독 결제 실패 알림 트리거
export async function triggerSubscriptionPaymentFailedNotification(data: {
  userId: string;
  planName: string;
  amount: number;
  failureReason: string;
  retryDate?: string;
  maxRetries?: number;
  currentRetry?: number;
}) {
  const userSettings = await getUserNotificationSettings(data.userId);
  if (!userSettings) return;

  const { email, settings } = userSettings;

  // 인앱 알림 생성 (항상 - 중요)
  await createInAppNotification({
    userId: data.userId,
    type: "SYSTEM",
    title: "⚠️ 결제 실패",
    message: `${data.planName} 구독 결제에 실패했습니다. 결제 수단을 확인해 주세요.`,
    data: { planName: data.planName, failureReason: data.failureReason },
  });

  // 이메일 알림 (설정에 관계없이 전송 - 중요)
  if (settings.email.paymentFailed && email) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { name: true },
      });

      await sendSubscriptionPaymentFailedEmail(email, {
        userName: user?.name || "회원",
        planName: data.planName,
        amount: data.amount,
        failureReason: data.failureReason,
        retryDate: data.retryDate,
        maxRetries: data.maxRetries,
        currentRetry: data.currentRetry,
      });
    } catch (error) {
      console.error("Failed to send subscription payment failed email:", error);
    }
  }
}

// 구독 취소 알림 트리거
export async function triggerSubscriptionCancelledNotification(data: {
  userId: string;
  planName: string;
  cancelDate: string;
  endDate: string;
  reason?: string;
}) {
  const userSettings = await getUserNotificationSettings(data.userId);
  if (!userSettings) return;

  const { email, settings } = userSettings;

  // 인앱 알림 생성
  await createInAppNotification({
    userId: data.userId,
    type: "SYSTEM",
    title: "구독이 취소되었습니다",
    message: `${data.planName} 구독이 취소되었습니다. ${data.endDate}까지 이용 가능합니다.`,
    data: { planName: data.planName, endDate: data.endDate },
  });

  // 이메일 알림 (항상 전송 - 확인 용도)
  if (settings.email.enabled && email) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { name: true },
      });

      await sendSubscriptionCancelledEmail(email, {
        userName: user?.name || "회원",
        planName: data.planName,
        cancelDate: data.cancelDate,
        endDate: data.endDate,
        reason: data.reason,
      });
    } catch (error) {
      console.error("Failed to send subscription cancelled email:", error);
    }
  }
}

// 구독 만료 임박 알림 트리거
export async function triggerSubscriptionExpiringNotification(data: {
  userId: string;
  planName: string;
  expiryDate: string;
  daysRemaining: number;
}) {
  const userSettings = await getUserNotificationSettings(data.userId);
  if (!userSettings) return;

  const { email, settings } = userSettings;

  // 인앱 알림 생성
  await createInAppNotification({
    userId: data.userId,
    type: "SYSTEM",
    title: "구독 만료 임박",
    message: `${data.planName} 구독이 ${data.daysRemaining}일 후 만료됩니다. 지금 갱신하세요!`,
    data: { planName: data.planName, daysRemaining: data.daysRemaining },
  });

  // 이메일 알림
  if (settings.email.subscriptionReminder && email) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { name: true },
      });

      await sendSubscriptionExpiringEmail(email, {
        userName: user?.name || "회원",
        planName: data.planName,
        expiryDate: data.expiryDate,
        daysRemaining: data.daysRemaining,
      });
    } catch (error) {
      console.error("Failed to send subscription expiring email:", error);
    }
  }
}
