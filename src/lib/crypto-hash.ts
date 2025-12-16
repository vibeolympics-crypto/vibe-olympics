/**
 * Edge Runtime 호환 해시 유틸리티
 * bcryptjs 대체용 - PBKDF2 기반
 *
 * 사용법:
 * import { hashPassword, verifyPassword } from '@/lib/crypto-hash';
 *
 * const hash = await hashPassword('password123');
 * const isValid = await verifyPassword('password123', hash);
 */

const ITERATIONS = 100000;
const HASH_LENGTH = 256;
const SALT_LENGTH = 16;

/**
 * 비밀번호 해싱 (PBKDF2-SHA256)
 * @param password 평문 비밀번호
 * @returns Base64 인코딩된 salt+hash 문자열
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_LENGTH
  );

  // salt + hash를 결합
  const combined = new Uint8Array(salt.length + hash.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(hash), salt.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * 비밀번호 검증
 * @param password 평문 비밀번호
 * @param storedHash 저장된 해시 문자열
 * @returns 일치 여부
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const combined = Uint8Array.from(atob(storedHash), (c) => c.charCodeAt(0));

    const salt = combined.slice(0, SALT_LENGTH);
    const originalHash = combined.slice(SALT_LENGTH);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const newHash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      HASH_LENGTH
    );

    // 상수 시간 비교 (타이밍 공격 방지)
    const newHashArray = new Uint8Array(newHash);
    if (originalHash.length !== newHashArray.length) return false;

    let result = 0;
    for (let i = 0; i < originalHash.length; i++) {
      result |= originalHash[i] ^ newHashArray[i];
    }

    return result === 0;
  } catch {
    return false;
  }
}

/**
 * bcrypt 해시인지 확인
 * @param hash 해시 문자열
 * @returns bcrypt 형식 여부
 */
export function isBcryptHash(hash: string): boolean {
  // bcrypt 해시는 $2a$, $2b$, $2y$로 시작
  return /^\$2[aby]\$/.test(hash);
}

/**
 * 환경에 따른 해시 함수 선택
 * - Edge Runtime: Web Crypto API (PBKDF2)
 * - Node.js: bcryptjs 사용 가능
 */
export async function hash(password: string): Promise<string> {
  // Edge Runtime 감지
  if (
    typeof globalThis.EdgeRuntime !== 'undefined' ||
    typeof process === 'undefined' ||
    !process.versions?.node
  ) {
    return hashPassword(password);
  }

  // Node.js 환경에서는 bcryptjs 사용 시도
  try {
    const bcrypt = await import('bcryptjs');
    return bcrypt.default.hash(password, 12);
  } catch {
    // bcryptjs 없으면 PBKDF2 사용
    return hashPassword(password);
  }
}

/**
 * 환경에 따른 검증 함수 선택
 */
export async function verify(
  password: string,
  storedHash: string
): Promise<boolean> {
  // bcrypt 해시인 경우
  if (isBcryptHash(storedHash)) {
    try {
      const bcrypt = await import('bcryptjs');
      return bcrypt.default.compare(password, storedHash);
    } catch {
      // Edge Runtime에서 bcrypt 해시는 검증 불가
      console.warn('bcrypt hash cannot be verified in Edge Runtime');
      return false;
    }
  }

  // PBKDF2 해시
  return verifyPassword(password, storedHash);
}
