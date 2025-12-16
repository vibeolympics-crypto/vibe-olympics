
 * Prisma Client - Edge 호환 래퍼
 * Cloudflare Pages Edge Runtime과 Node.js 환경 모두 지원
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { getRuntime, getDeploymentPlatform } from './edge-compat';

// 전역 Prisma 인스턴스 (개발 환경에서 hot reload 대응)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client 인스턴스 생성
 */
function createPrismaClient(): PrismaClient {
  const runtime = getRuntime();
  const platform = getDeploymentPlatform();
  
  const logLevel: Prisma.LogLevel[] = process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']
    : ['error'];
  
  // Edge Runtime (Cloudflare)에서는 datasourceUrl 직접 지정
  if (runtime === 'edge' || platform === 'cloudflare') {
    return new PrismaClient({
      log: logLevel,
      datasourceUrl: process.env.DATABASE_URL,
    });
  }
  
  return new PrismaClient({ log: logLevel });
}

/**
 * 싱글톤 Prisma Client
 * - 개발 환경: hot reload 시에도 인스턴스 재사용
 * - 프로덕션: 새 인스턴스 생성
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Edge Runtime에서 안전한 DB 쿼리 래퍼
 * - 타임아웃 처리
 * - 연결 에러 핸들링
 */
export async function safeDbQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    timeout?: number;
    fallback?: T;
    onError?: (error: Error) => void;
  } = {}
): Promise<T | null> {
  const { timeout = 10000, fallback = null, onError } = options;
  
  try {
    // 타임아웃 처리
    const result = await Promise.race([
      queryFn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), timeout)
      ),
    ]);
    
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    console.error('[DB Query Error]', err.message);
    
    if (onError) {
      onError(err);
    }
    
    return fallback as T | null;
  }
}

/**
 * 연결 상태 확인
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * 연결 종료 (서버리스 환경에서 권장)
 */
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
