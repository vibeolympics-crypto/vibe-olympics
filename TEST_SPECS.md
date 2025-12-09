# 🧪 Vibe Olympics - 테스트 명세 (TEST_SPECS)

> 마지막 업데이트: 2025년 12월 9일
> TestSprite MCP 자동 테스트용 역할별 테스트 케이스 정의
> 총 테스트 케이스: 184개 (명세) + 160개 (Playwright E2E)

---

## 🎭 Playwright E2E 테스트 현황

### 테스트 파일 구조
```
e2e/
├── app.spec.ts          # 기본 페이지 테스트 (27개)
├── auth.spec.ts         # 인증 테스트 (14개)
├── marketplace.spec.ts  # 마켓플레이스 테스트 (16개)
├── education.spec.ts    # 교육 센터 테스트 (14개)
├── community.spec.ts    # 커뮤니티 테스트 (13개)
├── responsive.spec.ts   # 반응형 디자인 테스트 (17개)
├── api.spec.ts          # API 테스트 (25개)
├── accessibility.spec.ts # 접근성 테스트 (19개)
└── performance.spec.ts  # 성능 테스트 (16개)
```

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
| auth.spec.ts | 14 | 로그인, 회원가입, 비밀번호 찾기, 보호된 라우트 |
| marketplace.spec.ts | 16 | 상품 목록, 검색, 필터, 상세 페이지 |
| education.spec.ts | 14 | 튜토리얼 목록, 난이도 필터, 상세 페이지 |
| community.spec.ts | 13 | 게시글 목록, 카테고리, 상호작용 |
| responsive.spec.ts | 17 | 모바일/태블릿/데스크톱 레이아웃 |
| api.spec.ts | 25 | Health check, CRUD, 인증, 에러 처리 |
| accessibility.spec.ts | 19 | 랜드마크, 키보드, alt, 레이블 |
| performance.spec.ts | 16 | 로드 시간, 응답 시간, 캐싱 |

---

## 📋 테스트 환경 정보

### 개발 서버
- **URL**: http://localhost:3000
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

### Stripe 테스트 카드
| 카드 번호 | 만료일 | CVC | 설명 |
|-----------|--------|-----|------|
| 4242 4242 4242 4242 | 12/34 | 123 | 성공 |
| 4000 0000 0000 0002 | 12/34 | 123 | 거절 |
| 4000 0000 0000 9995 | 12/34 | 123 | 잔액 부족 |

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
  - Stripe 환불 처리 시작
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
  - Stripe Checkout으로 리다이렉트 또는 결제 수단 선택 모달
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

#### TC-BUYER-017: 유료 상품 구매 - Stripe 결제
```yaml
url: /api/checkout
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품
steps:
  1. 유료 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "신용/체크카드 (Stripe)" 선택
  3. Stripe Checkout 페이지로 리다이렉트
  4. 테스트 카드 정보 입력 (4242 4242 4242 4242)
  5. 결제 완료
expected:
  - Stripe Checkout 세션 생성
  - 결제 성공 후 /dashboard/purchases?success=true로 리다이렉트
  - Success Toast "구매가 완료되었습니다"
  - 구매 완료 이메일 발송
  - 판매자에게 판매 알림
validation:
  - Purchase 레코드 생성 (status: COMPLETED)
  - 부트페이 webhook으로 검증 (/api/payment/bootpay/webhook)
```

#### TC-BUYER-018: 유료 상품 구매 - 카카오페이
```yaml
url: /api/payment/portone
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "카카오페이" 선택
  3. PortOne SDK 결제 창 열림
  4. 카카오페이 테스트 결제 진행
  5. 결제 완료
expected:
  - PortOne 결제 요청 성공
  - 결제 검증 API 호출
  - 구매 내역에 추가
  - Success Toast
validation:
  - Purchase 레코드 생성
  - paymentMethod = "kakaopay"
```

#### TC-BUYER-019: 유료 상품 구매 - 토스페이
```yaml
url: /api/payment/portone
method: POST
precondition: 구매자 계정으로 로그인 + 유료 상품
steps:
  1. 상품 상세 페이지에서 "구매하기" 버튼 클릭
  2. 결제 수단 선택 모달에서 "토스페이" 선택
  3. PortOne SDK 결제 창 열림
  4. 토스페이 테스트 결제 진행
  5. 결제 완료
expected:
  - PortOne 결제 요청 성공
  - 결제 검증 API 호출
  - 구매 내역에 추가
validation:
  - paymentMethod = "tosspay"
```

#### TC-BUYER-019B: 유료 상품 구매 - 부트페이 카드 결제
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

#### TC-BUYER-019F: 유료 상품 구매 - 부트페이 휴대폰 결제
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

#### TC-BUYER-019G: 유료 상품 구매 - 부트페이 계좌이체
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

#### TC-BUYER-019H: 유료 상품 구매 - 부트페이 가상계좌
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

#### TC-BUYER-019I: 부트페이 결제 취소 (사용자 취소)
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

#### TC-BUYER-019J: 부트페이 결제 검증 실패
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

#### TC-BUYER-020: 결제 취소 플로우
```yaml
url: /marketplace/[id]?canceled=true
method: GET
precondition: Stripe Checkout에서 취소
steps:
  1. 결제 진행 중 Stripe 페이지에서 "뒤로 가기" 클릭
  2. 상품 상세 페이지로 리다이렉트
expected:
  - Info Toast "결제가 취소되었습니다. 언제든 다시 시도하실 수 있습니다."
validation:
  - Purchase 레코드 생성 안됨
```

#### TC-BUYER-021: 구매 내역 조회
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

#### TC-BUYER-022: 구매 상세 모달
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

#### TC-BUYER-023: 상품 파일 다운로드
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
  - Stripe Refund 처리 (승인 시)
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
url: /api/checkout
method: POST
precondition: 로그인 + Stripe 테스트 카드 (4000 0000 0000 0002)
steps:
  1. 상품 결제 시도 (거절 카드)
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

| 역할 | 테스트 케이스 수 | 우선순위 |
|------|------------------|----------|
| 관리자 | 21 | 높음 |
| 판매자 | 20 | 높음 |
| 구매자 | 30 | 높음 |
| 방문자 | 22 | 중간 |
| 커뮤니티 | 19 | 중간 |
| 일반 유저 | 18 | 중간 |
| API | 32 | 높음 |
| 에러 케이스 | 10 | 높음 |
| 다국어 | 5 | 낮음 |
| 반응형/접근성 | 7 | 중간 |
| **총계** | **184** | - |

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
- [ ] 결제 통합 테스트 (Stripe)
- [ ] OAuth 통합 테스트 (GitHub, Google)
- [ ] 이메일 전송 테스트 (Resend)

### Phase 4: 성능 & 보안 테스트
- [ ] Lighthouse CI
- [ ] OWASP ZAP
- [ ] 로드 테스트 (k6)

---

**마지막 업데이트**: 2025-12-08  
**작성자**: Vibe Olympics 개발팀  
**버전**: 2.0

---

*이 파일은 TestSprite 자동 테스트 및 수동 테스트 가이드용입니다.*
