/**
 * Edge Runtime 호환성 유틸리티
 * Cloudflare Pages / Vercel Edge 환경에서 사용
 */

// Edge Runtime globalThis 확장 타입
declare global {
  // eslint-disable-next-line no-var
  var EdgeRuntime: string | undefined;
}

/**
 * 현재 런타임 환경 감지
 */
export function getRuntime(): 'edge' | 'nodejs' | 'browser' {
  // 브라우저 환경
  if (typeof window !== 'undefined') {
    return 'browser';
  }
  
  // Edge Runtime (Cloudflare Workers, Vercel Edge)
  if (
    typeof globalThis.EdgeRuntime !== 'undefined' ||
    typeof (globalThis as Record<string, unknown>).caches !== 'undefined'
  ) {
    return 'edge';
  }
  
  // Node.js 환경
  return 'nodejs';
}

/**
 * Edge Runtime 여부 확인
 */
export function isEdgeRuntime(): boolean {
  return getRuntime() === 'edge';
}

/**
 * Node.js 전용 기능 사용 가능 여부
 */
export function canUseNodeAPIs(): boolean {
  return getRuntime() === 'nodejs';
}

/**
 * 배포 플랫폼 감지
 */
export function getDeploymentPlatform(): 'cloudflare' | 'vercel' | 'render' | 'local' | 'unknown' {
  // Cloudflare
  if (process.env.CF_PAGES === '1' || process.env.CLOUDFLARE_WORKERS) {
    return 'cloudflare';
  }
  
  // Vercel
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
    return 'vercel';
  }
  
  // Render
  if (process.env.RENDER === 'true' || process.env.RENDER_SERVICE_NAME) {
    return 'render';
  }
  
  // 로컬 개발
  if (process.env.NODE_ENV === 'development') {
    return 'local';
  }
  
  return 'unknown';
}

/**
 * Edge 환경에서 안전하게 동적 import 수행
 */
export async function safeNodeImport<T>(
  moduleName: string,
  fallback: T
): Promise<T> {
  if (!canUseNodeAPIs()) {
    return fallback;
  }
  
  try {
    return await import(moduleName);
  } catch {
    return fallback;
  }
}

/**
 * 환경별 캐시 전략
 */
export function getCacheStrategy(): 'memory' | 'kv' | 'none' {
  const platform = getDeploymentPlatform();
  
  switch (platform) {
    case 'cloudflare':
      return 'kv'; // Cloudflare KV 사용 가능
    case 'vercel':
    case 'render':
      return 'memory'; // 메모리 캐시
    default:
      return 'memory';
  }
}

/**
 * Edge 호환 fetch wrapper
 */
export async function edgeFetch(
  url: string | URL,
  options?: RequestInit
): Promise<Response> {
  const runtime = getRuntime();
  
  // Edge Runtime에서는 기본 fetch 사용
  if (runtime === 'edge') {
    return fetch(url, options);
  }
  
  // Node.js에서는 node-fetch 또는 내장 fetch 사용
  return fetch(url, options);
}

/**
 * 환경 변수 안전하게 가져오기
 */
export function getEnvSafe(key: string, defaultValue = ''): string {
  try {
    return process.env[key] ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Edge Runtime에서 지원되지 않는 기능 경고
 */
export function warnIfEdge(feature: string): void {
  if (isEdgeRuntime()) {
    console.warn(`[Edge Warning] ${feature} is not fully supported in Edge Runtime`);
  }
}
