# Vercel 배포 가이드

## 목차
1. [사전 요구사항](#1-사전-요구사항)
2. [Vercel 프로젝트 설정](#2-vercel-프로젝트-설정)
3. [환경변수 설정](#3-환경변수-설정)
4. [데이터베이스 설정](#4-데이터베이스-설정)
5. [외부 서비스 설정](#5-외부-서비스-설정)
6. [도메인 설정](#6-도메인-설정)
7. [배포 후 확인사항](#7-배포-후-확인사항)
8. [문제 해결](#8-문제-해결)

---

## 1. 사전 요구사항

### 필수 계정
- [ ] Vercel 계정 (GitHub 연동)
- [ ] Supabase 프로젝트
- [ ] Stripe 계정 (Production keys)
- [ ] Resend 계정
- [ ] Sentry 프로젝트
- [ ] GitHub OAuth App (Production용)

### 로컬 확인사항
```bash
# 환경변수 검증
npm run check-env

# 빌드 테스트
npm run build

# 타입 체크
npm run type-check

# Lint 체크
npm run lint
```

---

## 2. Vercel 프로젝트 설정

### 2.1 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com/dashboard)에서 "New Project" 클릭
2. GitHub 저장소 연결
3. Framework Preset: **Next.js** 선택
4. Root Directory: `./` (기본값)

### 2.2 빌드 설정

| 설정 | 값 |
|------|-----|
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm ci` |
| Development Command | `npm run dev` |

### 2.3 Node.js 버전

프로젝트는 Node.js 18+ 필요. Vercel 설정에서 확인:
- Settings > General > Node.js Version > **18.x** or **20.x**

---

## 3. 환경변수 설정

Vercel Dashboard > Project > Settings > Environment Variables

### 3.1 필수 환경변수

#### NextAuth 설정
```env
# 반드시 production URL로 설정
NEXTAUTH_URL=https://your-domain.com

# 강력한 랜덤 문자열 (최소 32자)
# 생성: openssl rand -base64 32
NEXTAUTH_SECRET=your-production-secret-key
```

#### 데이터베이스
```env
# Supabase PostgreSQL 연결 문자열
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### GitHub OAuth (Production용 새로 발급)
```env
GITHUB_ID=your-production-github-client-id
GITHUB_SECRET=your-production-github-client-secret
```

#### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Stripe (Production Keys)
```env
# Production API Keys (pk_live_, sk_live_로 시작)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Production Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Resend
```env
# Production API Key
RESEND_API_KEY=re_...

# 발신자 이메일 (도메인 인증 필요)
EMAIL_FROM=noreply@your-verified-domain.com
```

#### Sentry
```env
# Production DSN
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project-id]
```

#### 내부 API 키
```env
# 강력한 랜덤 문자열
INTERNAL_API_KEY=your-secure-internal-key
```

### 3.2 환경 분리

각 환경변수에 적용 환경 설정:
- **Production**: 실제 서비스 (Live keys 사용)
- **Preview**: PR 미리보기 (Test keys 사용 가능)
- **Development**: 로컬 개발 (연결 안함)

> ⚠️ **중요**: Production에는 반드시 Live/Production 키 사용

---

## 4. 데이터베이스 설정

### 4.1 Supabase 설정

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. Production 프로젝트 선택/생성
3. Settings > Database > Connection string 복사

### 4.2 Prisma 마이그레이션

Vercel 빌드 전 데이터베이스 마이그레이션 필요:

```bash
# 로컬에서 production DB로 마이그레이션
DATABASE_URL="your-production-connection-string" npx prisma migrate deploy

# 또는 Vercel CLI 사용
vercel env pull .env.production.local
npx prisma migrate deploy
```

### 4.3 초기 데이터 (선택사항)

```bash
# seed 데이터 적용
DATABASE_URL="your-production-connection-string" npm run db:seed
```

---

## 5. 외부 서비스 설정

### 5.1 GitHub OAuth (Production)

1. GitHub > Settings > Developer settings > OAuth Apps
2. **새 OAuth App 생성** (Production용)
3. 설정:
   - Application name: `Vibe Olympics`
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-domain.com/api/auth/callback/github`

### 5.2 Stripe Webhook (Production)

1. Stripe Dashboard > Developers > Webhooks
2. "Add endpoint" 클릭
3. 설정:
   - Endpoint URL: `https://your-domain.com/api/webhook`
   - Events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
4. Signing secret 복사 → `STRIPE_WEBHOOK_SECRET`

### 5.3 Resend 도메인 인증

1. [Resend Dashboard](https://resend.com/domains) 접속
2. "Add Domain" 클릭
3. DNS 레코드 설정:
   - MX, TXT, CNAME 레코드 추가
4. 인증 완료 후 해당 도메인 이메일 사용 가능

### 5.4 Sentry 설정

1. [Sentry Dashboard](https://sentry.io) 접속
2. Project Settings > Client Keys (DSN)
3. DSN 복사 → `SENTRY_DSN`

---

## 6. 도메인 설정

### 6.1 커스텀 도메인 연결

1. Vercel Dashboard > Project > Settings > Domains
2. 도메인 추가
3. DNS 설정:
   - A Record: `76.76.21.21`
   - CNAME: `cname.vercel-dns.com`

### 6.2 SSL 인증서

Vercel이 자동으로 Let's Encrypt SSL 인증서 발급

### 6.3 도메인 연결 후 업데이트 필요 항목

- [ ] `NEXTAUTH_URL` 환경변수
- [ ] GitHub OAuth callback URL
- [ ] Stripe webhook URL
- [ ] Resend 발신자 도메인

---

## 7. 배포 후 확인사항

### 7.1 기능 체크리스트

- [ ] **홈페이지 로딩**
  - 정적 콘텐츠 표시
  - 이미지 로딩
  
- [ ] **인증**
  - GitHub 로그인
  - 이메일/패스워드 로그인
  - 로그아웃
  - 세션 유지
  
- [ ] **마켓플레이스**
  - 상품 목록 조회
  - 상품 상세 페이지
  - 검색 기능
  - 카테고리 필터
  
- [ ] **결제**
  - Stripe Checkout 리다이렉트
  - 결제 성공 처리
  - Webhook 수신 확인
  
- [ ] **이메일**
  - 비밀번호 재설정 이메일
  - 알림 이메일
  
- [ ] **커뮤니티**
  - 게시글 목록/상세
  - 댓글 작성
  - 반응 추가
  
- [ ] **에러 모니터링**
  - Sentry에 테스트 에러 전송 확인

### 7.2 성능 확인

```bash
# Lighthouse 점수 확인
# Chrome DevTools > Lighthouse
# 목표: Performance 90+, Accessibility 90+
```

### 7.3 로그 확인

Vercel Dashboard > Project > Functions > Logs

---

## 8. 문제 해결

### 8.1 빌드 실패

**증상**: `npm run build` 실패

**해결**:
1. 환경변수 누락 확인
2. TypeScript 에러 확인: `npm run type-check`
3. Lint 에러 확인: `npm run lint`

### 8.2 인증 실패

**증상**: GitHub 로그인 후 에러

**해결**:
1. `NEXTAUTH_URL`이 실제 도메인과 일치하는지 확인
2. GitHub OAuth callback URL 확인
3. `NEXTAUTH_SECRET` 설정 확인

### 8.3 데이터베이스 연결 실패

**증상**: 500 에러, "Cannot connect to database"

**해결**:
1. `DATABASE_URL` 형식 확인
2. Supabase 프로젝트 상태 확인
3. IP 허용 목록 확인 (Supabase > Settings > Database)

### 8.4 Stripe Webhook 실패

**증상**: 결제 후 상태 미반영

**해결**:
1. Webhook endpoint URL 확인
2. `STRIPE_WEBHOOK_SECRET` 일치 확인
3. Stripe Dashboard > Webhooks > Logs 확인

### 8.5 이메일 발송 실패

**증상**: 이메일 미수신

**해결**:
1. Resend Dashboard > Logs 확인
2. 발신자 도메인 인증 상태 확인
3. `EMAIL_FROM` 형식 확인

### 8.6 Sentry 미작동

**증상**: 에러가 Sentry에 표시 안됨

**해결**:
1. `SENTRY_DSN` 확인
2. 브라우저 콘솔에서 Sentry 초기화 확인
3. Sentry Dashboard > Issues 확인

---

## 배포 명령어 요약

```bash
# 1. 로컬 테스트
npm run check-env
npm run build
npm run start

# 2. 프로덕션 배포 (Vercel CLI)
vercel --prod

# 3. 데이터베이스 마이그레이션
npx prisma migrate deploy

# 4. 배포 확인
curl https://your-domain.com/api/health
```

---

## 참고 링크

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deploy](https://www.prisma.io/docs/guides/deployment)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Resend Documentation](https://resend.com/docs)
- [Sentry for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
