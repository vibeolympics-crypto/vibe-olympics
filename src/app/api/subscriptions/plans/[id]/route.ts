import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 구독 플랜 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            bio: true,
          },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "플랜을 찾을 수 없습니다" }, { status: 404 });
    }

    // 비공개 플랜인 경우 본인만 조회 가능
    if (!plan.isPublic) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || plan.sellerId !== session.user.id) {
        return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
      }
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("구독 플랜 조회 오류:", error);
    return NextResponse.json(
      { error: "구독 플랜을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 구독 플랜 수정 (판매자 전용)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ error: "플랜을 찾을 수 없습니다" }, { status: 404 });
    }

    if (plan.sellerId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      features,
      downloadLimit,
      accessLevel,
      includedProductIds,
      includedCollectionIds,
      trialDays,
      isPublic,
      isActive,
    } = body;

    // 구독자가 있는 경우 가격 변경 제한
    if (price !== undefined && price !== Number(plan.price) && plan.subscriberCount > 0) {
      return NextResponse.json(
        { error: "구독자가 있는 플랜의 가격은 변경할 수 없습니다. 새 플랜을 생성해주세요." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (price !== undefined) updateData.price = price;
    if (features !== undefined) updateData.features = features;
    if (downloadLimit !== undefined) updateData.downloadLimit = downloadLimit;
    if (accessLevel !== undefined) updateData.accessLevel = accessLevel;
    if (includedProductIds !== undefined) updateData.includedProductIds = includedProductIds;
    if (includedCollectionIds !== undefined) updateData.includedCollectionIds = includedCollectionIds;
    if (trialDays !== undefined) updateData.trialDays = trialDays;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    console.error("구독 플랜 수정 오류:", error);
    return NextResponse.json(
      { error: "구독 플랜 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 구독 플랜 삭제/비활성화
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ error: "플랜을 찾을 수 없습니다" }, { status: 404 });
    }

    if (plan.sellerId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 구독자가 있으면 비활성화만 가능
    if (plan.subscriberCount > 0) {
      const updatedPlan = await prisma.subscriptionPlan.update({
        where: { id },
        data: { isActive: false, isPublic: false },
      });

      return NextResponse.json({
        plan: updatedPlan,
        message: "구독자가 있어 비활성화되었습니다. 기존 구독은 유지됩니다.",
      });
    }

    // 구독자가 없으면 삭제
    await prisma.subscriptionPlan.delete({
      where: { id },
    });

    return NextResponse.json({ message: "플랜이 삭제되었습니다" });
  } catch (error) {
    console.error("구독 플랜 삭제 오류:", error);
    return NextResponse.json(
      { error: "구독 플랜 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
