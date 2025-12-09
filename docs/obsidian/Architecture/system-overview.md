# 🏗️ 시스템 개요 (System Overview)

#architecture #overview

> Vibe Olympics 전체 시스템 아키텍처
> 현재 상태: 개발 완료 → 배포 대기

---

## 📊 시스템 아키텍처 다이어그램

```mermaid
flowchart TB
    subgraph Client["🖥️ Client Layer"]
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end
    
    subgraph Frontend["⚛️ Frontend - Next.js 14"]
        Pages[App Router Pages]
        Components[React Components]
        Hooks[Custom Hooks]
        State[Zustand Store]
    end
    
    subgraph Backend["⚙️ Backend - API Routes"]
        Auth[NextAuth.js]
        API[REST API]
        Validation[Zod Validation]
    end
    
    subgraph Database["💾 Database Layer"]
        Prisma[Prisma ORM]
        Supabase[(Supabase PostgreSQL)]
    end
    
    subgraph External["🌐 External Services"]
        GitHub[GitHub OAuth]
        Bootpay[Bootpay 결제]
        PortOne[PortOne 결제]
        Resend[Resend 이메일]
        Sentry[Sentry 모니터링]
    end
    
    Client --> Frontend
    Frontend --> Backend
    Backend --> Database
    Backend --> External
    Auth --> GitHub
```

---

## 🎯 서비스 플로우

### 1. 사용자 여정 (User Journey)

```mermaid
journey
    title 구매자 여정
    section 탐색
      홈페이지 방문: 5: 방문자
      상품 검색: 4: 방문자
      상품 상세 확인: 4: 방문자
    section 인증
      로그인/회원가입: 3: 사용자
      프로필 설정: 4: 사용자
    section 구매
      장바구니 추가: 4: 구매자
      결제 진행: 3: 구매자
      다운로드: 5: 구매자
    section 후속
      리뷰 작성: 4: 구매자
      판매자 팔로우: 5: 구매자
```

### 2. 결제 플로우

```mermaid
sequenceDiagram
    participant U as 사용자
    participant F as Frontend
    participant B as Backend API
    participant BP as Bootpay
    participant DB as Database
    
    U->>F: 구매 버튼 클릭
    F->>F: 결제 수단 선택 모달
    U->>F: 결제 수단 선택
    F->>BP: Bootpay SDK 호출
    BP->>BP: 결제 진행
    BP-->>F: 결제 결과 (receipt_id)
    F->>B: POST /api/payment/bootpay/verify
    B->>BP: 결제 검증 API
    BP-->>B: 검증 결과
    B->>DB: Purchase 레코드 생성
    B-->>F: 구매 완료
    F->>U: 성공 페이지 리다이렉트
```

---

## 🏛️ 아키텍처 계층

### Layer 1: Presentation (프레젠테이션)
- **Next.js App Router** - 페이지 라우팅
- **React 18** - UI 컴포넌트
- **Tailwind CSS** - 스타일링
- **Framer Motion** - 애니메이션
- **Lucide React** - 아이콘

### Layer 2: Business Logic (비즈니스 로직)
- **API Routes** - RESTful API
- **NextAuth.js** - 인증/인가
- **Zod** - 유효성 검사
- **React Hook Form** - 폼 관리

### Layer 3: Data Access (데이터 접근)
- **Prisma ORM** - 데이터베이스 ORM
- **Supabase** - PostgreSQL + Storage

### Layer 4: External Integration (외부 연동)
- **Bootpay** - 한국 결제 (카드, 간편결제)
- **PortOne** - 추가 결제 옵션
- **Resend** - 트랜잭션 이메일
- **Sentry** - 에러 모니터링

---

## 📈 현재 상태 vs 배포 후

### 현재 상태 (Development)
```
┌─────────────────────────────────────┐
│  localhost:3000                      │
│  ├── 모든 기능 구현 완료             │
│  ├── 61개 테스트 통과                │
│  ├── TypeScript 타입 에러 없음       │
│  └── ESLint 경고 45개 (img→Image)   │
└─────────────────────────────────────┘
```

### 배포 후 (Production)
```
┌─────────────────────────────────────┐
│  https://vibe-olympics.vercel.app   │
│  ├── Vercel Edge Network            │
│  ├── Supabase Cloud DB              │
│  ├── Bootpay 실결제 연동            │
│  ├── GitHub OAuth 활성화            │
│  └── Sentry 에러 모니터링           │
└─────────────────────────────────────┘
```

---

## 🔗 관련 문서

- [[tech-stack|기술 스택 상세]]
- [[api-map|API 엔드포인트 맵]]
- [[database-schema|데이터베이스 스키마]]
- [[page-structure|페이지 구조]]
