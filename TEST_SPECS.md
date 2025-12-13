# 🧪 Vibe Olympics - 테스트 명세 (TEST_SPECS)

> 마지막 업데이트: 2025년 12월 14일
> TestSprite MCP 자동 테스트용 역할별 테스트 케이스 정의
> 총 테스트 케이스: 562개+ (명세) + 206개 (Playwright E2E) + 61개 (Jest)
> 
> **🌐 배포 URL**: https://vibe-olympics.onrender.com

---

## 🎯 TestSprite 테스트 구성

### 테스트 대상 URL
- **프로덕션**: https://vibe-olympics.onrender.com
- **로컬 개발**: http://localhost:3000

### 역할별 테스트 우선순위
| 우선순위 | 역할 | 테스트 수 | 설명 |
|----------|------|----------|------|
| 🔴 P0 | 방문자 | 22개 | 첫 접속, 회원가입, 로그인 |
| 🔴 P0 | 구매자 | 35개 | 검색, 구매, 결제 핵심 플로우 |
| 🟠 P1 | 판매자 | 38개 | 상품 등록, 관리, 정산 |
| 🟠 P1 | 커뮤니티 | 15개 | 게시글, 댓글, 팔로우 |
| 🟡 P2 | 관리자 | 29개 | 관리 기능 |
| 🟡 P2 | 일반유저 | 18개 | 설정, 알림 |
| 🟢 P3 | API | 25개 | API 직접 테스트 |
| 🟢 P3 | 반응형/접근성 | 15개 | UI/UX 테스트 |

### 세션별 테스트 로드맵 (Session 1-87)

#### Phase 1: 프로젝트 기반 (S01-S10)
| 세션 | 주요 작업 | 테스트 항목 | 상태 |
|------|----------|------------|------|
| S01 | 프로젝트 초기 설정 | Prisma, NextAuth 연동 | ✅ |
| S02 | 검색/알림 시스템 | 검색 API, 알림 기능 | ✅ |
| S03 | 상품 등록, 사용자 설정 | CRUD API, 설정 페이지 | ✅ |
| S04 | 분석, Stripe 결제 | 분석 대시보드, 결제 플로우 | ✅ |
| S05 | 커뮤니티 기능 | 게시글, 댓글, 반응 | ✅ |
| S06 | 구매 UX, 이메일 시스템 | 구매 플로우, 이메일 발송 | ✅ |
| S07 | SEO, 성능 최적화 | 메타데이터, 캐싱 | ✅ |
| S08 | 교육 센터 | 튜토리얼 목록/상세 | ✅ |
| S09 | 테스트 환경, CI/CD, Sentry | E2E, GitHub Actions | ✅ |
| S10 | 관리자 대시보드 | Admin 통계, 사용자 관리 | ✅ |

#### Phase 2: 기능 확장 (S11-S20)
| 세션 | 주요 작업 | 테스트 항목 | 상태 |
|------|----------|------------|------|
| S11 | FAQ 페이지 | 아코디언, 검색, 필터 | ✅ |
| S12 | 통합 반응 시스템 | Reaction 모델, 좋아요/추천 | ✅ |
| S13 | 교육 상세 페이지, 마크다운 | 콘텐츠 렌더링 | ✅ |
| S14 | 위시리스트, 판매자 프로필 | 위시리스트 API, 프로필 | ✅ |
| S15 | 팔로우 시스템 | 팔로우/언팔로우 | ✅ |
| S16 | 팔로잉/피드 시스템 | 피드 API | ✅ |
| S17 | 알림 설정, 구매 내역 개선 | 설정 UI, 내역 페이지 | ✅ |
| S18 | 비밀번호 찾기/재설정 | 이메일 발송, 토큰 검증 | ✅ |
| S19 | 프로덕션 배포 준비 | 환경변수, 빌드 | ✅ |
| S20 | Toast 시스템, UX 개선 | 토스트 알림, UX | ✅ |

#### Phase 3: 법적/결제 (S21-S30)
| 세션 | 주요 작업 | 테스트 항목 | 상태 |
|------|----------|------------|------|
| S21 | 이용약관, 개인정보, 환불정책 | 정적 페이지 | ✅ |
| S22 | 카카오페이, 토스페이, Google OAuth | 결제 수단, OAuth | ✅ |
| S23 | 검색/필터 고도화, 통계 차트 | 필터 UI, 차트 | ✅ |
| S24 | 이메일 알림 템플릿, 푸시 알림 | 알림 시스템 | ✅ |
| S25 | 정산/엑셀 시스템, 환불 관리 | Settlement, Refund API | ✅ |
| S26 | 교육 콘텐츠 정책, AI 챗봇 | 마크다운 에디터, 챗봇 | ✅ |
| S27 | 반응 통계, 개인화 추천 API | Analytics, Recommendations | ✅ |
| S28 | 마이그레이션 스크립트, 전환율 | Like→Reaction, 전환율 API | ✅ |
| S29 | SEO 최적화, 추천 UI 적용 | JSON-LD, 추천 섹션 | ✅ |
| S30 | API 캐싱, E2E 테스트 확대 | 캐싱 헤더, Playwright | ✅ |

#### Phase 4: 접근성/보안 (S31-S40)
| 세션 | 주요 작업 | 테스트 항목 | 상태 |
|------|----------|------------|------|
| S31 | 접근성 개선, 챗봇 API | ARIA, Skip Nav | ✅ |
| S32 | Supabase 연결, DB 시드 | DB 연결, 초기 데이터 | ✅ |
| S33 | 기능 검증, 에러 핸들링 | 페이지 검증, AI 에러 | ✅ |
| S34 | 인증 시스템 검증 | NextAuth 프로바이더 | ✅ |
| S35 | 코드 전면 재검토 | API, UI, 스키마 검토 | ✅ |
| S36 | Like → Reaction 마이그레이션 | 데이터 마이그레이션 | ✅ |
| S37 | 마이그레이션 검증, API 테스트 | 코드 검증, 런타임 테스트 | ✅ |
| S38 | 역할별 수동 테스트 실행 | Visitor 11개, API 6개 | ✅ |
| S39 | 인증 기능 테스트 | 로그인, 회원가입 폼 | ✅ |
| S40 | 상품/판매자/튜토리얼 API 테스트 | 공개 API 5개 | ✅ |

#### Phase 5: API 보안 테스트 (S41-S50)
| 세션 | 주요 작업 | 테스트 항목 | 상태 |
|------|----------|------------|------|
| S41 | 인증 필요 API 보안 테스트 | 401 응답 검증 7개 | ✅ |
| S42 | 에러 처리, 검색 API 테스트 | 404, 경계 조건, 검색 | ✅ |
| S43 | 페이지네이션 유효성 검사 | 음수/0 파라미터 → 400 | ✅ |
| S44 | 인증/결제 API 테스트 | NextAuth, Stripe, PortOne | ✅ |
| S45 | 판매자/분석/정산 API 보안 | 권한 검증 21개 | ✅ |
| S46 | 알림/팔로우/댓글/리뷰 API | 보안 테스트 16개 | ✅ |
| S47 | API 종합 테스트, 다국어/성능 | 116개 테스트 통과 | ✅ |
| S48 | SEO/검색 노출 최적화 | robots, sitemap, 메타데이터 | ✅ |
| S49 | 광고 슬롯, RSS 피드 | AdSlot, RSS/Atom API | ✅ |
| S50 | 자동 글 발행 API, 예약 발행 | MCP 연동, 스케줄러 | ✅ |

#### Phase 6: 배포/테스트 (S51-S57)
| 세션 | 주요 작업 | 테스트 항목 | 상태 |
|------|----------|------------|------|
| S51 | DB 마이그레이션, E2E 통과 | Prisma, Playwright 24개 | ✅ |
| S52 | 프로덕션 배포 준비 | 환경변수, Vercel 가이드 | ✅ |
| S53 | Cloudflare → Vercel 전환 | 배포 플랫폼 변경 | ✅ |
| S54 | 코드 품질 개선 | ESLint, Jest 61개 통과 | ✅ |
| S55 | 부트페이 결제 시스템 | Stripe → Bootpay 전환 | ✅ |
| S56 | ESLint 에러/경고 정리 | 0 errors, 0 warnings | ✅ |
| S57 | Playwright E2E 자동화 | 160개 테스트 작성 | ✅ |

#### Phase 7: 번들/추천 시스템 (S58-S64)
| 세션 | 주요 작업 | 테스트 수 | 상태 |
|------|----------|----------|------|
| S58 | 번들 판매, 쿠폰/할인 시스템 | 30개 | ✅ |
| S59 | Cloudinary 파일 업로드 | 12개 | ✅ |
| S60 | 조건부 확률 추천 시스템 | 15개 | ✅ |
| S61 | 글로벌 추천, Hydration 버그 | 12개 | ✅ |
| S62 | 이커머스 UX, 상품 비교 | 20개 | ✅ |
| S63 | AI 콘텐츠 등록, SEO 자동화 | 11개 | ✅ |
| S64 | 컬렉션, 아티스트, 미리보기 | 25개 | ✅ |

#### Phase 8: 구독/알림/실시간 (S65-S73)
| 세션 | 주요 작업 | 테스트 수 | 상태 |
|------|----------|----------|------|
| S65 | 검색 자동완성, 필터 UX 개선 | 10개 | ✅ |
| S66 | 정기 구독 결제, 빌링키 | 18개 | ✅ |
| S67 | 알림 시스템 고도화, 이메일 | 14개 | ✅ |
| S68 | Socket.io 실시간 알림 | 12개 | ✅ |
| S69 | TypeScript 타입 오류 수정 | - | ✅ |
| S70 | img → next/image 변환 (LCP) | 8개 | ✅ |
| S71 | Google Analytics 4 연동 | 10개 | ✅ |
| S72 | 추천 시스템 DB 검증 | - | ✅ |
| S73 | PWA 오프라인 지원 강화 | 15개 | ✅ |

#### Phase 9: A/B 테스트/대시보드 (S74-S78)
| 세션 | 주요 작업 | 테스트 수 | 상태 |
|------|----------|----------|------|
| S74 | A/B 테스트 프레임워크 | 16개 | ✅ |
| S75 | 결제/환불 이메일 알림 | 10개 | ✅ |
| S76 | 대시보드 기능 강화 | 15개 | ✅ |
| S77 | A/B 테스트 관리 대시보드 | 12개 | ✅ |
| S78 | 코드 품질 (force-dynamic, logger) | 5개 | ✅ |

#### Phase 10: SEO/운영 도구 (S80)
| 세션 | 주요 작업 | 테스트 수 | 상태 |
|------|----------|----------|------|
| S80 | Rate Limit, 감사 로그, 티켓, 뉴스레터 | 20개 | ✅ |

#### Phase 11: 판매자 도구 (S81-S83)
| 세션 | 주요 작업 | 테스트 수 | 상태 |
|------|----------|----------|------|
| S81 | 벌크 작업, CSV, 피드백, 레퍼럴 | 15개 | ✅ |
| S82 | 서버 헬스 모니터링, 실시간 알림 | 10개 | ✅ |
| S83 | 판매 리포트, 재고 알림, 경쟁 분석 | 10개 | ✅ |

#### Phase 12: AI 분석/고급 기능 (S84-S87)
| 세션 | 주요 작업 | 테스트 수 | 상태 |
|------|----------|----------|------|
| S84 | E2E 테스트 보강, 고급 분석, AI 설명 | 15개 | ✅ |
| S85 | 행동 분석, AI 인사이트, 이미지 분석 | 12개 | ✅ |
| S86 | AI 가격 책정, 소셜 미디어, 이메일 마케팅 | 10개 | ✅ |
| S87 | 외부 결제 (PayPal/Stripe), 네이티브 앱 | 8개 | ✅ |

---

## 🎭 Playwright E2E 테스트 현황

### 테스트 파일 구조
```
e2e/
├── accessibility.spec.ts # 접근성 테스트 (19개)
├── api.spec.ts          # API 테스트 (25개)
├── app.spec.ts          # 기본 페이지 테스트 (24개)
├── auth.spec.ts         # 인증 테스트 (14개)
├── community.spec.ts    # 커뮤니티 테스트 (13개)
├── dashboard.spec.ts    # 대시보드 테스트 (24개)
├── education.spec.ts    # 교육 센터 테스트 (14개)
├── marketplace.spec.ts  # 마켓플레이스 테스트 (16개)
├── performance.spec.ts  # 성능 테스트 (16개)
├── responsive.spec.ts   # 반응형 디자인 테스트 (17개)
└── seller-api.spec.ts   # 판매자 API 테스트 (24개)
```

**총 테스트**: 206개 (11개 파일)

### 실행 명령
```bash
npm run test:e2e              # 모든 E2E 테스트 실행
npx playwright test auth      # 인증 테스트만
npx playwright test api       # API 테스트만
npx playwright test --ui      # UI 모드로 실행
npx playwright test --headed  # 브라우저 표시하며 실행
```

### 테스트 카테고리별 요약

| 파일 | 테스트 수 | 주요 테스트 내용 |
|------|----------|-----------------|
| accessibility.spec.ts | 19 | 랜드마크, 키보드, alt, 레이블 |
| api.spec.ts | 25 | Health check, CRUD, 인증, 에러 처리 |
| app.spec.ts | 24 | 홈페이지, 네비게이션, 기본 페이지 |
| auth.spec.ts | 14 | 로그인, 회원가입, 비밀번호 찾기, 보호된 라우트 |
| community.spec.ts | 13 | 게시글 목록, 카테고리, 상호작용 |
| dashboard.spec.ts | 24 | 대시보드, 관리자 페이지, 헬스 모니터링 |
| education.spec.ts | 14 | 튜토리얼 목록, 난이도 필터, 상세 페이지 |
| marketplace.spec.ts | 16 | 상품 목록, 검색, 필터, 상세 페이지 |
| performance.spec.ts | 16 | 로드 시간, 응답 시간, 캐싱 |
| responsive.spec.ts | 17 | 모바일/태블릿/데스크톱 레이아웃 |
| seller-api.spec.ts | 24 | 판매자 API, 관리자 API, 레퍼럴, 피드백 |

---

## 📋 테스트 환경 정보

### 개발 서버
- **프로덕션 URL**: https://vibe-olympics.onrender.com
- **로컬 URL**: http://localhost:3000
- **포트**: 3000
- **실행 명령**: `npm run dev`
- **빌드 명령**: `npm run build`
- **테스트 명령**: `npm test` (Jest), `npm run test:e2e` (Playwright)

### 테스트 계정
| 역할 | 이메일 | 비밀번호 | 설명 |
|------|--------|----------|------|
| 구매자 | `test@vibeolympics.com` | `Test1234!` | 일반 사용자 테스트용 |
| 판매자 | `seller2@vibeolympics.com` | `Test1234!` | 판매자 기능 테스트용 |
| 관리자 | (환경변수 설정 필요) | - | ADMIN_EMAILS에 등록된 이메일 |

### Stripe 테스트 카드 (레거시 - Bootpay로 전환됨)
| 카드 번호 | 만료일 | CVC | 설명 |
|-----------|--------|-----|------|
| 4242 4242 4242 4242 | 12/34 | 123 | 성공 |
| 4000 0000 0000 0002 | 12/34 | 123 | 거절 |
| 4000 0000 0000 9995 | 12/34 | 123 | 잔액 부족 |

> ⚠️ **참고**: Session 55부터 Bootpay로 결제 시스템이 전환되었습니다. 아래 부트페이 테스트 정보를 사용하세요.

### 부트페이 테스트 (샌드박스 모드)
| 결제 수단 | 테스트 정보 | 설명 |
|-----------|-------------|------|
| 카드 | 아무 16자리 숫자 | 샌드박스에서 자동 승인 |
| 카카오페이 | 실제 앱 필요 | 테스트 결제 후 자동 취소 |
| 네이버페이 | 실제 앱 필요 | 테스트 결제 후 자동 취소 |
| 토스페이 | 실제 앱 필요 | 테스트 결제 후 자동 취소 |
| 휴대폰 | 실제 번호 필요 | 테스트 결제 후 자동 취소 |

### 지원 브라우저
- Chrome (Chromium) - 최신 버전
- Firefox - 최신 버전
- Safari (WebKit) - 최신 버전
- Edge - 최신 버전

### 반응형 뷰포트
- 모바일: 375px × 667px (iPhone SE)
- 태블릿: 768px × 1024px (iPad)
- 데스크톱: 1280px × 720px, 1920px × 1080px

---

## 🔐 역할 1: 운영자 (Admin)

### 접근 권한
- **요구 조건**: ADMIN_EMAILS 환경변수에 등록된 이메일로 로그인
- **접근 가능 페이지**: `/admin/*`
- **API 엔드포인트**: `/api/admin/*`

### 테스트 케이스

#### TC-ADMIN-001: 관리자 대시보드 접근
```yaml
url: /admin
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. 관리자 계정으로 로그인
  2. /admin 페이지 접근
expected:
  - HTTP 200 응답
  - 관리자 대시보드 렌더링
  - 개요 탭 표시
  - 통계 카드 4개 표시 (사용자, 상품, 판매, 수익)
  - 최근 7일간 활동 차트 표시
  - 카테고리별 상품 분포 차트 표시
validation:
  - 통계 수치가 실제 DB 데이터와 일치
  - 차트가 정상 렌더링
```

#### TC-ADMIN-002: 통계 API 조회
```yaml
url: /api/admin/stats
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. GET /api/admin/stats 호출
expected:
  - HTTP 200 응답
  - totalUsers, totalProducts, totalSales, totalRevenue 반환
  - recentActivity 배열 (7일치 데이터)
  - categoryDistribution 배열
validation:
  - 모든 필드가 숫자형
  - recentActivity가 날짜 내림차순
```

#### TC-ADMIN-003: 사용자 관리 - 목록 조회
```yaml
url: /admin
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. /admin 페이지 접근
  2. "사용자 관리" 탭 클릭
  3. 사용자 목록 확인
expected:
  - 사용자 테이블 표시
  - 컬럼: 이름, 이메일, 역할, 판매자 여부, 가입일, 액션
  - 페이지네이션 표시
  - 검색 입력 필드 표시
validation:
  - 각 행에 사용자 정보 정확히 표시
  - 액션 버튼 (수정, 삭제) 표시
```

#### TC-ADMIN-004: 사용자 관리 - 검색
```yaml
url: /api/admin/users?search={keyword}
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. 사용자 관리 탭에서 검색 필드에 키워드 입력
  2. 검색 실행
expected:
  - 이름 또는 이메일에 키워드 포함된 사용자만 표시
  - "결과 없음" 메시지 (검색 결과 0건 시)
validation:
  - 검색 결과가 키워드와 일치
  - 대소문자 구분 없음
```

#### TC-ADMIN-005: 사용자 관리 - 역할 변경
```yaml
url: /api/admin/users
method: PATCH
precondition: 관리자 계정으로 로그인
steps:
  1. 사용자 목록에서 특정 사용자 선택
  2. 역할 드롭다운에서 변경 (USER ↔ ADMIN)
  3. 저장 버튼 클릭
expected:
  - HTTP 200 응답
  - 사용자 역할 변경 성공 메시지
  - 목록에 변경된 역할 반영
validation:
  - DB에 역할 업데이트 확인
  - 변경된 사용자 재로그인 시 새 역할 적용
```

#### TC-ADMIN-006: 사용자 관리 - 판매자 권한 토글
```yaml
url: /api/admin/users
method: PATCH
precondition: 관리자 계정으로 로그인
steps:
  1. 사용자 목록에서 특정 사용자 선택
  2. "판매자 권한" 토글 스위치 클릭
  3. 저장
expected:
  - isSeller 상태 변경
  - 성공 Toast 메시지
validation:
  - 해당 사용자가 /dashboard/products 접근 가능 (판매자 활성화 시)
```

#### TC-ADMIN-007: 사용자 관리 - 삭제
```yaml
url: /api/admin/users
method: DELETE
precondition: 관리자 계정으로 로그인
steps:
  1. 사용자 목록에서 삭제 버튼 클릭
  2. 확인 다이얼로그에서 "삭제" 클릭
expected:
  - HTTP 200 응답
  - 사용자 삭제 성공 메시지
  - 목록에서 해당 사용자 제거
validation:
  - DB에서 사용자 레코드 삭제 확인
  - 관련 데이터 cascade 삭제 확인
```

#### TC-ADMIN-008: 상품 관리 - 목록 조회
```yaml
url: /admin
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. /admin 페이지 접근
  2. "상품 관리" 탭 클릭
expected:
  - 상품 테이블 표시
  - 컬럼: 제목, 판매자, 카테고리, 가격, 상태, 등록일, 액션
  - 상태 필터 (전체/게시/초안/보류)
  - 검색 입력 필드
validation:
  - 각 행에 상품 정보 정확히 표시
```

#### TC-ADMIN-009: 상품 관리 - 상태 필터링
```yaml
url: /api/admin/products?status={status}
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. 상품 관리 탭에서 상태 필터 선택 (PUBLISHED/DRAFT/PENDING)
  2. 필터 적용
expected:
  - 선택한 상태의 상품만 표시
validation:
  - 모든 표시된 상품의 status가 필터와 일치
```

#### TC-ADMIN-010: 상품 관리 - 상태 변경
```yaml
url: /api/admin/products
method: PATCH
precondition: 관리자 계정으로 로그인
steps:
  1. 상품 목록에서 특정 상품 선택
  2. 상태 드롭다운에서 변경 (PENDING → PUBLISHED)
  3. 저장
expected:
  - HTTP 200 응답
  - 상태 변경 성공 메시지
  - 목록에 변경된 상태 반영
validation:
  - DB에 상태 업데이트 확인
  - PUBLISHED 상태로 변경 시 마켓플레이스에 표시
```

#### TC-ADMIN-011: 상품 관리 - 삭제
```yaml
url: /api/admin/products
method: DELETE
precondition: 관리자 계정으로 로그인
steps:
  1. 상품 목록에서 삭제 버튼 클릭
  2. 확인 다이얼로그에서 "삭제" 클릭
expected:
  - HTTP 200 응답
  - 상품 삭제 성공 메시지
  - 목록에서 해당 상품 제거
validation:
  - DB에서 상품 소프트 삭제 (deletedAt 설정)
  - 마켓플레이스에서 해당 상품 비표시
```

#### TC-ADMIN-012: 정산 관리 - 목록 조회
```yaml
url: /admin/settlements
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. /admin/settlements 페이지 접근
expected:
  - 정산 목록 테이블 표시
  - 통계 카드 4개 (대기/처리중/완료/총액)
  - 상태 필터 (전체/대기/처리중/완료/취소)
  - 날짜 범위 필터
validation:
  - 각 행에 정산 정보 정확히 표시
```

#### TC-ADMIN-013: 정산 관리 - 상태별 필터링
```yaml
url: /api/settlements?status={status}
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. 정산 목록에서 상태 필터 선택
  2. 필터 적용
expected:
  - 선택한 상태의 정산만 표시
validation:
  - 모든 표시된 정산의 status가 필터와 일치
```

#### TC-ADMIN-014: 정산 관리 - 상태 변경
```yaml
url: /api/settlements/[id]
method: PATCH
precondition: 관리자 계정으로 로그인
steps:
  1. 정산 목록에서 특정 정산 선택
  2. 상태 변경 (PENDING → READY → PROCESSING → COMPLETED)
  3. 저장
expected:
  - HTTP 200 응답
  - 상태 변경 성공 메시지
validation:
  - COMPLETED 상태로 변경 시 판매자에게 이메일 발송
  - DB에 settledAt 타임스탬프 기록
```

#### TC-ADMIN-015: 정산 관리 - 상세 조회
```yaml
url: /api/settlements/[id]
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. 정산 목록에서 특정 정산 클릭
expected:
  - 정산 상세 정보 표시
  - 판매자 정보
  - 정산 기간
  - 정산 항목 목록 (개별 구매건)
  - 금액 상세 (총 판매액, 플랫폼 수수료, PG 수수료, 정산 금액)
  - 은행 계좌 정보
validation:
  - 금액 계산 정확성 (판매액 - 수수료 = 정산액)
```

#### TC-ADMIN-016: 환불 관리 - 목록 조회
```yaml
url: /admin/refunds
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. /admin/refunds 페이지 접근
expected:
  - 환불 요청 목록 테이블 표시
  - 상태 필터 (전체/대기/승인/거절/완료)
  - 사유별 필터
validation:
  - 각 행에 환불 정보 정확히 표시
```

#### TC-ADMIN-017: 환불 관리 - 승인
```yaml
url: /api/refunds/[id]
method: PATCH
precondition: 관리자 계정으로 로그인
steps:
  1. 환불 요청 목록에서 특정 요청 선택
  2. "승인" 버튼 클릭
  3. 확인
expected:
  - HTTP 200 응답
  - 환불 승인 성공 메시지
  - 상태가 APPROVED로 변경
validation:
  - 구매자에게 환불 승인 이메일 발송
  - Bootpay 환불 처리 시작
```

#### TC-ADMIN-018: 환불 관리 - 거절
```yaml
url: /api/refunds/[id]
method: PATCH
precondition: 관리자 계정으로 로그인
steps:
  1. 환불 요청 목록에서 특정 요청 선택
  2. "거절" 버튼 클릭
  3. 거절 사유 입력
  4. 확인
expected:
  - HTTP 200 응답
  - 환불 거절 성공 메시지
  - 상태가 REJECTED로 변경
validation:
  - 구매자에게 환불 거절 이메일 발송 (사유 포함)
  - rejectedReason 필드에 사유 저장
```

#### TC-ADMIN-019: 엑셀 내보내기 - 거래 내역
```yaml
url: /api/export/transactions
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. 정산 관리 페이지에서 "엑셀 다운로드" 버튼 클릭
  2. "거래 내역" 선택
expected:
  - CSV 파일 다운로드
  - 파일명: transactions_YYYYMMDD.csv
  - 헤더: 거래ID, 구매자, 판매자, 상품, 금액, 상태, 결제일
validation:
  - 모든 거래 데이터 포함
  - 한글 인코딩 정상 (UTF-8 BOM)
```

#### TC-ADMIN-020: 엑셀 내보내기 - 정산 내역
```yaml
url: /api/export/settlements
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. 정산 관리 페이지에서 "엑셀 다운로드" 버튼 클릭
expected:
  - CSV 파일 다운로드
  - 파일명: settlements_YYYYMMDD.csv
  - 컬럼: 정산ID, 판매자, 기간, 총액, 수수료, 정산액, 상태, 계좌정보
validation:
  - 모든 정산 데이터 포함
```

#### TC-ADMIN-021: 엑셀 내보내기 - 환불 내역
```yaml
url: /api/export/refunds
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. 환불 관리 페이지에서 "엑셀 다운로드" 버튼 클릭
expected:
  - CSV 파일 다운로드
  - 파일명: refunds_YYYYMMDD.csv
  - 컬럼: 환불ID, 구매자, 상품, 금액, 사유, 상태, 요청일, 처리일
validation:
  - 모든 환불 데이터 포함
```

### 💳 부트페이 관리 테스트

#### TC-ADMIN-030: 부트페이 환불 승인 처리
```yaml
url: /api/admin/refunds
method: PATCH
precondition: 관리자 계정으로 로그인 + 부트페이 환불 요청 존재
steps:
  1. 환불 관리 페이지에서 부트페이 결제 환불 요청 선택
  2. 환불 사유 확인
  3. "승인" 버튼 클릭
expected:
  - 부트페이 cancel API 호출
  - RefundRequest.status = APPROVED
  - 구매자에게 환불 완료 알림
validation:
  - 부트페이 결제 취소 완료
  - Purchase.status = REFUNDED
```

#### TC-ADMIN-031: 부트페이 웹훅 수신 테스트
```yaml
url: /api/payment/bootpay/webhook
method: POST
precondition: 부트페이 샌드박스에서 결제 완료
steps:
  1. 부트페이 webhook 시뮬레이션
  2. event: "결제완료", receipt_id 전송
expected:
  - HTTP 200
  - Purchase.paymentStatus 업데이트
validation:
  - 결제 상태 동기화 확인
  - 중복 웹훅 처리 방지
```

#### TC-ADMIN-032: 부트페이 결제 취소 웹훅
```yaml
url: /api/payment/bootpay/webhook
method: POST
precondition: 부트페이에서 결제 취소 발생
steps:
  1. 부트페이 webhook 시뮬레이션
  2. event: "결제취소", receipt_id 전송
expected:
  - HTTP 200
  - Purchase.status = REFUNDED
validation:
  - 환불 상태 자동 업데이트
```

### 📦 번들 관리 테스트

#### TC-ADMIN-033: 번들 목록 조회
```yaml
url: /api/bundles
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. GET /api/bundles?activeOnly=false 호출
expected:
  - HTTP 200
  - bundles 배열
  - pagination 정보 포함
validation:
  - 모든 번들 조회 가능 (비활성 포함)
```

#### TC-ADMIN-034: 플랫폼 쿠폰 생성
```yaml
url: /api/coupons
method: POST
precondition: 관리자 계정으로 로그인
body:
  code: "WELCOME2024"
  name: "신규 가입 환영 쿠폰"
  discountType: "PERCENTAGE"
  discountValue: 20
  maxDiscountAmount: 10000
  usageLimit: 1000
  usageLimitPerUser: 1
  isPlatformCoupon: true
steps:
  1. POST /api/coupons 호출
expected:
  - HTTP 200
  - coupon.sellerId = null (플랫폼 쿠폰)
  - 쿠폰 코드 대문자 변환
validation:
  - 플랫폼 쿠폰으로 생성됨
```

#### TC-ADMIN-035: 쿠폰 사용 현황 조회
```yaml
url: /api/coupons/[id]
method: GET
precondition: 관리자 계정으로 로그인 + 쿠폰 존재
steps:
  1. GET /api/coupons/{couponId} 호출
expected:
  - HTTP 200
  - coupon 상세 정보
  - recentUsages 배열
  - _count.usages 통계
validation:
  - 사용 내역 조회 가능
```

### 📧 이메일 테스트

#### TC-ADMIN-036: Resend 도메인 상태 확인
```yaml
url: /api/admin/email-test
method: GET
precondition: 관리자 계정으로 로그인
steps:
  1. GET /api/admin/email-test 호출
expected:
  - HTTP 200
  - configured: true
  - apiKeyValid: true
  - domains 배열
  - verifiedDomains 수
validation:
  - Resend API 연결 확인
```

#### TC-ADMIN-037: 테스트 이메일 발송
```yaml
url: /api/admin/email-test
method: POST
precondition: 관리자 계정으로 로그인 + Resend 설정 완료
body:
  templateType: "test"
steps:
  1. POST /api/admin/email-test 호출
expected:
  - HTTP 200
  - success: true
  - emailId 반환
validation:
  - 이메일 발송 성공
```

---

## 🛒 역할 2: 판매자 (Seller)

### 접근 권한
- **요구 조건**: isSeller = true인 계정으로 로그인
- **접근 가능 페이지**: `/dashboard/*`, `/seller/*`
- **API 엔드포인트**: `/api/products`, `/api/settlements`, `/api/analytics`

### 테스트 케이스

#### TC-SELLER-001: 상품 등록 - Step 1 (기본 정보)
```yaml
url: /dashboard/products/new
method: GET/POST
precondition: 판매자 계정으로 로그인
steps:
  1. /dashboard/products/new 페이지 접근
  2. Step 1: 기본 정보 입력
     - 상품명 입력 (3-100자)
     - 카테고리 선택
     - 태그 입력 (쉼표 구분, 최대 10개)
  3. "다음" 버튼 클릭
expected:
  - 유효성 검사 통과
  - Step 2로 이동
validation:
  - 필수 필드 미입력 시 에러 메시지
  - 상품명 중복 체크
```

#### TC-SELLER-002: 상품 등록 - Step 2 (상세 설명)
```yaml
url: /dashboard/products/new
precondition: Step 1 완료
steps:
  1. Step 2: 상세 설명 입력
     - 마크다운 에디터 사용
     - 이미지 URL 삽입
     - YouTube/Vimeo 링크 삽입
  2. 미리보기 확인
  3. "다음" 버튼 클릭
expected:
  - 마크다운 렌더링 정상
  - 이미지/영상 임베드 정상
  - Step 3로 이동
validation:
  - 최소 50자 이상 입력
```

#### TC-SELLER-003: 상품 등록 - Step 3 (가격 설정)
```yaml
url: /dashboard/products/new
precondition: Step 2 완료
steps:
  1. Step 3: 가격 설정
     - 무료/유료 토글
     - 유료 시 가격 입력 (1,000원 ~ 1,000,000원)
     - 라이선스 유형 선택 (개인용/상업용/확장)
  2. "다음" 버튼 클릭
expected:
  - 가격 유효성 검사 통과
  - Step 4로 이동
validation:
  - 가격 범위 체크
  - 무료 상품은 가격 0원
```

#### TC-SELLER-004: 상품 등록 - Step 4 (파일 업로드)
```yaml
url: /dashboard/products/new
precondition: Step 3 완료
steps:
  1. Step 4: 파일 업로드
     - 썸네일 이미지 업로드 (필수, 최대 2MB)
     - 상품 파일 업로드 (필수, 최대 100MB)
     - 미리보기 이미지 추가 (선택, 최대 5개)
  2. 업로드 진행률 확인
  3. "다음" 버튼 클릭
expected:
  - Supabase Storage에 파일 업로드 성공
  - 업로드 진행률 표시
  - Step 5로 이동
validation:
  - 파일 크기 체크
  - 파일 형식 체크 (이미지: jpg/png/webp, 파일: zip/pdf 등)
```

#### TC-SELLER-005: 상품 등록 - Step 5 (튜토리얼 연결)
```yaml
url: /dashboard/products/new
precondition: Step 4 완료
steps:
  1. Step 5: 튜토리얼 연결 (선택)
     - "내 튜토리얼" 목록 조회
     - 연결할 튜토리얼 선택
     - 연결 유형 선택 (사용 방법/제작 과정/활용 팁)
  2. "등록 완료" 버튼 클릭
expected:
  - 상품 등록 성공
  - 상품 상세 페이지로 리다이렉트
  - Success Toast 메시지
validation:
  - DB에 상품 레코드 생성
  - ProductTutorial 중간 테이블 생성
  - 초기 상태는 DRAFT
```

#### TC-SELLER-005A: 상품 타입 선택 (세션 63 추가)
```yaml
url: /dashboard/products/new
precondition: 판매자 계정 로그인
steps:
  1. Step 1: 상품 타입 선택 페이지 진입
  2. 4종 상품 타입 카드 중 선택:
     - 디지털 상품 (소스코드, 템플릿, 플러그인)
     - 도서/전자책 (전자책, 만화, 오디오북)
     - 영상 시리즈 (영화, 애니메이션, 다큐)
     - 음악 앨범 (음원, BGM)
  3. "다음" 버튼 클릭
expected:
  - 선택된 타입 하이라이트 표시
  - 타입별 안내 메시지 업데이트
  - Step 2 기본 정보 페이지로 이동
  - 카테고리 목록이 선택한 타입에 맞게 변경
validation:
  - 타입 변경 시 카테고리 자동 초기화
```

#### TC-SELLER-005B: 도서 메타데이터 입력 (세션 63 추가)
```yaml
url: /dashboard/products/new
precondition: 상품 타입 "도서/전자책" 선택
steps:
  1. Step 3: 도서 정보 페이지 진입
  2. 필수 항목 입력:
     - 도서 타입 선택 (전자책/만화/오디오북)
     - 저자명 입력
     - 언어 선택
     - 제공 포맷 선택 (PDF/EPUB/MP3)
  3. 선택 항목 입력:
     - 출판사, ISBN, 페이지수
     - 이용 등급, 시리즈 정보
  4. "다음" 버튼 클릭
expected:
  - 도서 타입 카드 UI 정상 표시
  - 포맷 뱃지 다중 선택 가능
  - Step 4 상세 설명으로 이동
validation:
  - 필수 필드 미입력 시 에러 표시
  - bookMeta 객체 생성
```

#### TC-SELLER-005C: 영상 메타데이터 입력 (세션 63 추가)
```yaml
url: /dashboard/products/new
precondition: 상품 타입 "영상 시리즈" 선택
steps:
  1. Step 3: 영상 정보 페이지 진입
  2. 필수 항목 입력:
     - 영상 타입 선택 (영화/애니메이션/다큐/단편/시리즈)
  3. 선택 항목 입력:
     - 감독/제작자, 출연진 (쉼표 구분)
     - 에피소드 수, 시즌 수, 총 재생시간
     - 해상도 (SD/HD/FHD/4K)
     - 오디오 포맷 (스테레오/5.1/Atmos)
     - 장르 다중 선택
     - 자막 언어 선택
     - 트레일러 URL
     - 이용 등급
  4. "다음" 버튼 클릭
expected:
  - 영상 타입 카드 UI 정상 표시
  - 장르/자막 뱃지 다중 선택
  - Step 4 상세 설명으로 이동
validation:
  - videoSeriesMeta 객체 생성
```

#### TC-SELLER-005D: 음악 메타데이터 입력 (세션 63 추가)
```yaml
url: /dashboard/products/new
precondition: 상품 타입 "음악 앨범" 선택
steps:
  1. Step 3: 음악 정보 페이지 진입
  2. 필수 항목 입력:
     - 아티스트/작곡가명
     - 장르 선택 (팝/록/힙합/클래식/앰비언트 등)
     - 트랙 수
     - 제공 음질 (MP3/FLAC/WAV)
  3. 선택 항목 입력:
     - 앨범 타입 (정규/EP/싱글)
     - 서브 장르, 총 재생시간
     - 분위기/무드 다중 선택
     - 가사 포함 여부, 인스트루멘탈 여부
     - 테마/용도
  4. "다음" 버튼 클릭
expected:
  - 무드 뱃지 다중 선택 가능
  - 음질 포맷 뱃지 다중 선택
  - Step 4 상세 설명으로 이동
validation:
  - musicAlbumMeta 객체 생성
```

#### TC-SELLER-005E: AI 생성 정보 입력 (세션 63 추가)
```yaml
url: /dashboard/products/new
precondition: Step 2 기본 정보 페이지
steps:
  1. "AI로 생성된 콘텐츠" 토글 활성화
  2. AI 도구 선택:
     - ChatGPT, Claude, Midjourney, DALL-E
     - Stable Diffusion, Suno AI, Udio
     - Runway, Pika, Kaiber, 기타
  3. 프롬프트 입력 (선택)
  4. "다음" 버튼 클릭
expected:
  - 토글 활성화 시 추가 필드 표시
  - AI 도구 드롭다운 정상 동작
  - 프롬프트 텍스트 영역 표시
validation:
  - isAiGenerated: true
  - aiTool, aiPrompt 필드 저장
```

#### TC-SELLER-005F: SEO 자동 최적화 (세션 63 추가)
```yaml
url: /dashboard/products/new
precondition: 제목, 간단한 설명 입력
steps:
  1. 제목 입력 후 SEO 미리보기 확인
  2. SEO 미리보기 표시 내용:
     - 자동 생성 URL (한글→로마자 변환)
     - 메타 설명 (155자)
     - 키워드 목록
expected:
  - 실시간 SEO 미리보기 업데이트
  - 한글 제목 → 로마자 slug 변환
  - 태그 기반 키워드 자동 생성
validation:
  - generateSlug() 정상 동작
  - generateMetaDescription() 155자 제한
  - generateKeywords() 최대 15개
```

#### TC-SELLER-005G: 상품 등록 API 확장 (세션 63 추가)
```yaml
url: /api/products
method: POST
precondition: 판매자 권한
request_body:
  productType: "BOOK" | "VIDEO_SERIES" | "MUSIC_ALBUM" | "DIGITAL_PRODUCT"
  title: "AI 생성 소설집"
  shortDescription: "..."
  description: "..."
  category: "book-fiction"
  isAiGenerated: true
  aiTool: "chatgpt"
  aiPrompt: "..."
  bookMeta:
    bookType: "EBOOK"
    author: "AI 작가"
    language: "ko"
    format: ["PDF", "EPUB"]
expected:
  - HTTP 201
  - Product 생성
  - BookMeta 생성 (1:1 관계)
  - SEO slug 자동 생성
validation:
  - productType 저장
  - 메타데이터 테이블 생성
```

#### TC-SELLER-005H: 카테고리 API productType 필터 (세션 63 추가)
```yaml
url: /api/categories?productType=BOOK
method: GET
expected:
  - HTTP 200
  - 도서 카테고리만 반환
  - categories 배열
validation:
  - BOOK 타입 카테고리만 필터링
  - _count.products 포함
```

#### TC-SELLER-005I: 카테고리 API groupByType 옵션 (세션 63 추가)
```yaml
url: /api/categories?groupByType=true
method: GET
expected:
  - HTTP 200
  - grouped 객체 반환
  - DIGITAL_PRODUCT, BOOK, VIDEO_SERIES, MUSIC_ALBUM 키
validation:
  - 각 타입별 카테고리 배열
```

#### TC-SELLER-005J: JSON-LD 구조화 데이터 생성 (세션 63 추가)
```yaml
scenario: SEO 구조화 데이터
steps:
  1. 도서 등록 시 generateBookJsonLd() 호출
  2. 영상 등록 시 generateVideoJsonLd() 호출
  3. 음악 등록 시 generateMusicJsonLd() 호출
expected:
  - Book: @type=Book, author, isbn, numberOfPages
  - Video: @type=Movie/TVSeries, director, duration
  - Music: @type=MusicAlbum, byArtist, numTracks
validation:
  - Schema.org 스펙 준수
  - 필수 속성 포함
```

#### TC-SELLER-005K: 타입별 동적 스텝 (세션 63 추가)
```yaml
url: /dashboard/products/new
scenario: 상품 타입에 따른 스텝 수 변경
steps:
  1. 디지털 상품 선택 → 6단계 (메타 스텝 제외)
  2. 도서/영상/음악 선택 → 7단계 (메타 스텝 포함)
expected:
  - 디지털 상품: 상품타입 → 기본정보 → 상세설명 → 파일 → 가격 → 튜토리얼
  - 콘텐츠 상품: 상품타입 → 기본정보 → 메타정보 → 상세설명 → 파일 → 가격 → 튜토리얼
validation:
  - totalSteps 동적 계산
  - 진행 바 정상 표시
```

#### TC-SELLER-006: 상품 목록 조회
```yaml
url: /dashboard/products
method: GET
precondition: 판매자 계정으로 로그인
steps:
  1. /dashboard/products 페이지 접근
expected:
  - 내 상품 목록 표시
  - 상태별 필터 (전체/게시/초안/보류)
  - 검색 입력 필드
  - 정렬 옵션 (최신순/조회순/판매순)
validation:
  - 본인의 상품만 표시
  - 각 카드에 편집/삭제 버튼
```

#### TC-SELLER-007: 상품 수정
```yaml
url: /dashboard/products/[id]/edit
method: GET/PATCH
precondition: 판매자 계정으로 로그인 + 본인 상품
steps:
  1. 상품 목록에서 "편집" 버튼 클릭
  2. /dashboard/products/[id]/edit 페이지로 이동
  3. 기존 정보 프리로드 확인
  4. 정보 수정
  5. "저장" 버튼 클릭
expected:
  - 기존 정보 정확히 표시
  - 수정 사항 저장 성공
  - Success Toast 메시지
validation:
  - DB에 변경 사항 반영
  - updatedAt 타임스탬프 업데이트
```

#### TC-SELLER-008: 상품 삭제
```yaml
url: /api/products/[id]
method: DELETE
precondition: 판매자 계정으로 로그인 + 본인 상품
steps:
  1. 상품 목록에서 "삭제" 버튼 클릭
  2. 확인 다이얼로그에서 "삭제" 클릭
expected:
  - HTTP 200 응답
  - 삭제 성공 Toast 메시지
  - 목록에서 해당 상품 제거
validation:
  - DB에서 소프트 삭제 (deletedAt 설정)
  - 마켓플레이스에서 비표시
```

#### TC-SELLER-009: 판매 통계 - 대시보드
```yaml
url: /dashboard/analytics
method: GET
precondition: 판매자 계정으로 로그인
steps:
  1. /dashboard/analytics 페이지 접근
expected:
  - 통계 카드 4개 (총 수익, 총 판매, 평균 평점, 조회수)
  - 기간 선택 (7일/30일/90일/전체)
  - 수익 추이 차트 (RevenueLineChart)
  - 판매 막대 차트 (SalesBarChart)
  - 카테고리별 파이 차트 (CategoryPieChart)
  - 전환율 차트 (ConversionChart)
  - 인기 상품 랭킹 (상위 10개)
validation:
  - 실제 판매 데이터와 일치
  - 차트 인터랙션 정상 (hover, click)
```

#### TC-SELLER-010: 판매 통계 - 기간 필터
```yaml
url: /api/analytics?period={period}
method: GET
precondition: 판매자 계정으로 로그인
steps:
  1. 대시보드에서 기간 선택 (7/30/90/all)
  2. 데이터 갱신 확인
expected:
  - 선택한 기간의 통계 표시
  - 차트 데이터 업데이트
validation:
  - API 응답의 날짜 범위가 요청과 일치
```

#### TC-SELLER-011: 판매 내역 엑셀 다운로드
```yaml
url: /api/export/sales
method: GET
precondition: 판매자 계정으로 로그인
steps:
  1. 대시보드에서 "엑셀 다운로드" 버튼 클릭
expected:
  - CSV 파일 다운로드
  - 파일명: sales_YYYYMMDD.csv
  - 컬럼: 판매ID, 구매자, 상품, 금액, 수수료, 순수익, 판매일
validation:
  - 본인의 판매 데이터만 포함
```

#### TC-SELLER-012: 정산 현황 조회
```yaml
url: /dashboard/settlements
method: GET
precondition: 판매자 계정으로 로그인
steps:
  1. /dashboard/settlements 페이지 접근
expected:
  - 정산 통계 카드 (대기 금액, 완료 금액)
  - 정산 내역 목록
  - 수수료 안내 정보 박스
  - 엑셀 다운로드 버튼
validation:
  - 본인의 정산 내역만 표시
```

#### TC-SELLER-013: 정산 요청
```yaml
url: /api/settlements
method: POST
precondition: 판매자 계정으로 로그인 + 정산 가능 금액 존재
steps:
  1. 정산 현황 페이지에서 "정산 요청" 버튼 클릭
  2. 은행 계좌 정보 확인/입력
  3. 정산 요청 제출
expected:
  - HTTP 200 응답
  - 정산 요청 생성 성공
  - 관리자에게 알림 전송
validation:
  - Settlement 레코드 생성 (상태: PENDING)
  - 7일 이상 경과한 구매건만 정산 대상
```

#### TC-SELLER-014: 리뷰 관리 - 목록 조회
```yaml
url: /dashboard/products/[id]
method: GET
precondition: 판매자 계정으로 로그인 + 리뷰 존재
steps:
  1. 내 상품 상세 페이지 접근
  2. 리뷰 섹션 확인
expected:
  - 리뷰 목록 표시
  - 평점 분포 그래프
  - 답글 작성 버튼 (리뷰별)
validation:
  - 해당 상품의 리뷰만 표시
```

#### TC-SELLER-015: 리뷰 답글 작성
```yaml
url: /api/reviews/[id]/reply
method: POST
precondition: 판매자 계정으로 로그인 + 내 상품 리뷰
steps:
  1. 리뷰에서 "답글 작성" 버튼 클릭
  2. 답글 내용 입력
  3. "등록" 버튼 클릭
expected:
  - HTTP 200 응답
  - 답글 등록 성공
  - 리뷰 작성자에게 알림 전송
validation:
  - Review 레코드의 sellerReply 필드 업데이트
```

#### TC-SELLER-016: 리뷰 답글 수정/삭제
```yaml
url: /api/reviews/[id]/reply
method: PATCH/DELETE
precondition: 판매자 계정으로 로그인 + 답글 존재
steps:
  1. 기존 답글에서 수정/삭제 버튼 클릭
  2. 수정: 내용 수정 후 저장 / 삭제: 확인
expected:
  - 수정/삭제 성공
validation:
  - sellerReply 필드 업데이트 또는 null
```

#### TC-SELLER-017: 튜토리얼 작성
```yaml
url: /dashboard (교육 센터 섹션)
method: POST
precondition: 판매자 또는 일반 사용자 로그인
steps:
  1. 교육 센터에서 "콘텐츠 작성" 버튼 클릭
  2. 제목, 유형, 내용(마크다운) 입력
  3. 썸네일 업로드 (선택)
  4. "등록" 버튼 클릭
expected:
  - 튜토리얼 등록 성공
  - 교육 센터 목록에 표시
validation:
  - Tutorial 레코드 생성
  - authorId가 현재 사용자
```

#### TC-SELLER-018: Q&A 응답
```yaml
url: /marketplace/[id] (상품 상세)
method: POST
precondition: 판매자 계정으로 로그인 + 내 상품 + Q&A 존재
steps:
  1. 상품 상세 페이지 Q&A 탭 접근
  2. 질문에 "답변하기" 버튼 클릭
  3. 답변 작성
  4. "등록" 버튼 클릭
expected:
  - 답변 등록 성공
  - 질문자에게 알림 전송
validation:
  - UnifiedComment 레코드의 parentId가 질문 ID
```

#### TC-SELLER-019: 반응 통계 조회
```yaml
url: /dashboard (대시보드 메인)
method: GET
precondition: 판매자 계정으로 로그인
steps:
  1. 대시보드 메인 페이지 접근
  2. "반응 통계" 위젯 확인
expected:
  - 반응 유형별 카운트 (LIKE, LOVE, FIRE, RECOMMEND)
  - 전주 대비 증감 퍼센트
  - 추세 아이콘 (↑↓)
validation:
  - /api/analytics/reactions API 연동
  - 실제 반응 데이터와 일치
```

#### TC-SELLER-020: 개인화 추천 - 내 상품 추천
```yaml
url: /dashboard (대시보드 메인)
method: GET
precondition: 판매자 계정으로 로그인
steps:
  1. 대시보드 메인 페이지 접근
  2. "추천 상품" 위젯 확인
expected:
  - 내 상품과 유사한 상품 추천
  - 추천 이유 표시
validation:
  - /api/recommendations?type=products API 연동
```

### 📦 번들 관리 테스트

#### TC-SELLER-021: 번들 생성
```yaml
url: /api/bundles
method: POST
precondition: 판매자 계정으로 로그인 + 상품 2개 이상 보유
body:
  title: "프리미엄 번들"
  description: "모든 프리미엄 상품 모음"
  productIds: ["product1", "product2", "product3"]
  bundlePrice: 50000
steps:
  1. POST /api/bundles 호출
expected:
  - HTTP 200
  - bundle 생성
  - 자동 할인율 계산 (discountPercent)
  - slug 자동 생성
validation:
  - 본인 상품만 번들에 포함 가능
  - 최소 2개 상품 필수
```

#### TC-SELLER-022: 번들 수정
```yaml
url: /api/bundles/[id]
method: PUT
precondition: 판매자 계정으로 로그인 + 본인 번들 존재
body:
  title: "슈퍼 프리미엄 번들"
  bundlePrice: 45000
  isActive: true
steps:
  1. PUT /api/bundles/{bundleId} 호출
expected:
  - HTTP 200
  - 번들 정보 업데이트
  - 할인율 재계산
validation:
  - 본인 번들만 수정 가능
```

#### TC-SELLER-023: 번들 비활성화
```yaml
url: /api/bundles/[id]
method: PUT
precondition: 판매자 계정으로 로그인 + 본인 번들 존재
body:
  isActive: false
steps:
  1. PUT /api/bundles/{bundleId} 호출
expected:
  - HTTP 200
  - bundle.isActive = false
validation:
  - 비활성화된 번들은 목록에서 제외
```

### 🎟️ 쿠폰 관리 테스트

#### TC-SELLER-024: 판매자 쿠폰 생성
```yaml
url: /api/coupons
method: POST
precondition: 판매자 계정으로 로그인
body:
  code: "MYSALE10"
  name: "내 상품 10% 할인"
  discountType: "PERCENTAGE"
  discountValue: 10
  usageLimitPerUser: 1
  endDate: "2025-12-31T23:59:59Z"
steps:
  1. POST /api/coupons 호출
expected:
  - HTTP 200
  - coupon.sellerId = 현재 사용자 ID
  - 쿠폰 코드 대문자 변환
validation:
  - 판매자 쿠폰으로 생성됨
```

#### TC-SELLER-025: 쿠폰 목록 조회
```yaml
url: /api/coupons
method: GET
precondition: 판매자 계정으로 로그인
steps:
  1. GET /api/coupons 호출
expected:
  - HTTP 200
  - 본인 쿠폰 + 플랫폼 쿠폰 목록
validation:
  - 다른 판매자 쿠폰은 미표시
```

#### TC-SELLER-026: 쿠폰 비활성화
```yaml
url: /api/coupons/[id]
method: PUT
precondition: 판매자 계정으로 로그인 + 본인 쿠폰 존재
body:
  isActive: false
steps:
  1. PUT /api/coupons/{couponId} 호출
expected:
  - HTTP 200
  - coupon.isActive = false
validation:
  - 비활성화된 쿠폰은 적용 불가
```

---

## 💳 역할 3: 구매자 (Buyer)

### 접근 권한
- **요구 조건**: 로그인 (OAuth 또는 Credentials)
- **접근 가능 페이지**: `/dashboard/*`, `/marketplace/*`
- **API 엔드포인트**: `/api/checkout`, `/api/purchases`, `/api/wishlist`, `/api/reviews`

### 테스트 케이스

#### TC-BUYER-001: 상품 검색 - 키워드
```yaml
url: /marketplace?search={keyword}
method: GET
precondition: 없음 (비로그인도 가능)
steps:
  1. /marketplace 페이지 접근
  2. 검색 입력 필드에 키워드 입력
  3. 엔터 또는 검색 버튼 클릭
expected:
  - 검색 결과 표시
  - 검색어 하이라이트
  - "X개 결과" 표시
validation:
  - 상품명 또는 설명에 키워드 포함
```

#### TC-BUYER-002: 상품 검색 - 자동완성
```yaml
url: /api/search/suggestions?q={query}
method: GET
precondition: 없음
steps:
  1. 검색 입력 필드에 2자 이상 입력
  2. 자동완성 드롭다운 확인
expected:
  - 관련 상품 제안 (최대 5개)
  - 인기 태그 제안
  - 키워드 볼드 표시
validation:
  - 200ms 이내 디바운싱
```

#### TC-BUYER-003: 상품 필터링 - 카테고리
```yaml
url: /marketplace?category={id}
method: GET
precondition: 없음
steps:
  1. 마켓플레이스에서 카테고리 선택
  2. 필터 적용
expected:
  - 선택한 카테고리의 상품만 표시
  - 필터 태그 표시
validation:
  - 모든 상품의 categoryId가 선택한 ID와 일치
```

#### TC-BUYER-004: 상품 필터링 - 가격 범위
```yaml
url: /marketplace?minPrice={min}&maxPrice={max}
method: GET
precondition: 없음
steps:
  1. 고급 필터 열기
  2. 가격 범위 선택 (₩0-10,000 / ₩10,000-50,000 등)
  3. 적용
expected:
  - 선택한 가격 범위의 상품만 표시
validation:
  - 모든 상품 가격이 범위 내
```

#### TC-BUYER-005: 상품 필터링 - 평점
```yaml
url: /marketplace?minRating={rating}
method: GET
precondition: 없음
steps:
  1. 고급 필터에서 평점 선택 (★4 이상, ★5만)
  2. 적용
expected:
  - 선택한 평점 이상의 상품만 표시
validation:
  - 평균 평점이 필터 값 이상
```

#### TC-BUYER-006: 상품 필터링 - 라이선스
```yaml
url: /marketplace?license={type}
method: GET
precondition: 없음
steps:
  1. 고급 필터에서 라이선스 유형 선택
  2. 적용
expected:
  - 선택한 라이선스의 상품만 표시
validation:
  - licenseType이 필터와 일치
```

#### TC-BUYER-007: 상품 필터링 - 태그
```yaml
url: /marketplace?tags={tag}
method: GET
precondition: 없음
steps:
  1. 고급 필터에서 인기 태그 선택
  2. 적용
expected:
  - 선택한 태그를 포함한 상품만 표시
validation:
  - 상품 tags 배열에 선택한 태그 포함
```

#### TC-BUYER-008: 상품 정렬
```yaml
url: /marketplace?sortBy={field}&order={order}
method: GET
precondition: 없음
steps:
  1. 정렬 드롭다운에서 옵션 선택
     - 최신순 (createdAt DESC)
     - 인기순 (views DESC)
     - 가격 낮은순 (price ASC)
     - 가격 높은순 (price DESC)
     - 평점순 (averageRating DESC)
  2. 정렬 적용
expected:
  - 선택한 순서로 상품 정렬
validation:
  - 정렬 순서 정확성
```

#### TC-BUYER-009: 상품 상세 조회
```yaml
url: /marketplace/[id]
method: GET
precondition: 상품 존재
steps:
  1. 마켓플레이스에서 상품 카드 클릭
  2. 상품 상세 페이지 이동
expected:
  - 상품 정보 표시 (제목, 설명, 가격, 이미지)
  - 판매자 정보 카드
  - 리뷰 섹션
  - Q&A 탭
  - 관련 상품 추천 섹션
  - 반응 버튼 (좋아요, 추천, 도움됨, 북마크)
validation:
  - 조회수 자동 증가
  - JSON-LD 구조화 데이터 포함
```

#### TC-BUYER-010: 판매자 프로필 조회
```yaml
url: /seller/[id]
method: GET
precondition: 판매자 존재
steps:
  1. 상품 상세 또는 카드에서 판매자 이름 클릭
  2. /seller/[id] 페이지로 이동
expected:
  - 판매자 정보 (이름, 소개, 프로필 이미지)
  - 소셜 링크 (웹사이트, GitHub, Twitter)
  - 통계 (등록 상품, 총 판매, 평균 평점, 리뷰 수, 팔로워)
  - 상품 목록 탭
  - 소개 탭
  - 팔로우 버튼
validation:
  - isSeller = true인 사용자만 접근 가능
  - JSON-LD Person 스키마
```

#### TC-BUYER-011: 위시리스트 추가
```yaml
url: /api/wishlist
method: POST
precondition: 구매자 계정으로 로그인
steps:
  1. 상품 상세 또는 카드에서 위시리스트 버튼 클릭
expected:
  - HTTP 200 응답
  - Success Toast "위시리스트에 추가되었습니다"
  - 하트 아이콘 채워짐 (filled)
validation:
  - Wishlist 레코드 생성
  - 중복 추가 방지
```

#### TC-BUYER-012: 위시리스트 제거
```yaml
url: /api/wishlist
method: DELETE
precondition: 구매자 계정으로 로그인 + 위시리스트에 상품 존재
steps:
  1. 위시리스트 버튼 다시 클릭
expected:
  - HTTP 200 응답
  - Success Toast "위시리스트에서 제거되었습니다"
  - 하트 아이콘 비워짐 (outline)
validation:
  - Wishlist 레코드 삭제
```

#### TC-BUYER-013: 위시리스트 페이지 - 목록 조회
```yaml
url: /dashboard/wishlist
method: GET
precondition: 구매자 계정으로 로그인
steps:
  1. /dashboard/wishlist 페이지 접근
expected:
  - 위시리스트 상품 목록 표시
  - 그리드/리스트 뷰 전환 버튼
  - 정렬 옵션 (최신순/오래된순/가격순/평점순/판매량순)
  - 카테고리 필터
  - 검색 기능
validation:
  - 본인의 위시리스트만 표시
```

#### TC-BUYER-014: 위시리스트 페이지 - 필터 및 정렬
```yaml
url: /dashboard/wishlist
method: GET
precondition: 구매자 계정으로 로그인 + 위시리스트에 상품 존재
steps:
  1. 카테고리 필터 선택
  2. 정렬 옵션 변경
  3. 검색어 입력
expected:
  - 필터 적용된 결과 표시
  - 정렬 순서 변경
  - 검색 결과 표시
validation:
  - 필터/정렬/검색 동시 적용 가능
```

#### TC-BUYER-015: 위시리스트에서 직접 구매
```yaml
url: /dashboard/wishlist
method: POST
precondition: 구매자 계정으로 로그인 + 위시리스트에 유료 상품 존재
steps:
  1. 위시리스트 상품 카드에서 "구매하기" 버튼 클릭
  2. 결제 진행
expected:
  - 결제 수단 선택 모달 (부트페이 7종 결제 수단)
validation:
  - useCheckout 훅 정상 작동
```

#### TC-BUYER-016: 무료 상품 다운로드
```yaml
url: /marketplace/[id]
method: POST
precondition: 로그인 + 무료 상품
steps:
  1. 무료 상품 상세 페이지 접근
  2. "무료 다운로드" 버튼 클릭
expected:
  - 즉시 Purchase 레코드 생성 (가격 0)
  - 다운로드 링크 활성화
  - Success Toast "다운로드가 시작됩니다"
validation:
  - 구매 내역에 추가
```

### 💳 부트페이 결제 테스트 (7종)

> ⚠️ **참고**: Session 55부터 모든 결제는 Bootpay로 통합되었습니다.

#### TC-BUYER-017: 유료 상품 구매 - 부트페이 카드 결제
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품 + 부트페이 샌드박스 활성화
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "신용/체크카드" 선택
  3. 부트페이 결제 창 열림
  4. 테스트 카드 정보 입력
  5. 결제 완료
expected:
  - 부트페이 결제 요청 성공
  - receipt_id 반환
  - 결제 검증 API 호출 (/api/payment/bootpay/verify)
  - 구매 내역에 추가
  - Success Toast "결제가 완료되었습니다!"
validation:
  - Purchase 레코드 생성 (status: COMPLETED)
  - paymentMethod = "BOOTPAY_CARD"
  - paymentId = receipt_id
```

#### TC-BUYER-019C: 유료 상품 구매 - 부트페이 카카오페이
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품 + 부트페이 샌드박스 활성화
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "카카오페이" 선택
  3. 부트페이 결제 창 → 카카오페이 앱 연동
  4. 테스트 결제 승인
  5. 결제 완료
expected:
  - 카카오페이 결제 창 열림
  - 결제 검증 API 호출
  - 구매 내역에 추가
validation:
  - paymentMethod = "BOOTPAY_KAKAO"
```

#### TC-BUYER-019D: 유료 상품 구매 - 부트페이 네이버페이
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품 + 부트페이 샌드박스 활성화
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "네이버페이" 선택
  3. 부트페이 결제 창 → 네이버페이 앱 연동
  4. 테스트 결제 승인
  5. 결제 완료
expected:
  - 네이버페이 결제 창 열림
  - 결제 검증 API 호출
  - 구매 내역에 추가
validation:
  - paymentMethod = "BOOTPAY_NAVER"
```

#### TC-BUYER-019E: 유료 상품 구매 - 부트페이 토스페이
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품 + 부트페이 샌드박스 활성화
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "토스페이" 선택
  3. 부트페이 결제 창 → 토스 앱 연동
  4. 테스트 결제 승인
  5. 결제 완료
expected:
  - 토스페이 결제 창 열림
  - 결제 검증 API 호출
  - 구매 내역에 추가
validation:
  - paymentMethod = "BOOTPAY_TOSS"
```

#### TC-BUYER-018: 유료 상품 구매 - 부트페이 카카오페이
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품 + 부트페이 샌드박스 활성화
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "카카오페이" 선택
  3. 부트페이 결제 창 → 카카오페이 앱 연동
  4. 테스트 결제 승인
  5. 결제 완료
expected:
  - 카카오페이 결제 창 열림
  - 결제 검증 API 호출
  - 구매 내역에 추가
validation:
  - paymentMethod = "BOOTPAY_KAKAO"
```

#### TC-BUYER-019: 유료 상품 구매 - 부트페이 네이버페이
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품 + 부트페이 샌드박스 활성화
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "네이버페이" 선택
  3. 부트페이 결제 창 → 네이버페이 앱 연동
  4. 테스트 결제 승인
  5. 결제 완료
expected:
  - 네이버페이 결제 창 열림
  - 결제 검증 API 호출
  - 구매 내역에 추가
validation:
  - paymentMethod = "BOOTPAY_NAVER"
```

#### TC-BUYER-020: 유료 상품 구매 - 부트페이 토스페이
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품 + 부트페이 샌드박스 활성화
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "토스페이" 선택
  3. 부트페이 결제 창 → 토스 앱 연동
  4. 테스트 결제 승인
  5. 결제 완료
expected:
  - 토스페이 결제 창 열림
  - 결제 검증 API 호출
  - 구매 내역에 추가
validation:
  - paymentMethod = "BOOTPAY_TOSS"
```

#### TC-BUYER-021: 유료 상품 구매 - 부트페이 휴대폰 결제
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품 + 부트페이 샌드박스 활성화
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "휴대폰 결제" 선택
  3. 부트페이 결제 창 열림
  4. 휴대폰 번호 입력 및 인증
  5. 결제 완료
expected:
  - 휴대폰 결제 창 열림
  - SMS 인증 진행
  - 결제 검증 API 호출
validation:
  - paymentMethod = "BOOTPAY_PHONE"
```

#### TC-BUYER-022: 유료 상품 구매 - 부트페이 계좌이체
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품 + 부트페이 샌드박스 활성화
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "계좌이체" 선택
  3. 부트페이 결제 창 열림
  4. 은행 선택 및 계좌 인증
  5. 결제 완료
expected:
  - 실시간 계좌이체 창 열림
  - 결제 검증 API 호출
validation:
  - paymentMethod = "BOOTPAY_BANK"
```

#### TC-BUYER-023: 유료 상품 구매 - 부트페이 가상계좌
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품 + 부트페이 샌드박스 활성화
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "가상계좌" 선택
  3. 부트페이 결제 창 열림
  4. 은행 선택
  5. 가상계좌 발급
expected:
  - 가상계좌 번호 발급
  - event = "issued" 응답
  - 입금 대기 상태 표시
  - 입금 완료 시 웹훅으로 구매 처리
validation:
  - Purchase 레코드 생성 (status: PENDING → COMPLETED)
  - paymentMethod = "BOOTPAY_VBANK"
```

#### TC-BUYER-024: 부트페이 결제 취소 (사용자 취소)
```yaml
url: /marketplace/[id]
method: GET
precondition: 부트페이 결제 창에서 취소
steps:
  1. 결제 수단 선택 후 부트페이 결제 창 열림
  2. 결제 창에서 X 버튼 또는 뒤로 가기 클릭
expected:
  - event = "cancel" 응답
  - 결제 창 닫힘
  - Error Toast 표시 안함 (조용히 취소)
validation:
  - Purchase 레코드 생성 안됨
```

#### TC-BUYER-025: 부트페이 결제 검증 실패
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 잘못된 receipt_id 또는 금액 불일치
steps:
  1. 위변조된 receipt_id로 검증 요청
expected:
  - HTTP 400 응답
  - Error: "결제 정보를 확인할 수 없습니다" 또는 "결제 금액이 일치하지 않습니다"
validation:
  - Purchase 레코드 생성 안됨
  - 보안 로그 기록
```

### 📦 구매 관리 테스트

#### TC-BUYER-026: 구매 내역 조회
```yaml
url: /dashboard/purchases
method: GET
precondition: 구매자 계정으로 로그인
steps:
  1. /dashboard/purchases 페이지 접근
expected:
  - 구매 내역 목록 표시
  - 각 항목: 상품 썸네일, 제목, 가격, 구매일, 상태, 다운로드 버튼
  - "상세 보기" 버튼
  - 엑셀 다운로드 버튼
validation:
  - 본인의 구매 내역만 표시
  - 최신순 정렬
```

#### TC-BUYER-027: 구매 상세 모달
```yaml
url: /api/purchases/[id]
method: GET
precondition: 구매자 계정으로 로그인 + 구매 내역 존재
steps:
  1. 구매 내역에서 "상세 보기" 버튼 클릭
  2. 상세 모달 열림
expected:
  - 탭 3개 (기본 정보 / 다운로드 / 영수증)
  - 기본 정보: 구매일, 결제 금액, 라이선스, 판매자, 주문번호
  - 다운로드: 파일 목록, 다운로드 버튼, 다운로드 이력
  - 영수증: 전자 영수증 형식, 인쇄 버튼
validation:
  - API 응답 데이터 정확성
```

#### TC-BUYER-028: 상품 파일 다운로드
```yaml
url: /api/products/[id]/download
method: GET
precondition: 구매자 계정으로 로그인 + 해당 상품 구매 완료
steps:
  1. 구매 내역 또는 상세 모달에서 "다운로드" 버튼 클릭
expected:
  - Supabase Storage signed URL 생성
  - 파일 다운로드 시작
  - Success Toast "다운로드가 시작됩니다"
validation:
  - 구매하지 않은 상품은 다운로드 불가 (403)
```

#### TC-BUYER-024: 구매 내역 엑셀 다운로드
```yaml
url: /api/export/purchases
method: GET
precondition: 구매자 계정으로 로그인
steps:
  1. 구매 내역 페이지에서 "엑셀 다운로드" 버튼 클릭
expected:
  - CSV 파일 다운로드
  - 파일명: purchases_YYYYMMDD.csv
  - 컬럼: 구매ID, 상품, 판매자, 금액, 구매일, 상태
validation:
  - 본인의 구매 데이터만 포함
```

#### TC-BUYER-025: 리뷰 작성 가능 여부 확인
```yaml
url: /marketplace/[id]
method: GET
precondition: 구매자 계정으로 로그인
steps:
  1. 구매한 상품 상세 페이지 접근
  2. 리뷰 섹션 확인
expected:
  - "리뷰 작성" 버튼 표시 (구매 완료 시)
  - 이미 작성한 경우 "리뷰 수정" 버튼
  - 구매하지 않은 경우 버튼 비활성화 또는 숨김
validation:
  - Purchase 레코드 존재 여부 확인
```

#### TC-BUYER-026: 리뷰 작성
```yaml
url: /api/reviews
method: POST
precondition: 구매자 계정으로 로그인 + 해당 상품 구매 완료
steps:
  1. 상품 상세 페이지에서 "리뷰 작성" 버튼 클릭
  2. 리뷰 폼 열림
  3. 별점 선택 (1-5)
  4. 제목 입력 (선택)
  5. 내용 입력 (최소 10자)
  6. 이미지 업로드 (선택, 최대 5개)
  7. "등록" 버튼 클릭
expected:
  - HTTP 200 응답
  - Success Toast "리뷰가 등록되었습니다"
  - 리뷰 목록에 추가
  - 판매자에게 알림 전송
  - isVerifiedPurchase = true
validation:
  - Review 레코드 생성
  - 상품 평균 평점 재계산
```

#### TC-BUYER-027: 리뷰 수정
```yaml
url: /api/reviews/[id]
method: PATCH
precondition: 구매자 계정으로 로그인 + 본인이 작성한 리뷰
steps:
  1. 리뷰 목록에서 본인 리뷰의 "수정" 버튼 클릭
  2. 수정 폼에서 내용 변경
  3. "저장" 버튼 클릭
expected:
  - 리뷰 수정 성공
  - Success Toast
validation:
  - updatedAt 타임스탬프 업데이트
```

#### TC-BUYER-028: 리뷰 삭제
```yaml
url: /api/reviews/[id]
method: DELETE
precondition: 구매자 계정으로 로그인 + 본인이 작성한 리뷰
steps:
  1. 리뷰 목록에서 본인 리뷰의 "삭제" 버튼 클릭
  2. 확인 다이얼로그에서 "삭제" 클릭
expected:
  - 리뷰 삭제 성공
  - Success Toast
  - 리뷰 목록에서 제거
validation:
  - Review 레코드 삭제
  - 상품 평균 평점 재계산
```

#### TC-BUYER-029: 리뷰 도움됨 투표
```yaml
url: /api/reviews/[id]/helpful
method: POST
precondition: 구매자 계정으로 로그인 + 타인의 리뷰
steps:
  1. 리뷰 카드에서 "도움이 됐어요" 버튼 클릭
expected:
  - HTTP 200 응답
  - helpfulCount 증가
  - 버튼 상태 변경 (활성화)
validation:
  - ReviewHelpful 레코드 생성
  - 본인 리뷰는 투표 불가
  - 중복 투표 방지
```

#### TC-BUYER-030: 리뷰 도움됨 취소
```yaml
url: /api/reviews/[id]/helpful
method: POST
precondition: 이미 도움됨 투표한 리뷰
steps:
  1. "도움이 됐어요" 버튼 다시 클릭
expected:
  - helpfulCount 감소
  - 버튼 상태 변경 (비활성화)
validation:
  - ReviewHelpful 레코드 삭제
```

### 💳 부트페이 환불 테스트

#### TC-BUYER-110: 부트페이 카드결제 환불 요청
```yaml
url: /api/payment/bootpay/cancel
method: POST
precondition: TC-BUYER-100 완료 (카드결제 구매 완료 상태)
steps:
  1. 구매내역에서 환불 요청
  2. 환불 사유: 단순 변심
  3. 환불 요청 버튼 클릭
expected:
  - HTTP 200 (success: true)
  - receipt_id로 부트페이 환불 처리
  - RefundRequest 레코드 생성 (status: REQUESTED)
validation:
  - 환불 상태 REQUESTED 확인
  - 판매자에게 환불 알림 전송
test_card: 카드번호 5570-5570-5570-5570
```

#### TC-BUYER-111: 부트페이 가상계좌 환불 요청
```yaml
url: /api/payment/bootpay/cancel
method: POST
precondition: TC-BUYER-106 완료 (가상계좌 결제 완료 상태)
steps:
  1. 구매내역에서 환불 요청
  2. 환불 사유: 상품 품질 불만
  3. 환불 계좌 정보 입력
  4. 환불 요청 버튼 클릭
expected:
  - HTTP 200 (success: true)
  - 가상계좌 환불은 입금 계좌로 환불
  - RefundRequest 레코드 생성
validation:
  - 환불 금액이 결제 금액과 일치
  - 부트페이 cancel API 호출 확인
```

#### TC-BUYER-112: 환불 거절 케이스
```yaml
url: /api/payment/bootpay/cancel
method: POST
precondition: 디지털 콘텐츠 다운로드 완료 상태
steps:
  1. 다운로드 완료된 상품 환불 요청
expected:
  - HTTP 400 (환불 불가 안내)
  - 다운로드 완료 상품은 환불 불가
validation:
  - 환불 정책 안내 메시지 표시
  - RefundRequest 생성되지 않음
```

### 📦 번들 구매 테스트

#### TC-BUYER-113: 번들 목록 조회
```yaml
url: /api/bundles
method: GET
precondition: 로그인 상태
steps:
  1. GET /api/bundles 호출
expected:
  - HTTP 200
  - 활성 번들 목록만 반환
  - 각 번들의 상품 정보 포함
validation:
  - 비활성/만료 번들 제외
```

#### TC-BUYER-114: 번들 상세 조회
```yaml
url: /api/bundles/[id]
method: GET
precondition: 로그인 상태 + 번들 존재
steps:
  1. GET /api/bundles/{bundleId} 호출
expected:
  - HTTP 200
  - 번들 상세 정보
  - 포함된 상품 목록
  - 판매자 정보
  - 할인율 정보
validation:
  - 개별 가격 vs 번들 가격 비교 가능
```

#### TC-BUYER-115: 번들 구매 성공
```yaml
url: /api/bundles/[id]/purchase
method: POST
precondition: 로그인 상태 + 활성 번들 + 미구매 상태
body:
  paymentMethod: "card"
  paymentId: "BP-TEST-12345"
steps:
  1. POST /api/bundles/{bundleId}/purchase 호출
expected:
  - HTTP 200
  - BundlePurchase 생성
  - 개별 상품별 Purchase 레코드 생성
  - 번들 salesCount 증가
  - 각 상품 salesCount 증가
validation:
  - 트랜잭션으로 일괄 처리
```

#### TC-BUYER-116: 번들 구매 실패 - 이미 구매
```yaml
url: /api/bundles/[id]/purchase
method: POST
precondition: 로그인 상태 + 이미 구매한 번들
steps:
  1. POST /api/bundles/{bundleId}/purchase 호출
expected:
  - HTTP 400
  - error: "이미 구매한 번들입니다"
validation:
  - 중복 구매 방지
```

#### TC-BUYER-117: 번들 구매 실패 - 일부 상품 보유
```yaml
url: /api/bundles/[id]/purchase
method: POST
precondition: 로그인 상태 + 번들 내 일부 상품 이미 구매
steps:
  1. POST /api/bundles/{bundleId}/purchase 호출
expected:
  - HTTP 400
  - error: "번들에 포함된 일부 상품을 이미 구매하셨습니다"
  - alreadyPurchasedProducts 배열
validation:
  - 부분 구매 상태 안내
```

### 🎟️ 쿠폰 적용 테스트

#### TC-BUYER-118: 쿠폰 조회 (코드로)
```yaml
url: /api/coupons?code=WELCOME2024
method: GET
precondition: 로그인 상태 + 유효한 쿠폰 코드
steps:
  1. GET /api/coupons?code=WELCOME2024 호출
expected:
  - HTTP 200
  - valid: true
  - 쿠폰 정보 (할인 유형, 할인값 등)
validation:
  - 유효 기간 확인
  - 사용 가능 여부 확인
```

#### TC-BUYER-119: 쿠폰 적용 계산
```yaml
url: /api/coupons/apply
method: POST
precondition: 로그인 상태 + 유효한 쿠폰
body:
  code: "WELCOME2024"
  orderAmount: 50000
  productId: "product123"
steps:
  1. POST /api/coupons/apply 호출
expected:
  - HTTP 200
  - valid: true
  - orderAmount: 50000
  - discountAmount: 10000 (20% 할인)
  - finalAmount: 40000
validation:
  - 할인 금액 정확히 계산
  - 최대 할인 금액 적용
```

#### TC-BUYER-120: 쿠폰 적용 실패 - 만료
```yaml
url: /api/coupons/apply
method: POST
precondition: 로그인 상태 + 만료된 쿠폰
body:
  code: "EXPIRED2023"
  orderAmount: 50000
steps:
  1. POST /api/coupons/apply 호출
expected:
  - HTTP 400
  - error: "만료된 쿠폰입니다"
validation:
  - 만료 쿠폰 거절
```

#### TC-BUYER-121: 쿠폰 적용 실패 - 이미 사용
```yaml
url: /api/coupons/apply
method: POST
precondition: 로그인 상태 + 이미 사용한 쿠폰 (usageLimitPerUser 초과)
body:
  code: "ONETIME"
  orderAmount: 50000
steps:
  1. POST /api/coupons/apply 호출
expected:
  - HTTP 400
  - error: "이미 사용한 쿠폰입니다"
validation:
  - 사용자별 사용 횟수 확인
```

#### TC-BUYER-122: 쿠폰 적용 실패 - 최소 주문 금액 미달
```yaml
url: /api/coupons/apply
method: POST
precondition: 로그인 상태 + 최소 주문 금액 조건 쿠폰
body:
  code: "MIN50000"
  orderAmount: 30000
steps:
  1. POST /api/coupons/apply 호출
expected:
  - HTTP 400
  - error: "최소 주문 금액은 50,000원입니다"
  - minOrderAmount: 50000
validation:
  - 최소 주문 금액 확인
```

#### TC-BUYER-123: 번들 구매 + 쿠폰 적용
```yaml
url: /api/bundles/[id]/purchase
method: POST
precondition: 로그인 상태 + 활성 번들 + 유효한 쿠폰
body:
  paymentMethod: "card"
  paymentId: "BP-TEST-12345"
  couponCode: "BUNDLE10"
steps:
  1. POST /api/bundles/{bundleId}/purchase 호출
expected:
  - HTTP 200
  - 쿠폰 할인 적용된 금액으로 결제
  - CouponUsage 레코드 생성
  - Coupon.usedCount 증가
validation:
  - 번들 + 쿠폰 동시 할인 적용
```

---

## 👀 역할 4: 방문자 (Visitor)

### 접근 권한
- **요구 조건**: 없음 (비로그인 상태)
- **접근 가능 페이지**: 공개 페이지만 (`/`, `/marketplace`, `/education`, `/community`, `/faq`, `/auth/*`, `/terms`, `/privacy`, `/refund`)
- **제한**: 로그인 필요 기능 사용 시 `/auth/login`으로 리다이렉트

### 테스트 케이스

#### TC-VISITOR-001: 홈페이지 접근
```yaml
url: /
method: GET
precondition: 비로그인 상태
steps:
  1. 브라우저에서 http://localhost:3000 접속
expected:
  - HTTP 200 응답
  - Hero 섹션 렌더링 ("Create Your Ideas Into Reality")
  - Features 섹션
  - How It Works 섹션
  - CTA 섹션 ("시작하기" 버튼)
  - 헤더 (로고, 네비게이션, 로그인/회원가입 버튼)
  - 푸터 (링크, 소셜 미디어)
validation:
  - 모든 이미지 로드
  - 애니메이션 정상 작동
```

#### TC-VISITOR-002: 네비게이션 메뉴
```yaml
url: /
precondition: 비로그인 상태
steps:
  1. 헤더의 네비게이션 메뉴 확인
     - 마켓플레이스
     - 교육 센터
     - 커뮤니티
     - FAQ
expected:
  - 모든 링크 정상 작동
  - 현재 페이지 하이라이트
validation:
  - 각 링크 클릭 시 해당 페이지로 이동
```

#### TC-VISITOR-003: 마켓플레이스 브라우징
```yaml
url: /marketplace
method: GET
precondition: 비로그인 상태
steps:
  1. /marketplace 페이지 접근
  2. 상품 목록 확인
  3. 검색/필터 사용
  4. 상품 카드 클릭
expected:
  - 상품 목록 표시 (게시된 상품만)
  - 검색/필터 작동
  - 상품 상세 페이지 접근 가능
  - 구매/위시리스트 버튼 클릭 시 로그인 페이지로 리다이렉트
validation:
  - 비로그인 상태에서 상품 정보 열람 가능
```

#### TC-VISITOR-004: 교육 센터 브라우징
```yaml
url: /education
method: GET
precondition: 비로그인 상태
steps:
  1. /education 페이지 접근
  2. 튜토리얼 목록 확인
  3. 필터 사용 (유형별)
  4. 튜토리얼 카드 클릭
expected:
  - 튜토리얼 목록 표시 (공개된 튜토리얼만)
  - 필터 작동
  - 튜토리얼 상세 페이지 접근 가능
  - 좋아요/북마크 버튼 클릭 시 로그인 페이지로 리다이렉트
validation:
  - 비로그인 상태에서 콘텐츠 열람 가능
```

#### TC-VISITOR-005: 교육 콘텐츠 상세 조회
```yaml
url: /education/[id]
method: GET
precondition: 비로그인 상태 + 튜토리얼 존재
steps:
  1. 튜토리얼 상세 페이지 접근
expected:
  - 튜토리얼 내용 표시 (마크다운 렌더링)
  - 목차 (데스크톱: 사이드바, 모바일: 인라인)
  - 영상 임베드 정상 (YouTube/Vimeo)
  - 관련 튜토리얼 추천
  - 반응/댓글 버튼은 로그인 요구
validation:
  - 조회수 증가
  - SEO: JSON-LD Article/HowTo 스키마
```

#### TC-VISITOR-006: 커뮤니티 브라우징
```yaml
url: /community
method: GET
precondition: 비로그인 상태
steps:
  1. /community 페이지 접근
  2. 게시글 목록 확인
  3. 게시글 카드 클릭
expected:
  - 게시글 목록 표시
  - 게시글 상세 페이지 접근 가능
  - 글쓰기/댓글 작성 시 로그인 요구
validation:
  - 비로그인 상태에서 게시글 열람 가능
```

#### TC-VISITOR-007: 커뮤니티 게시글 상세 조회
```yaml
url: /community/[id]
method: GET
precondition: 비로그인 상태 + 게시글 존재
steps:
  1. 게시글 상세 페이지 접근
expected:
  - 게시글 내용 표시
  - 작성자 정보
  - 댓글 목록 (읽기만 가능)
  - 반응/댓글 작성 버튼은 로그인 요구
validation:
  - SEO: JSON-LD DiscussionForumPosting 스키마
```

#### TC-VISITOR-008: FAQ 페이지
```yaml
url: /faq
method: GET
precondition: 비로그인 상태
steps:
  1. /faq 페이지 접근
  2. 검색 바에 키워드 입력
  3. 카테고리 필터 선택
  4. FAQ 아코디언 열기/닫기
expected:
  - FAQ 목록 표시
  - 검색 작동
  - 카테고리 필터 작동
  - 아코디언 애니메이션 정상
validation:
  - 검색 결과 정확성
  - 모든 FAQ 접근 가능
```

#### TC-VISITOR-009: 정적 페이지 - 이용약관
```yaml
url: /terms
method: GET
precondition: 비로그인 상태
steps:
  1. /terms 페이지 접근
expected:
  - 이용약관 내용 표시 (10개 조항)
  - 목차 네비게이션
  - 스크롤 스파이
validation:
  - 모든 조항 렌더링
```

#### TC-VISITOR-010: 정적 페이지 - 개인정보처리방침
```yaml
url: /privacy
method: GET
precondition: 비로그인 상태
steps:
  1. /privacy 페이지 접근
expected:
  - 개인정보처리방침 내용 표시 (9개 조항)
  - 수집 항목 테이블
  - 업무 위탁 현황 테이블
validation:
  - 모든 테이블 렌더링
```

#### TC-VISITOR-011: 정적 페이지 - 환불정책
```yaml
url: /refund
method: GET
precondition: 비로그인 상태
steps:
  1. /refund 페이지 접근
expected:
  - 환불정책 내용 표시
  - 환불 가능/불가능 사례
  - 환불 절차 타임라인
  - 환불 금액 테이블
validation:
  - 모든 섹션 렌더링
```

#### TC-VISITOR-012: 회원가입 - 이메일/비밀번호
```yaml
url: /auth/signup
method: GET/POST
precondition: 비로그인 상태
steps:
  1. /auth/signup 페이지 접근
  2. 이름 입력
  3. 이메일 입력
  4. 비밀번호 입력 (8자 이상, 영문+숫자 조합)
  5. 비밀번호 확인 입력
  6. 약관 동의 체크
  7. "가입하기" 버튼 클릭
expected:
  - HTTP 200 응답
  - Success Toast "회원가입이 완료되었습니다"
  - /auth/login으로 리다이렉트
  - 환영 이메일 발송
validation:
  - User 레코드 생성 (role: USER, isSeller: false)
  - 비밀번호 해시 저장
```

#### TC-VISITOR-013: 회원가입 - 유효성 검사
```yaml
url: /auth/signup
precondition: 비로그인 상태
steps:
  1. 잘못된 데이터로 회원가입 시도
     - 짧은 비밀번호 (7자 이하)
     - 잘못된 이메일 형식
     - 비밀번호 불일치
     - 약관 미동의
expected:
  - 각 필드에 에러 메시지 표시
  - 폼 제출 차단
validation:
  - 클라이언트 측 유효성 검사 작동
```

#### TC-VISITOR-014: 회원가입 - GitHub OAuth
```yaml
url: /auth/signup
precondition: 비로그인 상태
steps:
  1. /auth/signup 페이지 접근
  2. "GitHub으로 시작하기" 버튼 클릭
  3. GitHub 로그인 페이지로 리다이렉트
  4. GitHub 계정으로 로그인
  5. 권한 승인
expected:
  - GitHub OAuth 플로우 완료
  - 새 계정 생성 또는 기존 계정 로그인
  - 홈페이지로 리다이렉트
  - 헤더에 사용자 정보 표시
validation:
  - User 레코드 생성 (provider: github)
```

#### TC-VISITOR-015: 회원가입 - Google OAuth
```yaml
url: /auth/signup
precondition: 비로그인 상태
steps:
  1. /auth/signup 페이지 접근
  2. "Google로 시작하기" 버튼 클릭
  3. Google 로그인 페이지로 리다이렉트
  4. Google 계정 선택 및 로그인
expected:
  - Google OAuth 플로우 완료
  - 새 계정 생성 또는 기존 계정 로그인
  - 홈페이지로 리다이렉트
validation:
  - User 레코드 생성 (provider: google)
```

#### TC-VISITOR-016: 로그인 - 이메일/비밀번호
```yaml
url: /auth/login
method: POST
precondition: 비로그인 상태 + 계정 존재
steps:
  1. /auth/login 페이지 접근
  2. 이메일 입력
  3. 비밀번호 입력
  4. "로그인" 버튼 클릭
expected:
  - HTTP 200 응답
  - 홈페이지로 리다이렉트
  - 헤더에 사용자 정보 표시 (이름, 프로필 이미지)
  - 대시보드 메뉴 활성화
validation:
  - 세션 쿠키 생성 (next-auth.session-token)
```

#### TC-VISITOR-017: 로그인 - 잘못된 자격증명
```yaml
url: /auth/login
precondition: 비로그인 상태
steps:
  1. 존재하지 않는 이메일로 로그인 시도
  2. 또는 잘못된 비밀번호로 시도
expected:
  - Error Toast "이메일 또는 비밀번호가 올바르지 않습니다"
  - 로그인 실패
validation:
  - 세션 생성 안됨
```

#### TC-VISITOR-018: 로그인 - GitHub OAuth
```yaml
url: /auth/login
precondition: 비로그인 상태
steps:
  1. /auth/login 페이지 접근
  2. "GitHub으로 로그인" 버튼 클릭
  3. GitHub 계정으로 로그인
expected:
  - 로그인 성공
  - 홈페이지로 리다이렉트
validation:
  - 세션 쿠키 생성
```

#### TC-VISITOR-019: 로그인 - Google OAuth
```yaml
url: /auth/login
precondition: 비로그인 상태
steps:
  1. /auth/login 페이지 접근
  2. "Google로 로그인" 버튼 클릭
  3. Google 계정으로 로그인
expected:
  - 로그인 성공
  - 홈페이지로 리다이렉트
validation:
  - 세션 쿠키 생성
```

#### TC-VISITOR-020: 비밀번호 찾기
```yaml
url: /auth/forgot-password
method: POST
precondition: 비로그인 상태 + 계정 존재
steps:
  1. /auth/forgot-password 페이지 접근
  2. 이메일 입력
  3. "재설정 링크 전송" 버튼 클릭
expected:
  - Success Toast "재설정 링크가 이메일로 전송되었습니다"
  - 비밀번호 재설정 이메일 발송
validation:
  - PasswordResetToken 레코드 생성 (1시간 유효)
  - 이메일에 재설정 링크 포함
```

#### TC-VISITOR-021: 비밀번호 재설정
```yaml
url: /auth/reset-password?token={token}
method: POST
precondition: 비밀번호 찾기 완료 + 유효한 토큰
steps:
  1. 이메일의 재설정 링크 클릭
  2. /auth/reset-password?token={token} 페이지 열림
  3. 새 비밀번호 입력
  4. 새 비밀번호 확인 입력
  5. "비밀번호 재설정" 버튼 클릭
expected:
  - Success Toast "비밀번호가 재설정되었습니다"
  - /auth/login으로 리다이렉트
  - 비밀번호 변경 완료 이메일 발송
validation:
  - User 레코드의 password 해시 업데이트
  - PasswordResetToken 삭제
```

#### TC-VISITOR-022: 언어 전환
```yaml
url: /
precondition: 비로그인 상태
steps:
  1. 헤더의 언어 전환 버튼 클릭
  2. 영어(EN) 선택
  3. 다시 한국어(KO) 선택
expected:
  - 모든 텍스트가 선택한 언어로 번역
  - 번역 누락 없음 (translation key 노출 없음)
validation:
  - 쿠키에 NEXT_LOCALE 저장
  - 페이지 새로고침 시 언어 유지
```

---

## 💬 역할 5: 커뮤니티 활동자

### 접근 권한
- **요구 조건**: 로그인 (OAuth 또는 Credentials)
- **접근 가능 페이지**: `/community/*`
- **API 엔드포인트**: `/api/posts`, `/api/unified-comments`, `/api/reactions`, `/api/follows`

### 테스트 케이스

#### TC-COMMUNITY-001: 게시글 작성
```yaml
url: /api/posts
method: POST
precondition: 로그인 상태
steps:
  1. /community 페이지에서 "글쓰기" 버튼 클릭
  2. 작성 모달 열림
  3. 제목 입력 (3-100자)
  4. 내용 입력 (마크다운 지원, 최소 10자)
  5. 카테고리 선택 (질문/팁/공지/자유)
  6. "등록" 버튼 클릭
expected:
  - HTTP 200 응답
  - Success Toast "게시글이 등록되었습니다"
  - 게시글 상세 페이지로 이동
validation:
  - Post 레코드 생성
  - authorId가 현재 사용자
```

#### TC-COMMUNITY-002: 게시글 수정
```yaml
url: /api/posts/[id]
method: PATCH
precondition: 로그인 상태 + 본인이 작성한 게시글
steps:
  1. 게시글 상세 페이지에서 "수정" 버튼 클릭
  2. 수정 모달에서 내용 변경
  3. "저장" 버튼 클릭
expected:
  - 수정 성공
  - Success Toast
validation:
  - updatedAt 타임스탬프 업데이트
```

#### TC-COMMUNITY-003: 게시글 삭제
```yaml
url: /api/posts/[id]
method: DELETE
precondition: 로그인 상태 + 본인이 작성한 게시글
steps:
  1. 게시글 상세 페이지에서 "삭제" 버튼 클릭
  2. 확인 다이얼로그에서 "삭제" 클릭
expected:
  - HTTP 200 응답
  - Success Toast "게시글이 삭제되었습니다"
  - /community로 리다이렉트
validation:
  - Post 레코드 삭제
  - 관련 댓글도 cascade 삭제
```

#### TC-COMMUNITY-004: 댓글 작성
```yaml
url: /api/unified-comments
method: POST
precondition: 로그인 상태 + 게시글 존재
steps:
  1. 게시글 상세 페이지 접근
  2. 댓글 입력 필드에 내용 입력 (최소 1자)
  3. "등록" 버튼 클릭
expected:
  - HTTP 200 응답
  - Success Toast "댓글이 등록되었습니다"
  - 댓글 목록에 추가
  - 게시글 작성자에게 알림 전송
validation:
  - UnifiedComment 레코드 생성
  - targetType = POST
  - targetId = 게시글 ID
```

#### TC-COMMUNITY-005: 대댓글 작성
```yaml
url: /api/unified-comments
method: POST
precondition: 로그인 상태 + 댓글 존재
steps:
  1. 댓글에서 "답글" 버튼 클릭
  2. 답글 입력
  3. "등록" 버튼 클릭
expected:
  - 대댓글 등록 성공
  - 들여쓰기되어 표시
  - 원댓글 작성자에게 알림 전송
validation:
  - parentId가 원댓글 ID
```

#### TC-COMMUNITY-006: 댓글 수정
```yaml
url: /api/unified-comments/[id]
method: PATCH
precondition: 로그인 상태 + 본인이 작성한 댓글
steps:
  1. 댓글에서 "수정" 버튼 클릭
  2. 수정 폼에서 내용 변경
  3. "저장" 버튼 클릭
expected:
  - 댓글 수정 성공
validation:
  - updatedAt 타임스탬프 업데이트
```

#### TC-COMMUNITY-007: 댓글 삭제
```yaml
url: /api/unified-comments/[id]
method: DELETE
precondition: 로그인 상태 + 본인이 작성한 댓글
steps:
  1. 댓글에서 "삭제" 버튼 클릭
  2. 확인
expected:
  - 댓글 삭제 성공
validation:
  - 대댓글이 있으면 "삭제된 댓글입니다" 표시
  - 대댓글이 없으면 완전 삭제
```

#### TC-COMMUNITY-008: 게시글 반응 (좋아요)
```yaml
url: /api/reactions
method: POST
precondition: 로그인 상태 + 게시글 존재
steps:
  1. 게시글 상세 또는 카드에서 반응 버튼 클릭 (LIKE/RECOMMEND/BOOKMARK)
expected:
  - 반응 추가 성공
  - 반응 수 증가
  - 버튼 상태 변경 (filled)
  - 게시글 작성자에게 알림 전송
validation:
  - Reaction 레코드 생성
  - targetType = POST
```

#### TC-COMMUNITY-009: 반응 취소
```yaml
url: /api/reactions
method: POST
precondition: 이미 반응한 게시글
steps:
  1. 반응 버튼 다시 클릭
expected:
  - 반응 제거 성공
  - 반응 수 감소
  - 버튼 상태 변경 (outline)
validation:
  - Reaction 레코드 삭제
```

#### TC-COMMUNITY-010: 판매자 팔로우
```yaml
url: /api/follows
method: POST
precondition: 로그인 상태 + 판매자 존재
steps:
  1. 판매자 프로필 페이지 접근
  2. "팔로우" 버튼 클릭
expected:
  - HTTP 200 응답
  - Success Toast "팔로우했습니다"
  - 버튼 텍스트 변경 ("팔로잉")
  - 팔로워 수 증가
  - 판매자에게 알림 전송
validation:
  - Follow 레코드 생성
  - 자기 자신 팔로우 불가
```

#### TC-COMMUNITY-011: 언팔로우
```yaml
url: /api/follows
method: POST
precondition: 이미 팔로우한 판매자
steps:
  1. "팔로잉" 버튼 클릭
expected:
  - Success Toast "언팔로우했습니다"
  - 버튼 텍스트 변경 ("팔로우")
  - 팔로워 수 감소
validation:
  - Follow 레코드 삭제
```

#### TC-COMMUNITY-012: 팔로잉 목록 조회
```yaml
url: /dashboard/following
method: GET
precondition: 로그인 상태
steps:
  1. /dashboard/following 페이지 접근
  2. "팔로잉 목록" 탭 확인
expected:
  - 내가 팔로우한 판매자 목록 표시
  - 각 카드: 프로필 이미지, 이름, 소개, 통계, 언팔로우 버튼
validation:
  - API: /api/follows/following
```

#### TC-COMMUNITY-013: 팔로잉 피드
```yaml
url: /dashboard/following
method: GET
precondition: 로그인 상태 + 팔로잉한 판매자 존재
steps:
  1. /dashboard/following 페이지 접근
  2. "피드" 탭 클릭
expected:
  - 팔로우한 판매자들의 최신 상품 표시 (30일 이내)
  - 각 상품: 썸네일, 제목, 가격, 판매자 정보
  - "더 보기" 버튼 (페이지네이션)
validation:
  - API: /api/follows/feed
```

#### TC-COMMUNITY-014: 상품 Q&A 작성
```yaml
url: /api/unified-comments
method: POST
precondition: 로그인 상태 + 상품 존재
steps:
  1. 상품 상세 페이지의 Q&A 탭 접근
  2. 질문 입력
  3. "질문하기" 버튼 클릭
expected:
  - 질문 등록 성공
  - 판매자에게 알림 전송
validation:
  - targetType = PRODUCT
  - targetId = 상품 ID
```

#### TC-COMMUNITY-015: 튜토리얼 댓글 작성
```yaml
url: /api/unified-comments
method: POST
precondition: 로그인 상태 + 튜토리얼 존재
steps:
  1. 튜토리얼 상세 페이지의 댓글 섹션 접근
  2. 댓글 입력
  3. "등록" 버튼 클릭
expected:
  - 댓글 등록 성공
  - 튜토리얼 작성자에게 알림 전송
validation:
  - targetType = TUTORIAL
```

#### TC-COMMUNITY-016: 게시글 좋아요 (Post Like API)
```yaml
url: /api/posts/[id]/like
method: POST
precondition: 로그인 상태 + 게시글 존재
steps:
  1. 게시글 상세 페이지 접근
  2. 좋아요 버튼 클릭
expected:
  - HTTP 200 응답
  - { liked: true, likeCount: N+1 }
  - 좋아요 버튼 상태 변경 (filled)
  - 게시글 likeCount 증가
validation:
  - Reaction 레코드 생성
  - targetType = POST
  - type = LIKE
  - 통합 Reaction 시스템 사용
```

#### TC-COMMUNITY-017: 게시글 좋아요 취소
```yaml
url: /api/posts/[id]/like
method: POST
precondition: 이미 좋아요한 게시글
steps:
  1. 좋아요 버튼 다시 클릭
expected:
  - HTTP 200 응답
  - { liked: false, likeCount: N-1 }
  - 좋아요 버튼 상태 변경 (outline)
  - 게시글 likeCount 감소
validation:
  - Reaction 레코드 삭제
```

#### TC-COMMUNITY-018: 튜토리얼 좋아요 (Tutorial Like API)
```yaml
url: /api/tutorials/[id]/like
method: POST
precondition: 로그인 상태 + 튜토리얼 존재
steps:
  1. 튜토리얼 상세 페이지 접근
  2. 좋아요 버튼 클릭
expected:
  - HTTP 200 응답
  - { isLiked: true, likeCount: N+1 }
  - 좋아요 버튼 상태 변경 (filled)
  - 튜토리얼 likeCount 증가
validation:
  - Reaction 레코드 생성
  - targetType = TUTORIAL
  - type = LIKE
  - 통합 Reaction 시스템 사용
```

#### TC-COMMUNITY-019: 튜토리얼 좋아요 취소
```yaml
url: /api/tutorials/[id]/like
method: POST
precondition: 이미 좋아요한 튜토리얼
steps:
  1. 좋아요 버튼 다시 클릭
expected:
  - HTTP 200 응답
  - { isLiked: false, likeCount: N-1 }
  - 좋아요 버튼 상태 변경 (outline)
  - 튜토리얼 likeCount 감소
validation:
  - Reaction 레코드 삭제
```

---

## 🔧 역할 6: 일반 유저 (공통 기능)

### 접근 권한
- **요구 조건**: 로그인 (OAuth 또는 Credentials)
- **접근 가능 페이지**: `/dashboard/*`
- **API 엔드포인트**: `/api/user/*`, `/api/notifications/*`

### 테스트 케이스

#### TC-USER-001: 대시보드 메인 접근
```yaml
url: /dashboard
method: GET
precondition: 로그인 상태
steps:
  1. /dashboard 페이지 접근
expected:
  - 환영 메시지
  - 빠른 액션 카드 (상품 등록, 구매 내역, 위시리스트 등)
  - 최근 활동
  - 추천 섹션 (판매자인 경우 반응 통계 추가)
validation:
  - 역할에 따라 다른 위젯 표시
```

#### TC-USER-002: 프로필 조회
```yaml
url: /dashboard/settings
method: GET
precondition: 로그인 상태
steps:
  1. /dashboard/settings 페이지 접근
expected:
  - 프로필 탭 표시
  - 현재 정보 프리로드 (이름, 이메일, 소개, 프로필 이미지, 소셜 링크)
validation:
  - API: /api/user/profile (GET)
```

#### TC-USER-003: 프로필 수정
```yaml
url: /api/user/profile
method: PATCH
precondition: 로그인 상태
steps:
  1. 설정 페이지의 프로필 탭에서 정보 수정
     - 이름 변경
     - 소개 입력
     - 웹사이트 URL
     - GitHub 사용자명
     - Twitter 사용자명
  2. "저장" 버튼 클릭
expected:
  - HTTP 200 응답
  - Success Toast "프로필이 업데이트되었습니다"
  - 헤더에 변경된 이름 반영
validation:
  - User 레코드 업데이트
```

#### TC-USER-004: 프로필 이미지 업로드
```yaml
url: /api/user/profile
method: PATCH
precondition: 로그인 상태
steps:
  1. 프로필 이미지 영역 클릭
  2. 이미지 파일 선택 (최대 2MB)
  3. 업로드
expected:
  - Supabase Storage에 업로드 성공
  - 프로필 이미지 즉시 반영
  - 헤더 아바타 업데이트
validation:
  - 이미지 URL이 User 레코드에 저장
```

#### TC-USER-005: 알림 설정 조회
```yaml
url: /api/user/notification-settings
method: GET
precondition: 로그인 상태
steps:
  1. 설정 페이지의 알림 탭 접근
expected:
  - 이메일 알림 설정 표시 (7개 항목)
  - 푸시 알림 설정 표시 (7개 항목)
  - 각 항목 토글 스위치
validation:
  - 현재 설정 값 프리로드
```

#### TC-USER-006: 알림 설정 변경
```yaml
url: /api/user/notification-settings
method: PATCH
precondition: 로그인 상태
steps:
  1. 알림 탭에서 토글 스위치 클릭
     - 판매 알림 켜기/끄기
     - 리뷰 알림 켜기/끄기
     - 마케팅 알림 켜기/끄기
  2. 변경 사항 자동 저장
expected:
  - Success Toast "알림 설정이 저장되었습니다"
validation:
  - User.notificationSettings JSON 업데이트
  - Optimistic Update 적용
```

#### TC-USER-007: 푸시 알림 구독
```yaml
url: /api/notifications/push-subscription
method: POST
precondition: 로그인 상태 + 브라우저 알림 권한 허용
steps:
  1. 알림 탭에서 "브라우저 알림 활성화" 버튼 클릭
  2. 브라우저 권한 요청 승인
expected:
  - Push Subscription 생성 성공
  - Success Toast "브라우저 알림이 활성화되었습니다"
  - "테스트 알림 보내기" 버튼 활성화
validation:
  - PushSubscription 레코드 생성
  - Service Worker 등록
```

#### TC-USER-008: 푸시 알림 구독 해제
```yaml
url: /api/notifications/push-subscription
method: DELETE
precondition: 푸시 알림 구독 상태
steps:
  1. "브라우저 알림 비활성화" 버튼 클릭
expected:
  - 구독 해제 성공
  - Info Toast "브라우저 알림이 비활성화되었습니다"
validation:
  - PushSubscription 레코드 삭제
```

#### TC-USER-009: 비밀번호 변경
```yaml
url: /dashboard/settings
precondition: 로그인 상태 (Credentials 계정)
steps:
  1. 설정 페이지의 보안 탭 접근
  2. 현재 비밀번호 입력
  3. 새 비밀번호 입력 (8자 이상)
  4. 새 비밀번호 확인 입력
  5. "변경" 버튼 클릭
expected:
  - Success Toast "비밀번호가 변경되었습니다"
  - 비밀번호 변경 완료 이메일 발송
validation:
  - 현재 비밀번호 확인
  - User.password 해시 업데이트
```

#### TC-USER-010: 알림 센터 - 목록 조회
```yaml
url: /api/notifications
method: GET
precondition: 로그인 상태
steps:
  1. 헤더의 알림 벨 아이콘 클릭
  2. 알림 드롭다운 열림
expected:
  - 알림 목록 표시 (최근 10개)
  - 읽지 않은 알림 개수 배지
  - All/Unread 필터 탭
  - "모두 읽음" 버튼
  - "전체 삭제" 버튼
  - "설정" 링크
validation:
  - 30초마다 폴링 (자동 갱신)
```

#### TC-USER-011: 알림 센터 - 읽음 처리
```yaml
url: /api/notifications/[id]
method: PATCH
precondition: 로그인 상태 + 읽지 않은 알림 존재
steps:
  1. 알림 항목 클릭
expected:
  - 알림의 isRead가 true로 변경
  - 배지 숫자 감소
  - 관련 페이지로 이동
validation:
  - Notification.isRead = true
  - Notification.readAt 타임스탬프 기록
```

#### TC-USER-012: 알림 센터 - 모두 읽음
```yaml
url: /api/notifications
method: PATCH
precondition: 로그인 상태 + 읽지 않은 알림 존재
steps:
  1. 알림 드롭다운에서 "모두 읽음" 버튼 클릭
expected:
  - 모든 알림이 읽음 처리
  - 배지 숨김
validation:
  - 모든 Notification.isRead = true
```

#### TC-USER-013: 알림 센터 - 삭제
```yaml
url: /api/notifications/[id]
method: DELETE
precondition: 로그인 상태 + 알림 존재
steps:
  1. 알림 항목 스와이프 또는 삭제 버튼 클릭
expected:
  - 알림 삭제 성공
  - 목록에서 제거
validation:
  - Notification 레코드 삭제
```

#### TC-USER-014: 알림 페이지 - 전체 목록
```yaml
url: /dashboard/notifications
method: GET
precondition: 로그인 상태
steps:
  1. /dashboard/notifications 페이지 접근
expected:
  - 전체 알림 목록 표시
  - 타입별 필터 (전체/구매/판매/팔로워/댓글 등)
  - 페이지네이션
  - 개별 삭제 버튼
validation:
  - 페이지당 20개씩 표시
```

#### TC-USER-015: AI 챗봇 - 열기
```yaml
url: /
precondition: 로그인 상태 + ANTHROPIC_API_KEY 설정
steps:
  1. 우측 하단의 챗봇 플로팅 버튼 클릭
expected:
  - 챗봇 패널 열림 (애니메이션)
  - 환영 메시지 표시
  - 입력 필드 활성화
validation:
  - Glass morphism 디자인
```

#### TC-USER-016: AI 챗봇 - 대화
```yaml
url: /api/chat
method: POST
precondition: 챗봇 열린 상태
steps:
  1. 질문 입력 (예: "어떤 상품을 판매할 수 있나요?")
  2. 전송 버튼 클릭
expected:
  - 질문이 메시지 목록에 추가
  - 타이핑 인디케이터 표시
  - AI 응답 수신
  - 응답이 메시지 목록에 추가
validation:
  - Claude API 호출
  - 스트리밍 응답 (선택)
```

#### TC-USER-017: AI 챗봇 - 대화 초기화
```yaml
url: /
precondition: 챗봇에 대화 이력 존재
steps:
  1. 챗봇 헤더의 "대화 초기화" 버튼 클릭
  2. 확인
expected:
  - 대화 이력 삭제
  - 환영 메시지 재표시
validation:
  - 로컬 스토리지 또는 세션 스토리지 초기화
```

#### TC-USER-018: 로그아웃
```yaml
url: /api/auth/signout
method: POST
precondition: 로그인 상태
steps:
  1. 헤더의 사용자 메뉴 클릭
  2. "로그아웃" 클릭
expected:
  - 로그아웃 성공
  - 홈페이지로 리다이렉트
  - 헤더에서 사용자 정보 제거
  - "로그인" 버튼 표시
validation:
  - 세션 쿠키 삭제
```

---

## 🔌 역할 7: API 테스트

### 공개 API (인증 불필요)

#### TC-API-001: 카테고리 목록 조회
```yaml
url: /api/categories
method: GET
precondition: 없음
steps:
  1. GET /api/categories 요청
expected:
  - HTTP 200 응답
  - JSON 배열
  - 각 카테고리: id, name, slug, description, icon, productCount
validation:
  - 응답 시간 < 500ms
```

#### TC-API-002: 상품 검색
```yaml
url: /api/products?q={keyword}
method: GET
precondition: 없음
steps:
  1. GET /api/products?q=design 요청
expected:
  - HTTP 200 응답
  - 제목 또는 설명에 "design" 포함된 상품 목록
  - 페이지네이션 메타데이터 (total, page, limit)
validation:
  - 대소문자 구분 없음
```

#### TC-API-003: 상품 필터링
```yaml
url: /api/products?category={slug}&minPrice={min}&maxPrice={max}&rating={stars}&license={type}
method: GET
precondition: 없음
steps:
  1. GET /api/products?category=ui-kits&minPrice=10&maxPrice=50&rating=4 요청
expected:
  - 필터 조건에 맞는 상품만 반환
  - category=ui-kits
  - price >= 10 AND price <= 50
  - averageRating >= 4
validation:
  - 결과가 모든 필터 조건 만족
```

#### TC-API-004: 상품 정렬
```yaml
url: /api/products?sort={field}
method: GET
precondition: 없음
steps:
  1. GET /api/products?sort=popular 요청
  2. GET /api/products?sort=latest 요청
  3. GET /api/products?sort=price-asc 요청
  4. GET /api/products?sort=price-desc 요청
expected:
  - popular: salesCount 내림차순
  - latest: createdAt 내림차순
  - price-asc: price 오름차순
  - price-desc: price 내림차순
validation:
  - 정렬 순서 확인
```

#### TC-API-005: 상품 상세 조회
```yaml
url: /api/products/[id]
method: GET
precondition: 상품 존재
steps:
  1. GET /api/products/{productId} 요청
expected:
  - HTTP 200 응답
  - 상품 상세 정보 (seller, reviews, files, tutorials 포함)
  - 404 (상품 없음 시)
validation:
  - 관계 데이터 프리로드
```

#### TC-API-006: 판매자 프로필 조회
```yaml
url: /api/sellers/[id]
method: GET
precondition: 판매자 존재
steps:
  1. GET /api/sellers/{sellerId} 요청
expected:
  - HTTP 200 응답
  - 판매자 정보 (이름, 소개, 통계)
  - 판매 상품 목록
  - 404 (판매자 없음 시)
validation:
  - 통계: totalSales, productCount, avgRating, followerCount
```

#### TC-API-007: 튜토리얼 목록 조회
```yaml
url: /api/tutorials
method: GET
precondition: 없음
steps:
  1. GET /api/tutorials 요청
expected:
  - HTTP 200 응답
  - 튜토리얼 목록 (제목, 설명, 작성자, 생성일)
  - 페이지네이션 지원
validation:
  - 작성자 정보 포함
```

#### TC-API-008: 튜토리얼 상세 조회
```yaml
url: /api/tutorials/[id]
method: GET
precondition: 튜토리얼 존재
steps:
  1. GET /api/tutorials/{tutorialId} 요청
expected:
  - HTTP 200 응답
  - 튜토리얼 상세 정보 (steps 포함)
  - 관련 상품 정보
  - 404 (튜토리얼 없음 시)
validation:
  - steps 배열 순서 보존
```

### 인증 필요 API

#### TC-API-009: 상품 등록
```yaml
url: /api/products
method: POST
precondition: 판매자 로그인 상태
steps:
  1. POST /api/products 요청 (JSON body)
     - title, description, price, categoryId
expected:
  - HTTP 201 응답
  - 생성된 상품 ID 반환
  - 401 (비로그인 시)
  - 403 (판매자 아님)
validation:
  - Product 레코드 생성
  - sellerId가 현재 사용자
```

#### TC-API-010: 상품 수정
```yaml
url: /api/products/[id]
method: PATCH
precondition: 로그인 + 본인 상품
steps:
  1. PATCH /api/products/{productId} 요청
expected:
  - HTTP 200 응답
  - 403 (다른 사용자 상품)
validation:
  - 수정 권한 확인
```

#### TC-API-011: 상품 삭제
```yaml
url: /api/products/[id]
method: DELETE
precondition: 로그인 + 본인 상품
steps:
  1. DELETE /api/products/{productId} 요청
expected:
  - HTTP 200 응답
  - 403 (다른 사용자 상품)
validation:
  - Product 레코드 삭제
```

#### TC-API-012: 위시리스트 추가
```yaml
url: /api/wishlist
method: POST
precondition: 구매자 로그인 상태
steps:
  1. POST /api/wishlist 요청 { productId }
expected:
  - HTTP 200 응답
  - 위시리스트에 추가
  - 409 (이미 추가된 경우)
validation:
  - Wishlist 레코드 생성
```

#### TC-API-013: 위시리스트 제거
```yaml
url: /api/wishlist
method: DELETE
precondition: 로그인 + 위시리스트 존재
steps:
  1. DELETE /api/wishlist?productId={id} 요청
expected:
  - HTTP 200 응답
  - 위시리스트에서 제거
validation:
  - Wishlist 레코드 삭제
```

#### TC-API-014: 구매 내역 조회
```yaml
url: /api/purchases
method: GET
precondition: 구매자 로그인 상태
steps:
  1. GET /api/purchases 요청
expected:
  - HTTP 200 응답
  - 본인의 구매 내역만 반환
  - 각 구매: product, paymentInfo, downloadLink
validation:
  - userId가 현재 사용자
```

#### TC-API-015: 리뷰 작성
```yaml
url: /api/reviews
method: POST
precondition: 로그인 + 구매 완료 + 리뷰 미작성
steps:
  1. POST /api/reviews 요청 { productId, rating, comment }
expected:
  - HTTP 201 응답
  - 리뷰 생성
  - 400 (구매하지 않은 상품)
  - 409 (이미 리뷰 작성)
validation:
  - Review 레코드 생성
  - Product.averageRating 업데이트
```

#### TC-API-016: 리뷰 수정
```yaml
url: /api/reviews/[id]
method: PATCH
precondition: 로그인 + 본인 리뷰
steps:
  1. PATCH /api/reviews/{reviewId} 요청
expected:
  - HTTP 200 응답
  - 403 (다른 사용자 리뷰)
validation:
  - Review 레코드 업데이트
```

#### TC-API-017: 리뷰 삭제
```yaml
url: /api/reviews/[id]
method: DELETE
precondition: 로그인 + 본인 리뷰
steps:
  1. DELETE /api/reviews/{reviewId} 요청
expected:
  - HTTP 200 응답
validation:
  - Review 레코드 삭제
```

#### TC-API-018: 댓글 작성
```yaml
url: /api/unified-comments
method: POST
precondition: 로그인 상태
steps:
  1. POST /api/unified-comments 요청 { targetType, targetId, content }
expected:
  - HTTP 201 응답
  - targetType: POST | PRODUCT | TUTORIAL
validation:
  - UnifiedComment 레코드 생성
```

#### TC-API-019: 반응 추가
```yaml
url: /api/reactions
method: POST
precondition: 로그인 상태
steps:
  1. POST /api/reactions 요청 { targetType, targetId, type }
expected:
  - HTTP 200 응답
  - type: LIKE | LOVE | FIRE | RECOMMEND
  - 중복 방지 (unique constraint)
validation:
  - Reaction 레코드 생성 또는 삭제 (토글)
```

#### TC-API-020: 팔로우
```yaml
url: /api/follows
method: POST
precondition: 로그인 상태
steps:
  1. POST /api/follows 요청 { followingId }
expected:
  - HTTP 200 응답
  - 자기 자신 팔로우 불가 (400)
validation:
  - Follow 레코드 생성 또는 삭제 (토글)
```

### 관리자 API

#### TC-API-021: 사용자 목록 조회 (관리자)
```yaml
url: /api/admin/users
method: GET
precondition: 관리자 로그인 상태
steps:
  1. GET /api/admin/users 요청
expected:
  - HTTP 200 응답
  - 모든 사용자 목록
  - 403 (비관리자)
validation:
  - 역할 확인
```

#### TC-API-022: 사용자 역할 변경 (관리자)
```yaml
url: /api/admin/users/[id]
method: PATCH
precondition: 관리자 로그인 상태
steps:
  1. PATCH /api/admin/users/{userId} 요청 { role }
expected:
  - HTTP 200 응답
  - 역할 변경 성공
  - 403 (비관리자)
validation:
  - User.role 업데이트
```

#### TC-API-023: 정산 상태 변경 (관리자)
```yaml
url: /api/admin/settlements/[id]
method: PATCH
precondition: 관리자 로그인 상태
steps:
  1. PATCH /api/admin/settlements/{id} 요청 { status }
expected:
  - HTTP 200 응답
  - status: APPROVED | REJECTED | PROCESSING
validation:
  - Settlement.status 업데이트
```

#### TC-API-024: 환불 승인/거절 (관리자)
```yaml
url: /api/admin/refunds/[id]
method: PATCH
precondition: 관리자 로그인 상태
steps:
  1. PATCH /api/admin/refunds/{id} 요청 { action }
  2. action: approve | reject
expected:
  - HTTP 200 응답
  - Bootpay 환불 처리 (승인 시)
validation:
  - Refund.status 업데이트
```

### 분석 API (Analytics)

#### TC-API-025: 판매자 분석 통계 조회
```yaml
url: /api/analytics?period={period}
method: GET
precondition: 판매자 로그인 상태
steps:
  1. GET /api/analytics?period=30d 요청
expected:
  - HTTP 200 응답
  - 현재 기간 매출, 판매 건수, 평균 주문 금액
  - 이전 기간 대비 성장률
  - 일별 판매 데이터 배열
  - 401 (비로그인 시)
validation:
  - period: 7d, 30d, 90d, 1y
  - 본인 상품 데이터만 반환
```

#### TC-API-026: 반응 통계 조회 (인기 콘텐츠)
```yaml
url: /api/analytics/reactions?type=popular&targetType=PRODUCT&period=7d
method: GET
precondition: 없음
steps:
  1. GET /api/analytics/reactions?type=popular&targetType=PRODUCT&period=7d 요청
expected:
  - HTTP 200 응답
  - 인기 콘텐츠 목록 (반응 수 기준)
  - 각 항목: id, title, reactionCounts, totalReactions
validation:
  - type: popular, trending, category, user, overview
  - targetType: PRODUCT, POST, TUTORIAL
  - period: 7d, 30d, 90d, all
```

#### TC-API-027: 트렌딩 콘텐츠 조회
```yaml
url: /api/analytics/reactions?type=trending&limit=10
method: GET
precondition: 없음
steps:
  1. GET /api/analytics/reactions?type=trending&limit=10 요청
expected:
  - HTTP 200 응답
  - 최근 급상승 콘텐츠 목록
  - 반응 증가율 기준 정렬
validation:
  - 최근 7일 대비 이전 7일 반응 증가율
```

#### TC-API-028: 전환율 분석
```yaml
url: /api/analytics/conversion?period=month
method: GET
precondition: 로그인 상태
steps:
  1. GET /api/analytics/conversion?period=month 요청
expected:
  - HTTP 200 응답
  - 전체 전환율 (반응 → 구매)
  - 반응 유형별 전환율 (LIKE, BOOKMARK 등)
  - 시간대별 전환 패턴
  - 401 (비로그인 시)
validation:
  - period: day, week, month, all
  - productId, categoryId 필터 지원
```

#### TC-API-029: 사용자 반응 통계
```yaml
url: /api/analytics/reactions?type=user
method: GET
precondition: 로그인 상태
steps:
  1. GET /api/analytics/reactions?type=user 요청
expected:
  - HTTP 200 응답
  - 내가 받은 반응 통계
  - 반응 유형별 분포
  - 401 (비로그인 시)
validation:
  - 본인 콘텐츠에 대한 반응만 집계
```

### 추천 API (Recommendations)

#### TC-API-030: 개인화 추천 조회 (로그인)
```yaml
url: /api/recommendations?type=all&limit=12
method: GET
precondition: 로그인 상태
steps:
  1. GET /api/recommendations?type=all&limit=12 요청
expected:
  - HTTP 200 응답
  - 개인화된 상품/튜토리얼/게시글 추천
  - 사용자 반응 패턴 기반 추천
  - recommendationScore 포함
validation:
  - type: all, products, tutorials, posts
  - 사용자의 좋아요/북마크 태그 기반
```

#### TC-API-031: 인기 추천 조회 (비로그인)
```yaml
url: /api/recommendations?type=products&limit=8
method: GET
precondition: 비로그인 상태
steps:
  1. GET /api/recommendations?type=products&limit=8 요청
expected:
  - HTTP 200 응답
  - 인기 콘텐츠 기반 추천
  - 판매량/조회수/평점 기준 정렬
validation:
  - 비로그인 시 인기 콘텐츠 폴백
```

#### TC-API-033: 조건부확률 기반 유사 상품 추천 (NEW)
```yaml
url: /api/recommendations?type=similar&productId={id}
method: GET
precondition: 상품 ID 필요
steps:
  1. GET /api/recommendations?type=similar&productId=xxx 요청
expected:
  - HTTP 200 응답
  - 함께 구매한 상품 목록 (폭포 다이어그램 검증 통과한 상품만)
  - conditionalProbability 포함 (P(추천상품|현재상품))
  - waterfallValidation 포함 (일치율, 그룹성공률, 포지션백분위)
  - recommendReason: "이 상품 구매자의 XX%가 함께 구매"
validation:
  - P(B|A) = (A와 B 함께 구매 수) / (A 구매 수)
  - 시간 기반 가중치 (최근 구매일수록 높은 점수)
  - 일치율 50% 미만 상품은 자동 필터링
```

#### TC-API-034: 고객 여정 기반 추천 (NEW)
```yaml
url: /api/recommendations?type=journey&categoryId={id}
method: GET
precondition: 카테고리 ID 또는 로그인 상태
steps:
  1. GET /api/recommendations?type=journey&categoryId=xxx 요청
expected:
  - HTTP 200 응답
  - 다음 카테고리 전이 확률 기반 추천
  - transitionProbability 포함 (P(다음카테고리|현재카테고리))
  - 카테고리별 추천 상품 목록 (폭포 검증 적용)
  - validationStats: 필터링 전/후 상품 수
validation:
  - 카테고리 전이 행렬 기반 계산
  - 사용자의 마지막 구매 카테고리 활용
  - 폭포 다이어그램 검증으로 품질 보장
```

#### TC-API-035: 마케팅 타겟팅 데이터 조회 (NEW)
```yaml
url: /api/recommendations?type=marketing
method: GET
precondition: 관리자 권한 권장
steps:
  1. GET /api/recommendations?type=marketing 요청
expected:
  - HTTP 200 응답
  - bundleRecommendations: 번들 구성 추천 (폭포 검증 포함)
  - categoryTransitions: 크로스셀링 기회
  - highValueCustomers: VIP 고객 세그먼트
  - atRiskCustomers: 이탈 위험 고객
validation:
  - 쿠폰/이벤트/홍보 타겟팅에 활용
  - 번들 쌍은 combinedMatchRate 50% 이상만 포함

#### TC-API-036: 폭포 다이어그램 검증 시스템 (NEW)
```yaml
url: /api/recommendations (모든 type)
method: GET
precondition: 구매 이력이 있는 상품
steps:
  1. 추천 API 호출
  2. waterfallValidation 필드 확인
expected:
  - matchRate: 최종 일치율 (0-100%)
  - groupSuccessRate: 그룹 내 성공률
  - positionPercentile: 그룹 내 포지션 백분위
  - confidence: "high" | "medium" | "low"
  - isRecommended: 50% 이상만 true
validation:
  - 일치율 = (조건부확률 × 0.4) + (그룹성공률 × 0.3) + (포지션점수 × 0.3)
  - 50% 미만은 자동으로 추천 목록에서 제외
```

#### TC-API-032: 헬스 체크 API
```yaml
url: /api/health
method: GET
precondition: 없음
steps:
  1. GET /api/health 요청
expected:
  - HTTP 200 응답
  - { status: "ok", timestamp: "...", uptime: ... }
validation:
  - 서버 상태 확인용
```

---

## 📊 조건부확률 기반 고객 여정 분석 가이드

### 개요
고객이 제품을 구매했을 때, 조건부확률을 통해 **다음 행동을 예측**하고 **맞춤 추천**을 제공합니다.
**폭포 다이어그램 검증**을 통해 추천 품질을 보장하고, 50% 미만 일치율의 상품은 자동 필터링됩니다.

### 핵심 수식

#### 1. 구매 전이 확률
$$P(\text{상품B}|\text{상품A 구매}) = \frac{\text{A와 B를 함께 구매한 고객 수}}{\text{A를 구매한 총 고객 수}}$$

#### 2. 카테고리 전이 확률
$$P(\text{카테고리Y}|\text{카테고리X}) = \frac{\text{X→Y 전이 횟수}}{\text{X에서 출발한 총 전이 횟수}}$$

#### 3. 폭포 다이어그램 일치율 (안전장치)
$$\text{일치율} = (\text{조건부확률} \times 0.4) + (\text{그룹성공률} \times 0.3) + (\text{포지션점수} \times 0.3)$$

### 🏔️ 폭포 다이어그램 검증 시스템

#### 검증 흐름도
```
[1단계] 조건부확률 계산
P(상품B|상품A) = 42%
        │
        ▼
[2단계] 그룹 분석 (카테고리 + 가격대)
├─ 그룹 정의: electronics/mid (전자제품/중가)
├─ 그룹 내 총 거래: 150건
├─ 성공 거래: 120건 (완료 + 긍정 리뷰)
├─ 실패 거래: 30건 (환불 + 부정 리뷰)
└─ 그룹 성공률: 80%
        │
        ▼
[3단계] 그룹 내 포지션 계산
├─ 판매량 점수: 0.7
├─ 평점 점수: 0.8
├─ 리뷰 점수: 0.6
├─ 종합 점수: 0.72 (가중 평균)
├─ 그룹 내 순위: 12위 / 50개
└─ 백분위: 76%
        │
        ▼
[4단계] 최종 일치율 계산
일치율 = (0.42 × 0.4) + (0.80 × 0.3) + (0.76 × 0.3)
       = 0.168 + 0.24 + 0.228
       = 63.6%
        │
        ▼
[5단계] 추천 결정
├─ 임계값: 50%
├─ 63.6% ≥ 50%
└─ ✅ 추천 허용
```

#### 참/거짓 분류 기준
| 분류 | 조건 | 가중치 |
|------|------|--------|
| 참 (성공) | 완료된 거래 | +1 |
| 참 (성공) | 긍정 리뷰 (4점 이상) | +0.5 |
| 거짓 (실패) | 환불 승인 | +1 |
| 거짓 (실패) | 부정 리뷰 (4점 미만) | +0.5 |

#### 포지션 점수 계산
| 요소 | 가중치 | 설명 |
|------|--------|------|
| 판매량 | 40% | 그룹 내 최대 판매량 대비 |
| 평균 평점 | 40% | 5점 만점 기준 |
| 리뷰 수 | 20% | 그룹 내 최대 리뷰 수 대비 |

#### 신뢰도 등급
| 등급 | 조건 | 의미 |
|------|------|------|
| high | 거래 ≥30건, 그룹상품 ≥10개 | 충분한 데이터 |
| medium | 거래 ≥10건, 그룹상품 ≥5개 | 보통 데이터 |
| low | 그 외 | 부족한 데이터 (참고용) |

### 활용 시나리오

| 시나리오 | API 엔드포인트 | 활용 |
|----------|---------------|------|
| 상품 상세 페이지 | `?type=similar&productId=xxx` | "함께 구매한 상품" 섹션 |
| 결제 완료 페이지 | `?type=journey` | "다음에 관심 가질 상품" |
| 쿠폰 발급 | `?type=marketing` | VIP 고객 타겟팅 |
| 번들 구성 | `?type=marketing` | 높은 동시구매율 상품 묶음 |
| 재구매 이메일 | `?type=marketing` | 이탈 위험 고객 알림 |
| 이벤트 기획 | `?type=marketing` | 카테고리 전이 핫스팟 |

### API 응답 예시

#### 유사 상품 추천 (type=similar) - 폭포 검증 포함
```json
{
  "type": "similar_purchase",
  "sourceProductId": "prod_123",
  "totalBuyers": 150,
  "recommendations": [
    {
      "id": "prod_456",
      "title": "관련 상품",
      "conditionalProbability": 0.42,
      "purchaseCount": 63,
      "recommendReason": "이 상품 구매자의 42%가 함께 구매",
      "waterfallValidation": {
        "matchRate": 64,
        "groupSuccessRate": 80,
        "positionPercentile": 76,
        "confidence": "high",
        "isRecommended": true
      }
    }
  ],
  "metadata": {
    "algorithm": "conditional_probability_with_waterfall",
    "waterfallValidation": {
      "threshold": "50%",
      "totalCandidates": 25,
      "passedValidation": 18,
      "filteredOut": 7,
      "filteredOutReason": "일치율 50% 미만으로 추천에서 제외"
    }
  }
}
```

#### 고객 여정 추천 (type=journey) - 폭포 검증 포함
```json
{
  "type": "journey",
  "sourceCategoryId": "cat_templates",
  "recommendations": [
    {
      "category": { "id": "cat_plugins", "name": "플러그인" },
      "transitionProbability": 0.35,
      "products": [
        {
          "id": "prod_789",
          "title": "인기 플러그인",
          "waterfallValidation": {
            "matchRate": 58,
            "groupSuccessRate": 75,
            "positionPercentile": 82,
            "confidence": "medium"
          }
        }
      ],
      "validationStats": {
        "total": 20,
        "passed": 15,
        "filtered": 5
      }
    }
  ]
}
```

#### 마케팅 데이터 (type=marketing) - 폭포 검증 포함
```json
{
  "type": "marketing",
  "bundleRecommendations": [
    {
      "productA": { "title": "템플릿 A" },
      "productB": { "title": "플러그인 B" },
      "probability": { "average": 0.28 },
      "bundleSuggestion": "28% 동시 구매 확률",
      "waterfallValidation": {
        "productAMatchRate": 65,
        "productBMatchRate": 58,
        "combinedMatchRate": 62,
        "isRecommended": true
      }
    }
  ],
  "highValueCustomers": [...],
  "atRiskCustomers": [...]
}
```

---

## 🌐 글로벌 추천 시스템 (사이트 전체 통계 기반)

### 개요
개인화 추천은 개별 사용자의 행동을 분석하여 맞춤 추천을 제공하지만, **계산 비용이 높고** 데이터가 방대해집니다.

**글로벌 추천**은 웹사이트 전체 통계를 기반으로 조건부확률 + 폭포 다이어그램을 **사전 계산**하여:
- 이벤트/쿠폰 대상 선정
- 교육 콘텐츠 우선순위
- 배너/홍보 콘텐츠 배치

에 **우선 적용**합니다.

### 두 가지 추천 전략 비교

| 구분 | 개인화 추천 (Individual) | 글로벌 추천 (Global) |
|------|-------------------------|---------------------|
| 데이터 소스 | 1명의 사용자 행동 | 웹사이트 전체 통계 |
| 계산 시점 | 실시간 | 사전 계산 (1시간 캐시) |
| 비용 | 높음 | 낮음 |
| 활용 | 상품 상세, 장바구니 | 이벤트, 쿠폰, 배너 |
| API 타입 | similar, journey | global-event, global-education |

### 글로벌 추천 API

#### TC-API-037: 글로벌 이벤트/쿠폰 추천 (NEW)
```yaml
url: /api/recommendations?type=global-event
method: GET
precondition: 없음 (관리자 권장)
steps:
  1. GET /api/recommendations?type=global-event 요청
expected:
  - HTTP 200 응답
  - categoryRecommendations: 카테고리별 이벤트 추천
  - peakHours: 최적 이벤트 시간대
  - eventPrediction: 예상 도달률/전환율
validation:
  - 글로벌 폭포 검증 적용 (50% 미만 제외)
  - 1시간 캐시
```

#### TC-API-038: 글로벌 교육 콘텐츠 추천 (NEW)
```yaml
url: /api/recommendations?type=global-education
method: GET
precondition: 없음
steps:
  1. GET /api/recommendations?type=global-education 요청
expected:
  - HTTP 200 응답
  - recommendations: 교육 콘텐츠 목록 (폭포 검증 적용)
  - stats: 전체 교육 콘텐츠 통계
validation:
  - 글로벌 폭포 검증 적용
  - TUTORIAL/TIPS 타입 우선
```

#### TC-API-039: 글로벌 콘텐츠 추천 (NEW)
```yaml
url: /api/recommendations?type=global-content
method: GET
precondition: 없음
steps:
  1. GET /api/recommendations?type=global-content 요청
expected:
  - HTTP 200 응답
  - posts: 인기 게시글 (폭포 검증)
  - products: 인기 상품 (폭포 검증)
validation:
  - 통합 콘텐츠 추천
```

#### TC-API-040: 글로벌 통계 조회 (NEW)
```yaml
url: /api/recommendations?type=global-stats
method: GET
precondition: 관리자 권장
steps:
  1. GET /api/recommendations?type=global-stats 요청
expected:
  - HTTP 200 응답
  - contentStats: 콘텐츠 유형별 통계
  - topCategories: 상위 카테고리
  - globalConversionRate: 전체 전환율
  - peakActivityHours: 활동 피크 시간
validation:
  - 관리자 대시보드용 데이터
```

### 글로벌 통계 수집 항목

| 항목 | 설명 | 활용 |
|------|------|------|
| totalViews | 총 조회수 | 도달률 계산 |
| totalEngagements | 총 참여수 (구매/좋아요/댓글) | 전환율 계산 |
| conversionRate | 전환율 (조회→참여) | 이벤트 효과 예측 |
| successRate | 폭포 성공률 | 품질 기준 |
| topPerformers | 상위 콘텐츠 ID | 추천 대상 |
| timePatterns | 시간대별 활동 | 이벤트 시간 최적화 |

### 글로벌 폭포 검증

#### 콘텐츠 유형별 성공 기준
| 유형 | 성공 조건 |
|------|----------|
| 상품 | 평점 4점 이상 + 판매 1건 이상 |
| 튜토리얼 | 조회수 대비 좋아요 5% 이상 |
| 게시글 | 조회수 대비 댓글 3% 이상 |

#### 일치율 계산 (글로벌)
$$\text{일치율} = (\text{글로벌확률} \times 0.4) + (\text{그룹성공률} \times 0.3) + (\text{포지션점수} \times 0.3)$$

### API 응답 예시

#### 글로벌 이벤트 추천 (type=global-event)
```json
{
  "type": "global-event",
  "categoryRecommendations": [
    {
      "category": { "id": "cat_123", "name": "템플릿" },
      "conversionRate": 0.12,
      "waterfallSuccessRate": 0.75,
      "topProducts": [
        {
          "id": "prod_456",
          "title": "인기 템플릿",
          "globalValidation": {
            "matchRate": 68,
            "positionPercentile": 85,
            "isRecommended": true
          }
        }
      ],
      "eventSuggestion": "🔥 높은 전환율 - 할인 이벤트 추천"
    }
  ],
  "peakHours": [
    { "hour": "21:00", "activityLevel": 100, "suggestion": "🎯 최적 이벤트 시간" },
    { "hour": "20:00", "activityLevel": 85, "suggestion": "⏰ 권장 이벤트 시간" }
  ],
  "eventPrediction": {
    "expectedReach": 1500,
    "expectedConversion": 45,
    "globalConversionRate": 0.03
  },
  "metadata": {
    "algorithm": "global_waterfall_validation",
    "calculatedAt": "2025-12-10T10:00:00Z",
    "cacheExpiry": "2025-12-10T11:00:00Z"
  }
}
```

#### 글로벌 교육 추천 (type=global-education)
```json
{
  "type": "global-education",
  "recommendations": [
    {
      "id": "tut_123",
      "title": "Vibe Coding 완벽 가이드",
      "type": "TUTORIAL",
      "viewCount": 5000,
      "likeCount": 350,
      "engagementRate": 7,
      "globalValidation": {
        "matchRate": 72,
        "positionPercentile": 90,
        "groupSuccessRate": 65
      },
      "recommendReason": "🏆 최고 성과 교육 콘텐츠"
    }
  ],
  "stats": {
    "totalViews": 50000,
    "totalEngagements": 3500,
    "avgConversionRate": 7,
    "successRate": 45
  }
}
```

#### 글로벌 통계 (type=global-stats)
```json
{
  "type": "global-stats",
  "statistics": {
    "contentStats": {
      "products": { "totalViews": 100000, "conversionRate": 0.03, "successRate": 40 },
      "tutorials": { "totalViews": 50000, "conversionRate": 0.07, "successRate": 45 },
      "posts": { "totalViews": 30000, "conversionRate": 0.05, "successRate": 35 },
      "education": { "totalViews": 25000, "conversionRate": 0.08, "successRate": 50 }
    },
    "topCategories": [
      { "id": "cat_1", "name": "템플릿", "successRate": 75, "conversionRate": 0.12 }
    ],
    "globalConversionRate": 3.5,
    "peakActivityHours": [
      { "hour": "21:00", "activity": 100 },
      { "hour": "20:00", "activity": 85 }
    ]
  },
  "metadata": {
    "calculatedAt": "2025-12-10T10:00:00Z",
    "cacheExpiry": "2025-12-10T11:00:00Z",
    "cacheTTL": "60분"
  }
}
```

### 활용 시나리오

| 시나리오 | API | 결과 활용 |
|----------|-----|----------|
| 홈페이지 배너 | `type=global-content` | 인기 콘텐츠 배너 노출 |
| 이벤트 기획 | `type=global-event` | 대상 카테고리 및 시간 선정 |
| 쿠폰 발급 | `type=global-event` | 전환율 높은 상품 쿠폰 |
| 교육 페이지 | `type=global-education` | 추천 교육 콘텐츠 순서 |
| 관리자 대시보드 | `type=global-stats` | 전체 통계 모니터링 |

---

## 📦 세션 58: 번들 판매 및 쿠폰/할인 시스템 테스트

> **추가일**: 2025-12-09
> **테스트 수**: 30개

### 번들 API 테스트

#### TC-S58-BUNDLE-001: 번들 목록 조회
```yaml
url: /api/bundles
method: GET
precondition: 없음
steps:
  1. GET /api/bundles 호출
expected:
  - HTTP 200 응답
  - 공개 번들 목록 반환
  - 포함 상품 정보 포함
validation:
  - isActive: true 번들만 반환
```

#### TC-S58-BUNDLE-002: 번들 생성
```yaml
url: /api/bundles
method: POST
precondition: 판매자 로그인
body:
  name: "프리미엄 패키지"
  description: "모든 템플릿 포함"
  productIds: ["prod_1", "prod_2"]
  discountRate: 20
steps:
  1. POST /api/bundles 호출
expected:
  - HTTP 201 응답
  - 번들 생성 완료
  - bundlePrice 자동 계산
validation:
  - discountRate 적용된 가격 계산
```

#### TC-S58-BUNDLE-003: 번들 수정
```yaml
url: /api/bundles/{id}
method: PUT
precondition: 번들 소유자 로그인
body:
  name: "슈퍼 프리미엄 패키지"
  discountRate: 25
steps:
  1. PUT /api/bundles/{id} 호출
expected:
  - HTTP 200 응답
  - 번들 정보 업데이트
validation:
  - 소유자만 수정 가능
```

#### TC-S58-BUNDLE-004: 번들 삭제
```yaml
url: /api/bundles/{id}
method: DELETE
precondition: 번들 소유자 로그인
steps:
  1. DELETE /api/bundles/{id} 호출
expected:
  - HTTP 200 응답
  - 번들 삭제 (soft delete)
validation:
  - 판매 기록이 있으면 비활성화만
```

#### TC-S58-BUNDLE-005: 번들 구매
```yaml
url: /api/bundles/{id}/purchase
method: POST
precondition: 구매자 로그인
steps:
  1. POST /api/bundles/{id}/purchase 호출
expected:
  - HTTP 200 응답
  - 결제 세션 생성
  - 할인된 가격 적용
validation:
  - 포함 상품 모두 구매 처리
```

### 쿠폰 API 테스트

#### TC-S58-COUPON-001: 쿠폰 생성
```yaml
url: /api/coupons
method: POST
precondition: 판매자 또는 관리자 로그인
body:
  code: "WINTER2025"
  discountType: "percentage"
  discountValue: 15
  expiresAt: "2025-12-31"
  maxUses: 100
steps:
  1. POST /api/coupons 호출
expected:
  - HTTP 201 응답
  - 쿠폰 생성 완료
validation:
  - 고유 코드 검증
```

#### TC-S58-COUPON-002: 쿠폰 적용
```yaml
url: /api/coupons/apply
method: POST
precondition: 구매자 로그인
body:
  code: "WINTER2025"
  productId: "prod_1"
steps:
  1. POST /api/coupons/apply 호출
expected:
  - HTTP 200 응답
  - 할인 금액 계산
  - 적용 가능 여부 반환
validation:
  - 만료/사용횟수 제한 검증
```

#### TC-S58-COUPON-003: 쿠폰 유효성 검증 실패 케이스
```yaml
url: /api/coupons/apply
method: POST
precondition: 만료된 쿠폰
body:
  code: "EXPIRED2024"
  productId: "prod_1"
steps:
  1. POST /api/coupons/apply 호출
expected:
  - HTTP 400 응답
  - error: "쿠폰이 만료되었습니다"
validation:
  - 다양한 실패 케이스 처리
```

#### TC-S58-COUPON-004: 쿠폰 목록 조회
```yaml
url: /api/coupons
method: GET
precondition: 판매자 로그인
steps:
  1. GET /api/coupons 호출
expected:
  - HTTP 200 응답
  - 내가 생성한 쿠폰 목록
  - 사용 통계 포함
validation:
  - 페이지네이션 지원
```

---

## ☁️ 세션 59: Cloudinary 파일 스토리지 테스트

> **추가일**: 2025-12-09
> **테스트 수**: 12개

### Cloudinary 업로드 테스트

#### TC-S59-CLOUD-001: 이미지 업로드
```yaml
url: /api/upload/cloudinary
method: POST
precondition: 로그인 상태
body:
  file: (이미지 파일)
  context: "product"
steps:
  1. POST /api/upload/cloudinary 호출
expected:
  - HTTP 200 응답
  - Cloudinary URL 반환
  - WebP 변환 완료
validation:
  - 최적화된 이미지 URL
```

#### TC-S59-CLOUD-002: 프로필 이미지 업로드
```yaml
url: /api/upload/cloudinary
method: POST
precondition: 로그인 상태
body:
  file: (이미지 파일)
  context: "profile"
steps:
  1. POST /api/upload/cloudinary 호출
expected:
  - HTTP 200 응답
  - 200x200 리사이즈
  - 원형 크롭 적용
validation:
  - 프로필 최적화 설정 적용
```

#### TC-S59-CLOUD-003: 썸네일 이미지 업로드
```yaml
url: /api/upload/cloudinary
method: POST
precondition: 로그인 상태
body:
  file: (이미지 파일)
  context: "thumbnail"
steps:
  1. POST /api/upload/cloudinary 호출
expected:
  - HTTP 200 응답
  - 400x300 리사이즈
  - 고품질 압축
validation:
  - 썸네일 최적화 설정 적용
```

#### TC-S59-CLOUD-004: 파일 크기 제한
```yaml
url: /api/upload/cloudinary
method: POST
precondition: 로그인 상태
body:
  file: (10MB 초과 파일)
steps:
  1. POST /api/upload/cloudinary 호출
expected:
  - HTTP 400 응답
  - error: "파일 크기가 너무 큽니다"
validation:
  - 5MB 제한 적용
```

#### TC-S59-CLOUD-005: 지원하지 않는 파일 형식
```yaml
url: /api/upload/cloudinary
method: POST
precondition: 로그인 상태
body:
  file: (exe 파일)
steps:
  1. POST /api/upload/cloudinary 호출
expected:
  - HTTP 400 응답
  - error: "지원하지 않는 파일 형식입니다"
validation:
  - 허용 확장자 검증
```

#### TC-S59-CLOUD-006: 이미지 삭제
```yaml
url: /api/upload/cloudinary
method: DELETE
precondition: 로그인 + 이미지 소유자
body:
  publicId: "products/abc123"
steps:
  1. DELETE /api/upload/cloudinary 호출
expected:
  - HTTP 200 응답
  - Cloudinary에서 삭제 완료
validation:
  - 소유권 검증
```

---

## 🎲 세션 60: 조건부 확률 추천 시스템 테스트

> **추가일**: 2025-12-09
> **테스트 수**: 15개

### 조건부 확률 API 테스트

#### TC-S60-REC-001: 조건부 확률 P(B|A) 계산
```yaml
url: /api/recommendations?type=conditional
method: GET
precondition: 로그인 + 구매/조회 이력
params:
  type: conditional
  productId: prod_1
steps:
  1. GET /api/recommendations 호출
expected:
  - HTTP 200 응답
  - P(B|A) 기반 추천 목록
  - confidence 값 포함
validation:
  - 조건부 확률 계산 정확성
```

#### TC-S60-REC-002: 학습 여정 추천
```yaml
url: /api/recommendations?type=learning-journey
method: GET
precondition: 튜토리얼 수강 이력
params:
  type: learning-journey
  currentTutorialId: tut_1
steps:
  1. GET /api/recommendations 호출
expected:
  - HTTP 200 응답
  - 다음 단계 튜토리얼 추천
  - transitionProbability 포함
validation:
  - 학습 전환 확률 계산
```

#### TC-S60-REC-003: 폭포 다이어그램 데이터
```yaml
url: /api/recommendations?type=waterfall
method: GET
precondition: 로그인
params:
  type: waterfall
steps:
  1. GET /api/recommendations 호출
expected:
  - HTTP 200 응답
  - 그룹별 전환 데이터
  - stagePositions 포함
validation:
  - 50% 임계값 기반 필터링
```

#### TC-S60-REC-004: 12가지 추천 타입
```yaml
url: /api/recommendations?type={type}
method: GET
precondition: 로그인
params:
  type: similar | trending | journey | bundle | new | popular | category | tag | price | rating | seller | view-also-viewed
steps:
  1. 각 타입별 API 호출
expected:
  - HTTP 200 응답
  - 타입별 추천 목록
validation:
  - 각 타입 정상 동작
```

---

## 🌍 세션 61: 글로벌 추천 시스템 & 버그 수정 테스트

> **추가일**: 2025-12-10
> **테스트 수**: 12개

### 글로벌 추천 API 테스트

#### TC-S61-GLOBAL-001: 글로벌 이벤트 추천
```yaml
url: /api/recommendations?type=global-event
method: GET
precondition: 없음
steps:
  1. GET /api/recommendations?type=global-event 호출
expected:
  - HTTP 200 응답
  - 피크 시간대 정보
  - 이벤트 추천 카테고리
validation:
  - 캐시 TTL 적용
```

#### TC-S61-GLOBAL-002: 글로벌 교육 추천
```yaml
url: /api/recommendations?type=global-education
method: GET
precondition: 없음
steps:
  1. GET /api/recommendations?type=global-education 호출
expected:
  - HTTP 200 응답
  - 인기 교육 콘텐츠
  - 학습 경로 추천
validation:
  - 완료율 기반 정렬
```

#### TC-S61-GLOBAL-003: 글로벌 콘텐츠 추천
```yaml
url: /api/recommendations?type=global-content
method: GET
precondition: 없음
steps:
  1. GET /api/recommendations?type=global-content 호출
expected:
  - HTTP 200 응답
  - 인기 콘텐츠 목록
  - 콘텐츠 유형별 분류
validation:
  - 조회수/전환율 기반 정렬
```

#### TC-S61-GLOBAL-004: 글로벌 통계 조회
```yaml
url: /api/recommendations?type=global-stats
method: GET
precondition: 없음
steps:
  1. GET /api/recommendations?type=global-stats 호출
expected:
  - HTTP 200 응답
  - 플랫폼 전체 통계
  - 카테고리별 성과
validation:
  - 60분 캐시 적용
```

### Hydration 버그 수정 테스트

#### TC-S61-FIX-001: ProductCard 중첩 Link 수정
```yaml
url: /marketplace
method: GET
precondition: 없음
steps:
  1. 마켓플레이스 페이지 접속
  2. 상품 카드 클릭
  3. 장바구니 버튼 클릭
expected:
  - Hydration Error 없음
  - 각 버튼 독립적 동작
validation:
  - 콘솔 에러 없음
```

#### TC-S61-FIX-002: 언어 전환 완전 새로고침
```yaml
url: /
method: GET
precondition: 없음
steps:
  1. 홈페이지 접속
  2. 언어 전환 (한국어 ↔ 영어)
expected:
  - 페이지 완전 새로고침
  - 모든 텍스트 번역 적용
validation:
  - window.location.reload() 동작
```

---

## 🛒 세션 62: 이커머스 UX 기능 테스트 (NEW)

### 드롭다운 메가메뉴 테스트

#### TC-UX-001: 디지털 상품 드롭다운 메가메뉴
```yaml
url: /
method: GET
precondition: 없음
steps:
  1. 홈페이지 접속
  2. "디지털 상품" 탭 호버
expected:
  - 3그룹 드롭다운 메뉴 표시
  - 비즈니스/업무 (6개 항목)
  - 개발 도구 (6개 항목)
  - 라이프스타일 (6개 항목)
validation:
  - 호버 시 메뉴 애니메이션 동작
  - 각 카테고리 클릭 시 마켓플레이스로 이동
```

#### TC-UX-002: 홈페이지 카테고리 검색
```yaml
url: /
method: GET
precondition: 없음
steps:
  1. 홈페이지 접속
  2. 검색 바에 "웹 앱" 입력
expected:
  - 검색 결과 카테고리 필터링
  - 일치하는 카테고리만 표시
validation:
  - 실시간 필터링 동작
```

#### TC-UX-003: 빠른 필터 버튼
```yaml
url: /
method: GET
precondition: 없음
steps:
  1. 홈페이지 접속
  2. "인기 급상승" 빠른 필터 클릭
expected:
  - /marketplace?filter=trending 이동
  - 인기 상품 필터링
validation:
  - 각 필터 버튼 정상 동작
```

### 최근 본 상품 테스트

#### TC-UX-004: 최근 본 상품 기록
```yaml
url: /marketplace/{productId}
method: GET
precondition: 없음
steps:
  1. 상품 상세 페이지 방문
  2. 다른 상품 상세 페이지 방문
  3. 마켓플레이스로 이동
expected:
  - 사이드바에 "최근 본 상품" 위젯 표시
  - 방문한 상품 2개 표시
validation:
  - 로컬 스토리지에 상품 ID 저장
  - 최신 방문 순으로 정렬
```

#### TC-UX-005: 최근 본 상품 삭제
```yaml
url: /marketplace
method: GET
precondition: 최근 본 상품 1개 이상
steps:
  1. 최근 본 상품 위젯에서 X 버튼 클릭
expected:
  - 해당 상품 목록에서 제거
  - 로컬 스토리지 업데이트
validation:
  - UI 즉시 업데이트
```

#### TC-UX-006: 최근 본 상품 전체 삭제
```yaml
url: /marketplace
method: GET
precondition: 최근 본 상품 2개 이상
steps:
  1. "전체 삭제" 버튼 클릭
expected:
  - 모든 최근 본 상품 제거
  - 위젯 숨김
validation:
  - 로컬 스토리지 비움
```

### 상품 비교 기능 테스트

#### TC-UX-007: 상품 비교에 추가
```yaml
url: /marketplace
method: GET
precondition: 없음
steps:
  1. 상품 카드 호버
  2. 비교 버튼(저울 아이콘) 클릭
expected:
  - 하단 플로팅 비교 바 표시
  - 상품 썸네일 표시
  - "1개 상품 비교" 텍스트
validation:
  - 로컬 스토리지에 상품 ID 저장
```

#### TC-UX-008: 최대 4개 상품 비교 제한
```yaml
url: /marketplace
method: GET
precondition: 비교 목록에 4개 상품
steps:
  1. 5번째 상품 비교 버튼 클릭
expected:
  - 비교 버튼 비활성화
  - 추가 불가
validation:
  - canAddMore === false
```

### 비교 페이지 테스트

#### TC-UX-009: 비교 페이지 접근
```yaml
url: /marketplace/compare
method: GET
precondition: 비교 목록에 2개 이상 상품
steps:
  1. 플로팅 바 "비교하기" 버튼 클릭
expected:
  - 비교 페이지 이동
  - 테이블 형식으로 상품 비교
  - 가격, 평점, 판매량, 기능 비교
validation:
  - 모든 비교 항목 정상 표시
```

#### TC-UX-010: 비교 페이지에서 상품 제거
```yaml
url: /marketplace/compare
method: GET
precondition: 비교 목록에 2개 이상 상품
steps:
  1. 상품 헤더의 X 버튼 클릭
expected:
  - 해당 상품 테이블에서 제거
  - 비교 목록 업데이트
validation:
  - 1개 남으면 빈 상태 메시지
```

---

## ⚠️ 역할 8: 에러 케이스 테스트

#### TC-ERROR-001: 404 페이지
```yaml
url: /non-existent-page
method: GET
precondition: 없음
steps:
  1. 존재하지 않는 페이지 접근
expected:
  - HTTP 404 응답
  - 커스텀 404 페이지 렌더링 (not-found.tsx)
  - "페이지를 찾을 수 없습니다" 메시지
  - 홈으로 가기 버튼
validation:
  - 에러 로깅 (Sentry)
```

#### TC-ERROR-002: 인증 필요 페이지 리다이렉트
```yaml
url: /dashboard
method: GET
precondition: 비로그인 상태
steps:
  1. /dashboard 페이지 접근
expected:
  - /auth/login으로 리다이렉트
  - callbackUrl 쿼리 파라미터 포함
validation:
  - 로그인 후 원래 페이지로 복귀
```

#### TC-ERROR-003: 권한 없는 페이지 접근
```yaml
url: /admin
method: GET
precondition: 비관리자 로그인 상태
steps:
  1. /admin 페이지 접근
expected:
  - 403 Forbidden
  - 에러 메시지 "접근 권한이 없습니다"
  - 홈으로 가기 버튼
validation:
  - 에러 로깅
```

#### TC-ERROR-004: 잘못된 입력 유효성 검사 (클라이언트)
```yaml
url: /auth/signup
method: GET
precondition: 없음
steps:
  1. 회원가입 폼 접근
  2. 이메일 형식 오류 입력
  3. 비밀번호 6자 입력 (최소 8자)
  4. 비밀번호 확인 불일치
  5. 제출 버튼 클릭
expected:
  - 각 필드 아래 에러 메시지 표시
  - 제출 불가
  - API 호출 없음
validation:
  - Zod 스키마 유효성 검사
```

#### TC-ERROR-005: API 에러 핸들링
```yaml
url: /api/products
method: POST
precondition: 판매자 로그인 상태
steps:
  1. POST /api/products 요청 (필수 필드 누락)
expected:
  - HTTP 400 Bad Request
  - JSON 에러 응답 { error: "..." }
  - Toast 에러 메시지
validation:
  - 서버 사이드 유효성 검사
```

#### TC-ERROR-006: 네트워크 에러
```yaml
precondition: 네트워크 연결 끊김 (시뮬레이션)
steps:
  1. 상품 목록 페이지 접근
  2. API 요청 실패
expected:
  - Error Toast "네트워크 오류가 발생했습니다"
  - 재시도 버튼
validation:
  - SWR 에러 핸들링
```

#### TC-ERROR-007: 결제 실패
```yaml
url: /api/payment/bootpay/verify
method: POST
precondition: 로그인 + 부트페이 샌드박스 테스트 결제 실패 케이스
steps:
  1. 상품 결제 시도 (결제 실패 시뮬레이션)
expected:
  - HTTP 400 응답
  - Error Toast "결제가 거절되었습니다"
  - 결제 페이지 유지
validation:
  - 구매 내역 생성 안 됨
```

#### TC-ERROR-008: 파일 업로드 오류
```yaml
url: /api/upload
method: POST
precondition: 판매자 로그인 상태
steps:
  1. 10MB 초과 파일 업로드 시도
expected:
  - HTTP 400 응답
  - "파일 크기는 10MB를 초과할 수 없습니다" 에러 메시지
validation:
  - Supabase Storage 업로드 안 됨
```

#### TC-ERROR-009: 세션 만료
```yaml
precondition: 로그인 상태 + 세션 만료 (30일 후 시뮬레이션)
steps:
  1. 보호된 API 호출
expected:
  - HTTP 401 Unauthorized
  - 로그인 페이지로 리다이렉트
  - "세션이 만료되었습니다. 다시 로그인해주세요" Toast
validation:
  - 세션 쿠키 삭제
```

#### TC-ERROR-010: 동시 요청 충돌
```yaml
url: /api/wishlist
method: POST
precondition: 로그인 상태
steps:
  1. 동일 상품에 대해 위시리스트 추가 버튼 빠르게 2번 클릭
expected:
  - HTTP 409 Conflict (두 번째 요청)
  - Toast "이미 위시리스트에 추가되어 있습니다"
validation:
  - 중복 방지 (unique constraint)
```

---

## 🌐 역할 9: 다국어 테스트

#### TC-I18N-001: 언어 전환 (한국어 → 영어)
```yaml
url: /
method: GET
precondition: 없음
steps:
  1. 홈페이지 접근 (기본 한국어)
  2. 헤더의 언어 선택기 클릭
  3. "English" 선택
expected:
  - 페이지 텍스트가 영어로 변환
  - 쿠키에 NEXT_LOCALE=en 저장
  - 새로고침 시에도 영어 유지
validation:
  - messages/en.json 로드
```

#### TC-I18N-002: 언어 전환 (영어 → 한국어)
```yaml
url: /
method: GET
precondition: NEXT_LOCALE=en
steps:
  1. 언어 선택기에서 "한국어" 선택
expected:
  - 페이지 텍스트가 한국어로 변환
  - 쿠키에 NEXT_LOCALE=ko 저장
validation:
  - messages/ko.json 로드
```

#### TC-I18N-003: 번역 누락 체크
```yaml
precondition: 없음
steps:
  1. 모든 페이지를 영어로 접근
  2. 콘솔에서 번역 키 누락 경고 확인
expected:
  - 번역이 없는 경우 키 그대로 표시 (예: "common.submit")
  - 콘솔 경고: "Missing translation for key: ..."
validation:
  - next-intl의 onError 핸들러
```

#### TC-I18N-004: URL 경로 다국어
```yaml
url: /ko vs /en
method: GET
precondition: 없음
steps:
  1. /ko/marketplace 접근
  2. /en/marketplace 접근
expected:
  - 각각 한국어/영어로 렌더링
  - 언어 선택기에 현재 언어 표시
validation:
  - i18n/request.ts의 locale 파라미터
```

#### TC-I18N-005: 쿠키 저장 및 유지
```yaml
precondition: 없음
steps:
  1. 영어로 전환
  2. 브라우저 닫기
  3. 브라우저 재오픈 후 사이트 접근
expected:
  - 여전히 영어로 표시
  - 쿠키 만료 기간: 1년
validation:
  - NEXT_LOCALE 쿠키 확인
```

---

## 📱 역할 10: 반응형 & 접근성 테스트

#### TC-RESPONSIVE-001: 모바일 레이아웃 (375px)
```yaml
viewport: 375 x 667 (iPhone SE)
precondition: 없음
steps:
  1. 홈페이지 접근
  2. 마켓플레이스 접근
  3. 상품 상세 접근
  4. 대시보드 접근
expected:
  - 햄버거 메뉴 표시
  - 상품 카드 1열 배치
  - 모든 텍스트 가독성 확보
  - 버튼 터치 영역 44px 이상
validation:
  - 가로 스크롤 없음
```

#### TC-RESPONSIVE-002: 태블릿 레이아웃 (768px)
```yaml
viewport: 768 x 1024 (iPad)
precondition: 없음
steps:
  1. 각 주요 페이지 접근
expected:
  - 상품 카드 2열 배치
  - 사이드바 접기/펼치기 가능
  - 적절한 여백
validation:
  - 레이아웃 깨짐 없음
```

#### TC-RESPONSIVE-003: 데스크톱 레이아웃 (1280px)
```yaml
viewport: 1280 x 800
precondition: 없음
steps:
  1. 각 주요 페이지 접근
expected:
  - 상품 카드 3-4열 배치
  - 전체 네비게이션 표시
  - 사이드바 항상 표시
validation:
  - 레이아웃 최적화
```

#### TC-RESPONSIVE-004: 대형 모니터 (1920px)
```yaml
viewport: 1920 x 1080
precondition: 없음
steps:
  1. 각 주요 페이지 접근
expected:
  - 콘텐츠 최대 너비 제한 (max-w-7xl 등)
  - 가운데 정렬
  - 적절한 여백
validation:
  - 콘텐츠가 너무 넓게 퍼지지 않음
```

#### TC-A11Y-001: 키보드 네비게이션
```yaml
precondition: 없음
steps:
  1. Tab 키로 모든 인터랙티브 요소 탐색
  2. Enter/Space로 버튼 클릭
  3. Escape로 모달 닫기
  4. 화살표 키로 드롭다운 탐색
expected:
  - 모든 요소 접근 가능
  - 포커스 표시자 명확
  - 논리적인 탭 순서
validation:
  - tabIndex 적절히 설정
```

#### TC-A11Y-002: 스크린 리더 호환성
```yaml
precondition: 스크린 리더 활성화 (NVDA, VoiceOver)
steps:
  1. 각 페이지 탐색
  2. 폼 필드 입력
  3. 버튼 클릭
expected:
  - 모든 이미지 alt 텍스트
  - 폼 필드 레이블 연결
  - 버튼 목적 명확
  - 동적 콘텐츠 알림 (aria-live)
validation:
  - ARIA 속성 적절
```

#### TC-A11Y-003: 색상 대비
```yaml
precondition: 없음
steps:
  1. Lighthouse 접근성 검사 실행
  2. 색상 대비 검사
expected:
  - 텍스트/배경 대비 비율 4.5:1 이상 (AA 기준)
  - 대형 텍스트 3:1 이상
validation:
  - WCAG 2.1 AA 준수
```

---

## 📊 테스트 실행 및 보고

### 자동 테스트 실행
```bash
# Jest 단위 테스트
npm run test

# Playwright E2E 테스트
npm run test:e2e

# TestSprite 자동 테스트 (MCP)
# GitHub Copilot Chat에서 실행
```

---

## 🎯 TestSprite MCP 테스트 진행 현황

> TestSprite MCP를 통한 자동 테스트 진행 상태 추적
> 각 테스트 케이스는 고객 유형별 웹페이지 여정을 기반으로 합니다.

### 📋 테스트 상태 분류

| 상태 | 설명 | 아이콘 |
|------|------|--------|
| **Backlog** | 테스트 대기 (아직 실행 안 함) | ⬜ |
| **In Progress** | 테스트 진행 중 | 🔄 |
| **Review** | 테스트 완료, 검토 필요 | 🔍 |
| **Done** | 테스트 통과, 검증 완료 | ✅ |

---

### ✅ 완료 (Done) - 검증된 테스트 케이스

> 제작자 또는 자동화 테스트로 통과 확인된 항목

#### Jest 단위 테스트 (61개 통과)
- ✅ 컴포넌트: Button, Input, Card, Badge, Textarea
- ✅ 유틸리티: lib/utils.ts (cn 함수)
- ✅ 커스텀 훅: use-media-query

#### Playwright E2E 테스트 (160개 설정)
- ✅ app.spec.ts - 기본 페이지 테스트 (27개)
- ✅ auth.spec.ts - 인증 테스트 (14개)
- ✅ marketplace.spec.ts - 마켓플레이스 테스트 (16개)
- ✅ education.spec.ts - 교육 센터 테스트 (14개)
- ✅ community.spec.ts - 커뮤니티 테스트 (13개)
- ✅ responsive.spec.ts - 반응형 테스트 (17개)
- ✅ api.spec.ts - API 테스트 (25개)
- ✅ accessibility.spec.ts - 접근성 테스트 (19개)
- ✅ performance.spec.ts - 성능 테스트 (16개)

#### 통합 테스트
- ✅ Bootpay 결제 연동 (7종 결제 수단)
- ✅ Resend 이메일 API 연결 확인
- ✅ Supabase 데이터베이스 연결
- ✅ GitHub OAuth 인증

---

### 🔍 검토 (Review) - 수동 검증 필요

> 자동 테스트 통과했으나 수동 확인 필요한 항목

| TC ID | 테스트명 | 역할 | 상태 |
|-------|---------|------|------|
| TC-ADMIN-036 | Resend 도메인 상태 확인 | 관리자 | 🔍 도메인 인증 대기 |
| TC-ADMIN-037 | 테스트 이메일 발송 | 관리자 | 🔍 도메인 인증 후 검증 |

---

### 🔄 진행 중 (In Progress)

> 현재 TestSprite MCP로 테스트 진행 중인 항목

| TC ID | 테스트명 | 역할 | 진행률 |
|-------|---------|------|--------|
| - | - | - | - |

---

### ⬜ 대기 (Backlog) - TestSprite MCP 테스트 예정

> 고객 유형별 웹페이지 여정 테스트 (TestSprite MCP 자동 테스트 대상)

#### 방문자 (Visitor) 여정 테스트 - 22개
| TC ID | 테스트명 | 페이지 | 상태 |
|-------|---------|--------|------|
| TC-VISITOR-001 | 홈페이지 접근 | / | ⬜ |
| TC-VISITOR-002 | 네비게이션 메뉴 | / | ⬜ |
| TC-VISITOR-003 | 마켓플레이스 브라우징 | /marketplace | ⬜ |
| TC-VISITOR-004 | 교육 센터 브라우징 | /education | ⬜ |
| TC-VISITOR-005 | 교육 콘텐츠 상세 조회 | /education/[id] | ⬜ |
| TC-VISITOR-006 | 커뮤니티 브라우징 | /community | ⬜ |
| TC-VISITOR-007 | 커뮤니티 게시글 상세 조회 | /community/[id] | ⬜ |
| TC-VISITOR-008 | FAQ 페이지 | /faq | ⬜ |
| TC-VISITOR-009 | 정적 페이지 - 이용약관 | /terms | ⬜ |
| TC-VISITOR-010 | 정적 페이지 - 개인정보처리방침 | /privacy | ⬜ |
| TC-VISITOR-011 | 정적 페이지 - 환불정책 | /refund | ⬜ |
| TC-VISITOR-012 | 회원가입 - 이메일/비밀번호 | /auth/signup | ⬜ |
| TC-VISITOR-013 | 회원가입 - 유효성 검사 | /auth/signup | ⬜ |
| TC-VISITOR-014 | 회원가입 - GitHub OAuth | /auth/signup | ⬜ |
| TC-VISITOR-015 | 회원가입 - Google OAuth | /auth/signup | ⬜ |
| TC-VISITOR-016 | 로그인 - 이메일/비밀번호 | /auth/login | ⬜ |
| TC-VISITOR-017 | 로그인 - 잘못된 자격증명 | /auth/login | ⬜ |
| TC-VISITOR-018 | 로그인 - GitHub OAuth | /auth/login | ⬜ |
| TC-VISITOR-019 | 로그인 - Google OAuth | /auth/login | ⬜ |
| TC-VISITOR-020 | 비밀번호 찾기 | /auth/forgot-password | ⬜ |
| TC-VISITOR-021 | 비밀번호 재설정 | /auth/reset-password | ⬜ |
| TC-VISITOR-022 | 언어 전환 | / | ⬜ |

#### 구매자 (Buyer) 여정 테스트 - 53개
| TC ID | 테스트명 | 페이지 | 상태 |
|-------|---------|--------|------|
| TC-BUYER-001 | 상품 검색 - 키워드 | /marketplace | ⬜ |
| TC-BUYER-002 | 상품 검색 - 자동완성 | /marketplace | ⬜ |
| TC-BUYER-003~008 | 상품 필터링/정렬 | /marketplace | ⬜ |
| TC-BUYER-009 | 상품 상세 조회 | /marketplace/[id] | ⬜ |
| TC-BUYER-010 | 판매자 프로필 조회 | /seller/[id] | ⬜ |
| TC-BUYER-011~015 | 위시리스트 관리 | /dashboard/wishlist | ⬜ |
| TC-BUYER-016 | 무료 상품 다운로드 | /marketplace/[id] | ⬜ |
| TC-BUYER-019B~H | 부트페이 결제 (7종) | /marketplace/[id] | ⬜ |
| TC-BUYER-020~024 | 구매/다운로드 관리 | /dashboard/purchases | ⬜ |
| TC-BUYER-025~030 | 리뷰 관리 | /marketplace/[id] | ⬜ |
| TC-BUYER-110~112 | 환불 요청 | /dashboard/purchases | ⬜ |
| TC-BUYER-113~117 | 번들 구매 | /api/bundles | ⬜ |
| TC-BUYER-118~123 | 쿠폰 적용 | /api/coupons | ⬜ |

#### 판매자 (Seller) 여정 테스트 - 26개
| TC ID | 테스트명 | 페이지 | 상태 |
|-------|---------|--------|------|
| TC-SELLER-001~005 | 상품 등록 (5단계) | /dashboard/products/new | ⬜ |
| TC-SELLER-006~008 | 상품 관리 | /dashboard/products | ⬜ |
| TC-SELLER-009~011 | 판매 통계/내역 | /dashboard | ⬜ |
| TC-SELLER-012~013 | 정산 관리 | /dashboard/settlements | ⬜ |
| TC-SELLER-014~016 | 리뷰 관리 | /dashboard/products/[id] | ⬜ |
| TC-SELLER-017~020 | 튜토리얼/Q&A/통계 | /dashboard | ⬜ |
| TC-SELLER-021~023 | 번들 관리 | /api/bundles | ⬜ |
| TC-SELLER-024~026 | 쿠폰 관리 | /api/coupons | ⬜ |

#### 커뮤니티 활동자 여정 테스트 - 19개
| TC ID | 테스트명 | 페이지 | 상태 |
|-------|---------|--------|------|
| TC-COMMUNITY-001~003 | 게시글 CRUD | /community | ⬜ |
| TC-COMMUNITY-004~007 | 댓글/대댓글 | /community/[id] | ⬜ |
| TC-COMMUNITY-008~009 | 반응 (좋아요) | /community/[id] | ⬜ |
| TC-COMMUNITY-010~013 | 팔로우/피드 | /seller/[id] | ⬜ |
| TC-COMMUNITY-014~019 | Q&A/튜토리얼 좋아요 | /marketplace/[id] | ⬜ |

#### 관리자 (Admin) 여정 테스트 - 29개
| TC ID | 테스트명 | 페이지 | 상태 |
|-------|---------|--------|------|
| TC-ADMIN-001~003 | 대시보드/통계 | /admin | ⬜ |
| TC-ADMIN-004~007 | 사용자 관리 | /admin/users | ⬜ |
| TC-ADMIN-008~011 | 상품 관리 | /admin/products | ⬜ |
| TC-ADMIN-012~015 | 정산 관리 | /admin/settlements | ⬜ |
| TC-ADMIN-016~018 | 환불 관리 | /admin/refunds | ⬜ |
| TC-ADMIN-019~021 | 엑셀 내보내기 | /admin | ⬜ |
| TC-ADMIN-030~032 | 부트페이 관리 | /api/admin | ⬜ |
| TC-ADMIN-033~037 | 번들/쿠폰/이메일 | /api/admin | ⬜ |

---

### 수동 테스트 체크리스트
- [ ] 모든 역할별 테스트 케이스 실행
- [ ] 반응형 테스트 (모바일/태블릿/데스크톱)
- [ ] 크로스 브라우저 테스트 (Chrome, Firefox, Safari, Edge)
- [ ] 접근성 테스트 (스크린 리더, 키보드 내비게이션)
- [ ] 성능 테스트 (Lighthouse, Core Web Vitals)
- [ ] 보안 테스트 (OWASP Top 10)

### 테스트 보고서 생성
```bash
# Jest 커버리지 리포트
npm run test:coverage

# Playwright HTML 리포트
npx playwright show-report

# 엑셀 내보내기 (관리자 기능)
# /admin 페이지에서 "엑셀 내보내기" 버튼 클릭
```

---

## 📝 테스트 결과 요약

| 역할 | 테스트 케이스 수 | 우선순위 | 비고 |
|------|------------------|----------|------|
| 방문자 | 22 | 🔴 P0 | 첫 접속, 회원가입, 로그인 |
| 구매자 | 35 | 🔴 P0 | 부트페이 7종, 위시리스트, 리뷰 |
| 판매자 | 26 | 🟠 P1 | 상품/번들/쿠폰 관리 |
| 커뮤니티 | 15 | 🟠 P1 | 게시글, 댓글, 팔로우 |
| 일반 유저 | 18 | 🟡 P2 | 설정, 알림, 프로필 |
| 관리자 | 29 | 🟡 P2 | 관리 기능 전체 |
| API | 25 | 🟢 P3 | 공개/인증 API |
| 시스템 | 3 | 🟢 P3 | Health, Scheduler, Webhook |
| 업로드 | 4 | 🟢 P3 | Cloudinary 이미지 |
| 검색/추천 | 3 | 🟢 P3 | 자동완성, 추천 |
| 피드 | 1 | 🟢 P3 | 팔로잉 피드 |
| 반응형/접근성 | 4 | 🟢 P3 | UI/UX |
| **총계** | **185** | - | Session 60 업데이트 |

---

## 🔄 테스트 자동화 로드맵

### Phase 1: 단위 테스트 (Jest)
- [x] 컴포넌트 테스트 (Button, Input, Card, Badge, Textarea)
- [x] 유틸리티 함수 테스트 (lib/utils.ts)
- [x] 커스텀 훅 테스트 (use-media-query)
- [ ] API 라우트 핸들러 테스트

### Phase 2: E2E 테스트 (Playwright)
- [x] 기본 E2E 테스트 (app.spec.ts)
- [ ] 구매 플로우 E2E
- [ ] 판매자 플로우 E2E
- [ ] 관리자 플로우 E2E

### Phase 3: 통합 테스트
- [x] 결제 통합 테스트 (Bootpay - 7종 결제 수단)
- [ ] OAuth 통합 테스트 (GitHub, Google)
- [ ] 이메일 전송 테스트 (Resend)

### Phase 4: 성능 & 보안 테스트
- [ ] Lighthouse CI
- [ ] OWASP ZAP
- [ ] 로드 테스트 (k6)

---

## 🆕 추가 테스트 케이스 (Session 60)

> 누락되었던 중요 테스트 케이스 추가

### 🖼️ Cloudinary 이미지 업로드 테스트

#### TC-UPLOAD-001: Cloudinary 이미지 업로드 (상품 썸네일)
```yaml
url: /api/upload/cloudinary
method: POST
precondition: 판매자 로그인 상태
steps:
  1. 상품 등록 페이지에서 썸네일 이미지 선택
  2. 파일 업로드 (최대 5MB)
expected:
  - HTTP 200 응답
  - Cloudinary URL 반환
  - 이미지 최적화 (WebP 변환, 리사이즈)
validation:
  - 800x600 리사이즈
  - WebP 포맷 변환
```

#### TC-UPLOAD-002: Cloudinary 갤러리 이미지 업로드
```yaml
url: /api/upload/cloudinary
method: POST
precondition: 판매자 로그인 상태
steps:
  1. 상품 등록 페이지에서 갤러리 이미지 선택 (최대 5개)
  2. 여러 파일 업로드
expected:
  - 각 이미지별 Cloudinary URL 반환
  - 1200x900 리사이즈
validation:
  - 이미지 배열 반환
```

#### TC-UPLOAD-003: Cloudinary 프로필 이미지 업로드
```yaml
url: /api/upload/cloudinary
method: POST
precondition: 로그인 상태
steps:
  1. 설정 페이지에서 프로필 이미지 변경
  2. 파일 업로드
expected:
  - 400x400 정사각형 크롭
  - WebP 변환
validation:
  - 프로필 이미지 URL 업데이트
```

#### TC-UPLOAD-004: Cloudinary 이미지 삭제
```yaml
url: /api/upload/delete
method: DELETE
precondition: 로그인 상태 + 본인 이미지
body:
  publicId: "vibe-olympics/products/xxx"
steps:
  1. 이미지 삭제 API 호출
expected:
  - HTTP 200 응답
  - Cloudinary에서 이미지 삭제
validation:
  - 이미지 URL 접근 불가
```

### 🏥 Health Check & 시스템 테스트

#### TC-SYSTEM-001: Health Check API
```yaml
url: /api/health
method: GET
precondition: 없음
steps:
  1. GET /api/health 호출
expected:
  - HTTP 200 응답
  - status: "ok"
  - timestamp 포함
validation:
  - 서버 정상 작동 확인
```

#### TC-SYSTEM-002: 콘텐츠 스케줄러
```yaml
url: /api/content/scheduler
method: GET
precondition: Cron Job 또는 수동 호출
steps:
  1. GET /api/content/scheduler 호출
expected:
  - HTTP 200 응답
  - 예약된 콘텐츠 발행 처리
validation:
  - SCHEDULED 상태 콘텐츠 → PUBLISHED 변경
```

#### TC-SYSTEM-003: 부트페이 웹훅 수신
```yaml
url: /api/webhook
method: POST
precondition: 부트페이 웹훅 설정
body:
  event: "결제완료"
  receipt_id: "xxx"
steps:
  1. 부트페이에서 웹훅 전송
expected:
  - HTTP 200 응답
  - Purchase 상태 업데이트
validation:
  - 중복 웹훅 처리 방지
```

### 📰 Feed API 테스트

#### TC-FEED-001: 팔로잉 피드 조회
```yaml
url: /api/feed
method: GET
precondition: 로그인 + 팔로잉한 판매자 존재
steps:
  1. GET /api/feed 호출
expected:
  - HTTP 200 응답
  - 팔로우한 판매자의 최신 상품 목록
  - 30일 이내 상품만 표시
validation:
  - 페이지네이션 지원
```

### 🔍 검색 API 테스트

#### TC-SEARCH-001: 검색 자동완성
```yaml
url: /api/search/suggestions?q={query}
method: GET
precondition: 없음
steps:
  1. GET /api/search/suggestions?q=design 호출
expected:
  - HTTP 200 응답
  - 최대 5개 제안
  - 키워드 볼드 표시
validation:
  - 200ms 이내 응답
```

### 🎯 추천 API 테스트

#### TC-RECOMMEND-001: 개인화 상품 추천
```yaml
url: /api/recommendations?type=products
method: GET
precondition: 로그인 상태
steps:
  1. GET /api/recommendations?type=products 호출
expected:
  - HTTP 200 응답
  - 사용자 관심사 기반 추천
  - 추천 이유 포함
validation:
  - 최소 4개 상품 반환
```

#### TC-RECOMMEND-002: 유사 상품 추천
```yaml
url: /api/recommendations?type=similar&productId={id}
method: GET
precondition: 없음
steps:
  1. 상품 상세 페이지에서 유사 상품 API 호출
expected:
  - HTTP 200 응답
  - 같은 카테고리/태그 기반 추천
validation:
  - 최소 4개 상품 반환
```

---

## 📦 Session 64: 컬렉션/번들/아티스트/미리보기 테스트

> **추가일**: 2025-12-10
> **테스트 수**: 25개

### 🗂️ 컬렉션 API 테스트

#### TC-COLLECTION-001: 컬렉션 목록 조회
```yaml
url: /api/collections
method: GET
precondition: 없음
steps:
  1. GET /api/collections 호출
expected:
  - HTTP 200 응답
  - 공개 컬렉션 목록 반환
  - 각 컬렉션에 items 배열 포함
validation:
  - pagination 지원 (page, limit)
  - type 필터 지원 (SERIES, BUNDLE, PLAYLIST, CURATED)
```

#### TC-COLLECTION-002: 컬렉션 상세 조회
```yaml
url: /api/collections/{id}
method: GET
precondition: 컬렉션 존재
steps:
  1. GET /api/collections/{id} 호출
expected:
  - HTTP 200 응답
  - 컬렉션 상세 정보
  - items 배열에 product 정보 포함
  - bundlePrice, bundleDiscount 포함
validation:
  - 비공개 컬렉션은 소유자만 접근 가능
```

#### TC-COLLECTION-003: 컬렉션 생성
```yaml
url: /api/collections
method: POST
precondition: 판매자로 로그인
body:
  name: "테스트 컬렉션"
  description: "설명"
  type: "BUNDLE"
  isPublic: true
  bundlePrice: 29.99
  bundleDiscount: 20
  productIds: ["prod1", "prod2"]
steps:
  1. POST /api/collections 호출
expected:
  - HTTP 201 응답
  - 컬렉션 생성 성공
  - CollectionItem 자동 생성
validation:
  - 번들 가격이 개별 합계보다 할인 적용
```

#### TC-COLLECTION-004: 컬렉션 수정
```yaml
url: /api/collections/{id}
method: PATCH
precondition: 컬렉션 소유자로 로그인
body:
  name: "수정된 이름"
  bundleDiscount: 30
steps:
  1. PATCH /api/collections/{id} 호출
expected:
  - HTTP 200 응답
  - 컬렉션 업데이트 성공
validation:
  - 소유자만 수정 가능
```

#### TC-COLLECTION-005: 컬렉션 삭제
```yaml
url: /api/collections/{id}
method: DELETE
precondition: 컬렉션 소유자로 로그인
steps:
  1. DELETE /api/collections/{id} 호출
expected:
  - HTTP 200 응답
  - 컬렉션 및 CollectionItem 삭제
validation:
  - 소유자만 삭제 가능
  - 연결된 상품은 삭제되지 않음
```

### 💰 번들 구매 API 테스트

#### TC-BUNDLE-001: 번들 구매 생성
```yaml
url: /api/collections/purchase
method: POST
precondition: 로그인 상태
body:
  collectionId: "{bundleId}"
  paymentMethod: "card"
steps:
  1. POST /api/collections/purchase 호출
expected:
  - HTTP 200 응답
  - paymentIntent 또는 결제 URL 반환
  - originalPrice, discountAmount 포함
validation:
  - 번들 할인이 올바르게 적용
  - 이미 소유한 상품은 제외
```

#### TC-BUNDLE-002: 번들 구매 검증
```yaml
url: /api/collections/purchase/verify
method: POST
precondition: 결제 완료 상태
body:
  paymentId: "{paymentId}"
  collectionId: "{collectionId}"
steps:
  1. POST /api/collections/purchase/verify 호출
expected:
  - HTTP 200 응답
  - 모든 번들 상품에 대한 Purchase 생성
  - bundleDiscountApplied: true
validation:
  - 각 상품별 Purchase 레코드 생성
  - bundleId 필드 설정됨
```

#### TC-BUNDLE-003: 부분 소유 번들 가격 계산
```yaml
url: /api/collections/{id}/price
method: GET
precondition: 일부 상품 이미 구매한 사용자
steps:
  1. GET /api/collections/{id}/price 호출
expected:
  - HTTP 200 응답
  - 미소유 상품만 가격 계산
  - 조정된 할인율 적용
validation:
  - 이미 소유한 상품 목록 표시
  - 추가 결제 금액 정확히 계산
```

### 🎨 아티스트 API 테스트

#### TC-ARTIST-001: 아티스트 목록 조회
```yaml
url: /api/artists
method: GET
precondition: 없음
steps:
  1. GET /api/artists 호출
expected:
  - HTTP 200 응답
  - 판매자 또는 아티스트 프로필 사용자 목록
  - productCount, totalSales 포함
validation:
  - artistType 필터 지원
  - productType 필터 지원
  - 검색 지원 (이름, 바이오)
```

#### TC-ARTIST-002: 아티스트 프로필 조회 (slug)
```yaml
url: /api/artists/{slug}
method: GET
precondition: 아티스트 slug 존재
steps:
  1. GET /api/artists/john-doe 호출
expected:
  - HTTP 200 응답
  - 아티스트 상세 프로필
  - products 배열
  - collections 배열
  - stats (totalProducts, totalSales, averageRating)
validation:
  - socialLinks JSON 파싱
  - artistLanguages 배열 반환
```

#### TC-ARTIST-003: 아티스트 프로필 수정
```yaml
url: /api/artists/profile
method: PATCH
precondition: 로그인 상태
body:
  artistBio: "새로운 바이오"
  artistType: "MUSICIAN"
  artistLocation: "Seoul, Korea"
  socialLinks: {"twitter": "@artist"}
steps:
  1. PATCH /api/artists/profile 호출
expected:
  - HTTP 200 응답
  - 프로필 업데이트 성공
validation:
  - slug 자동 생성 (없는 경우)
  - socialLinks JSON 저장
```

#### TC-ARTIST-004: 아티스트 검증 요청
```yaml
url: /api/artists/verify
method: POST
precondition: 아티스트 프로필 완성
body:
  portfolioUrl: "https://portfolio.com"
  verificationDocs: ["doc1.pdf"]
steps:
  1. POST /api/artists/verify 호출
expected:
  - HTTP 200 응답
  - 검증 요청 접수
validation:
  - isVerifiedArtist 상태 변경 없음 (관리자 승인 필요)
```

### 🎬 미리보기 API 테스트

#### TC-PREVIEW-001: 책 미리보기 조회
```yaml
url: /api/preview/{productSlug}?type=book
method: GET
precondition: BOOK 타입 상품 존재
steps:
  1. GET /api/preview/my-ebook 호출
expected:
  - HTTP 200 응답
  - previewChapters 배열 (무료 챕터)
  - totalChapters 수
  - previewPercentage
validation:
  - 유료 챕터 내용 노출 안됨
  - 목차 정보 포함
```

#### TC-PREVIEW-002: 비디오 시리즈 미리보기 조회
```yaml
url: /api/preview/{productSlug}?type=video
method: GET
precondition: VIDEO_SERIES 타입 상품 존재
steps:
  1. GET /api/preview/my-course 호출
expected:
  - HTTP 200 응답
  - trailerUrl (예고편)
  - previewEpisodes 배열 (무료 에피소드)
  - totalEpisodes 수
validation:
  - 유료 에피소드 URL 노출 안됨
  - 썸네일 포함
```

#### TC-PREVIEW-003: 음악 앨범 미리보기 조회
```yaml
url: /api/preview/{productSlug}?type=music
method: GET
precondition: MUSIC_ALBUM 타입 상품 존재
steps:
  1. GET /api/preview/my-album 호출
expected:
  - HTTP 200 응답
  - tracks 배열 (30초 미리듣기 URL)
  - totalTracks 수
  - previewDuration (각 트랙 30초)
validation:
  - 전체 트랙 URL 노출 안됨
  - 트랙 순서 정보 포함
```

#### TC-PREVIEW-004: 디지털 상품 미리보기 조회
```yaml
url: /api/preview/{productSlug}?type=digital
method: GET
precondition: DIGITAL_PRODUCT 타입 상품 존재
steps:
  1. GET /api/preview/my-template 호출
expected:
  - HTTP 200 응답
  - previewImages 배열
  - previewDescription
  - fileTypes, fileCount
validation:
  - 다운로드 URL 노출 안됨
  - 워터마크된 이미지만 제공
```

#### TC-PREVIEW-005: 구매자 전체 콘텐츠 접근
```yaml
url: /api/preview/{productSlug}?full=true
method: GET
precondition: 해당 상품 구매 완료
steps:
  1. GET /api/preview/my-ebook?full=true 호출
expected:
  - HTTP 200 응답
  - 모든 챕터/에피소드/트랙 접근
  - 다운로드 URL 포함
validation:
  - Purchase 레코드 확인
  - 미구매자는 403 응답
```

### 🖼️ 컬렉션 UI 컴포넌트 테스트

#### TC-COLLECTION-UI-001: 컬렉션 카드 렌더링
```yaml
component: CollectionCard
precondition: 컬렉션 데이터 존재
steps:
  1. CollectionCard 컴포넌트 렌더링
expected:
  - 컬렉션 이름, 설명 표시
  - 상품 수 표시
  - 타입 배지 표시 (SERIES, BUNDLE 등)
  - 번들 가격 및 할인율 표시
validation:
  - 클릭 시 상세 모달 열림
```

#### TC-COLLECTION-UI-002: 번들 가격 표시
```yaml
component: BundlePriceDisplay
precondition: 번들 컬렉션 데이터
steps:
  1. BundlePriceDisplay 컴포넌트 렌더링
expected:
  - 원가 (취소선)
  - 할인가 (강조)
  - 할인율 배지
  - 절약 금액 표시
validation:
  - 가격 포맷 올바름 (통화 기호)
```

### 🎨 아티스트 UI 테스트

#### TC-ARTIST-UI-001: 아티스트 프로필 페이지
```yaml
url: /artists/{slug}
method: GET
precondition: 아티스트 slug 존재
steps:
  1. /artists/john-doe 페이지 접근
expected:
  - 프로필 헤더 (이미지, 이름, 바이오)
  - 통계 카드 (상품 수, 판매량, 평점)
  - 탭 네비게이션 (상품, 컬렉션, 정보)
  - 소셜 링크 버튼
validation:
  - 검증 배지 표시 (isVerifiedArtist)
  - 반응형 레이아웃
```

#### TC-ARTIST-UI-002: 아티스트 목록 페이지
```yaml
url: /artists
method: GET
precondition: 없음
steps:
  1. /artists 페이지 접근
expected:
  - 아티스트 그리드 표시
  - 필터 (아티스트 타입, 상품 타입)
  - 검색 입력 필드
  - 페이지네이션
validation:
  - 필터 적용 시 목록 업데이트
  - 검색 결과 정확
```

### 🎬 미리보기 UI 테스트

#### TC-PREVIEW-UI-001: 책 미리보기 모달
```yaml
component: BookPreview
precondition: BOOK 상품 데이터
steps:
  1. 미리보기 버튼 클릭
  2. BookPreview 모달 열림
expected:
  - 목차 사이드바
  - 챕터 콘텐츠 뷰어
  - 무료/유료 챕터 구분 표시
  - "전체 구매" 버튼
validation:
  - 유료 챕터 클릭 시 구매 유도
```

#### TC-PREVIEW-UI-002: 비디오 미리보기 플레이어
```yaml
component: VideoPreview
precondition: VIDEO_SERIES 상품 데이터
steps:
  1. 미리보기 버튼 클릭
  2. VideoPreview 모달 열림
expected:
  - 비디오 플레이어
  - 에피소드 목록
  - 무료 에피소드 재생 가능
  - "전체 구매" 버튼
validation:
  - 유료 에피소드 잠금 아이콘
```

#### TC-PREVIEW-UI-003: 음악 미리보기 플레이어
```yaml
component: MusicPreview
precondition: MUSIC_ALBUM 상품 데이터
steps:
  1. 미리보기 버튼 클릭
  2. MusicPreview 모달 열림
expected:
  - 트랙 목록
  - 30초 미리듣기 재생
  - 진행바 표시
  - "앨범 구매" 버튼
validation:
  - 30초 후 자동 정지
```

---

## 🔍 Session 65: 검색/필터 UX 개선 테스트

> **추가일**: 2025-12-10
> **테스트 수**: 10개

### 검색 자동완성 테스트

#### TC-S65-SEARCH-001: 카테고리 포함 자동완성
```yaml
url: /api/search/suggestions?q=템플릿
method: GET
precondition: 없음
steps:
  1. GET /api/search/suggestions?q=템플릿 호출
expected:
  - HTTP 200 응답
  - products, categories 섹션 포함
  - 검색어와 일치하는 카테고리 반환
validation:
  - 최대 5개 상품, 3개 카테고리 반환
```

#### TC-S65-SEARCH-002: 키보드 네비게이션
```yaml
url: /marketplace
method: UI
precondition: 검색창 포커스
steps:
  1. 검색어 입력
  2. 화살표 키로 자동완성 항목 이동
  3. Enter로 선택
expected:
  - 화살표 위/아래로 하이라이트 이동
  - Enter로 선택된 항목 적용
  - Escape로 닫기
validation:
  - aria-selected 속성 정확히 설정
```

#### TC-S65-FILTER-001: AI 생성 필터
```yaml
url: /marketplace?isAIGenerated=true
method: GET
precondition: 없음
steps:
  1. AI 생성 필터 체크박스 클릭
expected:
  - URL에 isAIGenerated=true 추가
  - AI 생성 상품만 표시
validation:
  - Sparkles 아이콘 표시
```

#### TC-S65-SORT-001: 다운로드순 정렬
```yaml
url: /marketplace?sortBy=downloadCount
method: GET
precondition: 없음
steps:
  1. 정렬 옵션에서 "다운로드순" 선택
expected:
  - downloadCount 내림차순 정렬
validation:
  - 다운로드 수 표시
```

---

## 💳 Session 66: 정기 구독 결제 시스템 테스트

> **추가일**: 2025-12-11
> **테스트 수**: 18개

### 구독 플랜 API 테스트

#### TC-S66-PLAN-001: 구독 플랜 목록 조회
```yaml
url: /api/subscriptions/plans
method: GET
precondition: 없음
steps:
  1. GET /api/subscriptions/plans 호출
expected:
  - HTTP 200 응답
  - 월간/연간 플랜 목록
  - 가격, 혜택, 트라이얼 정보 포함
validation:
  - isActive: true 플랜만 반환
```

#### TC-S66-PLAN-002: 구독 플랜 생성 (관리자)
```yaml
url: /api/subscriptions/plans
method: POST
precondition: 관리자 로그인
body:
  name: "프리미엄 월간"
  interval: "monthly"
  price: 9900
  trialDays: 7
steps:
  1. POST /api/subscriptions/plans 호출
expected:
  - HTTP 201 응답
  - 플랜 생성 완료
validation:
  - 관리자만 생성 가능
```

### 구독 관리 API 테스트

#### TC-S66-SUB-001: 구독 생성
```yaml
url: /api/subscriptions
method: POST
precondition: 로그인 상태, 빌링키 존재
body:
  planId: "{planId}"
  billingKey: "{billingKey}"
steps:
  1. POST /api/subscriptions 호출
expected:
  - HTTP 201 응답
  - 구독 생성 및 첫 결제 처리
  - ACTIVE 또는 TRIAL 상태
validation:
  - SubscriptionPayment 레코드 생성
```

#### TC-S66-SUB-002: 빌링키 발급
```yaml
url: /api/subscriptions/billing
method: POST
precondition: 로그인 상태
body:
  cardNumber: "4242424242424242"
  expiryMonth: "12"
  expiryYear: "25"
steps:
  1. POST /api/subscriptions/billing 호출
expected:
  - HTTP 200 응답
  - 부트페이 빌링키 반환
validation:
  - 안전한 키 저장
```

#### TC-S66-SUB-003: 자동 갱신 처리
```yaml
url: /api/subscriptions/renew
method: POST
precondition: 만료된 ACTIVE 구독 존재
steps:
  1. POST /api/subscriptions/renew (Cron) 호출
expected:
  - HTTP 200 응답
  - 대상 구독 자동 결제
  - 기간 연장
validation:
  - 결제 실패 시 PAST_DUE 상태
```

#### TC-S66-RETRY-001: 결제 재시도
```yaml
url: /api/subscriptions/retry
method: POST
precondition: 결제 실패 구독 존재
steps:
  1. POST /api/subscriptions/retry 호출
expected:
  - HTTP 200 응답
  - 1일/3일/7일 스케줄 재시도
validation:
  - 3회 실패 시 EXPIRED 상태
```

---

## 🔔 Session 67: 알림 시스템 고도화 테스트

> **추가일**: 2025-12-12
> **테스트 수**: 14개

### 이메일 템플릿 테스트

#### TC-S67-EMAIL-001: 구독 환영 이메일
```yaml
url: /api/subscriptions
method: POST (트리거)
precondition: 구독 생성
steps:
  1. 구독 생성 API 호출
expected:
  - 구독 환영 이메일 발송
  - 플랜명, 혜택 정보 포함
validation:
  - 이메일 발송 로그 확인
```

#### TC-S67-EMAIL-002: 결제 실패 알림 이메일
```yaml
url: /api/subscriptions/renew
method: POST (트리거)
precondition: 결제 실패
steps:
  1. 결제 실패 발생
expected:
  - 결제 실패 안내 이메일 발송
  - 재시도 일정, 결제수단 업데이트 링크 포함
validation:
  - paymentFailed 알림 설정 확인
```

### 알림 설정 API 테스트

#### TC-S67-SETTINGS-001: 알림 설정 조회/수정
```yaml
url: /api/user/notification-settings
method: GET/PATCH
precondition: 로그인 상태
steps:
  1. GET으로 현재 설정 조회
  2. PATCH로 설정 수정
expected:
  - 이메일/푸시/인앱 알림 옵션 포함
  - subscriptionReminder, paymentFailed 옵션 확인
validation:
  - 옵션별 토글 동작
```

---

## 🔌 Session 68: 실시간 알림 웹소켓 테스트

> **추가일**: 2025-12-12
> **테스트 수**: 12개

### Socket.io 연결 테스트

#### TC-S68-SOCKET-001: 소켓 연결
```yaml
url: /api/socket
method: WebSocket
precondition: 로그인 상태
steps:
  1. Socket.io 연결 시도
  2. 사용자 인증 (userId 전송)
expected:
  - 연결 성공
  - user:{userId} 룸 참여
validation:
  - 연결 상태 확인
```

#### TC-S68-SOCKET-002: 실시간 알림 수신
```yaml
url: WebSocket
method: Event
precondition: 소켓 연결됨
steps:
  1. 서버에서 notification:new 이벤트 발송
expected:
  - 클라이언트에서 알림 수신
  - 알림 목록 자동 업데이트
validation:
  - React Query 캐시 무효화
```

#### TC-S68-SOCKET-003: 알림 읽음 처리
```yaml
url: WebSocket
method: Event
precondition: 소켓 연결됨
steps:
  1. notification:read 이벤트 발송
expected:
  - 알림 읽음 상태 업데이트
  - unread-count:update 이벤트 수신
validation:
  - 읽지 않은 수 감소
```

---

## 🖼️ Session 69-70: 이미지 최적화 & 타입 오류 수정 테스트

> **추가일**: 2025-12-12
> **테스트 수**: 8개

### next/image 최적화 테스트

#### TC-S70-IMAGE-001: 상품 썸네일 최적화
```yaml
url: /marketplace
method: GET
precondition: 상품 목록 존재
steps:
  1. 마켓플레이스 페이지 로드
expected:
  - next/image 컴포넌트 사용
  - WebP/AVIF 자동 변환
  - Lazy loading 적용
validation:
  - LCP 성능 개선
```

#### TC-S70-IMAGE-002: 프로필 이미지 최적화
```yaml
url: /dashboard/settings
method: GET
precondition: 로그인 상태
steps:
  1. 설정 페이지 로드
expected:
  - 프로필 이미지 최적화 로드
  - sizes 속성 적절히 설정
validation:
  - 적절한 크기 이미지 로드
```

---

## 📊 Session 71: Google Analytics 4 연동 테스트

> **추가일**: 2025-12-12
> **테스트 수**: 10개

### GA4 이벤트 트래킹 테스트

#### TC-S71-GA-001: 페이지 뷰 트래킹
```yaml
url: /*
method: GET
precondition: GA_MEASUREMENT_ID 설정
steps:
  1. 페이지 이동
expected:
  - page_view 이벤트 전송
  - page_path, page_title 포함
validation:
  - GA4 디버그 뷰 확인
```

#### TC-S71-GA-002: 상품 조회 트래킹
```yaml
url: /marketplace/{id}
method: GET
precondition: 상품 존재
steps:
  1. 상품 상세 페이지 접근
expected:
  - view_item 이벤트 전송
  - item_id, item_name, price, category 포함
validation:
  - GA4 이벤트 파라미터 확인
```

#### TC-S71-GA-003: 구매 완료 트래킹
```yaml
url: /marketplace/{id}
method: POST (결제 완료)
precondition: 결제 성공
steps:
  1. 구매 완료
expected:
  - purchase 이벤트 전송
  - transaction_id, value, currency, items 포함
validation:
  - GA4 이커머스 전환 추적
```

---

## 📱 Session 72-73: PWA 오프라인 지원 강화 테스트

> **추가일**: 2025-12-12
> **테스트 수**: 15개

### Service Worker 테스트

#### TC-S73-SW-001: API 캐싱 (Network First)
```yaml
url: /api/products
method: GET
precondition: Service Worker 등록
steps:
  1. 온라인 상태에서 API 호출
  2. 오프라인 전환
  3. 동일 API 재호출
expected:
  - 캐시된 응답 반환
  - 5분 TTL 적용
validation:
  - Cache Storage 확인
```

#### TC-S73-SW-002: 이미지 캐싱 (Cache First)
```yaml
url: /images/*
method: GET
precondition: Service Worker 등록
steps:
  1. 이미지 로드
  2. 오프라인 전환
  3. 동일 이미지 재로드
expected:
  - 캐시된 이미지 반환
  - 백그라운드 업데이트
validation:
  - image-cache 확인
```

### 오프라인 UI 테스트

#### TC-S73-OFFLINE-001: 오프라인 배너 표시
```yaml
url: /*
method: UI
precondition: 오프라인 상태
steps:
  1. 네트워크 연결 끊기
expected:
  - 오프라인 상태 배너 표시
  - "동기화" 버튼 표시
validation:
  - navigator.onLine 감지
```

#### TC-S73-PWA-001: PWA 설치 프롬프트
```yaml
url: /*
method: UI
precondition: beforeinstallprompt 이벤트
steps:
  1. 설치 프롬프트 조건 충족
expected:
  - 설치 안내 UI 표시
  - Android/iOS 별도 안내
validation:
  - standalone 모드 아님
```

---

## 🧪 Session 74: A/B 테스트 프레임워크 테스트

> **추가일**: 2025-12-11
> **테스트 수**: 16개

### A/B 테스트 API 테스트

#### TC-S74-AB-001: 변형 할당
```yaml
url: /api/ab-test/assign
method: POST
precondition: 실험 진행 중
body:
  experimentKey: "homepage_cta"
steps:
  1. POST /api/ab-test/assign 호출
expected:
  - HTTP 200 응답
  - 변형 ID 반환 (가중치 기반)
  - ExperimentAssignment 생성
validation:
  - 동일 사용자 동일 변형 반환
```

#### TC-S74-AB-002: 이벤트 추적
```yaml
url: /api/ab-test/track
method: POST
precondition: 변형 할당됨
body:
  experimentKey: "homepage_cta"
  eventType: "conversion"
  metadata: { revenue: 50000 }
steps:
  1. POST /api/ab-test/track 호출
expected:
  - HTTP 200 응답
  - ExperimentEvent 생성
validation:
  - view, click, conversion, revenue 타입
```

#### TC-S74-AB-003: 실험 통계 조회
```yaml
url: /api/ab-test/experiments/{id}
method: GET
precondition: 실험 존재
steps:
  1. GET /api/ab-test/experiments/{id} 호출
expected:
  - HTTP 200 응답
  - 변형별 전환율, 개선율, 신뢰도 포함
validation:
  - 95% 이상 신뢰도에서 승자 판정
```

---

## 📧 Session 75: 결제/환불 이메일 알림 테스트

> **추가일**: 2025-12-11
> **테스트 수**: 10개

### 결제 알림 테스트

#### TC-S75-EMAIL-001: 결제 영수증 이메일
```yaml
url: /api/payment/bootpay/verify
method: POST (트리거)
precondition: 결제 완료
steps:
  1. 결제 검증 API 호출
expected:
  - 구매자에게 영수증 이메일 발송
  - 상품명, 금액, 결제수단, 거래번호 포함
validation:
  - 이메일 발송 성공
```

#### TC-S75-EMAIL-002: 판매자 판매 알림
```yaml
url: /api/payment/bootpay/verify
method: POST (트리거)
precondition: 결제 완료
steps:
  1. 결제 검증 API 호출
expected:
  - 판매자에게 판매 알림 이메일 발송
validation:
  - 판매자 이메일 확인
```

### 환불 알림 테스트

#### TC-S75-REFUND-001: 환불 요청 접수 알림
```yaml
url: /api/refunds
method: POST
precondition: 구매 내역 존재
steps:
  1. POST /api/refunds 호출
expected:
  - 환불 요청 접수 이메일 발송
validation:
  - 요청 번호 포함
```

#### TC-S75-REFUND-002: 환불 완료/거절 알림
```yaml
url: /api/refunds/{id}
method: PATCH
precondition: 환불 요청 존재
steps:
  1. PATCH로 승인/거절 처리
expected:
  - 구매자에게 결과 이메일 발송
  - 판매자에게 환불 알림 (승인 시)
validation:
  - 상태별 적절한 이메일
```

---

## 📈 Session 76: 대시보드 기능 강화 테스트

> **추가일**: 2025-12-11
> **테스트 수**: 15개

### 관리자 대시보드 API 테스트

#### TC-S76-ADMIN-001: 종합 통계 조회
```yaml
url: /api/admin/dashboard
method: GET
precondition: 관리자 로그인
steps:
  1. GET /api/admin/dashboard 호출
expected:
  - HTTP 200 응답
  - overview, period, refunds, topSellers, dailyTrend 포함
validation:
  - 관리자만 접근 가능
```

#### TC-S76-STATS-001: 상품별 통계 조회
```yaml
url: /api/dashboard/product-stats
method: GET
precondition: 판매자 로그인
steps:
  1. GET /api/dashboard/product-stats 호출
expected:
  - HTTP 200 응답
  - 상품별 조회수, 판매량, 전환율 포함
validation:
  - 본인 상품만 조회
```

### 실시간 위젯 테스트

#### TC-S76-WIDGET-001: 실시간 판매 알림 위젯
```yaml
url: /dashboard
method: UI
precondition: 판매자 로그인, Socket 연결
steps:
  1. 판매 발생
expected:
  - 실시간 판매 알림 표시
  - sale:new 이벤트 수신
validation:
  - 위젯 자동 업데이트
```

---

## 🔬 Session 77: A/B 테스트 관리 대시보드 테스트

> **추가일**: 2025-12-11
> **테스트 수**: 12개

### A/B 테스트 관리 API 테스트

#### TC-S77-AB-ADMIN-001: 대시보드 통계
```yaml
url: /api/admin/ab-test
method: GET
precondition: 관리자 로그인
steps:
  1. GET /api/admin/ab-test 호출
expected:
  - HTTP 200 응답
  - summary, recentExperiments, topPerformers, trends 포함
validation:
  - 전체 실험 통계
```

#### TC-S77-AB-ADMIN-002: 일괄 작업
```yaml
url: /api/admin/ab-test/bulk
method: POST
precondition: 관리자 로그인
body:
  action: "start"
  experimentIds: ["exp1", "exp2"]
steps:
  1. POST /api/admin/ab-test/bulk 호출
expected:
  - HTTP 200 응답
  - 선택한 실험 일괄 상태 변경
validation:
  - start, pause, resume, archive, delete 액션
```

---

## 🛠️ Session 78: 코드 품질 개선 테스트

> **추가일**: 2025-12-12
> **테스트 수**: 5개

### force-dynamic 테스트

#### TC-S78-DYNAMIC-001: API 동적 렌더링
```yaml
url: /api/*
method: GET
precondition: 배포 환경
steps:
  1. API 엔드포인트 호출
expected:
  - 동적 렌더링 (캐싱 없음)
  - force-dynamic 설정 적용
validation:
  - 빌드 시 정적 생성 안됨
```

### logger 유틸리티 테스트

#### TC-S78-LOGGER-001: 개발 환경 로깅
```yaml
url: N/A
method: Utility
precondition: NODE_ENV=development
steps:
  1. logger.log() 호출
expected:
  - 콘솔에 로그 출력
validation:
  - 프로덕션에서는 출력 안됨
```

---

## 🔒 Session 80: SEO 자동화 & 운영 도구 테스트

> **추가일**: 2025-12-12
> **테스트 수**: 20개

### Rate Limiting 테스트

#### TC-S80-RATE-001: 인증 API 속도 제한
```yaml
url: /api/auth/signup
method: POST
precondition: 없음
steps:
  1. 11회 연속 API 호출
expected:
  - 10회까지 성공
  - 11회째 HTTP 429 응답
  - "요청이 너무 많습니다" 메시지
validation:
  - 분당 10회 제한
```

### 감사 로그 테스트

#### TC-S80-AUDIT-001: 감사 로그 기록
```yaml
url: /api/admin/audit-logs
method: GET
precondition: 관리자 로그인
steps:
  1. 관리자 작업 수행
  2. GET /api/admin/audit-logs 호출
expected:
  - HTTP 200 응답
  - 관리자 활동 로그 목록
  - action, targetType, targetId, userId 포함
validation:
  - 시간순 정렬
```

### 티켓 시스템 테스트

#### TC-S80-TICKET-001: 티켓 생성
```yaml
url: /api/support/tickets
method: POST
precondition: 로그인 상태
body:
  subject: "결제 문의"
  category: "PAYMENT"
  message: "환불 요청합니다"
steps:
  1. POST /api/support/tickets 호출
expected:
  - HTTP 201 응답
  - 티켓 생성 완료
  - 상태: OPEN
validation:
  - TicketMessage 자동 생성
```

#### TC-S80-TICKET-002: 티켓 응답
```yaml
url: /api/support/tickets/{id}
method: POST
precondition: 티켓 존재
body:
  message: "답변 내용"
steps:
  1. POST /api/support/tickets/{id} 호출
expected:
  - HTTP 200 응답
  - 메시지 추가
  - 상태 업데이트
validation:
  - isStaffReply 플래그
```

### 뉴스레터 테스트

#### TC-S80-NEWSLETTER-001: 구독 신청
```yaml
url: /api/newsletter
method: POST
precondition: 없음
body:
  email: "test@example.com"
steps:
  1. POST /api/newsletter 호출
expected:
  - HTTP 200 응답
  - 구독 등록 완료
validation:
  - 이메일 중복 체크
```

---

## 🏭 Session 81-83: Phase 11 판매자 도구 테스트

> **추가일**: 2025-12-13
> **테스트 수**: 35개

### 벌크 작업 테스트

#### TC-S81-BULK-001: 상품 일괄 가격 변경
```yaml
url: /api/admin/bulk-products
method: POST
precondition: 판매자 로그인
body:
  action: "UPDATE_PRICE"
  productIds: ["p1", "p2"]
  value: 50000
steps:
  1. POST /api/admin/bulk-products 호출
expected:
  - HTTP 200 응답
  - 선택 상품 가격 일괄 변경
validation:
  - 본인 상품만 수정 가능
```

### CSV 내보내기/가져오기 테스트

#### TC-S81-CSV-001: 상품 데이터 내보내기
```yaml
url: /api/admin/csv?type=products
method: GET
precondition: 판매자 로그인
steps:
  1. GET /api/admin/csv?type=products 호출
expected:
  - HTTP 200 응답
  - CSV 파일 다운로드
validation:
  - 본인 상품만 포함
```

### 판매 리포트 테스트

#### TC-S83-REPORT-001: 주간 판매 리포트
```yaml
url: /api/seller/sales-report
method: GET
precondition: 판매자 로그인
steps:
  1. GET /api/seller/sales-report?period=weekly 호출
expected:
  - HTTP 200 응답
  - 일별 판매 추이
  - 인기 상품 TOP 5
  - 수수료 내역
validation:
  - 지난주 대비 성장률 포함
```

### 서버 헬스 모니터링 테스트

#### TC-S82-HEALTH-001: 헬스 대시보드
```yaml
url: /dashboard/health
method: GET
precondition: 관리자 로그인
steps:
  1. /dashboard/health 페이지 접근
expected:
  - 서버 응답 시간 차트
  - 에러율 표시
  - 메모리 사용량
validation:
  - 실시간 업데이트
```

---

## 🤖 Session 84-87: Phase 12 AI 분석 & 고급 기능 테스트

> **추가일**: 2025-12-13~14
> **테스트 수**: 45개

### 고급 분석 대시보드 테스트 (P12-01)

#### TC-S84-ANALYTICS-001: 매출 예측
```yaml
url: /api/analytics/advanced
method: GET
precondition: 판매 데이터 존재
steps:
  1. GET /api/analytics/advanced 호출
expected:
  - HTTP 200 응답
  - 선형 회귀 기반 예측
  - R² 정확도 포함
validation:
  - 트렌드 방향, 강도, 변동성 포함
```

### AI 상품 설명 생성 테스트 (P12-04)

#### TC-S84-AI-DESC-001: AI 설명 생성
```yaml
url: /api/ai/description
method: POST
precondition: 로그인 상태
body:
  title: "프리미엄 템플릿"
  category: "template"
steps:
  1. POST /api/ai/description 호출
expected:
  - HTTP 200 응답
  - 3가지 변형 설명 생성
  - 마케팅 문구 포함
validation:
  - Claude/폴백 로직 동작
```

### 행동 분석 테스트 (P12-02)

#### TC-S85-BEHAVIOR-001: 사용자 행동 분석
```yaml
url: /api/analytics/behavior
method: GET
precondition: 관리자 로그인
steps:
  1. GET /api/analytics/behavior 호출
expected:
  - HTTP 200 응답
  - 체류 시간, 클릭 패턴 분석
  - 전환 퍼널 데이터
validation:
  - 세그먼트별 분석 지원
```

### AI 인사이트 테스트 (P12-03)

#### TC-S85-INSIGHTS-001: AI 비즈니스 인사이트
```yaml
url: /api/ai/insights
method: GET
precondition: 관리자 로그인
steps:
  1. GET /api/ai/insights 호출
expected:
  - HTTP 200 응답
  - 트렌드 분석
  - 이상 탐지 결과
  - 권장 사항 목록
validation:
  - 우선순위별 정렬
```

### 이미지 분석 테스트 (P12-05)

#### TC-S85-IMAGE-001: AI 이미지 분석
```yaml
url: /api/ai/image-analysis
method: POST
precondition: 이미지 URL 존재
body:
  imageUrl: "https://..."
steps:
  1. POST /api/ai/image-analysis 호출
expected:
  - HTTP 200 응답
  - 자동 태그 (주제, 스타일, 분위기)
  - 색상 분석
  - 품질 점수
  - 개선 제안
validation:
  - 한국어 태그 포함
```

### AI 가격 책정 테스트 (P12-06)

#### TC-S86-PRICING-001: AI 가격 추천
```yaml
url: /api/ai/pricing
method: POST
precondition: 상품 데이터 존재
body:
  productData: { category, features }
steps:
  1. POST /api/ai/pricing 호출
expected:
  - HTTP 200 응답
  - 추천 가격대
  - 경쟁 분석 기반 근거
validation:
  - 시장 데이터 참조
```

### 소셜 미디어 연동 테스트 (P12-07)

#### TC-S86-SOCIAL-001: 소셜 공유 API
```yaml
url: /api/social
method: POST
precondition: 판매자/관리자 로그인
body:
  action: "create"
  platform: "twitter"
  type: "product"
  content: "상품 홍보 포스트"
  hashtags: ["#artwork", "#digital"]
steps:
  1. POST /api/social (action: create) 호출
expected:
  - HTTP 200 응답
  - 포스트 ID 반환
  - 유효성 검사 결과 포함
validation:
  - 플랫폼별 글자수 제한 검증
  - 해시태그 최대 개수 검증
```

### 이메일 마케팅 테스트 (P12-08)

#### TC-S86-EMAIL-MKT-001: 캠페인 생성
```yaml
url: /api/email-marketing
method: POST
precondition: 판매자/관리자 로그인
body:
  action: "create-campaign"
  campaign:
    name: "신년 프로모션"
    subject: "새해 특별 할인!"
    htmlContent: "<h1>새해 복 많이 받으세요</h1>"
    listIds: ["list_1"]
steps:
  1. POST /api/email-marketing (action: create-campaign) 호출
expected:
  - HTTP 200 응답
  - campaign.id 반환
  - status: 'draft'
validation:
  - 필수 필드 검증 (name, subject, htmlContent, listIds)
  - 템플릿 변수 치환 지원
```

### 외부 결제 연동 테스트 (P12-09)

#### TC-S87-PAYPAL-001: PayPal 결제
```yaml
url: /api/payment/providers
method: POST
precondition: 로그인 상태
body:
  action: "create"
  provider: "paypal"
  orderName: "디지털 아트 구매"
  amount: 50000
  currency: "KRW"
steps:
  1. POST /api/payment/providers (action: create, provider: paypal) 호출
expected:
  - HTTP 200 응답
  - PayPal 결제 URL 반환 (approveUrl)
  - orderId 생성
validation:
  - API 키 미설정 시 데모 모드 동작
  - 샌드박스/프로덕션 환경 분기
```

#### TC-S87-STRIPE-001: Stripe 결제
```yaml
url: /api/payment/providers
method: POST
precondition: 로그인 상태
body:
  action: "create"
  provider: "stripe"
  orderName: "디지털 아트 구매"
  amount: 50000
  currency: "KRW"
steps:
  1. POST /api/payment/providers (action: create, provider: stripe) 호출
expected:
  - HTTP 200 응답
  - Stripe clientSecret 반환
  - PaymentIntent ID 생성
validation:
  - API 키 미설정 시 데모 모드 동작
  - 웹훅 /api/webhook/stripe 연동
```

### 네이티브 앱 웹뷰 테스트 (P12-10)

#### TC-S87-WEBVIEW-001: 네이티브 앱 감지
```yaml
url: /*
method: GET
precondition: 네이티브 앱 웹뷰
steps:
  1. 앱에서 페이지 로드
expected:
  - 네이티브 앱 감지
  - 네이티브 기능 활성화
  - 딥링크 처리
validation:
  - User-Agent 또는 커스텀 헤더 감지
```

#### TC-S87-WEBVIEW-002: 네이티브 브릿지 통신
```yaml
url: /*
method: JavaScript Bridge
precondition: 네이티브 앱 환경
steps:
  1. 네이티브 기능 호출 (공유, 결제 등)
expected:
  - 앱으로 메시지 전달
  - 응답 수신
validation:
  - postMessage 또는 커스텀 스킴
```

### E2E 테스트 추가 (세션 84)

#### TC-S84-E2E-001: 판매자 API 테스트 (24개)
```yaml
file: e2e/seller-api.spec.ts
precondition: 테스트 환경 설정
tests:
  - TC-SELLER-001~003: 판매 리포트 API
  - TC-SELLER-004~005: 재고 알림 API
  - TC-SELLER-006~008: 프로모션 API
  - TC-SELLER-009~010: 경쟁 분석 API
  - TC-SELLER-011~012: 판매자 대시보드
  - TC-ADMIN-001~004: 백업/헬스 모니터링
  - TC-REF-001~002: 레퍼럴 시스템
  - TC-FEED-001~002: 피드백 시스템
  - TC-CSV-001~002: CSV 내보내기/가져오기
  - TC-BULK-001~002: 볌크 작업
  - TC-TICKET-001~002: 지원 티켓
validation:
  - npm run test:e2e 통과
```

#### TC-S84-E2E-002: 대시보드 페이지 테스트 (24개)
```yaml
file: e2e/dashboard.spec.ts
precondition: 테스트 환경 설정
tests:
  - TC-DASH-001~006: 헬스/리포트/지원 대시보드
  - TC-DASH-007~017: 대시보드 네비게이션 (상품, 구매, 위시리스트 등)
  - TC-ADMIN-005~009: 관리자 페이지 (A/B 테스트, 정산, 환불)
  - TC-SELLER-011~012: 판매자 대시보드 페이지
validation:
  - npm run test:e2e 통과
```

---

**마지막 업데이트**: 2025-12-14  
**작성자**: Vibe Olympics 개발팀  
**버전**: 3.0 (Session 1-87 전체 테스트 케이스 포함)

### 프로젝트 개발 로드맵 요약

#### ✅ 완료된 Phase (Phase 1-12)
| Phase | 세션 범위 | 주요 내용 | 테스트 수 |
|-------|----------|----------|----------|
| Phase 1 | S01-S10 | 프로젝트 기반, 인증, 검색, 결제 | 기반 구축 |
| Phase 2 | S11-S20 | 기능 확장, 팔로우, 알림, UX | 기반 구축 |
| Phase 3 | S21-S30 | 법적 페이지, 결제 수단, SEO | 기반 구축 |
| Phase 4 | S31-S40 | 접근성, 보안, API 테스트 | 기반 구축 |
| Phase 5 | S41-S50 | API 보안 테스트, SEO, 자동화 | 116개 통과 |
| Phase 6 | S51-S57 | 배포, E2E 테스트, 부트페이 | 206개 |
| Phase 7 | S58-S64 | 번들, 쿠폰, 추천 시스템 | 125개 |
| Phase 8 | S65-S73 | 구독, 알림, Socket.io, PWA | 87개 |
| Phase 9 | S74-S78 | A/B 테스트, 대시보드 | 58개 |
| Phase 10 | S80 | SEO, 운영 도구 | 20개 |
| Phase 11 | S81-S83 | 판매자 도구, 서버 헬스 | 35개 |
| Phase 12 | S84-S87 | AI 분석, 외부 결제, 네이티브 앱 | 45개 |

### 세션별 테스트 추가 내역 (상세)
| 세션 | 테스트 수 | 주요 내용 |
|------|----------|----------|
| S01-S57 | 기반 | 프로젝트 구축, 기능 개발, 테스트 환경 |
| S58 | 30개 | 번들 판매, 쿠폰/할인 시스템 |
| S59 | 12개 | Cloudinary 파일 업로드 |
| S60 | 15개 | 조건부 확률 추천 시스템 |
| S61 | 12개 | 글로벌 추천, Hydration 버그 수정 |
| S62 | 20개 | 이커머스 UX, 상품 비교, 최근 본 상품 |
| S63 | 11개 | AI 콘텐츠 등록, SEO 자동화 |
| S64 | 25개 | 컬렉션, 번들 구매, 아티스트, 미리보기 |
| S65 | 10개 | 검색 자동완성, 필터 UX 개선 |
| S66 | 18개 | 정기 구독 결제, 빌링키, 자동갱신 |
| S67 | 14개 | 알림 시스템 고도화, 이메일 템플릿 |
| S68 | 12개 | Socket.io 실시간 알림 |
| S69-70 | 8개 | next/image 최적화, 타입 오류 수정 |
| S71 | 10개 | Google Analytics 4 연동 |
| S72-73 | 15개 | PWA 오프라인 지원, Service Worker |
| S74 | 16개 | A/B 테스트 프레임워크 |
| S75 | 10개 | 결제/환불 이메일 알림 |
| S76 | 15개 | 관리자 대시보드, 실시간 위젯 |
| S77 | 12개 | A/B 테스트 관리 대시보드 |
| S78 | 5개 | force-dynamic, logger 유틸리티 |
| S80 | 20개 | Rate Limit, 감사 로그, 티켓, 뉴스레터 |
| S81-83 | 35개 | Phase 11 판매자 도구, 서버 헬스 |
| S84-87 | 45개 | Phase 12 AI 분석, 외부결제, 네이티브 앱 |

### 테스트 실행 현황
| 카테고리 | 통과 | 실패 | 통과율 |
|----------|------|------|--------|
| Jest 단위 테스트 | 61 | 0 | 100% |
| Playwright E2E | 206 | 0 | 100% |
| API 보안 테스트 | 116 | 0 | 100% |
| 명세 테스트 | 562+ | - | 작성완료 |

---

*이 파일은 TestSprite 자동 테스트 및 수동 테스트 가이드용입니다.*
*배포 URL: https://vibe-olympics.onrender.com*
