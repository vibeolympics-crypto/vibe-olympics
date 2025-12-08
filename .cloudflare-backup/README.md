# Cloudflare Pages 배포 설정 백업

> ⚠️ **주의**: 이 폴더의 파일들은 Cloudflare Pages 배포를 위한 백업 설정입니다.
> 현재 프로젝트는 **Vercel**에서 배포 중입니다.

## 백업된 날짜
2025-12-09

## Cloudflare Pages 활성화 방법

Cloudflare Pages로 전환하려면 다음 단계를 수행하세요:

### 1. 파일 복원

```bash
# 루트 디렉토리로 파일 복사
cp .cloudflare-backup/wrangler.toml ./wrangler.toml
cp .cloudflare-backup/open-next.config.ts ./open-next.config.ts
```

### 2. package.json 스크립트 추가

`package.json`의 `scripts` 섹션에 다음을 추가:

```json
{
  "scripts": {
    "build:cf": "prisma generate && npx opennextjs-cloudflare build",
    "preview:cf": "npx wrangler pages dev",
    "deploy:cf": "npm run build:cf && npx wrangler pages deploy"
  }
}
```

### 3. 의존성 설치

```bash
npm install -D @opennextjs/cloudflare wrangler --legacy-peer-deps
```

### 4. Edge Runtime 설정 (필수)

Cloudflare Pages는 Edge Runtime만 지원합니다. 모든 API 라우트와 페이지에 다음을 추가해야 합니다:

```typescript
export const runtime = 'edge';
```

### 5. Prisma Edge 설정

`prisma/schema.prisma` 수정:

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

## 주의사항

1. **Node.js API 호환성**: `fs`, `path` 등 Node.js 전용 API는 Edge Runtime에서 사용 불가
2. **Prisma**: Edge-compatible 드라이버 어댑터 필요
3. **NextAuth**: Edge Runtime 호환 설정 필요
4. **환경 변수**: Cloudflare Dashboard에서 별도 설정 필요

## 참고 문서

- [OpenNext Cloudflare](https://opennext.js.org/cloudflare)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Prisma Edge](https://www.prisma.io/docs/guides/deployment/edge)
