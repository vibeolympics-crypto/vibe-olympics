/**
 * Realtime Events API
 * 실시간 이벤트 조회/관리 API
 * 
 * Phase 11 - 대시보드 실시간 알림
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEvents,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getEventStats,
  type RealtimeEvent,
} from "@/lib/realtime-events";

export const dynamic = 'force-dynamic';

// GET: 이벤트 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 관리자 또는 판매자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isSeller: true },
    });

    if (user?.role !== "ADMIN" && !user?.isSeller) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const since = searchParams.get("since") 
      ? parseInt(searchParams.get("since")!) 
      : undefined;
    const includeStats = searchParams.get("stats") === "true";

    // 이벤트 조회
    const events = getEvents(limit, since);
    const unreadCount = getUnreadCount();

    const response: {
      events: RealtimeEvent[];
      unreadCount: number;
      stats?: ReturnType<typeof getEventStats>;
    } = {
      events,
      unreadCount,
    };

    // 통계 포함 옵션
    if (includeStats) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      response.stats = getEventStats(oneHourAgo);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Realtime events GET error:", error);
    return NextResponse.json(
      { error: "이벤트 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 이벤트 읽음 처리
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    // 관리자 또는 판매자 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isSeller: true },
    });

    if (user?.role !== "ADMIN" && !user?.isSeller) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await request.json();
    const { action, eventId } = body;

    if (action === "markAsRead" && eventId) {
      const success = markAsRead(eventId);
      return NextResponse.json({ success });
    }

    if (action === "markAllAsRead") {
      markAllAsRead();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "유효하지 않은 작업입니다" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Realtime events POST error:", error);
    return NextResponse.json(
      { error: "이벤트 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
