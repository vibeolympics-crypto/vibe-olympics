# Vibe Olympics Comprehensive Checklist

> Version: 1.0.0
> Updated: 2025-12-26
> Purpose: 배포/마감 전 정밀 검증 (30분-1시간)
> Prerequisite: WEB_CHECKLIST_QUICK.md 통과 후 실행

---

## Usage Guide

배포, PR 머지, 스프린트 마감 전 사용합니다.
Quick 체크리스트 통과 후에만 실행하세요.

### Execution Order

```
1. Quick 체크리스트 통과 확인
2. 해당 섹션만 선택적 실행
3. 필수 섹션: 1, 2, 8, 11, 12
4. 선택 섹션: 프로젝트 특성에 따라
```

---

## 0. Pre-Flight Check

- [ ] Quick 체크리스트 통과 완료
- [ ] 변경 파일 목록 파악 완료
- [ ] 영향 받는 기능 범위 파악 완료

---

## 1. Build & Type Safety (필수)

```bash
npm run build
npx tsc --noEmit
npm run lint
```

- [ ] 프로덕션 빌드 성공
- [ ] 빌드 경고 검토 (critical 없음)
- [ ] 타입 에러 0개
- [ ] any 타입 남용 없음
- [ ] 린트 에러 0개

---

## 2. Code Quality (필수)

### Code Hygiene

- [ ] 미사용 import 없음
- [ ] 미사용 변수/함수 없음
- [ ] 주석 처리된 코드 정리됨
- [ ] console.log 제거됨
- [ ] TODO 주석 검토 완료
- [ ] 순환 의존성 없음

### Naming & Structure

- [ ] 네이밍 컨벤션 일관성
- [ ] 파일/폴더 구조 규칙 준수
- [ ] 함수당 단일 책임 원칙

---

## 3. Next.js App Router Deep Check

### Server Components

- [ ] 'use client' 필요한 곳에만 사용
- [ ] 서버 컴포넌트에서 DB 직접 접근 정상
- [ ] 메타데이터 생성 정상

### Client Components

- [ ] Hook 규칙 준수
- [ ] useEffect 의존성 배열 정확
- [ ] useEffect cleanup 구현
- [ ] useMemo/useCallback 적절 사용
- [ ] 불필요한 리렌더링 없음

### API Routes

- [ ] NextRequest/NextResponse 사용
- [ ] 인증 체크 구현 (requireAuth)
- [ ] Zod 스키마 검증 적용
- [ ] 에러 응답 표준화
- [ ] Rate limiting 적용 (민감 API)

---

## 4. State Management

### React Query (Server State)

- [ ] queryKey 체계적 관리
- [ ] staleTime/gcTime 적절 설정
- [ ] 뮤테이션 후 캐시 무효화
- [ ] 에러/로딩 상태 처리
- [ ] 낙관적 업데이트 정상 (해당 시)

### Client State

- [ ] 상태 구조 적절
- [ ] 불변성 유지
- [ ] 불필요한 전역 상태 없음

### URL State

- [ ] 라우팅 정상 동작
- [ ] 뒤로가기/앞으로가기 정상
- [ ] 딥링크 정상
- [ ] 새로고침 시 상태 유지

---

## 5. Database (Prisma)

### Query Optimization

- [ ] N+1 문제 없음 (include 사용)
- [ ] 필요한 필드만 select
- [ ] 인덱스 활용 확인
- [ ] 대용량 쿼리 페이지네이션

### Data Integrity

- [ ] 트랜잭션 적절 사용
- [ ] unique 제약조건 활용
- [ ] cascade 삭제 의도대로 동작
- [ ] 마이그레이션 정상

```bash
npm run db:generate
npm run db:push
```

---

## 6. Style & Layout

### Responsive Design

- [ ] Mobile (320px-480px) 정상
- [ ] Tablet (481px-768px) 정상
- [ ] Desktop (769px-1024px) 정상
- [ ] Large (1025px+) 정상

### Layout Integrity

- [ ] Flex/Grid 정렬 정상
- [ ] 스크롤 동작 정상
- [ ] 모달/팝업 오버레이 정상
- [ ] z-index 충돌 없음

### Tailwind CSS

- [ ] 클래스명 중복 없음
- [ ] 커스텀 유틸리티 적절 사용
- [ ] 다크모드 지원 (해당 시)

---

## 7. API & Network

### Request Verification

- [ ] 엔드포인트 URL 정확
- [ ] HTTP 메서드 적절
- [ ] 요청 헤더 설정 정확
- [ ] 인증 토큰 처리 정상

### Response Handling

- [ ] 성공 응답 처리
- [ ] HTTP 에러 (4xx, 5xx) 처리
- [ ] 네트워크 에러 처리
- [ ] 타임아웃 처리

### Performance

- [ ] 불필요한 요청 없음
- [ ] React Query 캐싱 활용
- [ ] 요청 디바운싱 (검색 등)

---

## 8. Security (필수)

### Authentication & Authorization

- [ ] NextAuth 세션 체크 정상
- [ ] 토큰 만료 처리
- [ ] 로그아웃 시 세션 제거
- [ ] 역할 기반 접근 제어 (RBAC)
- [ ] IDOR 방지 (소유권 확인)

### Input Validation

- [ ] Zod 스키마 서버 검증
- [ ] XSS 방지 (sanitize)
- [ ] 파일 업로드 검증

### Sensitive Data

- [ ] API 키 클라이언트 노출 없음
- [ ] 환경 변수 사용
- [ ] .gitignore 민감 파일 포함
- [ ] 에러 메시지에 민감 정보 없음
- [ ] 로그에 개인정보 없음

### Payment Security

- [ ] 서버사이드 가격 검증
- [ ] Webhook 시그니처 검증
- [ ] 결제 상태 DB 기록

---

## 9. Performance

### Bundle Optimization

- [ ] 코드 스플리팅 적용
- [ ] Tree shaking 정상
- [ ] 번들 크기 적정

### Rendering Optimization

- [ ] React.memo 적절 사용
- [ ] useMemo/useCallback 적절 사용
- [ ] 가상화 적용 (긴 리스트)

### Image Optimization

- [ ] next/image 사용
- [ ] 적절한 width/height 설정
- [ ] priority 속성 적절 사용
- [ ] lazy loading 적용

---

## 10. Accessibility

### Semantic HTML

- [ ] heading 계층 적절
- [ ] 랜드마크 요소 사용
- [ ] 폼 레이블 연결

### Keyboard Navigation

- [ ] 모든 인터랙티브 요소 접근 가능
- [ ] Tab 순서 논리적
- [ ] 포커스 표시 명확

---

## 11. Deployment Preparation (필수)

### Environment

- [ ] 환경 변수 분리 (dev/prod)
- [ ] 환경별 API URL 설정
- [ ] 민감 정보 환경 변수 관리

```bash
npm run check-env
npm run test-services
```

### Build Verification

- [ ] 프로덕션 빌드 성공
- [ ] 빌드 결과물 로컬 테스트

```bash
npm run build && npm run start
```

---

## 12. Final Verification (필수)

### Testing

```bash
npm test
npm run test:e2e
```

- [ ] 단위 테스트 통과
- [ ] E2E 테스트 통과
- [ ] 새 기능 정상 동작
- [ ] 기존 기능 영향 없음

### Documentation

- [ ] CHANGELOG.md 기록
- [ ] TODO.md 업데이트
- [ ] API 변경 시 문서 업데이트

---

## 13. Git & Commit

### Pre-Commit

- [ ] 변경 사항 검토 완료
- [ ] 불필요한 파일 커밋 안 함
- [ ] .gitignore 확인

### Commit

```bash
feat: 새 기능 추가
fix: 버그 수정
refactor: 코드 개선
docs: 문서 수정
test: 테스트 추가
security: 보안 개선
```

- [ ] 커밋 메시지 명확
- [ ] 커밋 단위 적절

---

## Retry Protocol

```
1차 실패 -> 원인 분석 -> 해당 섹션 수정
2차 실패 -> 접근 방식 변경
3차 실패 -> 중단 + 상세 보고

보고 형식:
[FULL-BLOCKED] {섹션명}
- 항목: {실패 항목}
- 증상: {발생 현상}
- 시도: {시도한 방법 목록}
- 원인: {추정 원인}
- 대안: {가능한 대안}
- 필요: {사용자 결정 요청}
```

---

## Completion Summary Template

```markdown
## Deployment Readiness Report

### Build Status
- Production Build: PASS/FAIL
- Type Check: PASS/FAIL
- Lint: PASS/FAIL

### Testing Status
- Unit Tests: PASS/FAIL
- E2E Tests: PASS/FAIL
- Regression: PASS/FAIL

### Security Status
- Auth Check: PASS/FAIL
- Input Validation: PASS/FAIL
- Sensitive Data: PASS/FAIL

### Blocked Items
- {항목}: {상태}

### Recommendation
- READY FOR DEPLOYMENT
- NEEDS REVIEW: {사유}
- BLOCKED: {사유}
```

---

## Section Quick Reference

| 섹션 | 필수 | 적용 시점 |
|------|-----|----------|
| 1. Build & Type | O | 항상 |
| 2. Code Quality | O | 항상 |
| 3. Next.js | - | 컴포넌트/API 변경 시 |
| 4. State | - | 상태 관리 변경 시 |
| 5. Database | - | DB 쿼리 변경 시 |
| 6. Style | - | UI 변경 시 |
| 7. API | - | API 연동 변경 시 |
| 8. Security | O | 배포 전 |
| 9. Performance | - | 성능 이슈 시 |
| 10. Accessibility | - | UI 변경 시 권장 |
| 11. Deployment | O | 배포 전 |
| 12. Final | O | 항상 |
| 13. Git | O | 커밋 전 |

---

**Quick Check Only?** -> WEB_CHECKLIST_QUICK.md 참조
