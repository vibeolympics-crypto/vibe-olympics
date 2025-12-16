# Cloudflare Pages 배포 가이드

**최종 업데이트**: 2025년 12월 16일

---

## 현재 상태 및 문제점

### 주요 호환성 이슈

Cloudflare Pages는 **Edge Runtime**을 사용하므로 다음 제약이 있습니다:

| 문제 | 현재 상태 | 해결 필요 |
|------|-----------|-----------|
| Prisma Client | Node.js 바이너리 사용 | Prisma Accelerate 필요 |
| bcryptjs | Node.js 전용 | Web Crypto API 대체 필요 |
| socket.io | Node.js 전용 | 별도 서버 또는 제거 필요 |
| 파일 시스템 (fs) | 사용 불가 | R2 Storage 사용 |

---

## 해결 방법

### 방법 1: Prisma Accelerate 사용 (권장)

Prisma Accelerate는 Edge Runtime에서 Prisma를 사용할 수 있게 해주는 서비스입니다.

#### 1단계: Prisma Accelerate 설정

1. [Prisma Cloud Console](https://console.prisma.io/) 접속
2. 새 프로젝트 생성
3. Accelerate 활성화
4. 연결 문자열 생성

#### 2단계: 환경 변수 수정

```bash
# 기존 DATABASE_URL 대신 Accelerate URL 사용
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_ACCELERATE_API_KEY"

# Direct URL (마이그레이션용)
DIRECT_URL="postgresql://user:password@host:5432/database"
```

#### 3단계: Prisma Schema 수정

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 방법 2: Cloudflare D1 마이그레이션 (대안)

D1은 Cloudflare의 서버리스 SQLite 데이터베이스입니다.

> ⚠️ 이 방법은 PostgreSQL에서 SQLite로의 마이그레이션이 필요하므로 권장하지 않습니다.

---

## Cloudflare Pages 대시보드 설정

### 1. 프로젝트 설정

**Settings > Build & deployments**에서:

| 설정 | 값 |
|------|-----|
| Framework preset | Next.js |
| Build command | `npm run build:cf` |
| Build output directory | `.open-next/cloudflare` |
| Root directory | `/` |

### 2. 환경 변수 (필수)

**Settings > Environment variables**에서 다음 변수 추가:

```
# 필수 변수
DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=YOUR_KEY
DIRECT_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.pages.dev
NEXTAUTH_SECRET=your-secret-key

# OAuth
GITHUB_ID=...
GITHUB_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# 결제 (PortOne)
NEXT_PUBLIC_PORTONE_STORE_ID=...
PORTONE_API_SECRET=...

# 이메일 (Resend)
RESEND_API_KEY=...

# 파일 업로드 (Cloudinary)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# 기타
NODE_VERSION=20
```

### 3. Node.js 버전

**Settings > Environment variables**에서:
```
NODE_VERSION=20
```

---

## bcrypt 대체 솔루션

### Web Crypto API 사용

`src/lib/crypto-hash.ts` 파일 생성:

```typescript
/**
 * Edge Runtime 호환 해시 유틸리티
 * bcryptjs 대체용
 */

// PBKDF2를 사용한 비밀번호 해싱
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

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
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  // salt + hash를 base64로 인코딩
  const combined = new Uint8Array(salt.length + hash.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(hash), salt.length);

  return btoa(String.fromCharCode(...combined));
}

// 비밀번호 검증
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));

  const salt = combined.slice(0, 16);
  const originalHash = combined.slice(16);

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
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  // 상수 시간 비교
  const newHashArray = new Uint8Array(newHash);
  if (originalHash.length !== newHashArray.length) return false;

  let result = 0;
  for (let i = 0; i < originalHash.length; i++) {
    result |= originalHash[i] ^ newHashArray[i];
  }

  return result === 0;
}
```

---

## 배포 명령어

### 로컬 빌드 테스트 (WSL 권장)

```bash
# Windows에서는 WSL 사용 권장
wsl

# 빌드
npm run build:cf

# 로컬 미리보기
npm run preview:cf
```

### 배포

```bash
# Cloudflare에 배포
npm run deploy:cf

# 또는 GitHub에 push하면 자동 배포
git push origin main
```

---

## 대안: Vercel 또는 Render 사용

현재 프로젝트가 Node.js 의존성이 많아 Cloudflare Pages보다 **Vercel** 또는 **Render**가 더 적합할 수 있습니다.

### Vercel 장점
- Prisma 완벽 지원 (Node.js Runtime)
- bcryptjs 사용 가능
- Next.js 최적화

### Render 장점
- 이미 구성되어 있음 (`render.yaml`)
- Docker 지원
- 더 낮은 비용

---

## 체크리스트

배포 전 확인 사항:

- [ ] Prisma Accelerate 설정 완료
- [ ] 환경 변수 모두 설정
- [ ] bcryptjs → Web Crypto API 변경
- [ ] socket.io 관련 코드 분리/제거
- [ ] 빌드 성공 확인

---

## 문제 해결

### 빌드 실패 시

1. **Prisma 오류**: Accelerate URL 확인
2. **bcrypt 오류**: crypto-hash.ts로 대체
3. **모듈 없음**: `npm install` 재실행
4. **메모리 초과**: 빌드 분할 고려

### 런타임 오류 시

1. Cloudflare Dashboard > Functions > Logs 확인
2. 환경 변수 누락 확인
3. Edge Runtime 호환성 확인

---

## 참고 자료

- [OpenNext Cloudflare](https://github.com/opennextjs/opennextjs-cloudflare)
- [Prisma Accelerate](https://www.prisma.io/accelerate)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
