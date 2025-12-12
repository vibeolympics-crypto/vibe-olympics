/**
 * Database Health Check Utility
 * 데이터베이스 연결 상태 확인 및 모니터링
 */

import { prisma } from "./prisma";

export interface DBHealthStatus {
  connected: boolean;
  latency: number;
  error?: string;
  timestamp: string;
  version?: string;
  activeConnections?: number;
}

export interface TableStatus {
  name: string;
  count: number;
  lastUpdated?: string;
}

/**
 * 데이터베이스 연결 상태 확인
 */
export async function checkDatabaseHealth(): Promise<DBHealthStatus> {
  const startTime = Date.now();
  
  try {
    // 간단한 쿼리로 연결 테스트
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    
    const latency = Date.now() - startTime;
    
    return {
      connected: true,
      latency,
      timestamp: new Date().toISOString(),
      version: result[0]?.version,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    return {
      connected: false,
      latency,
      error: error instanceof Error ? error.message : "Unknown database error",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 핵심 테이블 상태 확인
 */
export async function getTableStatuses(): Promise<TableStatus[]> {
  try {
    const [
      userCount,
      productCount,
      orderCount,
      postCount,
      tutorialCount,
      ticketCount,
      auditLogCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.purchase.count(),
      prisma.post.count(),
      prisma.tutorial.count(),
      prisma.supportTicket.count().catch(() => 0),
      prisma.auditLog.count().catch(() => 0),
    ]);

    return [
      { name: "users", count: userCount },
      { name: "products", count: productCount },
      { name: "purchases", count: orderCount },
      { name: "posts", count: postCount },
      { name: "tutorials", count: tutorialCount },
      { name: "support_tickets", count: ticketCount },
      { name: "audit_logs", count: auditLogCount },
    ];
  } catch (error) {
    console.error("Failed to get table statuses:", error);
    return [];
  }
}

/**
 * 스키마 마이그레이션 상태 확인
 */
export async function checkMigrationStatus(): Promise<{
  needsMigration: boolean;
  pendingModels: string[];
}> {
  const pendingModels: string[] = [];
  
  try {
    // 새 모델들이 존재하는지 확인
    const modelChecks = [
      { name: "AuditLog", check: () => prisma.auditLog.count() },
      { name: "SupportTicket", check: () => prisma.supportTicket.count() },
      { name: "TicketMessage", check: () => prisma.ticketMessage.count() },
      { name: "NewsletterSubscriber", check: () => prisma.newsletterSubscriber.count() },
    ];

    for (const { name, check } of modelChecks) {
      try {
        await check();
      } catch (error) {
        // 테이블이 없으면 에러 발생
        if (error instanceof Error && error.message.includes("does not exist")) {
          pendingModels.push(name);
        }
      }
    }

    return {
      needsMigration: pendingModels.length > 0,
      pendingModels,
    };
  } catch (error) {
    console.error("Migration check error:", error);
    return {
      needsMigration: true,
      pendingModels: ["Unknown - check failed"],
    };
  }
}

/**
 * 데이터베이스 통계 요약
 */
export async function getDatabaseSummary(): Promise<{
  health: DBHealthStatus;
  tables: TableStatus[];
  migration: { needsMigration: boolean; pendingModels: string[] };
}> {
  const [health, tables, migration] = await Promise.all([
    checkDatabaseHealth(),
    getTableStatuses(),
    checkMigrationStatus(),
  ]);

  return {
    health,
    tables,
    migration,
  };
}

/**
 * 데이터베이스 연결 재시도
 */
export async function reconnectDatabase(maxRetries = 3): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      const health = await checkDatabaseHealth();
      if (health.connected) {
        console.log(`Database reconnected on attempt ${i + 1}`);
        return true;
      }
    } catch (error) {
      console.error(`Database reconnection attempt ${i + 1} failed:`, error);
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return false;
}

/**
 * Prisma 연결 종료 (앱 종료 시)
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log("Database disconnected gracefully");
  } catch (error) {
    console.error("Error disconnecting database:", error);
  }
}
