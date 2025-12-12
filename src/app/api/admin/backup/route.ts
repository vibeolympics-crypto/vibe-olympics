/**
 * 백업 모니터링 API
 * GET - 백업 상태/이력 조회
 * POST - 수동 백업 트리거
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  performBackup,
  getBackupHistory,
  getBackupSummary,
  getDatabaseStats,
  checkBackupHealthAndAlert,
} from "@/lib/backup-monitor";

export const dynamic = "force-dynamic";

// GET: 백업 상태/이력 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자 전용
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // 데이터베이스 통계
    if (action === "dbStats") {
      const stats = await getDatabaseStats();
      return NextResponse.json({ success: true, data: stats });
    }

    // 백업 이력
    if (action === "history") {
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const history = getBackupHistory(limit);
      return NextResponse.json({ success: true, data: history });
    }

    // 기본: 백업 요약
    const summary = getBackupSummary();
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Backup monitor error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 백업 트리거 또는 건강 체크
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자 전용
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, type = "FULL" } = body;

    // 수동 백업 실행
    if (action === "backup") {
      const backup = await performBackup(type);
      return NextResponse.json({
        success: true,
        message: backup.status === "SUCCESS" ? "백업이 완료되었습니다." : "백업에 실패했습니다.",
        data: backup,
      });
    }

    // 건강 체크 및 알림 발송
    if (action === "healthCheck") {
      const adminEmail = session.user.email || "";
      const adminName = session.user.name || "관리자";
      
      const result = await checkBackupHealthAndAlert(adminEmail, adminName);
      return NextResponse.json({
        success: true,
        message: result.alerted 
          ? `상태: ${result.status}, 알림이 발송되었습니다.`
          : `상태: ${result.status}, 정상입니다.`,
        data: result,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Backup action error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
