# 🏆 Vibe Olympics

> VIBE 코딩 기반 지식재산 마켓플레이스

AI를 활용한 창작물(프롬프트, 템플릿, 코드 등)을 거래할 수 있는 마켓플레이스입니다.

## ✨ 주요 기능

- 🛒 **마켓플레이스** - AI 도구, 프롬프트, 템플릿 판매/구매
- 📚 **교육 센터** - VIBE 코딩 튜토리얼, 메이킹 영상
- 💬 **커뮤니티** - 자유 게시판, Q&A, 피드백
- 👤 **대시보드** - 판매자/구매자 통합 관리
- 🔔 **실시간 알림** - 웹 푸시 알림 지원

## 🛠 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS
- **Payment**: Stripe, PortOne
- **3D**: Three.js, React Three Fiber

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
# .env.local 파일을 열어 실제 값 입력
```

### 3. 데이터베이스 설정

```bash
npx prisma generate
npx prisma db push
```

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인

## 📦 프로덕션 배포 (Vercel)

### 1. Vercel 프로젝트 연결

```bash
npx vercel link
```

### 2. 환경변수 설정 (Vercel Dashboard)

**필수 환경변수:**
| 변수명 | 설명 |
|--------|------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` 로 생성 |
| `NEXTAUTH_URL` | `https://your-domain.com` |
| `DATABASE_URL` | Supabase Pooler URL (포트 6543) |
| `DIRECT_URL` | Supabase Direct URL (포트 5432) |
| `GITHUB_ID` | GitHub OAuth Client ID |
| `GITHUB_SECRET` | GitHub OAuth Client Secret |

**선택 환경변수:**
| 변수명 | 설명 |
|--------|------|
| `STRIPE_SECRET_KEY` | Stripe API 키 |
| `RESEND_API_KEY` | 이메일 발송용 |
| `NEXT_PUBLIC_SENTRY_DSN` | 에러 모니터링 |
| `ANTHROPIC_API_KEY` | AI 챗봇 |

### 3. 배포

```bash
npx vercel --prod
```

### 4. Cron Job 활성화

`vercel.json`에 예약 발행 스케줄러가 설정되어 있습니다:
- 15분마다 `/api/content/scheduler` 자동 호출
- Vercel Pro 플랜 이상 필요 (무료 플랜: 1일 1회)

## 🧪 테스트

```bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# 타입 체크
npm run type-check
```

## 📁 프로젝트 구조

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API Routes
│   ├── auth/         # 인증 페이지
│   ├── dashboard/    # 대시보드
│   ├── marketplace/  # 마켓플레이스
│   ├── education/    # 교육 센터
│   └── community/    # 커뮤니티
├── components/       # React 컴포넌트
├── lib/              # 유틸리티 함수
└── types/            # TypeScript 타입
```

## 📜 문서

- [CHANGELOG.md](./CHANGELOG.md) - 변경 이력
- [TODO.md](./TODO.md) - 작업 예정 목록
- [TEST_SPECS.md](./TEST_SPECS.md) - 테스트 케이스

## 📄 라이선스

MIT License

