/**
 * Feedback Survey API
 * 만족도 조사 API
 * 
 * Phase 11 - 만족도 조사 시스템
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// 설문 응답 스키마
const feedbackSchema = z.object({
  surveyType: z.enum(["PURCHASE", "TICKET", "PRODUCT", "GENERAL", "NPS"]),
  purchaseId: z.string().optional(),
  ticketId: z.string().optional(),
  productId: z.string().optional(),
  rating: z.number().min(1).max(5),
  easeOfUse: z.number().min(1).max(5).optional(),
  valueForMoney: z.number().min(1).max(5).optional(),
  customerService: z.number().min(1).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
  feedback: z.string().max(2000).optional(),
  source: z.string().optional(),
});

// POST: 설문 응답 제출
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const validation = feedbackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 중복 응답 체크 (같은 엔티티에 대해 이미 응답한 경우)
    const existingCheck: Record<string, unknown> = {};
    if (data.purchaseId) existingCheck.purchaseId = data.purchaseId;
    if (data.ticketId) existingCheck.ticketId = data.ticketId;
    if (session?.user?.id) existingCheck.userId = session.user.id;

    if (Object.keys(existingCheck).length > 0) {
      const existing = await prisma.feedbackSurvey.findFirst({
        where: existingCheck,
      });

      if (existing) {
        return NextResponse.json(
          { error: "이미 설문에 응답하셨습니다" },
          { status: 400 }
        );
      }
    }

    // 설문 응답 저장
    const survey = await prisma.feedbackSurvey.create({
      data: {
        userId: session?.user?.id,
        email: session?.user?.email,
        surveyType: data.surveyType,
        purchaseId: data.purchaseId,
        ticketId: data.ticketId,
        productId: data.productId,
        rating: data.rating,
        easeOfUse: data.easeOfUse,
        valueForMoney: data.valueForMoney,
        customerService: data.customerService,
        wouldRecommend: data.wouldRecommend,
        feedback: data.feedback,
        source: data.source || "web",
      },
    });

    // 티켓의 경우 티켓 rating도 업데이트
    if (data.ticketId && data.rating) {
      await prisma.supportTicket.update({
        where: { id: data.ticketId },
        data: { 
          rating: data.rating,
          ratingComment: data.feedback,
        },
      }).catch(() => {}); // 실패해도 무시
    }

    return NextResponse.json({
      message: "소중한 의견 감사합니다!",
      surveyId: survey.id,
    }, { status: 201 });
  } catch (error) {
    console.error("Feedback survey error:", error);
    return NextResponse.json(
      { error: "설문 제출 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET: 설문 결과 조회 (관리자 전용)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 관리자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const surveyType = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};

    if (surveyType) {
      where.surveyType = surveyType;
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

    // 설문 결과 조회
    const [surveys, total, stats] = await Promise.all([
      prisma.feedbackSurvey.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedbackSurvey.count({ where }),
      // 통계 계산
      prisma.feedbackSurvey.aggregate({
        where,
        _avg: {
          rating: true,
          easeOfUse: true,
          valueForMoney: true,
          customerService: true,
        },
        _count: {
          id: true,
          wouldRecommend: true,
        },
      }),
    ]);

    // 추천 의향 비율 계산
    const recommendCount = await prisma.feedbackSurvey.count({
      where: { ...where, wouldRecommend: true },
    });

    const totalWithRecommend = await prisma.feedbackSurvey.count({
      where: { ...where, wouldRecommend: { not: null } },
    });

    // 평점 분포
    const ratingDistribution = await prisma.feedbackSurvey.groupBy({
      by: ["rating"],
      where,
      _count: { rating: true },
    });

    // 유형별 통계
    const typeStats = await prisma.feedbackSurvey.groupBy({
      by: ["surveyType"],
      where,
      _avg: { rating: true },
      _count: { id: true },
    });

    return NextResponse.json({
      surveys,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: stats._avg.rating || 0,
        averageEaseOfUse: stats._avg.easeOfUse || 0,
        averageValueForMoney: stats._avg.valueForMoney || 0,
        averageCustomerService: stats._avg.customerService || 0,
        totalResponses: stats._count.id,
        recommendRate: totalWithRecommend > 0 
          ? (recommendCount / totalWithRecommend * 100).toFixed(1) 
          : 0,
      },
      ratingDistribution: ratingDistribution.reduce((acc, item) => {
        acc[item.rating] = item._count.rating;
        return acc;
      }, {} as Record<number, number>),
      typeStats: typeStats.map(t => ({
        type: t.surveyType,
        averageRating: t._avg.rating || 0,
        count: t._count.id,
      })),
    });
  } catch (error) {
    console.error("Feedback survey list error:", error);
    return NextResponse.json(
      { error: "설문 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
