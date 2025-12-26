# AGENTS.md

> Version: 1.0.0
> Updated: 2025-12-26
> Project: Vibe Olympics (VIBE Coding IP Marketplace)

---

# Role

AI Context & Governance Architect로서 Vibe Olympics 프로젝트의 중앙 통제 및 위임 구조를 관리합니다.

---

# Core Philosophy

1. **500-Line Limit**: 모든 AGENTS.md는 500라인 미만 유지
2. **No Fluff, No Emojis**: 이모지와 불필요한 서술 금지
3. **Central Control & Delegation**: 루트는 관제탑, 상세 구현은 하위 파일로 위임
4. **Machine-Readable Clarity**: 실행 가능한 구체적 지침만 제공
5. **Token Efficiency**: 반복 작업과 헛바퀴 방지

---

# Token Efficiency Protocol

## Loop Prevention

작업 전 필수 확인:
1. 요구사항이 명확한가? 불명확 시 먼저 질문
2. 기존 코드/패턴이 있는가? 있으면 재사용
3. 영향 범위를 파악했는가? 파악 후 작업 시작

## Retry Limit Rule

```
[작업 시도]
    |
    +-- 1차 실패 -> 원인 분석 -> 수정 시도
    |
    +-- 2차 실패 -> 접근 방식 변경
    |
    +-- 3차 실패 -> 작업 중단 + 사용자에게 보고
    |
    L-- 보고 내용: 시도한 방법, 실패 원인, 대안 제시
```

## Scope Control

- 요청받은 범위만 수정
- 관련 없는 파일 수정 금지
- 대규모 리팩토링은 사전 승인 필요

---

# Project Context

## Tech Stack

```yaml
Language: TypeScript 5
Framework: Next.js 14 (App Router)
Database: PostgreSQL (Supabase) + Prisma ORM
Auth: NextAuth.js 4
State: TanStack React Query 5 + Zustand
Styling: Tailwind CSS 4 + Radix UI
Payment: Bootpay, PortOne, Stripe
i18n: next-intl
Testing: Jest + Playwright
Monitoring: Sentry
```

## Operational Commands

```bash
# Development
DEV_CMD=npm run dev
DEV_SOCKET=npm run dev:socket

# Build
BUILD_CMD=npm run build
BUILD_CF=npm run build:cf

# Database
DB_GENERATE=npm run db:generate
DB_PUSH=npm run db:push
DB_MIGRATE=npm run db:migrate
DB_SEED=npm run db:seed
DB_STUDIO=npm run db:studio

# Testing
TEST_CMD=npm test
TEST_WATCH=npm run test:watch
TEST_COVERAGE=npm run test:coverage
TEST_E2E=npm run test:e2e

# Code Quality
LINT_CMD=npm run lint
TYPE_CMD=npx tsc --noEmit

# Validation
CHECK_ENV=npm run check-env
TEST_SERVICES=npm run test-services
```

---

# Golden Rules

## Immutable (절대 불변)

- API 키, 토큰, 비밀번호 하드코딩 금지
- .env, .env.local 파일 직접 수정 금지
- node_modules, .git, .next 디렉토리 접근 금지
- 프로덕션 데이터베이스 직접 조작 금지
- prisma/schema.prisma 무단 변경 금지
- 사용자 동의 없는 파일 삭제 금지

## Do's

- 환경 변수 참조: process.env.KEY
- Prisma 쿼리 사용 (raw SQL 지양)
- Zod 스키마로 입력 검증
- React Query로 서버 상태 관리
- 기존 패턴과 컨벤션 따르기
- 작은 단위로 커밋

## Don'ts

- 외부 CORS 프록시 사용 금지
- console.log 프로덕션 코드에 남기기 금지
- any 타입 남용 금지
- dangerouslySetInnerHTML 무분별 사용 금지
- 미사용 import/변수 방치 금지
- 테스트 없이 복잡한 로직 추가 금지

---

# Validation Protocol

## Validation Files

- **Quick 검증**: 모든 작업 완료 후 (5-10분)
- **Full 검증**: 배포, PR 머지, 마감 전 (30분-1시간)

## Trigger Conditions

| 작업 유형 | 검증 수준 |
|----------|----------|
| 단일 파일 수정 | Quick |
| 복수 파일 수정 | Quick |
| 새 기능 추가 | Quick |
| API/DB 변경 | Quick + 관련 정밀 섹션 |
| 배포/릴리스 | Full |
| PR 머지 | Full |

## Quick Validation Checklist

```
[ ] npm run build 성공
[ ] npx tsc --noEmit 통과
[ ] npm run lint 에러 없음
[ ] 새 기능 정상 작동
[ ] 기존 기능 영향 없음
[ ] 콘솔 에러 없음
```

## Failure Recovery

```
1차 실패: 에러 메시지 분석 -> 해당 부분 수정
2차 실패: 접근 방식 재검토 -> 대안 적용
3차 실패: 작업 중단 -> 상황 보고 -> 사용자 판단 대기

보고 형식:
[BLOCKED] {작업명}
- 시도: {시도한 방법들}
- 원인: {추정 원인}
- 대안: {가능한 대안들}
- 필요: {사용자 결정 필요 사항}
```

---

# Priority Rules

충돌 발생 시 우선순위:

1. 사용자 직접 명령 (최우선)
2. 가장 가까운 AGENTS.md (해당 폴더)
3. 상위 AGENTS.md
4. 루트 AGENTS.md (이 파일)
5. 기본 동작

---

# Directory Structure & Routing

```
src/
+-- app/                  # Next.js App Router
|   +-- api/              # API Routes (47+ groups)
|   +-- auth/             # Auth pages
|   +-- dashboard/        # Dashboard pages
|   +-- marketplace/      # Marketplace pages
|   +-- admin/            # Admin pages
+-- components/
|   +-- providers/        # Context providers
|   +-- ui/               # Reusable UI
+-- lib/                  # Utilities (30+ files)
|   +-- auth.ts           # NextAuth config
|   +-- prisma.ts         # Prisma client
|   +-- api.ts            # API client
+-- hooks/                # Custom hooks
+-- types/                # TypeScript types
```

## Context Map

- **API 라우트 수정** -> src/app/api/ 해당 폴더
- **UI 컴포넌트** -> src/components/
- **상태 관리** -> src/hooks/ 또는 src/components/providers/
- **유틸리티** -> src/lib/
- **타입 정의** -> src/types/index.ts
- **DB 스키마** -> prisma/schema.prisma

---

# Code Conventions

## File Naming

- Components: PascalCase (ProductCard.tsx)
- Utilities: kebab-case (api-utils.ts)
- Hooks: camelCase with use prefix (useProducts.ts)
- Types: PascalCase (Product, User)

## API Route Pattern

```typescript
// src/app/api/{resource}/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

const schema = z.object({...});

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = await request.json();
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  try {
    // Business logic
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Component Pattern

```typescript
// src/components/{domain}/{Component}.tsx
'use client';

import { memo, useCallback } from 'react';

interface Props {
  // typed props
}

export const Component = memo(function Component({ ...props }: Props) {
  const handleAction = useCallback(() => {
    // handler
  }, []);

  return (
    // JSX
  );
});
```

---

# Git Strategy

## Branch Naming

```
feature/{feature-name}
fix/{bug-name}
refactor/{target}
docs/{doc-name}
```

## Commit Message

```
feat: 새 기능 추가
fix: 버그 수정
refactor: 코드 개선
docs: 문서 수정
style: 포맷팅
test: 테스트 추가
chore: 기타 작업
security: 보안 개선

[AGENTS] 규칙 업데이트: {변경 내용}
```

---

# Security Requirements

## Mandatory Checks

- [ ] API 키/토큰 하드코딩 없음
- [ ] 사용자 입력 Zod 검증
- [ ] XSS 방지 (textContent 사용, sanitize)
- [ ] IDOR 방지 (리소스 소유권 확인)
- [ ] Rate limiting 적용
- [ ] 민감 정보 로깅 금지

## Payment Security

- 서버사이드 가격 검증 필수
- Webhook 시그니처 검증 필수
- 결제 상태 DB 기록 필수

---

# Testing Requirements

## Unit Test (Jest)

- 새 유틸리티 함수는 테스트 필수
- 커버리지 60% 이상 유지

## E2E Test (Playwright)

- 핵심 사용자 플로우 테스트 필수
- 결제 플로우 테스트 필수

---

# Documentation

## Key Files

| 파일 | 목적 |
|-----|------|
| CLAUDE.md | AI 개발 가이드 |
| TODO.md | 작업 목록 |
| CHANGELOG.md | 변경 이력 |
| TEST_SPECS.md | 테스트 명세 |
| SESSION_CONFIG.md | 환경 설정 |

## Update Rules

- 규칙과 코드 괴리 발생 시 업데이트 제안
- 버전 변경 시 상단 Version, Updated 갱신

---

# Quick Reference

```
작업 시작 전:
[ ] 요구사항 명확한가?
[ ] 영향 범위 파악했는가?
[ ] 기존 패턴 확인했는가?

작업 중:
[ ] 요청 범위만 수정하는가?
[ ] Golden Rules 위반 없는가?
[ ] 3회 이상 같은 에러 반복하는가? -> 중단

작업 완료 후:
[ ] Quick 검증 실행
[ ] 검증 통과 -> 커밋
[ ] 배포 전 -> Full 검증
```

---

# Rules for Agent

1. **Direct Execution**: 확인 질문 없이 즉시 실행
2. **Overwrite Authority**: 기존 파일은 이 구조로 덮어쓰기
3. **Markdown Only**: 유효한 Markdown 문법 준수
4. **Scope Discipline**: 요청 범위만 수정
5. **Retry Limit**: 3회 실패 시 중단하고 보고
6. **Validation Required**: 작업 완료 후 Quick 검증 필수

---

**Command:**
Follow this AGENTS.md strictly. Ensure NO EMOJIS and STRICT RETRY LIMITS.
