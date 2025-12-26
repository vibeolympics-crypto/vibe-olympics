/**
 * @fileoverview IDOR 방어 및 인가 시스템
 * 리소스 소유권 검증 통합
 *
 * 대응 위협: S3.3 (IDOR 취약점)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { securityLogger } from './index';

// ============================================
// 1. 역할 정의
// ============================================
export type UserRole = 'USER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';

export const roleHierarchy: Record<UserRole, number> = {
  USER: 1,
  SELLER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

// ============================================
// 2. 리소스 타입 및 소유권 검증
// ============================================
export type ResourceType =
  | 'product'
  | 'purchase'
  | 'review'
  | 'settlement'
  | 'subscription'
  | 'comment'
  | 'notification'
  | 'file';

interface OwnershipCheckResult {
  isOwner: boolean;
  resource?: unknown;
  error?: string;
}

/**
 * 리소스별 소유권 검증 로직
 */
const ownershipCheckers: Record<
  ResourceType,
  (resourceId: string, userId: string) => Promise<OwnershipCheckResult>
> = {
  product: async (resourceId, userId) => {
    const product = await prisma.product.findUnique({
      where: { id: resourceId },
      select: { id: true, sellerId: true },
    });
    if (!product) return { isOwner: false, error: 'Resource not found' };
    return { isOwner: product.sellerId === userId, resource: product };
  },

  purchase: async (resourceId, userId) => {
    const purchase = await prisma.purchase.findUnique({
      where: { id: resourceId },
      select: { id: true, buyerId: true },
    });
    if (!purchase) return { isOwner: false, error: 'Resource not found' };
    return { isOwner: purchase.buyerId === userId, resource: purchase };
  },

  review: async (resourceId, userId) => {
    const review = await prisma.review.findUnique({
      where: { id: resourceId },
      select: { id: true, userId: true },
    });
    if (!review) return { isOwner: false, error: 'Resource not found' };
    return { isOwner: review.userId === userId, resource: review };
  },

  settlement: async (resourceId, userId) => {
    const settlement = await prisma.settlement.findUnique({
      where: { id: resourceId },
      select: { id: true, sellerId: true },
    });
    if (!settlement) return { isOwner: false, error: 'Resource not found' };
    return { isOwner: settlement.sellerId === userId, resource: settlement };
  },

  subscription: async (resourceId, userId) => {
    const subscription = await prisma.subscription.findUnique({
      where: { id: resourceId },
      select: { id: true, userId: true },
    });
    if (!subscription) return { isOwner: false, error: 'Resource not found' };
    return { isOwner: subscription.userId === userId, resource: subscription };
  },

  comment: async (resourceId, userId) => {
    const comment = await prisma.comment.findUnique({
      where: { id: resourceId },
      select: { id: true, authorId: true },
    });
    if (!comment) return { isOwner: false, error: 'Resource not found' };
    return { isOwner: comment.authorId === userId, resource: comment };
  },

  notification: async (resourceId, userId) => {
    const notification = await prisma.notification.findUnique({
      where: { id: resourceId },
      select: { id: true, userId: true },
    });
    if (!notification) return { isOwner: false, error: 'Resource not found' };
    return { isOwner: notification.userId === userId, resource: notification };
  },

  file: async (resourceId, userId) => {
    // 파일은 Product 또는 별도 테이블과 연관
    // 여기서는 Product의 파일로 가정
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { thumbnailUrl: { contains: resourceId } },
          { files: { some: { id: resourceId } } },
        ],
        sellerId: userId,
      },
    });
    return { isOwner: !!product, resource: product };
  },
};

// ============================================
// 3. 인가 검증 함수
// ============================================
export const authorization = {
  /**
   * 세션에서 현재 사용자 정보 추출
   */
  getCurrentUser: async (): Promise<{
    id: string;
    role: UserRole;
    email: string;
  } | null> => {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    return {
      id: session.user.id as string,
      role: (session.user.role as UserRole) || 'USER',
      email: session.user.email || '',
    };
  },

  /**
   * 역할 기반 접근 검증
   */
  hasRole: (userRole: UserRole, requiredRole: UserRole): boolean => {
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  },

  /**
   * 리소스 소유권 검증
   */
  checkOwnership: async (
    resourceType: ResourceType,
    resourceId: string,
    userId: string
  ): Promise<OwnershipCheckResult> => {
    const checker = ownershipCheckers[resourceType];
    if (!checker) {
      return { isOwner: false, error: 'Unknown resource type' };
    }
    return checker(resourceId, userId);
  },

  /**
   * 소유자 또는 관리자 검증
   */
  isOwnerOrAdmin: async (
    resourceType: ResourceType,
    resourceId: string,
    userId: string,
    userRole: UserRole
  ): Promise<boolean> => {
    // 관리자는 모든 리소스 접근 가능
    if (authorization.hasRole(userRole, 'ADMIN')) {
      return true;
    }

    const result = await authorization.checkOwnership(resourceType, resourceId, userId);
    return result.isOwner;
  },
};

// ============================================
// 4. IDOR 방어 미들웨어
// ============================================
export interface IDORCheckOptions {
  resourceType: ResourceType;
  resourceIdParam?: string; // URL 파라미터 이름 (기본: 'id')
  allowedRoles?: UserRole[]; // 이 역할은 소유권 검사 없이 접근 가능
  customCheck?: (userId: string, resourceId: string) => Promise<boolean>;
}

export async function withIDORProtection(
  request: NextRequest,
  handler: (req: NextRequest, context: { userId: string; resource?: unknown }) => Promise<NextResponse>,
  options: IDORCheckOptions
): Promise<NextResponse> {
  const { resourceType, resourceIdParam = 'id', allowedRoles = ['ADMIN', 'SUPER_ADMIN'] } = options;
  const context = securityLogger.extractContext(request);

  // 1. 인증 확인
  const user = await authorization.getCurrentUser();
  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: '인증이 필요합니다.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. 역할 기반 접근 허용 확인
  const hasAllowedRole = allowedRoles.some(role =>
    authorization.hasRole(user.role, role)
  );

  if (hasAllowedRole) {
    return handler(request, { userId: user.id });
  }

  // 3. 리소스 ID 추출
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  let resourceId: string | null = null;

  // URL 경로에서 ID 추출 시도 (예: /api/products/[id])
  const idIndex = pathParts.findIndex(part => part === resourceIdParam);
  if (idIndex !== -1 && pathParts[idIndex + 1]) {
    resourceId = pathParts[idIndex + 1];
  } else {
    // 쿼리 파라미터에서 시도
    resourceId = url.searchParams.get(resourceIdParam);
  }

  // Body에서 ID 추출 (POST/PUT 요청)
  if (!resourceId && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const body = await request.clone().json();
      resourceId = body[resourceIdParam] || body.resourceId || body.id;
    } catch {
      // Body 파싱 실패 시 무시
    }
  }

  if (!resourceId) {
    // ID가 없는 경우 (목록 조회 등)은 허용
    return handler(request, { userId: user.id });
  }

  // 4. 커스텀 체크 또는 소유권 검증
  let hasAccess = false;

  if (options.customCheck) {
    hasAccess = await options.customCheck(user.id, resourceId);
  } else {
    const result = await authorization.checkOwnership(resourceType, resourceId, user.id);
    hasAccess = result.isOwner;

    if (result.error === 'Resource not found') {
      return new NextResponse(
        JSON.stringify({ error: '리소스를 찾을 수 없습니다.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  if (!hasAccess) {
    // IDOR 시도 로깅
    securityLogger.log({
      type: 'IDOR_ATTEMPT',
      severity: 'high',
      userId: user.id,
      ...context,
      details: {
        resourceType,
        resourceId,
        endpoint: request.nextUrl.pathname,
        method: request.method,
      },
    });

    return new NextResponse(
      JSON.stringify({ error: '이 리소스에 접근할 권한이 없습니다.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return handler(request, { userId: user.id });
}

// ============================================
// 5. 헬퍼 함수
// ============================================

/**
 * 간단한 소유권 체크 (API 라우트에서 직접 사용)
 */
export async function requireOwnership(
  resourceType: ResourceType,
  resourceId: string
): Promise<{ userId: string; isOwner: boolean; error?: string }> {
  const user = await authorization.getCurrentUser();

  if (!user) {
    return { userId: '', isOwner: false, error: 'Unauthorized' };
  }

  // 관리자는 항상 접근 가능
  if (authorization.hasRole(user.role, 'ADMIN')) {
    return { userId: user.id, isOwner: true };
  }

  const result = await authorization.checkOwnership(resourceType, resourceId, user.id);

  if (!result.isOwner) {
    securityLogger.log({
      type: 'IDOR_ATTEMPT',
      severity: 'high',
      userId: user.id,
      details: { resourceType, resourceId },
    });
  }

  return {
    userId: user.id,
    isOwner: result.isOwner,
    error: result.error,
  };
}

/**
 * 역할 요구 검증 (API 라우트에서 직접 사용)
 */
export async function requireRole(
  requiredRole: UserRole
): Promise<{ userId: string; hasRole: boolean; userRole?: UserRole }> {
  const user = await authorization.getCurrentUser();

  if (!user) {
    return { userId: '', hasRole: false };
  }

  const hasRequiredRole = authorization.hasRole(user.role, requiredRole);

  return {
    userId: user.id,
    hasRole: hasRequiredRole,
    userRole: user.role,
  };
}

export default {
  authorization,
  withIDORProtection,
  requireOwnership,
  requireRole,
  roleHierarchy,
};
