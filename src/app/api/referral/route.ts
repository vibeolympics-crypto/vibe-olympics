/**
 * Referral System API
 * 친구 초대/추천인 시스템
 * 
 * Phase 11 - 레퍼럴 시스템
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// 추천 코드 생성 (6자리 영문+숫자)
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동 방지: 0, O, I, L, 1 제외
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET: 내 추천 정보 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // 추천 코드 조회 또는 생성
    if (action === "my-code") {
      let referral = await prisma.referral.findFirst({
        where: { referrerId: session.user.id },
        orderBy: { createdAt: "asc" },
      });

      // 추천 코드가 없으면 생성
      if (!referral) {
        let code = generateReferralCode();
        
        // 중복 체크
        let exists = await prisma.referral.findUnique({ where: { referrerCode: code } });
        while (exists) {
          code = generateReferralCode();
          exists = await prisma.referral.findUnique({ where: { referrerCode: code } });
        }

        referral = await prisma.referral.create({
          data: {
            referrerId: session.user.id,
            referrerCode: code,
            status: "PENDING",
          },
        });
      }

      // 내 추천 통계
      const stats = await prisma.referral.aggregate({
        where: { referrerId: session.user.id },
        _count: { id: true },
      });

      const qualified = await prisma.referral.count({
        where: { 
          referrerId: session.user.id,
          status: { in: ["QUALIFIED", "REWARDED"] },
        },
      });

      const totalRewards = await prisma.referral.aggregate({
        where: { 
          referrerId: session.user.id,
          status: "REWARDED",
        },
        _sum: { referrerRewardAmount: true },
      });

      return NextResponse.json({
        code: referral.referrerCode,
        inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?ref=${referral.referrerCode}`,
        stats: {
          totalInvites: stats._count.id,
          qualified,
          totalRewards: Number(totalRewards._sum.referrerRewardAmount) || 0,
        },
      });
    }

    // 내 추천 목록 조회
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where: { referrerId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.referral.count({ where: { referrerId: session.user.id } }),
    ]);

    return NextResponse.json({
      referrals: referrals.map(r => ({
        id: r.id,
        refereeEmail: r.refereeEmail ? maskEmail(r.refereeEmail) : null,
        status: r.status,
        statusLabel: getStatusLabel(r.status),
        rewardAmount: r.referrerRewardAmount ? Number(r.referrerRewardAmount) : null,
        conditionMet: r.conditionMet,
        conditionMetAt: r.conditionMetAt?.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Referral GET error:", error);
    return NextResponse.json(
      { error: "추천 정보 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 추천 코드 적용 (회원가입 시)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, refereeEmail, refereeId } = body;

    if (!referralCode) {
      return NextResponse.json({ error: "추천 코드를 입력해주세요" }, { status: 400 });
    }

    // 추천 코드 유효성 확인
    const referral = await prisma.referral.findUnique({
      where: { referrerCode: referralCode.toUpperCase() },
    });

    if (!referral) {
      return NextResponse.json({ error: "유효하지 않은 추천 코드입니다" }, { status: 400 });
    }

    // 자기 자신 추천 방지
    if (refereeId && referral.referrerId === refereeId) {
      return NextResponse.json({ error: "자신의 추천 코드는 사용할 수 없습니다" }, { status: 400 });
    }

    // 이미 등록된 경우
    if (referral.refereeId) {
      return NextResponse.json({ error: "이미 사용된 추천입니다" }, { status: 400 });
    }

    // 추천 정보 업데이트
    const updated = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        refereeId,
        refereeEmail,
        status: "REGISTERED",
        // 신규 가입자 보상 설정 (예: 10% 할인 쿠폰)
        refereeRewardType: "COUPON",
        refereeRewardAmount: 10, // 10% 할인
      },
    });

    return NextResponse.json({
      message: "추천 코드가 적용되었습니다! 첫 구매 시 10% 할인 혜택을 받으세요.",
      referralId: updated.id,
      benefit: {
        type: "DISCOUNT",
        amount: 10,
        description: "첫 구매 10% 할인",
      },
    });
  } catch (error) {
    console.error("Referral POST error:", error);
    return NextResponse.json(
      { error: "추천 코드 적용 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 추천 조건 충족 확인 및 보상 지급 (시스템 호출)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { refereeId, action } = body;

    if (action === "check-qualification") {
      // 피추천인의 첫 구매 확인
      const referral = await prisma.referral.findFirst({
        where: { refereeId, status: "REGISTERED" },
      });

      if (!referral) {
        return NextResponse.json({ message: "해당하는 추천 정보가 없습니다" });
      }

      // 구매 내역 확인
      const purchase = await prisma.purchase.findFirst({
        where: { 
          buyerId: refereeId,
          status: "COMPLETED",
        },
      });

      if (purchase) {
        // 조건 충족 - 보상 처리
        await prisma.referral.update({
          where: { id: referral.id },
          data: {
            status: "QUALIFIED",
            conditionMet: true,
            conditionMetAt: new Date(),
            // 추천인 보상 설정 (예: 5,000원 크레딧)
            referrerRewardType: "CREDIT",
            referrerRewardAmount: 5000,
          },
        });

        // TODO: 실제 보상 지급 로직 (쿠폰 생성, 크레딧 추가 등)
        // TODO: 알림 발송

        return NextResponse.json({
          message: "추천 조건이 충족되었습니다",
          qualified: true,
        });
      }
    }

    return NextResponse.json({ message: "처리되었습니다" });
  } catch (error) {
    console.error("Referral PATCH error:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 이메일 마스킹
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  
  const maskedLocal = local.length > 2 
    ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
    : local[0] + "*";
  
  return `${maskedLocal}@${domain}`;
}

// 상태 라벨
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "대기 중",
    REGISTERED: "가입 완료",
    QUALIFIED: "조건 충족",
    REWARDED: "보상 지급",
    EXPIRED: "만료",
    CANCELLED: "취소",
  };
  return labels[status] || status;
}
