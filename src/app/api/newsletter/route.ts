/**
 * Newsletter Subscription API
 * 뉴스레터 구독 관리 API
 * 
 * Session 80 - 마케팅/성장 기능
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// 구독 스키마
const subscribeSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  name: z.string().min(2).optional(),
  categories: z.array(z.string()).optional(),
  source: z.string().optional(),
});

// POST: 뉴스레터 구독
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);

    // 유효성 검사
    const validation = subscribeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, name, categories, source } = validation.data;

    // 기존 구독 확인
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { error: "이미 구독 중인 이메일입니다" },
          { status: 400 }
        );
      }
      
      // 비활성 구독자 재활성화
      await prisma.newsletterSubscriber.update({
        where: { email: email.toLowerCase() },
        data: {
          isActive: true,
          name: name || existing.name,
          categories: categories || existing.categories,
          unsubscribedAt: null,
        },
      });

      return NextResponse.json({
        message: "뉴스레터 구독이 재활성화되었습니다",
        subscribed: true,
      });
    }

    // 새 구독자 생성
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: email.toLowerCase(),
        name,
        categories: categories || ["all"],
        source: source || "website",
        userId: session?.user?.id,
      },
    });

    // TODO: 환영 이메일 발송

    return NextResponse.json({
      message: "뉴스레터 구독이 완료되었습니다",
      subscribed: true,
      subscriberId: subscriber.id,
    }, { status: 201 });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "구독 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 뉴스레터 구독 취소
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email && !token) {
      return NextResponse.json(
        { error: "이메일 또는 토큰이 필요합니다" },
        { status: 400 }
      );
    }

    // 토큰으로 찾기
    let subscriber;
    if (token) {
      subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { unsubscribeToken: token },
      });
    } else if (email) {
      subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { email: email.toLowerCase() },
      });
    }

    if (!subscriber) {
      return NextResponse.json(
        { error: "구독 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 구독 취소 처리
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "뉴스레터 구독이 취소되었습니다",
      unsubscribed: true,
    });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json(
      { error: "구독 취소 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET: 구독 상태 확인 (관리자용 목록 조회)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    // 단순 상태 확인
    const checkEmail = searchParams.get("check");
    if (checkEmail) {
      const subscriber = await prisma.newsletterSubscriber.findUnique({
        where: { email: checkEmail.toLowerCase() },
        select: { isActive: true, categories: true },
      });
      
      return NextResponse.json({
        subscribed: subscriber?.isActive || false,
        categories: subscriber?.categories || [],
      });
    }

    // 관리자 목록 조회
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const active = searchParams.get("active");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    
    if (active !== null) {
      where.isActive = active === "true";
    }
    
    if (category) {
      where.categories = { has: category };
    }

    const skip = (page - 1) * limit;

    const [subscribers, total, activeCount, totalCount] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { subscribedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          categories: true,
          source: true,
          subscribedAt: true,
          unsubscribedAt: true,
        },
      }),
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      prisma.newsletterSubscriber.count(),
    ]);

    return NextResponse.json({
      subscribers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        activeCount,
        totalCount,
        unsubscribedCount: totalCount - activeCount,
      },
    });
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json(
      { error: "뉴스레터 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
