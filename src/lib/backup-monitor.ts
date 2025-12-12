/**
 * DB 백업 모니터링 및 알림 시스템
 * Phase 11 - P11-11
 */

import { prisma } from "@/lib/prisma";
import { sendEmail, APP_NAME, baseLayout } from "@/lib/email";
import { recordEvent } from "@/lib/realtime-events";

// 백업 상태
export type BackupStatus = "SUCCESS" | "FAILED" | "IN_PROGRESS" | "PENDING";

// 백업 정보
export interface BackupInfo {
  id: string;
  timestamp: Date;
  status: BackupStatus;
  size?: number; // bytes
  duration?: number; // ms
  type: "FULL" | "INCREMENTAL" | "SNAPSHOT";
  location?: string;
  error?: string;
}

// 백업 이력 저장소 (메모리 기반)
const backupHistory: BackupInfo[] = [];
const MAX_HISTORY = 100;

/**
 * 고유 ID 생성
 */
function generateId(): string {
  return `backup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 백업 시뮬레이션 (실제 환경에서는 클라우드 백업 API 연동)
 */
export async function performBackup(type: BackupInfo["type"] = "FULL"): Promise<BackupInfo> {
  const backupId = generateId();
  const startTime = Date.now();

  // 진행 중 상태 기록
  const inProgressBackup: BackupInfo = {
    id: backupId,
    timestamp: new Date(),
    status: "IN_PROGRESS",
    type,
  };
  backupHistory.unshift(inProgressBackup);

  try {
    // DB 통계 수집 (실제 백업 대신 시뮬레이션)
    const stats = await getDatabaseStats();
    
    // 시뮬레이션된 백업 시간 (실제로는 클라우드 스토리지로 백업)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const completedBackup: BackupInfo = {
      id: backupId,
      timestamp: new Date(),
      status: "SUCCESS",
      type,
      size: stats.estimatedSize,
      duration: Date.now() - startTime,
      location: `backups/${new Date().toISOString().split("T")[0]}/${backupId}.sql`,
    };

    // 이력 업데이트
    const index = backupHistory.findIndex(b => b.id === backupId);
    if (index !== -1) {
      backupHistory[index] = completedBackup;
    }

    // 오래된 이력 제거
    if (backupHistory.length > MAX_HISTORY) {
      backupHistory.splice(MAX_HISTORY);
    }

    // 성공 이벤트 기록
    recordEvent("TICKET_CREATED", {
      description: `DB 백업 완료: ${formatBytes(completedBackup.size || 0)}`,
      metadata: {
        backupId,
        type,
        duration: completedBackup.duration,
        alertType: "backup_success",
      },
    });

    return completedBackup;
  } catch (error) {
    const failedBackup: BackupInfo = {
      id: backupId,
      timestamp: new Date(),
      status: "FAILED",
      type,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };

    // 이력 업데이트
    const index = backupHistory.findIndex(b => b.id === backupId);
    if (index !== -1) {
      backupHistory[index] = failedBackup;
    }

    // 실패 이벤트 기록
    recordEvent("TICKET_CREATED", {
      description: `DB 백업 실패: ${failedBackup.error}`,
      metadata: {
        backupId,
        type,
        error: failedBackup.error,
        alertType: "backup_failed",
      },
    });

    return failedBackup;
  }
}

/**
 * 바이트 단위 포맷팅
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 데이터베이스 통계 수집
 */
export async function getDatabaseStats(): Promise<{
  tables: Array<{ name: string; count: number }>;
  totalRecords: number;
  estimatedSize: number;
}> {
  // 주요 테이블 레코드 수 조회
  const [
    userCount,
    productCount,
    purchaseCount,
    reviewCount,
    postCount,
    notificationCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.purchase.count(),
    prisma.review.count(),
    prisma.post.count(),
    prisma.notification.count(),
  ]);

  const tables = [
    { name: "users", count: userCount },
    { name: "products", count: productCount },
    { name: "purchases", count: purchaseCount },
    { name: "reviews", count: reviewCount },
    { name: "posts", count: postCount },
    { name: "notifications", count: notificationCount },
  ];

  const totalRecords = tables.reduce((sum, t) => sum + t.count, 0);
  
  // 추정 크기 계산 (레코드당 평균 1KB 가정)
  const estimatedSize = totalRecords * 1024;

  return { tables, totalRecords, estimatedSize };
}

/**
 * 백업 이력 조회
 */
export function getBackupHistory(limit: number = 20): BackupInfo[] {
  return backupHistory.slice(0, limit);
}

/**
 * 마지막 성공 백업 조회
 */
export function getLastSuccessfulBackup(): BackupInfo | null {
  return backupHistory.find(b => b.status === "SUCCESS") || null;
}

/**
 * 백업 상태 요약
 */
export interface BackupSummary {
  lastBackup: BackupInfo | null;
  successCount: number;
  failedCount: number;
  totalSize: number;
  averageDuration: number;
  healthStatus: "HEALTHY" | "WARNING" | "CRITICAL";
  healthMessage: string;
}

export function getBackupSummary(): BackupSummary {
  const lastBackup = backupHistory[0] || null;
  const last7Days = backupHistory.filter(b => 
    b.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  const successCount = last7Days.filter(b => b.status === "SUCCESS").length;
  const failedCount = last7Days.filter(b => b.status === "FAILED").length;
  
  const successfulBackups = last7Days.filter(b => b.status === "SUCCESS" && b.size);
  const totalSize = successfulBackups.reduce((sum, b) => sum + (b.size || 0), 0);
  const averageDuration = successfulBackups.length > 0
    ? successfulBackups.reduce((sum, b) => sum + (b.duration || 0), 0) / successfulBackups.length
    : 0;

  // 건강 상태 판단
  let healthStatus: BackupSummary["healthStatus"] = "HEALTHY";
  let healthMessage = "모든 백업이 정상적으로 수행되고 있습니다.";

  const lastSuccessful = getLastSuccessfulBackup();
  if (!lastSuccessful) {
    healthStatus = "CRITICAL";
    healthMessage = "성공한 백업 기록이 없습니다.";
  } else {
    const hoursSinceLastBackup = (Date.now() - lastSuccessful.timestamp.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastBackup > 48) {
      healthStatus = "CRITICAL";
      healthMessage = `마지막 백업이 ${Math.round(hoursSinceLastBackup)}시간 전입니다. 즉시 백업이 필요합니다.`;
    } else if (hoursSinceLastBackup > 24) {
      healthStatus = "WARNING";
      healthMessage = `마지막 백업이 ${Math.round(hoursSinceLastBackup)}시간 전입니다.`;
    } else if (failedCount > successCount && last7Days.length > 0) {
      healthStatus = "WARNING";
      healthMessage = "최근 백업 실패율이 높습니다.";
    }
  }

  return {
    lastBackup,
    successCount,
    failedCount,
    totalSize,
    averageDuration,
    healthStatus,
    healthMessage,
  };
}

/**
 * 백업 알림 이메일 템플릿
 */
const backupAlertEmail = (data: {
  adminName: string;
  status: BackupStatus;
  backupId: string;
  timestamp: string;
  details: string;
  actionRequired?: string;
}) => {
  const statusConfig = {
    SUCCESS: { emoji: "✅", color: "#059669", title: "백업 완료" },
    FAILED: { emoji: "❌", color: "#ef4444", title: "백업 실패" },
    IN_PROGRESS: { emoji: "⏳", color: "#3b82f6", title: "백업 진행 중" },
    PENDING: { emoji: "🕐", color: "#f59e0b", title: "백업 대기" },
  };

  const config = statusConfig[data.status];

  return {
    subject: `[${APP_NAME}] ${config.emoji} ${config.title} - ${data.backupId}`,
    html: baseLayout(`
      <h2>${config.emoji} ${config.title}</h2>
      <p>안녕하세요, <span class="highlight">${data.adminName}</span>님!</p>
      
      <div class="info-box" style="border-left: 4px solid ${config.color};">
        <p><strong>백업 ID:</strong> ${data.backupId}</p>
        <p><strong>시간:</strong> ${data.timestamp}</p>
        <p><strong>상세:</strong> ${data.details}</p>
        ${data.actionRequired ? `
          <p style="margin-top: 12px; color: ${config.color}; font-weight: 600;">
            ⚠️ ${data.actionRequired}
          </p>
        ` : ""}
      </div>
      
      <p style="text-align: center; margin-top: 24px;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/health" class="button">서버 상태 확인</a>
      </p>
    `),
  };
};

/**
 * 백업 알림 발송 (관리자에게)
 */
export async function sendBackupAlert(
  backup: BackupInfo,
  adminEmail: string,
  adminName: string
): Promise<boolean> {
  try {
    let details = "";
    let actionRequired: string | undefined;

    if (backup.status === "SUCCESS") {
      details = `크기: ${formatBytes(backup.size || 0)}, 소요 시간: ${backup.duration}ms`;
    } else if (backup.status === "FAILED") {
      details = `오류: ${backup.error || "알 수 없는 오류"}`;
      actionRequired = "백업 실패 원인을 확인하고 수동 백업을 수행해 주세요.";
    }

    const email = backupAlertEmail({
      adminName,
      status: backup.status,
      backupId: backup.id,
      timestamp: backup.timestamp.toLocaleString("ko-KR"),
      details,
      actionRequired,
    });

    await sendEmail({
      to: adminEmail,
      subject: email.subject,
      html: email.html,
    });

    return true;
  } catch (error) {
    console.error("Failed to send backup alert:", error);
    return false;
  }
}

/**
 * 백업 상태 체크 및 알림 (크론잡용)
 */
export async function checkBackupHealthAndAlert(
  adminEmail: string,
  adminName: string
): Promise<{
  status: BackupSummary["healthStatus"];
  alerted: boolean;
}> {
  const summary = getBackupSummary();
  
  // WARNING 또는 CRITICAL 상태일 때만 알림
  if (summary.healthStatus !== "HEALTHY" && summary.lastBackup) {
    await sendBackupAlert(summary.lastBackup, adminEmail, adminName);
    return { status: summary.healthStatus, alerted: true };
  }

  return { status: summary.healthStatus, alerted: false };
}
