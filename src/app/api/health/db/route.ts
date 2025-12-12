/**
 * Database Health API
 * 데이터베이스 상태 확인 엔드포인트
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  checkDatabaseHealth,
  getTableStatuses,
  checkMigrationStatus,
} from "@/lib/db-health";

export const dynamic = 'force-dynamic';

// GET: 데이터베이스 상태 확인
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get("detailed") === "true";

    // 기본 헬스체크 (모든 사용자 접근 가능)
    const health = await checkDatabaseHealth();

    if (!health.connected) {
      return NextResponse.json({
        status: "unhealthy",
        ...health,
      }, { status: 503 });
    }

    // 간단한 응답 (공개)
    if (!detailed) {
      return NextResponse.json({
        status: "healthy",
        connected: health.connected,
        latency: health.latency,
        timestamp: health.timestamp,
      });
    }

    // 상세 정보는 관리자만 접근 가능
    const session = await getServerSession(authOptions);
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

    // 상세 정보 수집
    const [tables, migration] = await Promise.all([
      getTableStatuses(),
      checkMigrationStatus(),
    ]);

    return NextResponse.json({
      status: "healthy",
      health,
      tables,
      migration,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Health check failed",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// POST: 마이그레이션 실행 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "check-migration") {
      const migration = await checkMigrationStatus();
      return NextResponse.json({
        message: "마이그레이션 상태 확인 완료",
        migration,
        hint: migration.needsMigration 
          ? "prisma db push 명령어로 스키마를 동기화하세요" 
          : "스키마가 최신 상태입니다",
      });
    }

    // 실제 마이그레이션은 서버에서 직접 실행해야 함
    return NextResponse.json({
      message: "마이그레이션은 서버 콘솔에서 실행해야 합니다",
      commands: [
        "npx prisma db push",
        "npx prisma migrate deploy",
      ],
    });
  } catch (error) {
    console.error("Migration action error:", error);
    return NextResponse.json(
      { error: "작업 실행 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
