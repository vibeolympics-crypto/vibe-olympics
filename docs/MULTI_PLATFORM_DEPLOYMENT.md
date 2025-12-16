# 멀티 플랫폼 배포 가이드

> Vibe Olympics는 **Vercel**, **Render**, **Cloudflare Pages** 3가지 플랫폼에 배포할 수 있습니다.

## 📊 플랫폼 비교

| 기능 | Vercel | Render | Cloudflare Pages |
|------|--------|--------|------------------|
| **무료 티어** | 100GB 대역폭 | 750시간/월 | 무제한 |
| **Edge Functions** | ✅ 지원 | ❌ 미지원 | ✅ 지원 |
| **서버 사이드** | ✅ 지원 | ✅ 지원 | ⚠️ Edge 제한 |
| **Prisma** | ✅ 완전 지원 | ✅ 완전 지원 | ⚠️ Edge 어댑터 필요 |
| **콜드 스타트** | 빠름 | 느림 (무료) | 매우 빠름 |
| **커스텀 도메인** | ✅ 무료 | ✅ 무료 | ✅ 무료 |
| **CI/CD** | ✅ 자동 | ✅ 자동 | ✅ 자동 |

---

## 🚀 1. Vercel 배포 (권장)

### 설정 파일
- `vercel.json` - 라우팅 및 빌드 설정

### 배포 방법
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 환경 변수 설정
Vercel Dashboard > Settings > Environment Variables

---

## 🐳 2. Render 배포

### 설정 파일
- `render.yaml` - Blueprint 설정

### 배포 방법
1. [Render Dashboard](https://dashboard.render.com/)에서 New > Blueprint
2. GitHub 저장소 연결
3. `render.yaml` 자동 인식

### 주의사항
- 무료 티어는 15분 비활성 시 슬립 (콜드 스타트 30초~1분)
- 크론 잡으로 슬립 방지 가능

---

## ☁️ 3. Cloudflare Pages 배포

### 설정 파일
- `wrangler.toml` - Cloudflare 설정
- `open-next.config.ts` - OpenNext 어댑터

### 빌드 및 배포

```bash
# Cloudflare 빌드
npm run build:cf

# 로컬 미리보기
npm run preview:cf

# 배포
npm run deploy:cf
```

### Cloudflare Dashboard 배포
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 로그인
2. Workers & Pages > Create application > Pages
3. Connect to Git > GitHub 연결
4. 빌드 설정:

| 설정 | 값 |
|------|-----|
| Framework preset | None |
| Build command | `npm run build:cf` |
| Build output directory | `.open-next/cloudflare` |
| Node.js version | 20 |

### 환경 변수 (필수)
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.pages.dev
NEXTAUTH_SECRET=your-secret
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret
```

### Edge Runtime 제한사항
⚠️ Cloudflare Pages는 Edge Runtime을 사용합니다:

1. **Node.js API 제한**: `fs`, `path`, `crypto` 일부 기능 사용 불가
2. **Prisma 제한**: 
   - 연결 풀링 비활성화 필요
   - `src/lib/prisma-edge.ts` 사용 권장
3. **외부 패키지**: 일부 npm 패키지 호환 불가

### 문제 해결

#### Prisma 연결 오류
```typescript
// src/lib/prisma-edge.ts 사용
import prisma from '@/lib/prisma-edge';
```

#### 빌드 오류
```bash
# 캐시 정리 후 재빌드
rm -rf .open-next .next
npm run build:cf
```

---

## 🔧 공통 환경 변수

모든 플랫폼에서 필요한 환경 변수:

```env
# 인증
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-domain.com

# 데이터베이스
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# GitHub OAuth
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

# 결제 (Bootpay)
NEXT_PUBLIC_BOOTPAY_JS_KEY=your-js-key
BOOTPAY_REST_API_KEY=your-api-key
BOOTPAY_PRIVATE_KEY=your-private-key

# 이메일 (Resend)
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@your-domain.com

# 파일 스토리지 (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# 모니터링 (Sentry)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

---

## 📋 배포 체크리스트

### 배포 전
- [ ] 환경 변수 모두 설정
- [ ] `npm run check-env` 실행
- [ ] `npm run build` 성공 확인
- [ ] 로컬 테스트 완료

### 배포 후
- [ ] 메인 페이지 접속 확인
- [ ] 로그인 기능 테스트
- [ ] API 엔드포인트 테스트
- [ ] 결제 테스트 (테스트 모드)

---

## 🔀 플랫폼 전환

### Vercel → Cloudflare
```bash
# Cloudflare 패키지 설치
npm install -D @opennextjs/cloudflare wrangler

# 빌드 및 배포
npm run build:cf
npm run deploy:cf
```

### Cloudflare → Vercel
```bash
# Cloudflare 패키지 제거 (선택)
npm uninstall @opennextjs/cloudflare wrangler

# Vercel 배포
vercel --prod
```

---

## 📞 지원

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [OpenNext Docs](https://opennext.js.org/)
