/**
 * Admin Audit Log API
 * 관리자 활동 로그 조회 API
 * 
 * Session 80 - 운영 로그 대시보드
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditAction, AuditStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

// GET: 감사 로그 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 관리자 권한 체크
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // 필터 파라미터
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action") as AuditAction | null;
    const targetType = searchParams.get("targetType");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") as AuditStatus | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // 필터 조건 구성
    const where: Record<string, unknown> = {};

    if (action) {
      where.action = action;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }

    if (search) {
      where.OR = [
        { userEmail: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
        { targetLabel: { contains: search, mode: "insensitive" } },
        { targetId: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    // 로그 조회
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // 통계 데이터
    const stats = await prisma.auditLog.groupBy({
      by: ["action"],
      _count: { action: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 최근 7일
        },
      },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        user: {
          id: log.user?.id || log.userId,
          email: log.userEmail,
          name: log.userName || log.user?.name,
          image: log.user?.image,
        },
        action: log.action,
        actionLabel: getActionLabel(log.action),
        targetType: log.targetType,
        targetId: log.targetId,
        targetLabel: log.targetLabel,
        oldValue: log.oldValue,
        newValue: log.newValue,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        status: log.status,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error("Audit log API error:", error);
    return NextResponse.json(
      { error: "감사 로그 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// Action 라벨 변환
function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    USER_CREATE: "사용자 생성",
    USER_UPDATE: "사용자 수정",
    USER_DELETE: "사용자 삭제",
    USER_BAN: "사용자 차단",
    USER_UNBAN: "사용자 차단 해제",
    USER_ROLE_CHANGE: "사용자 권한 변경",
    PRODUCT_CREATE: "상품 생성",
    PRODUCT_UPDATE: "상품 수정",
    PRODUCT_DELETE: "상품 삭제",
    PRODUCT_APPROVE: "상품 승인",
    PRODUCT_REJECT: "상품 거부",
    PRODUCT_FEATURE: "상품 추천",
    ORDER_REFUND: "주문 환불",
    ORDER_CANCEL: "주문 취소",
    PAYMENT_MANUAL: "수동 결제 처리",
    SETTLEMENT_APPROVE: "정산 승인",
    SETTLEMENT_PROCESS: "정산 처리",
    SETTLEMENT_REJECT: "정산 거부",
    SETTING_CHANGE: "설정 변경",
    ADMIN_LOGIN: "관리자 로그인",
    ADMIN_LOGOUT: "관리자 로그아웃",
    BULK_ACTION: "대량 작업",
    EXPORT_DATA: "데이터 내보내기",
  };
  return labels[action] || action;
}
