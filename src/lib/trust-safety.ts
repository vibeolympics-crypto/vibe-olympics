/**
 * Trust & Safety 서비스
 * 신고, 분쟁, 제재, 이의 신청 관리
 */

import { prisma } from "./prisma";
import {
  ReportTargetType,
  ReportType,
  ReportStatus,
  DisputeType,
  DisputeStatus,
  DisputeResolution,
  SanctionType,
  SanctionStatus,
  UserTrustStatus,
  AppealStatus,
  AppealResult,
} from "@prisma/client";

// ==========================================
// 신고 (Report) 서비스
// ==========================================

interface CreateReportInput {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetUserId?: string;
  type: ReportType;
  reason: string;
  evidence?: string[];
}

/**
 * 신고 생성
 */
export async function createReport(input: CreateReportInput) {
  const { reporterId, targetType, targetId, targetUserId, type, reason, evidence } = input;

  // 중복 신고 확인 (동일 신고자, 동일 대상)
  const existingReport = await prisma.report.findFirst({
    where: {
      reporterId,
      targetType,
      targetId,
      status: { in: ["PENDING", "REVIEWING"] },
    },
  });

  if (existingReport) {
    throw new Error("이미 해당 대상에 대한 신고가 접수되어 있습니다.");
  }

  // 신고 대상 사용자 ID 조회 (targetUserId가 없는 경우)
  let resolvedTargetUserId: string | undefined = targetUserId;
  if (!resolvedTargetUserId && targetType !== "MESSAGE") {
    const fetchedUserId = await getTargetUserId(targetType, targetId);
    resolvedTargetUserId = fetchedUserId ?? undefined;
  }

  // 자기 자신 신고 방지
  if (resolvedTargetUserId === reporterId) {
    throw new Error("자기 자신을 신고할 수 없습니다.");
  }

  const report = await prisma.report.create({
    data: {
      reporterId,
      targetType,
      targetId,
      targetUserId: resolvedTargetUserId,
      type,
      reason,
      evidence: evidence ? { urls: evidence } : null,
      priority: calculateReportPriority(type),
    },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
    },
  });

  return report;
}

/**
 * 신고 대상의 사용자 ID 조회
 */
async function getTargetUserId(targetType: ReportTargetType, targetId: string): Promise<string | null> {
  switch (targetType) {
    case "USER":
      return targetId;
    case "PRODUCT": {
      const product = await prisma.product.findUnique({
        where: { id: targetId },
        select: { sellerId: true },
      });
      return product?.sellerId ?? null;
    }
    case "REVIEW": {
      const review = await prisma.review.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });
      return review?.userId ?? null;
    }
    case "POST": {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      return post?.authorId ?? null;
    }
    case "COMMENT": {
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      return comment?.authorId ?? null;
    }
    default:
      return null;
  }
}

/**
 * 신고 우선순위 계산
 */
function calculateReportPriority(type: ReportType): number {
  const priorities: Record<ReportType, number> = {
    FRAUD: 10,
    COPYRIGHT: 8,
    HARASSMENT: 7,
    INAPPROPRIATE: 6,
    DIRECT_TRADE: 5,
    QUALITY: 3,
    SPAM: 2,
    OTHER: 1,
  };
  return priorities[type] ?? 1;
}

/**
 * 신고 목록 조회 (관리자)
 */
export async function getReports(params: {
  status?: ReportStatus;
  type?: ReportType;
  targetType?: ReportTargetType;
  page?: number;
  limit?: number;
}) {
  const { status, type, targetType, page = 1, limit = 20 } = params;

  const where = {
    ...(status && { status }),
    ...(type && { type }),
    ...(targetType && { targetType }),
  };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, email: true, image: true } },
        targetUser: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where }),
  ]);

  return {
    items: reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 신고 상세 조회
 */
export async function getReportById(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, name: true, email: true, image: true } },
      targetUser: { select: { id: true, name: true, email: true, image: true } },
      sanction: true,
    },
  });
}

/**
 * 신고 처리 (관리자)
 */
export async function processReport(
  id: string,
  adminId: string,
  action: {
    status: ReportStatus;
    reviewNote?: string;
    actionTaken?: string;
    sanctionType?: SanctionType;
    sanctionDuration?: number; // days
  }
) {
  const report = await prisma.report.findUnique({
    where: { id },
  });

  if (!report) {
    throw new Error("신고를 찾을 수 없습니다.");
  }

  // 제재 생성 (필요한 경우)
  let sanctionId: string | undefined;
  if (action.status === "RESOLVED" && action.sanctionType && report.targetUserId) {
    const sanction = await createSanction({
      userId: report.targetUserId,
      type: action.sanctionType,
      reason: action.reviewNote ?? report.reason,
      issuedBy: adminId,
      duration: action.sanctionDuration,
    });
    sanctionId = sanction.id;
  }

  const updatedReport = await prisma.report.update({
    where: { id },
    data: {
      status: action.status,
      reviewNote: action.reviewNote,
      actionTaken: action.actionTaken,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      sanctionId,
    },
  });

  return updatedReport;
}

// ==========================================
// 분쟁 (Dispute) 서비스
// ==========================================

interface CreateDisputeInput {
  purchaseId: string;
  initiatorId: string;
  type: DisputeType;
  reason: string;
  evidence?: string[];
  requestedAmount?: number;
}

/**
 * 분쟁 신청
 */
export async function createDispute(input: CreateDisputeInput) {
  const { purchaseId, initiatorId, type, reason, evidence, requestedAmount } = input;

  // 구매 정보 확인
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { product: { select: { sellerId: true } } },
  });

  if (!purchase) {
    throw new Error("구매 정보를 찾을 수 없습니다.");
  }

  // 분쟁 신청자 확인 (구매자만 가능)
  if (purchase.buyerId !== initiatorId) {
    throw new Error("구매자만 분쟁을 신청할 수 있습니다.");
  }

  // 기존 분쟁 확인
  const existingDispute = await prisma.dispute.findFirst({
    where: {
      purchaseId,
      status: { notIn: ["RESOLVED", "CLOSED"] },
    },
  });

  if (existingDispute) {
    throw new Error("해당 거래에 대한 분쟁이 이미 진행 중입니다.");
  }

  // 분쟁 가능 기간 확인 (구매 후 14일 이내)
  const daysSincePurchase = Math.floor(
    (Date.now() - new Date(purchase.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSincePurchase > 14) {
    throw new Error("분쟁 신청 가능 기간(구매 후 14일)이 지났습니다.");
  }

  // 협의 기한 설정 (3일 후)
  const negotiationDeadline = new Date();
  negotiationDeadline.setDate(negotiationDeadline.getDate() + 3);

  const dispute = await prisma.dispute.create({
    data: {
      purchaseId,
      initiatorId,
      respondentId: purchase.product.sellerId,
      type,
      reason,
      evidence: evidence ? { urls: evidence } : null,
      requestedAmount,
      negotiationDeadline,
    },
    include: {
      initiator: { select: { id: true, name: true, email: true } },
      respondent: { select: { id: true, name: true, email: true } },
      purchase: { include: { product: true } },
    },
  });

  // 시스템 메시지 추가
  await prisma.disputeMessage.create({
    data: {
      disputeId: dispute.id,
      senderId: initiatorId,
      content: `분쟁이 신청되었습니다. 유형: ${getDisputeTypeLabel(type)}`,
      isSystemMessage: true,
    },
  });

  return dispute;
}

/**
 * 분쟁 유형 라벨
 */
function getDisputeTypeLabel(type: DisputeType): string {
  const labels: Record<DisputeType, string> = {
    NOT_AS_DESCRIBED: "상품 불일치",
    NOT_DELIVERED: "미제공",
    QUALITY_ISSUE: "품질 문제",
    REFUND_DISPUTE: "환불 분쟁",
    OTHER: "기타",
  };
  return labels[type];
}

/**
 * 분쟁 목록 조회
 */
export async function getDisputes(params: {
  userId?: string;
  status?: DisputeStatus;
  page?: number;
  limit?: number;
}) {
  const { userId, status, page = 1, limit = 20 } = params;

  const where = {
    ...(userId && {
      OR: [{ initiatorId: userId }, { respondentId: userId }],
    }),
    ...(status && { status }),
  };

  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      include: {
        initiator: { select: { id: true, name: true, image: true } },
        respondent: { select: { id: true, name: true, image: true } },
        purchase: { include: { product: { select: { id: true, title: true, thumbnail: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dispute.count({ where }),
  ]);

  return {
    items: disputes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 분쟁 상세 조회
 */
export async function getDisputeById(id: string) {
  return prisma.dispute.findUnique({
    where: { id },
    include: {
      initiator: { select: { id: true, name: true, email: true, image: true } },
      respondent: { select: { id: true, name: true, email: true, image: true } },
      purchase: { include: { product: true } },
      messages: {
        include: {
          sender: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/**
 * 분쟁 메시지 전송
 */
export async function sendDisputeMessage(
  disputeId: string,
  senderId: string,
  content: string,
  attachments?: string[]
) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
  });

  if (!dispute) {
    throw new Error("분쟁을 찾을 수 없습니다.");
  }

  // 분쟁 당사자 확인
  if (dispute.initiatorId !== senderId && dispute.respondentId !== senderId) {
    throw new Error("분쟁 당사자만 메시지를 보낼 수 있습니다.");
  }

  // 종료된 분쟁에는 메시지 불가
  if (["RESOLVED", "CLOSED"].includes(dispute.status)) {
    throw new Error("종료된 분쟁에는 메시지를 보낼 수 없습니다.");
  }

  const message = await prisma.disputeMessage.create({
    data: {
      disputeId,
      senderId,
      content,
      attachments: attachments ? { urls: attachments } : null,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  return message;
}

/**
 * 중재 요청
 */
export async function requestMediation(disputeId: string, userId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
  });

  if (!dispute) {
    throw new Error("분쟁을 찾을 수 없습니다.");
  }

  if (dispute.initiatorId !== userId && dispute.respondentId !== userId) {
    throw new Error("분쟁 당사자만 중재를 요청할 수 있습니다.");
  }

  if (!["OPEN", "NEGOTIATING"].includes(dispute.status)) {
    throw new Error("현재 상태에서는 중재를 요청할 수 없습니다.");
  }

  const updatedDispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: "MEDIATION_REQUESTED" },
  });

  // 시스템 메시지 추가
  await prisma.disputeMessage.create({
    data: {
      disputeId,
      senderId: userId,
      content: "중재가 요청되었습니다. 운영팀에서 검토 후 중재를 진행합니다.",
      isSystemMessage: true,
    },
  });

  return updatedDispute;
}

/**
 * 분쟁 해결 (관리자)
 */
export async function resolveDispute(
  id: string,
  adminId: string,
  resolution: {
    result: DisputeResolution;
    note?: string;
    amount?: number;
  }
) {
  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: { purchase: true },
  });

  if (!dispute) {
    throw new Error("분쟁을 찾을 수 없습니다.");
  }

  const updatedDispute = await prisma.dispute.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolution: resolution.result,
      resolutionNote: resolution.note,
      resolvedAmount: resolution.amount,
      resolvedAt: new Date(),
      resolvedBy: adminId,
    },
  });

  // 환불 처리 (구매자 승 또는 부분 환불인 경우)
  if (
    ["BUYER_WIN", "PARTIAL_REFUND"].includes(resolution.result) &&
    resolution.amount
  ) {
    // 환불 로직 (실제 구현 시 결제 시스템과 연동)
    await prisma.purchase.update({
      where: { id: dispute.purchaseId },
      data: { status: "REFUNDED" },
    });
  }

  // 시스템 메시지 추가
  await prisma.disputeMessage.create({
    data: {
      disputeId: id,
      senderId: adminId,
      content: `분쟁이 해결되었습니다. 결과: ${getResolutionLabel(resolution.result)}`,
      isSystemMessage: true,
    },
  });

  return updatedDispute;
}

/**
 * 분쟁 결과 라벨
 */
function getResolutionLabel(resolution: DisputeResolution): string {
  const labels: Record<DisputeResolution, string> = {
    BUYER_WIN: "구매자 승",
    SELLER_WIN: "판매자 승",
    MUTUAL_AGREEMENT: "상호 합의",
    PARTIAL_REFUND: "부분 환불",
    DISMISSED: "기각",
  };
  return labels[resolution];
}

// ==========================================
// 제재 (Sanction) 서비스
// ==========================================

interface CreateSanctionInput {
  userId: string;
  type: SanctionType;
  reason: string;
  issuedBy: string;
  evidence?: string[];
  duration?: number; // days
  restrictions?: Record<string, boolean>;
}

/**
 * 제재 생성
 */
export async function createSanction(input: CreateSanctionInput) {
  const { userId, type, reason, issuedBy, evidence, duration, restrictions } = input;

  // 제재 종료일 계산
  let endAt: Date | undefined;
  if (duration && type !== "PERMANENT_BAN") {
    endAt = new Date();
    endAt.setDate(endAt.getDate() + duration);
  }

  const sanction = await prisma.sanction.create({
    data: {
      userId,
      type,
      reason,
      evidence: evidence ? { urls: evidence } : null,
      endAt,
      restrictions: restrictions ?? null,
      issuedBy,
    },
  });

  // 사용자 신뢰 상태 업데이트
  await updateUserTrustStatus(userId, type);

  return sanction;
}

/**
 * 제재에 따른 사용자 신뢰 상태 업데이트
 */
async function updateUserTrustStatus(userId: string, sanctionType: SanctionType) {
  const statusMap: Record<SanctionType, UserTrustStatus> = {
    WARNING: "CAUTION",
    CONTENT_REMOVAL: "CAUTION",
    FEATURE_RESTRICTION: "RESTRICTED",
    TEMPORARY_SUSPENSION: "SUSPENDED",
    PERMANENT_BAN: "BANNED",
  };

  const newStatus = statusMap[sanctionType];

  await prisma.userTrust.upsert({
    where: { userId },
    update: {
      status: newStatus,
      statusChangedAt: new Date(),
      sanctionCount: { increment: 1 },
      ...(sanctionType === "WARNING" && { warningCount: { increment: 1 } }),
      ...(sanctionType === "TEMPORARY_SUSPENSION" && { suspendedAt: new Date() }),
    },
    create: {
      userId,
      status: newStatus,
      statusChangedAt: new Date(),
      sanctionCount: 1,
      warningCount: sanctionType === "WARNING" ? 1 : 0,
      suspendedAt: sanctionType === "TEMPORARY_SUSPENSION" ? new Date() : undefined,
    },
  });
}

/**
 * 제재 목록 조회
 */
export async function getSanctions(params: {
  userId?: string;
  type?: SanctionType;
  status?: SanctionStatus;
  page?: number;
  limit?: number;
}) {
  const { userId, type, status, page = 1, limit = 20 } = params;

  const where = {
    ...(userId && { userId }),
    ...(type && { type }),
    ...(status && { status }),
  };

  const [sanctions, total] = await Promise.all([
    prisma.sanction.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        appeal: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sanction.count({ where }),
  ]);

  return {
    items: sanctions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 제재 상세 조회
 */
export async function getSanctionById(id: string) {
  return prisma.sanction.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      reports: true,
      appeal: true,
    },
  });
}

/**
 * 제재 해제
 */
export async function revokeSanction(id: string, adminId: string, reason: string) {
  const sanction = await prisma.sanction.findUnique({
    where: { id },
  });

  if (!sanction) {
    throw new Error("제재를 찾을 수 없습니다.");
  }

  const updatedSanction = await prisma.sanction.update({
    where: { id },
    data: {
      status: "REVOKED",
    },
  });

  // 사용자 신뢰 상태 복구 (활성 제재가 없으면)
  const activeSanctions = await prisma.sanction.count({
    where: {
      userId: sanction.userId,
      status: "ACTIVE",
      id: { not: id },
    },
  });

  if (activeSanctions === 0) {
    await prisma.userTrust.update({
      where: { userId: sanction.userId },
      data: {
        status: "NORMAL",
        statusChangedAt: new Date(),
        statusReason: reason,
        statusChangedBy: adminId,
      },
    });
  }

  return updatedSanction;
}

// ==========================================
// 이의 신청 (Appeal) 서비스
// ==========================================

interface CreateAppealInput {
  sanctionId: string;
  userId: string;
  reason: string;
  evidence?: string[];
}

/**
 * 이의 신청 생성
 */
export async function createAppeal(input: CreateAppealInput) {
  const { sanctionId, userId, reason, evidence } = input;

  // 제재 확인
  const sanction = await prisma.sanction.findUnique({
    where: { id: sanctionId },
  });

  if (!sanction) {
    throw new Error("제재를 찾을 수 없습니다.");
  }

  // 본인 제재만 이의 신청 가능
  if (sanction.userId !== userId) {
    throw new Error("본인의 제재만 이의 신청할 수 있습니다.");
  }

  // 이미 이의 신청이 있는지 확인
  if (sanction.appealId) {
    throw new Error("이미 이의 신청이 접수되어 있습니다.");
  }

  // 이의 신청 가능 기간 확인 (제재 후 7일 이내)
  const daysSinceSanction = Math.floor(
    (Date.now() - new Date(sanction.startAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceSanction > 7) {
    throw new Error("이의 신청 가능 기간(7일)이 지났습니다.");
  }

  const appeal = await prisma.appeal.create({
    data: {
      sanctionId,
      userId,
      reason,
      evidence: evidence ? { urls: evidence } : null,
    },
  });

  // 제재 상태 업데이트
  await prisma.sanction.update({
    where: { id: sanctionId },
    data: {
      status: "APPEALED",
      appealId: appeal.id,
    },
  });

  return appeal;
}

/**
 * 이의 신청 목록 조회
 */
export async function getAppeals(params: {
  userId?: string;
  status?: AppealStatus;
  page?: number;
  limit?: number;
}) {
  const { userId, status, page = 1, limit = 20 } = params;

  const where = {
    ...(userId && { userId }),
    ...(status && { status }),
  };

  const [appeals, total] = await Promise.all([
    prisma.appeal.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        sanction: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appeal.count({ where }),
  ]);

  return {
    items: appeals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 이의 신청 상세 조회
 */
export async function getAppealById(id: string) {
  return prisma.appeal.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      sanction: {
        include: {
          reports: true,
        },
      },
    },
  });
}

/**
 * 이의 신청 처리 (관리자)
 */
export async function processAppeal(
  id: string,
  adminId: string,
  decision: {
    result: AppealResult;
    note?: string;
    newSanctionType?: SanctionType;
    newDuration?: number;
  }
) {
  const appeal = await prisma.appeal.findUnique({
    where: { id },
    include: { sanction: true },
  });

  if (!appeal) {
    throw new Error("이의 신청을 찾을 수 없습니다.");
  }

  const updatedAppeal = await prisma.appeal.update({
    where: { id },
    data: {
      status: decision.result === "REJECTED" ? "REJECTED" : "APPROVED",
      result: decision.result,
      resultNote: decision.note,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    },
  });

  // 결과에 따른 제재 처리
  if (decision.result === "FULL_REVERSAL") {
    // 제재 완전 해제
    await revokeSanction(appeal.sanctionId, adminId, decision.note ?? "이의 신청 인용");
  } else if (decision.result === "PARTIAL_REVERSAL") {
    // 제재 완화 (새로운 제재 타입이나 기간 적용)
    if (decision.newSanctionType || decision.newDuration) {
      await prisma.sanction.update({
        where: { id: appeal.sanctionId },
        data: {
          ...(decision.newSanctionType && { type: decision.newSanctionType }),
          ...(decision.newDuration && {
            endAt: new Date(Date.now() + decision.newDuration * 24 * 60 * 60 * 1000),
          }),
          status: "ACTIVE",
        },
      });
    }
  } else {
    // 기각 - 제재 유지
    await prisma.sanction.update({
      where: { id: appeal.sanctionId },
      data: { status: "ACTIVE" },
    });
  }

  return updatedAppeal;
}

// ==========================================
// 사용자 신뢰 정보 서비스
// ==========================================

/**
 * 사용자 신뢰 정보 조회
 */
export async function getUserTrust(userId: string) {
  const userTrust = await prisma.userTrust.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, isSeller: true } },
    },
  });

  if (!userTrust) {
    // 신뢰 정보가 없으면 기본값 반환
    return {
      userId,
      status: "NORMAL" as UserTrustStatus,
      trustScore: 50,
      warningCount: 0,
      sanctionCount: 0,
    };
  }

  return userTrust;
}

/**
 * 사용자 신뢰 점수 재계산
 */
export async function recalculateUserTrustScore(userId: string) {
  // 사용자 통계 조회
  const [user, sanctions, disputes, purchases] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        products: {
          select: {
            averageRating: true,
            reviewCount: true,
          },
        },
      },
    }),
    prisma.sanction.count({
      where: { userId, status: "ACTIVE" },
    }),
    prisma.dispute.count({
      where: {
        OR: [{ initiatorId: userId }, { respondentId: userId }],
        resolution: { in: ["BUYER_WIN", "SELLER_WIN"] },
      },
    }),
    prisma.purchase.count({
      where: {
        product: { sellerId: userId },
        status: "COMPLETED",
      },
    }),
  ]);

  if (!user) return;

  // 평균 평점 계산
  const totalReviews = user.products.reduce((sum, p) => sum + p.reviewCount, 0);
  const weightedRating = user.products.reduce(
    (sum, p) => sum + p.averageRating * p.reviewCount,
    0
  );
  const avgRating = totalReviews > 0 ? weightedRating / totalReviews : 0;

  // 환불률 계산
  const refunds = await prisma.refundRequest.count({
    where: {
      purchase: { product: { sellerId: userId } },
      status: "COMPLETED",
    },
  });
  const refundRate = purchases > 0 ? refunds / purchases : 0;

  // 분쟁률 계산
  const disputeRate = purchases > 0 ? disputes / purchases : 0;

  // 신뢰 점수 계산 (0-100)
  let trustScore = 50; // 기본값

  // 평점 기여 (+20)
  trustScore += (avgRating / 5) * 20;

  // 판매 건수 기여 (+15)
  trustScore += Math.min(purchases / 100, 1) * 15;

  // 제재 감점 (-10 per active sanction)
  trustScore -= sanctions * 10;

  // 환불률 감점 (-15 if > 10%)
  if (refundRate > 0.1) {
    trustScore -= 15;
  }

  // 분쟁률 감점 (-10 if > 5%)
  if (disputeRate > 0.05) {
    trustScore -= 10;
  }

  // 범위 제한
  trustScore = Math.max(0, Math.min(100, trustScore));

  await prisma.userTrust.upsert({
    where: { userId },
    update: {
      trustScore: Math.round(trustScore),
      avgRating,
      refundRate,
      disputeRate,
      totalSales: purchases,
    },
    create: {
      userId,
      trustScore: Math.round(trustScore),
      avgRating,
      refundRate,
      disputeRate,
      totalSales: purchases,
    },
  });
}
