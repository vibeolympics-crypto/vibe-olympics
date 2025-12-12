/**
 * Audit Log Utility
 * 관리자 활동 로깅 유틸리티
 * 
 * Session 80 - 운영 로그 대시보드
 */

import { prisma } from '@/lib/prisma';
import { AuditAction, AuditStatus } from '@prisma/client';

interface AuditLogEntry {
  userId: string;
  userEmail: string;
  userName?: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  targetLabel?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status?: AuditStatus;
  errorMessage?: string;
}

/**
 * 감사 로그 생성
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        userEmail: entry.userEmail,
        userName: entry.userName,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        targetLabel: entry.targetLabel,
        oldValue: entry.oldValue ? JSON.parse(JSON.stringify(entry.oldValue)) : null,
        newValue: entry.newValue ? JSON.parse(JSON.stringify(entry.newValue)) : null,
        metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : {},
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        status: entry.status || 'SUCCESS',
        errorMessage: entry.errorMessage,
      },
    });
  } catch (error) {
    // 로깅 실패가 메인 기능을 방해하면 안됨
    console.error('Failed to create audit log:', error);
  }
}

/**
 * 요청에서 감사 로그용 정보 추출
 */
export function extractRequestInfo(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded 
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

/**
 * 사용자 관련 감사 로그 생성 헬퍼
 */
export async function logUserAction(
  action: 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE' | 'USER_BAN' | 'USER_UNBAN' | 'USER_ROLE_CHANGE',
  adminUser: { id: string; email: string; name?: string | null },
  targetUser: { id: string; email?: string; name?: string | null },
  options: {
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    request?: Request;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  const requestInfo = options.request ? extractRequestInfo(options.request) : {};
  
  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    userName: adminUser.name,
    action,
    targetType: 'USER',
    targetId: targetUser.id,
    targetLabel: targetUser.name || targetUser.email || targetUser.id,
    oldValue: options.oldValue,
    newValue: options.newValue,
    metadata: options.metadata,
    ...requestInfo,
  });
}

/**
 * 상품 관련 감사 로그 생성 헬퍼
 */
export async function logProductAction(
  action: 'PRODUCT_CREATE' | 'PRODUCT_UPDATE' | 'PRODUCT_DELETE' | 'PRODUCT_APPROVE' | 'PRODUCT_REJECT' | 'PRODUCT_FEATURE',
  adminUser: { id: string; email: string; name?: string | null },
  product: { id: string; title?: string },
  options: {
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    request?: Request;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  const requestInfo = options.request ? extractRequestInfo(options.request) : {};
  
  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    userName: adminUser.name,
    action,
    targetType: 'PRODUCT',
    targetId: product.id,
    targetLabel: product.title || product.id,
    oldValue: options.oldValue,
    newValue: options.newValue,
    metadata: options.metadata,
    ...requestInfo,
  });
}

/**
 * 주문/환불 관련 감사 로그 생성 헬퍼
 */
export async function logOrderAction(
  action: 'ORDER_REFUND' | 'ORDER_CANCEL' | 'PAYMENT_MANUAL',
  adminUser: { id: string; email: string; name?: string | null },
  order: { id: string; orderNumber?: string },
  options: {
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    request?: Request;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  const requestInfo = options.request ? extractRequestInfo(options.request) : {};
  
  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    userName: adminUser.name,
    action,
    targetType: 'ORDER',
    targetId: order.id,
    targetLabel: order.orderNumber || order.id,
    oldValue: options.oldValue,
    newValue: options.newValue,
    metadata: options.metadata,
    ...requestInfo,
  });
}

/**
 * 정산 관련 감사 로그 생성 헬퍼
 */
export async function logSettlementAction(
  action: 'SETTLEMENT_APPROVE' | 'SETTLEMENT_PROCESS' | 'SETTLEMENT_REJECT',
  adminUser: { id: string; email: string; name?: string | null },
  settlement: { id: string; sellerId?: string },
  options: {
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    request?: Request;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  const requestInfo = options.request ? extractRequestInfo(options.request) : {};
  
  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    userName: adminUser.name,
    action,
    targetType: 'SETTLEMENT',
    targetId: settlement.id,
    targetLabel: `정산 #${settlement.id.slice(0, 8)}`,
    oldValue: options.oldValue,
    newValue: options.newValue,
    metadata: options.metadata,
    ...requestInfo,
  });
}

/**
 * 관리자 로그인 로깅
 */
export async function logAdminLogin(
  adminUser: { id: string; email: string; name?: string | null },
  request?: Request
): Promise<void> {
  const requestInfo = request ? extractRequestInfo(request) : {};
  
  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    userName: adminUser.name,
    action: 'ADMIN_LOGIN',
    targetType: 'SESSION',
    targetId: adminUser.id,
    targetLabel: adminUser.email,
    ...requestInfo,
  });
}

/**
 * 설정 변경 로깅
 */
export async function logSettingChange(
  adminUser: { id: string; email: string; name?: string | null },
  settingKey: string,
  options: {
    oldValue?: unknown;
    newValue?: unknown;
    request?: Request;
  } = {}
): Promise<void> {
  const requestInfo = options.request ? extractRequestInfo(options.request) : {};
  
  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    userName: adminUser.name,
    action: 'SETTING_CHANGE',
    targetType: 'SETTING',
    targetId: settingKey,
    targetLabel: settingKey,
    oldValue: options.oldValue ? { value: options.oldValue } : undefined,
    newValue: options.newValue ? { value: options.newValue } : undefined,
    ...requestInfo,
  });
}

/**
 * 대량 작업 로깅
 */
export async function logBulkAction(
  adminUser: { id: string; email: string; name?: string | null },
  description: string,
  options: {
    targetType: string;
    affectedCount: number;
    targetIds?: string[];
    request?: Request;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const requestInfo = options.request ? extractRequestInfo(options.request) : {};
  
  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    userName: adminUser.name,
    action: 'BULK_ACTION',
    targetType: options.targetType,
    targetLabel: description,
    metadata: {
      ...options.metadata,
      affectedCount: options.affectedCount,
      targetIds: options.targetIds?.slice(0, 100), // 최대 100개만 저장
    },
    ...requestInfo,
  });
}

/**
 * 데이터 내보내기 로깅
 */
export async function logDataExport(
  adminUser: { id: string; email: string; name?: string | null },
  exportType: string,
  options: {
    recordCount: number;
    format?: string;
    request?: Request;
  }
): Promise<void> {
  const requestInfo = options.request ? extractRequestInfo(options.request) : {};
  
  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    userName: adminUser.name,
    action: 'EXPORT_DATA',
    targetType: 'EXPORT',
    targetLabel: exportType,
    metadata: {
      recordCount: options.recordCount,
      format: options.format || 'csv',
    },
    ...requestInfo,
  });
}
