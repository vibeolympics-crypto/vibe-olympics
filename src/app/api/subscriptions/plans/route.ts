import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlanInterval } from "@prisma/client";

export const dynamic = 'force-dynamic';

// GET: 구독 플랜 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");
    const interval = searchParams.get("interval") as SubscriptionPlanInterval | null;
    const includePrivate = searchParams.get("includePrivate") === "true";

    // 로그인 여부 확인 (비공개 플랜 조회 시 필요)
    const session = await getServerSession(authOptions);
    
    const where = {
      isActive: true,
      ...(sellerId && { sellerId }),
      ...(interval && { interval }),
      ...(!includePrivate && { isPublic: true }),
      // includePrivate인 경우 본인 플랜만 비공개 조회 가능
      ...(includePrivate && session?.user?.id && {
        OR: [
          { isPublic: true },
          { sellerId: session.user.id },
        ],
      }),
    };

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: [
        { price: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("구독 플랜 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "구독 플랜 목록을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 구독 플랜 생성 (판매자 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 판매자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSeller: true, sellerVerified: true },
    });

    if (!user?.isSeller) {
      return NextResponse.json(
        { error: "판매자만 구독 플랜을 생성할 수 있습니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      currency = "KRW",
      interval = "MONTHLY",
      features = [],
      downloadLimit,
      accessLevel = 1,
      includedProductIds = [],
      includedCollectionIds = [],
      trialDays = 0,
      isPublic = true,
    } = body;

    // 유효성 검사
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "플랜 이름은 2자 이상이어야 합니다" },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: "가격은 0보다 커야 합니다" },
        { status: 400 }
      );
    }

    // slug 생성
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.subscriptionPlan.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        slug,
        price,
        currency,
        interval,
        features,
        downloadLimit,
        accessLevel,
        includedProductIds,
        includedCollectionIds,
        trialDays,
        isPublic,
        sellerId: session.user.id,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("구독 플랜 생성 오류:", error);
    return NextResponse.json(
      { error: "구독 플랜 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
