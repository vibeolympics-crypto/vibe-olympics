# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe Olympics는 VIBE 코딩(AI 활용 개발) 창작물을 거래하는 Next.js 14 기반 지식재산 마켓플레이스입니다. 프롬프트, 템플릿, 코드, 디지털 콘텐츠 등을 판매/구매할 수 있습니다.

## Commands

```bash
# Development
npm run dev              # 개발 서버 (localhost:3000)
npm run dev:socket       # WebSocket 서버 (실시간 알림용)

# Build
npm run build            # Prisma generate + Next.js 빌드
npm run build:cf         # Cloudflare Workers 빌드

# Database (Prisma)
npm run db:generate      # Prisma 클라이언트 생성
npm run db:push          # 스키마 동기화
npm run db:migrate       # 마이그레이션 생성
npm run db:seed          # 시드 데이터 삽입
npm run db:studio        # Prisma Studio GUI

# Testing
npm test                 # Jest 단위 테스트 (61+ tests)
npm run test:watch       # Watch 모드
npm run test:coverage    # 커버리지 리포트
npm run test:e2e         # Playwright E2E 테스트 (206 tests)
npm run test:e2e:ui      # Playwright UI 모드
npm run test:e2e:prod    # 프로덕션 E2E 테스트

# Run single test
npm test -- path/to/test.ts                    # Jest 단일 파일
npx playwright test e2e/auth.spec.ts           # Playwright 단일 파일

# Code Quality
npm run lint             # ESLint 검사
npm run check-env        # 환경변수 검증
npm run test-services    # 외부 서비스 연결 테스트
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Supabase) + Prisma ORM + Accelerate
- **Auth**: NextAuth.js (GitHub, Google, Credentials)
- **State**: TanStack React Query (서버), Zustand (클라이언트)
- **Styling**: Tailwind CSS 4 + Radix UI
- **i18n**: next-intl (한국어/영어)
- **Payment**: Bootpay (메인), PortOne (백업), Stripe (해외)
- **AI**: Anthropic Claude API

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes (47+ 그룹)
│   │   ├── auth/           # NextAuth 라우트
│   │   ├── products/       # 상품 CRUD
│   │   ├── payment/        # 결제 (Bootpay, PortOne, Stripe)
│   │   ├── ai/             # Claude AI 통합
│   │   ├── admin/          # 관리자 API
│   │   └── dashboard/      # 판매자/구매자 대시보드
│   ├── marketplace/        # 마켓플레이스 페이지
│   ├── dashboard/          # 대시보드 페이지
│   ├── education/          # 교육 센터
│   ├── community/          # 커뮤니티
│   └── admin/              # 관리자 패널
├── components/
│   ├── providers/          # Context Providers (Auth, Query, Notification)
│   ├── ui/                 # 재사용 UI 컴포넌트
│   └── marketplace/        # 도메인별 컴포넌트
├── lib/                    # 유틸리티 (30+ 파일)
│   ├── prisma.ts           # Prisma 클라이언트
│   ├── auth.ts             # NextAuth 설정
│   ├── api.ts              # Axios API 클라이언트
│   └── payment-providers.ts # 통합 결제 핸들러
├── hooks/                  # Custom Hooks
│   ├── use-api.ts          # React Query 래퍼
│   ├── use-socket.ts       # WebSocket 관리
│   └── use-ab-test.ts      # A/B 테스트
└── types/                  # TypeScript 타입 (200+)
```

### Prisma Schema (prisma/schema.prisma)

55+ 모델 정의:
- **User**: 사용자 (NextAuth 연동, 판매자/구매자 역할)
- **Product**: 상품 (DIGITAL_PRODUCT, BOOK, VIDEO_SERIES, MUSIC_ALBUM)
- **Purchase**: 구매 내역
- **Settlement**: 판매자 정산
- **Review**: 리뷰 시스템
- **Subscription**: 구독 플랜
- **Experiment**: A/B 테스트
- **AuditLog**: 관리자 액션 로그

### API Patterns

API 클라이언트 (`src/lib/api.ts`):
```typescript
productsApi.getAll(params)
productsApi.getById(id)
productsApi.create(data)
reviewsApi.create(productId, data)
```

React Query Hooks (`src/hooks/use-api.ts`):
```typescript
useProducts(params)
useProduct(id)
useCreateProduct()
```

### Authentication

NextAuth.js 설정 (`src/lib/auth.ts`):
- Providers: GitHub, Google, Credentials (이메일/비밀번호)
- Adapter: PrismaAdapter
- Custom pages: `/auth/login`, `/auth/signup`

### Internationalization

next-intl 설정:
- 지원 언어: 한국어(ko), 영어(en)
- 기본 언어: 한국어
- 번역 파일: `messages/ko.json`, `messages/en.json`

## Key Files

| 파일 | 설명 |
|------|------|
| `TODO.md` | 작업 목록 (12 Phase 완료) |
| `CHANGELOG.md` | 세션별 변경 이력 |
| `TEST_SPECS.md` | 테스트 케이스 명세 (562+) |
| `SESSION_CONFIG.md` | 개발 환경 설정 정보 |

## Test Accounts

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 구매자 | `test@vibeolympics.com` | `Test1234!` |
| 판매자 | `seller2@vibeolympics.com` | `Test1234!` |

## Environment Variables

필수 환경변수 (`.env.local` 참고):
- `DATABASE_URL`, `DIRECT_URL` - Supabase PostgreSQL
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` - NextAuth
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth

선택 환경변수:
- `ANTHROPIC_API_KEY` - Claude AI
- `NEXT_PUBLIC_BOOTPAY_JS_KEY`, `BOOTPAY_REST_API_KEY` - 결제
- `RESEND_API_KEY` - 이메일
- `NEXT_PUBLIC_SENTRY_DSN` - 에러 모니터링

## Development Workflow

1. `TODO.md`에서 현재 작업 확인
2. 개발 작업 수행
3. `CHANGELOG.md`에 변경사항 기록
4. 테스트 실행: `npm test`, `npm run test:e2e`
