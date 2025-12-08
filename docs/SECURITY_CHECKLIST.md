# 🔒 Vibe Olympics 보안 점검 체크리스트

> 프로덕션 배포 전 반드시 확인해야 할 보안 항목입니다.
> 체크 완료 시 [x]로 표시하세요.

---

## 1. 🔐 인증 (Authentication)

### NextAuth.js 설정
- [x] `NEXTAUTH_SECRET` 강력한 랜덤 값 사용 (32자 이상)
- [x] `NEXTAUTH_URL` 프로덕션 도메인으로 설정
- [x] GitHub OAuth callback URL 프로덕션 도메인으로 업데이트
- [ ] 세션 만료 시간 적절히 설정 (기본값 검토)

### API 라우트 인증 상태

| API 라우트 | 인증 필요 | 상태 | 비고 |
|-----------|----------|------|------|
| `/api/auth/*` | ❌ | ✅ | NextAuth 내장 |
| `/api/admin/*` | ✅ | ✅ | isAdmin 체크 |
| `/api/analytics` | ✅ | ✅ | getServerSession |
| `/api/categories` | ❌ (GET) | ✅ | 공개 데이터 |
| `/api/checkout` | ✅ | ✅ | getServerSession |
| `/api/follows/*` | ✅ | ✅ | getServerSession |
| `/api/notifications` | ✅ | ✅ | getServerSession |
| `/api/posts/*` | 부분 | ✅ | GET 공개, POST/PATCH/DELETE 인증 |
| `/api/products/*` | 부분 | ✅ | GET 공개, POST/PATCH/DELETE 인증 |
| `/api/purchases/*` | ✅ | ✅ | getServerSession |
| `/api/reactions` | ✅ | ✅ | getServerSession |
| `/api/reviews/*` | 부분 | ✅ | GET 공개, POST/PATCH/DELETE 인증 |
| `/api/search/*` | ❌ | ✅ | 공개 검색 |
| `/api/sellers/*` | ❌ (GET) | ✅ | 공개 프로필 |
| `/api/tutorials/*` | 부분 | ✅ | GET 공개, POST/PATCH/DELETE 인증 |
| `/api/unified-comments/*` | 부분 | ✅ | GET 공개, POST/PATCH/DELETE 인증 |
| `/api/upload` | ✅ | ✅ | getServerSession |
| `/api/user/*` | ✅ | ✅ | getServerSession |
| `/api/webhook/stripe` | 특수 | ✅ | Stripe 서명 검증 |
| `/api/wishlist/*` | ✅ | ✅ | getServerSession |

---

## 2. 🛡️ 권한 (Authorization)

### 역할 기반 접근 제어
- [x] 관리자 전용 API (`/api/admin/*`) isAdmin 체크
- [x] 판매자 전용 기능 isSeller 체크
- [x] 본인 리소스만 수정/삭제 가능 (userId 검증)

### 데이터 접근 제어
- [x] 다른 사용자의 구매 내역 접근 차단
- [x] 다른 사용자의 알림 접근 차단
- [x] 다른 사용자의 위시리스트 접근 차단
- [x] 비공개 상품 접근 제한 (DRAFT, PENDING_REVIEW)

---

## 3. 🔑 환경변수 보안

### 민감 정보 노출 방지
- [ ] `.env.local` 파일 `.gitignore`에 포함 확인
- [ ] `NEXT_PUBLIC_*` 접두사 변수는 공개 가능한 것만 사용
- [ ] 서버 전용 키(SECRET, SERVICE_ROLE 등) 클라이언트 노출 없음 확인

### Vercel 환경변수 설정
- [ ] Production 환경변수 설정 완료
- [ ] Preview 환경변수 설정 완료 (테스트용)
- [ ] 민감한 환경변수 "Sensitive" 옵션 활성화

---

## 4. 💳 결제 보안 (Stripe)

### 웹훅 보안
- [x] `STRIPE_WEBHOOK_SECRET` 설정
- [x] 웹훅 서명 검증 (`stripe.webhooks.constructEvent`)
- [ ] 프로덕션 웹훅 엔드포인트 등록

### 결제 데이터 검증
- [x] 결제 금액 서버 사이드 검증
- [x] 중복 결제 방지 (이미 구매한 상품 체크)
- [x] 결제 완료 후 Purchase 레코드 생성

---

## 5. 📧 이메일 보안 (Resend)

### 발신자 검증
- [ ] Resend에서 도메인 인증 완료
- [ ] SPF/DKIM 레코드 설정

### 이메일 내용 보안
- [x] 비밀번호 재설정 토큰 1회용, 1시간 만료
- [x] 민감한 정보 이메일 본문에 포함하지 않음

---

## 6. 🗄️ 데이터베이스 보안

### Prisma/Supabase
- [x] `DATABASE_URL` 보안 연결 (SSL)
- [ ] Supabase RLS (Row Level Security) 활성화 검토
- [x] SQL 인젝션 방지 (Prisma ORM 사용)

### 데이터 검증
- [x] Zod 스키마로 입력 데이터 검증
- [x] XSS 방지 (React 자동 이스케이프)

---

## 7. 📁 파일 업로드 보안

### Supabase Storage
- [x] 파일 크기 제한 (이미지: 5MB, 상품: 100MB)
- [x] 파일 타입 검증 (MIME type)
- [ ] 업로드 버킷 접근 정책 설정

---

## 8. 🌐 네트워크 보안

### HTTPS
- [ ] 프로덕션 HTTPS 강제 (Vercel 자동)
- [ ] HSTS 헤더 설정 검토

### CORS
- [x] Next.js API 라우트 기본 same-origin 정책
- [ ] 필요한 경우 CORS 헤더 명시적 설정

### Rate Limiting
- [ ] API 요청 제한 검토 (Vercel Edge Middleware 또는 외부 서비스)
- [ ] 로그인 시도 제한 검토

---

## 9. 🔭 모니터링

### Sentry
- [ ] `NEXT_PUBLIC_SENTRY_DSN` 프로덕션 DSN 설정
- [ ] 소스맵 업로드 설정
- [ ] 에러 알림 설정

### 로깅
- [ ] 민감한 정보 로그에 포함되지 않도록 확인
- [ ] Vercel 로그 보존 기간 확인

---

## 10. ✅ 배포 전 최종 체크

- [ ] 모든 테스트 통과 (`npm test`)
- [ ] 빌드 성공 (`npm run build`)
- [ ] 환경변수 검증 통과 (`npm run check-env`)
- [ ] 프로덕션 데이터베이스 마이그레이션 완료
- [ ] DNS 설정 완료 (도메인 사용 시)
- [ ] SSL 인증서 확인 (Vercel 자동)

---

## 📝 추가 권장 사항

### 향후 구현 권장
- [ ] Rate Limiting 미들웨어 추가
- [ ] CAPTCHA 추가 (회원가입, 비밀번호 재설정)
- [ ] 2FA (Two-Factor Authentication) 옵션
- [ ] 감사 로그 (Audit Log) 시스템
- [ ] CSP (Content Security Policy) 헤더

---

*마지막 검토: 2025년 12월 7일*
