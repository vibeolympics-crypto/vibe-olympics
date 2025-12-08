# Cloudflare Pages 배포 가이드

> 이 프로젝트는 **OpenNext** 어댑터를 사용하여 Cloudflare Pages에 배포됩니다.

## 1. Cloudflare Pages 설정

### 1.1 Cloudflare Dashboard에서 프로젝트 생성

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)에 로그인
2. **Workers & Pages** → **Create application** → **Pages** 선택
3. **Connect to Git** 클릭
4. GitHub 계정 연동 후 `vibeolympics-crypto/vibe-olympics` 저장소 선택

### 1.2 빌드 설정

| 설정 항목 | 값 |
|-----------|-----|
| **Framework preset** | Next.js (Static HTML Export) 또는 None |
| **Build command** | `npm run build:cf` |
| **Build output directory** | `.open-next/cloudflare` |
| **Root directory** | `/` (기본값) |
| **Node.js version** | 20 |

### 1.3 환경 변수 설정

Cloudflare Dashboard의 **Settings** → **Environment variables**에서 다음 환경 변수를 설정하세요:

#### 필수 환경 변수
```
# Database
DATABASE_URL=your_database_url

# NextAuth
NEXTAUTH_URL=https://your-domain.pages.dev
NEXTAUTH_SECRET=your_nextauth_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe (선택)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret

# Sentry (선택)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# PortOne (선택)
NEXT_PUBLIC_PORTONE_STORE_ID=your_portone_store_id
```

> ⚠️ **주의**: Production과 Preview 환경에 각각 환경 변수를 설정해야 합니다.

## 2. 로컬에서 테스트

### 2.1 의존성 설치
```bash
npm install -D @opennextjs/cloudflare wrangler
```

### 2.2 로컬 빌드 및 테스트
```bash
# Cloudflare Pages용 빌드
npm run build:cf

# 로컬에서 미리보기
npm run preview:cf
```

## 3. 자동 배포 설정

Git 연동 후 자동으로 다음과 같이 배포됩니다:

| 브랜치 | 배포 환경 | URL |
|--------|----------|-----|
| `main` | Production | `https://vibe-olympics.pages.dev` |
| 기타 브랜치 | Preview | `https://<branch>.vibe-olympics.pages.dev` |

### 3.1 배포 트리거
- `main` 브랜치에 push → 자동 Production 배포
- Pull Request 생성 → 자동 Preview 배포

## 4. 커스텀 도메인 설정

1. **Custom domains** → **Set up a custom domain**
2. 도메인 입력 (예: `vibe-olympics.com`)
3. DNS 설정 추가 (Cloudflare DNS 사용 시 자동)

## 5. 주의사항

### 5.1 Edge Runtime 호환성
Cloudflare Pages는 Edge Runtime을 사용합니다. 다음 사항을 확인하세요:

- Node.js 전용 API (`fs`, `path` 등)는 서버 컴포넌트에서만 사용
- Prisma 사용 시 [Prisma Edge](https://www.prisma.io/docs/guides/deployment/edge) 설정 필요

### 5.2 Prisma 설정
Cloudflare에서 Prisma를 사용하려면 `prisma/schema.prisma`에 다음을 추가:

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

### 5.3 빌드 시간 제한
- Cloudflare Pages 빌드 제한: 20분
- 빌드 시간이 초과되면 최적화 필요

## 6. 문제 해결

### 빌드 실패 시
```bash
# 로컬에서 빌드 테스트
npm run build:cf

# 에러 로그 확인
# Cloudflare Dashboard → Deployments → 실패한 배포 클릭 → Logs
```

### 환경 변수 문제
- `NEXT_PUBLIC_*` 변수는 빌드 시점에 포함됨
- 서버 전용 변수는 런타임에 사용됨
- 환경 변수 변경 후 재배포 필요

## 7. 유용한 링크

- [Cloudflare Pages 문서](https://developers.cloudflare.com/pages/)
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
