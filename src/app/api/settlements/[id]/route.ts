/**
 * 정산 상세 API
 * GET /api/settlements/[id] - 정산 상세 조회
 * PATCH /api/settlements/[id] - 정산 상태 변경 (관리자)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 정산 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isSeller: true },
    });

    const settlement = await prisma.settlement.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, email: true, image: true } },
        settlementItems: {
          include: {
            purchase: {
              include: {
                product: { select: { title: true } },
                buyer: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!settlement) {
      return NextResponse.json({ error: "정산을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인: 관리자이거나 본인 정산인 경우만
    const isAdmin = user?.role === "ADMIN";
    if (!isAdmin && settlement.sellerId !== session.user.id) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    return NextResponse.json(settlement);
  } catch (error) {
    console.error("Get settlement detail error:", error);
    return NextResponse.json(
      { error: "정산 상세 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 정산 상태 변경 (관리자)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { status, transactionId, notes } = body;

    const settlement = await prisma.settlement.findUnique({
      where: { id },
    });

    if (!settlement) {
      return NextResponse.json({ error: "정산을 찾을 수 없습니다." }, { status: 404 });
    }

    // 상태 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {};
    
    if (status) {
      updateData.status = status;
      
      // 상태에 따른 날짜 업데이트
      if (status === "PROCESSING") {
        updateData.processedAt = new Date();
      } else if (status === "COMPLETED") {
        updateData.paidAt = new Date();
      }
    }
    
    if (transactionId) {
      updateData.transactionId = transactionId;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedSettlement = await prisma.settlement.update({
      where: { id },
      data: updateData,
      include: {
        seller: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updatedSettlement);
  } catch (error) {
    console.error("Update settlement error:", error);
    return NextResponse.json(
      { error: "정산 상태 변경에 실패했습니다." },
      { status: 500 }
    );
  }
}
