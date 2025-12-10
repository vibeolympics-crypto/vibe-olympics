# Vibe Olympics - 세션 설정 정보

> 마지막 업데이트: 2025년 12월 12일 (세션 67 완료)
> 📋 예정 작업 → TODO.md
> 📜 완료 이력 → CHANGELOG.md  
> 🧪 테스트 명세 → TEST_SPECS.md

---

## 🔧 MCP 서버 설정

> 파일 위치: `c:\Users\WON\Desktop\프로젝트\Vibe Olympics\mcp.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "ctx7sk-ef634880-4de6-4e46-8983-70b49add844c"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "TestSprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "API_KEY": "sk-user-BP5dA4zJqkL6SdFK4Bm70_fftoNTSFtNqoK178VGNgFKmCHlOmpWqJMrbu079WMRbmjLPvCnCcdGfiJx8XiZnqmwBDO8hQEdfuhvymz-jdFRKHtNK4fOIHhamvfc_ImLUVc"
      }
    }
  }
}
```

---

## 🔑 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 구매자 | `test@vibeolympics.com` | `Test1234!` |
| 판매자 | `seller2@vibeolympics.com` | `Test1234!` |

---

## 🌐 개발 환경

| 항목 | 값 |
|------|------|
| 개발 서버 | http://localhost:3000 |
| DB | Supabase PostgreSQL |
| 프레임워크 | Next.js 14.2.33 |
| 빌드 페이지 수 | 73개 |

---

## ⚙️ 환경변수 설정 가이드

### 필수 환경변수 (.env.local)

```env
# Database (Supabase)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# GitHub OAuth
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 선택 환경변수 (프로덕션 배포 시)

```env
# Stripe 결제
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# PortOne (카카오페이/토스페이)
NEXT_PUBLIC_PORTONE_STORE_ID=store-xxxxx
PORTONE_API_SECRET=xxxxx
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD=channel-xxxxx
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY=channel-xxxxx
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY=channel-xxxxx

# Resend (이메일)
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@yourdomain.com

# Sentry (에러 모니터링)
NEXT_PUBLIC_SENTRY_DSN=https://xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=sntrys_xxxxx

# AI 챗봇
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 푸시 알림 (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx

# 관리자 이메일 (쉼표로 구분)
ADMIN_EMAILS=admin@example.com
```

---

## 🔧 기술 스택

| 카테고리 | 기술 |
|----------|------|
| Framework | Next.js 14.2.33 (App Router) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | NextAuth.js (GitHub, Google, Credentials) |
| Storage | Supabase Storage |
| State | TanStack React Query |
| Styling | Tailwind CSS |
| Payment | Stripe, PortOne (카카오페이/토스페이) |
| i18n | next-intl (한국어/영어) |
| Testing | Jest + Playwright |
| Monitoring | Sentry (에러) + Web Vitals (성능) |
| CI/CD | GitHub Actions + Vercel |

---

## 📝 현재 테스트 현황

| 테스트 종류 | 개수 | 상태 |
|------------|------|------|
| Jest 단위 테스트 | 61개 | ✅ 통과 |
| Playwright E2E | 설정 완료 | ✅ |

---

## 🚀 주요 명령어

```powershell
# 개발 서버
npm run dev

# 빌드
npm run build

# Prisma
npx prisma generate
npx prisma db push
npx prisma studio

# 테스트
npm test
npm run test:e2e

# 환경 검증
npm run check-env
npm run test-services
```

---

*세션 종료 시 변경 사항을 CHANGELOG.md에 기록하세요.*
