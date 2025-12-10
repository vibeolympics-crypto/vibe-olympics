import { PrismaClient, PricingType, LicenseType, ProductStatus, ProductType, BookType, VideoSeriesType, MusicGenre } from "@prisma/client";

const prisma = new PrismaClient();

// ==========================================
// 디지털 상품 카테고리 (기존)
// ==========================================
const digitalProductCategories = [
  {
    name: "웹 앱",
    slug: "web-app",
    description: "웹 기반 애플리케이션 및 SaaS 솔루션",
    icon: "Globe",
    color: "#00D4FF",
    sortOrder: 1,
    productType: "DIGITAL_PRODUCT" as const,
  },
  {
    name: "모바일 앱",
    slug: "mobile-app",
    description: "iOS, Android 모바일 애플리케이션",
    icon: "Smartphone",
    color: "#FF6B35",
    sortOrder: 2,
    productType: "DIGITAL_PRODUCT" as const,
  },
  {
    name: "AI/ML 모델",
    slug: "ai-ml",
    description: "인공지능 및 머신러닝 모델",
    icon: "Brain",
    color: "#BD00FF",
    sortOrder: 3,
    productType: "DIGITAL_PRODUCT" as const,
  },
  {
    name: "자동화 도구",
    slug: "automation",
    description: "업무 자동화 스크립트 및 도구",
    icon: "Zap",
    color: "#00FF9F",
    sortOrder: 4,
    productType: "DIGITAL_PRODUCT" as const,
  },
  {
    name: "API/백엔드",
    slug: "api-backend",
    description: "REST API, GraphQL, 서버 솔루션",
    icon: "Server",
    color: "#FFD93D",
    sortOrder: 5,
    productType: "DIGITAL_PRODUCT" as const,
  },
  {
    name: "데이터 분석",
    slug: "data-analytics",
    description: "데이터 시각화 및 분석 도구",
    icon: "BarChart3",
    color: "#FF6B6B",
    sortOrder: 6,
    productType: "DIGITAL_PRODUCT" as const,
  },
  {
    name: "크롬 확장",
    slug: "chrome-extension",
    description: "브라우저 확장 프로그램",
    icon: "Chrome",
    color: "#4285F4",
    sortOrder: 7,
    productType: "DIGITAL_PRODUCT" as const,
  },
  {
    name: "디자인 도구",
    slug: "design-tools",
    description: "UI/UX 디자인 관련 도구",
    icon: "Palette",
    color: "#FF85A2",
    sortOrder: 8,
    productType: "DIGITAL_PRODUCT" as const,
  },
  {
    name: "게임",
    slug: "games",
    description: "게임 및 인터랙티브 콘텐츠",
    icon: "Gamepad2",
    color: "#9B59B6",
    sortOrder: 9,
    productType: "DIGITAL_PRODUCT" as const,
  },
  {
    name: "기타",
    slug: "others",
    description: "기타 디지털 상품",
    icon: "Package",
    color: "#95A5A6",
    sortOrder: 10,
    productType: "DIGITAL_PRODUCT" as const,
  },
];

// ==========================================
// 도서 카테고리 (AI 생성 콘텐츠)
// ==========================================
const bookCategories = [
  {
    name: "만화/웹툰",
    slug: "book-comic",
    description: "AI로 제작한 만화책, 웹툰",
    icon: "BookImage",
    color: "#FF6B6B",
    sortOrder: 1,
    productType: "BOOK" as const,
  },
  {
    name: "전자책",
    slug: "book-ebook",
    description: "AI 작성 전자책, 에세이, 소설",
    icon: "BookOpen",
    color: "#4ECDC4",
    sortOrder: 2,
    productType: "BOOK" as const,
  },
  {
    name: "동화/그림책",
    slug: "book-picture",
    description: "어린이용 동화책, 그림책",
    icon: "Baby",
    color: "#FFE66D",
    sortOrder: 3,
    productType: "BOOK" as const,
  },
  {
    name: "교육/학습",
    slug: "book-education",
    description: "학습서, 교재, 가이드북",
    icon: "GraduationCap",
    color: "#95E1D3",
    sortOrder: 4,
    productType: "BOOK" as const,
  },
  {
    name: "자기계발",
    slug: "book-selfhelp",
    description: "자기계발, 비즈니스 도서",
    icon: "TrendingUp",
    color: "#DDA0DD",
    sortOrder: 5,
    productType: "BOOK" as const,
  },
  {
    name: "오디오북",
    slug: "book-audio",
    description: "AI 음성으로 제작한 오디오북",
    icon: "Headphones",
    color: "#87CEEB",
    sortOrder: 6,
    productType: "BOOK" as const,
  },
];

// ==========================================
// 영상 시리즈 카테고리 (AI 생성 콘텐츠)
// ==========================================
const videoCategories = [
  {
    name: "애니메이션",
    slug: "video-animation",
    description: "AI 생성 애니메이션, 카툰",
    icon: "Clapperboard",
    color: "#FF85A2",
    sortOrder: 1,
    productType: "VIDEO_SERIES" as const,
  },
  {
    name: "단편 영화",
    slug: "video-shortfilm",
    description: "AI 생성 단편 영화, 뮤직비디오",
    icon: "Film",
    color: "#B19CD9",
    sortOrder: 2,
    productType: "VIDEO_SERIES" as const,
  },
  {
    name: "다큐멘터리",
    slug: "video-documentary",
    description: "교육용 다큐, 설명 영상",
    icon: "Video",
    color: "#77DD77",
    sortOrder: 3,
    productType: "VIDEO_SERIES" as const,
  },
  {
    name: "웹 시리즈",
    slug: "video-webseries",
    description: "에피소드 형식의 웹 시리즈",
    icon: "Tv",
    color: "#FFB347",
    sortOrder: 4,
    productType: "VIDEO_SERIES" as const,
  },
  {
    name: "교육 영상",
    slug: "video-tutorial",
    description: "강좌, 튜토리얼, How-to 영상",
    icon: "MonitorPlay",
    color: "#AEC6CF",
    sortOrder: 5,
    productType: "VIDEO_SERIES" as const,
  },
  {
    name: "버추얼 콘텐츠",
    slug: "video-virtual",
    description: "VR/360도 영상, 가상 투어",
    icon: "View",
    color: "#FDFD96",
    sortOrder: 6,
    productType: "VIDEO_SERIES" as const,
  },
];

// ==========================================
// 음악 앨범 카테고리 (AI 생성 콘텐츠)
// ==========================================
const musicCategories = [
  {
    name: "작업용 BGM",
    slug: "music-work",
    description: "집중력 향상, 작업/공부용 음악",
    icon: "Laptop",
    color: "#00CED1",
    sortOrder: 1,
    productType: "MUSIC_ALBUM" as const,
  },
  {
    name: "명상/힐링",
    slug: "music-meditation",
    description: "명상, 수면, 힐링 음악",
    icon: "Moon",
    color: "#9370DB",
    sortOrder: 2,
    productType: "MUSIC_ALBUM" as const,
  },
  {
    name: "영상 배경음악",
    slug: "music-bgm",
    description: "유튜브, 팟캐스트용 배경음악",
    icon: "Music",
    color: "#FF6347",
    sortOrder: 3,
    productType: "MUSIC_ALBUM" as const,
  },
  {
    name: "게임 사운드트랙",
    slug: "music-game",
    description: "게임용 OST, 효과음",
    icon: "Gamepad2",
    color: "#32CD32",
    sortOrder: 4,
    productType: "MUSIC_ALBUM" as const,
  },
  {
    name: "팝/일렉트로닉",
    slug: "music-pop",
    description: "팝, EDM, 일렉트로닉 음악",
    icon: "Disc3",
    color: "#FF69B4",
    sortOrder: 5,
    productType: "MUSIC_ALBUM" as const,
  },
  {
    name: "클래식/재즈",
    slug: "music-classical",
    description: "클래식, 재즈, 어쿠스틱",
    icon: "Piano",
    color: "#DAA520",
    sortOrder: 6,
    productType: "MUSIC_ALBUM" as const,
  },
  {
    name: "앰비언트/자연",
    slug: "music-ambient",
    description: "자연 소리, 앰비언트, ASMR",
    icon: "TreePine",
    color: "#228B22",
    sortOrder: 7,
    productType: "MUSIC_ALBUM" as const,
  },
  {
    name: "로열티 프리",
    slug: "music-royaltyfree",
    description: "상업적 사용 가능한 음원",
    icon: "BadgeCheck",
    color: "#4169E1",
    sortOrder: 8,
    productType: "MUSIC_ALBUM" as const,
  },
];

// 모든 카테고리 합치기
const categories = [
  ...digitalProductCategories,
  ...bookCategories,
  ...videoCategories,
  ...musicCategories,
];

async function main() {
  console.log("🌱 Seeding database...");

  // 카테고리 생성
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  console.log("✅ Categories seeded successfully!");

  // 테스트 사용자 생성 (개발 환경용)
  if (process.env.NODE_ENV !== "production") {
    const testUser = await prisma.user.upsert({
      where: { email: "test@vibeolympics.com" },
      update: {},
      create: {
        email: "test@vibeolympics.com",
        name: "테스트 판매자",
        // 비밀번호: Test1234! (bcrypt 해시)
        password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKxcQwKdB9w7lGm",
        isSeller: true,
        sellerVerified: true,
        bio: "VIBE 코딩으로 다양한 프로젝트를 만드는 개발자입니다.",
      },
    });

    console.log("✅ Test user created:", testUser.email);

    // 두 번째 테스트 판매자
    const testUser2 = await prisma.user.upsert({
      where: { email: "seller2@vibeolympics.com" },
      update: {},
      create: {
        email: "seller2@vibeolympics.com",
        name: "김개발",
        password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKxcQwKdB9w7lGm",
        isSeller: true,
        sellerVerified: true,
        bio: "풀스택 개발자입니다. AI와 자동화 도구를 주로 만듭니다.",
      },
    });

    console.log("✅ Test user 2 created:", testUser2.email);

    // 카테고리 ID 조회
    const webAppCategory = await prisma.category.findUnique({ where: { slug: "web-app" } });
    const mobileAppCategory = await prisma.category.findUnique({ where: { slug: "mobile-app" } });
    const aiMlCategory = await prisma.category.findUnique({ where: { slug: "ai-ml" } });
    const automationCategory = await prisma.category.findUnique({ where: { slug: "automation" } });
    const apiBackendCategory = await prisma.category.findUnique({ where: { slug: "api-backend" } });
    const dataAnalyticsCategory = await prisma.category.findUnique({ where: { slug: "data-analytics" } });
    const chromeExtCategory = await prisma.category.findUnique({ where: { slug: "chrome-extension" } });
    const designCategory = await prisma.category.findUnique({ where: { slug: "design-tools" } });

    // 샘플 상품 데이터
    const sampleProducts = [
      {
        title: "AI 챗봇 SaaS 템플릿",
        slug: "ai-chatbot-saas-template",
        shortDescription: "ChatGPT API를 활용한 완성형 SaaS 챗봇 템플릿",
        description: `# AI 챗봇 SaaS 템플릿

VIBE 코딩으로 제작된 완벽한 AI 챗봇 SaaS 솔루션입니다.

## 주요 기능
- 🤖 OpenAI GPT-4 API 통합
- 💬 실시간 대화 인터페이스
- 📊 대화 기록 및 분석
- 👥 다중 사용자 지원
- 🎨 커스터마이징 가능한 UI
- 📱 반응형 디자인

## 기술 스택
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- OpenAI API

## 포함 내용
- 전체 소스코드
- 배포 가이드
- API 연동 문서
- 1개월 기술 지원`,
        categoryId: webAppCategory!.id,
        sellerId: testUser.id,
        pricingType: PricingType.PAID,
        price: 89000,
        originalPrice: 120000,
        licenseType: LicenseType.COMMERCIAL,
        tags: ["AI", "ChatGPT", "SaaS", "Next.js", "챗봇"],
        features: ["GPT-4 통합", "실시간 채팅", "다중 사용자", "분석 대시보드", "커스터마이징"],
        techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL"],
        status: ProductStatus.PUBLISHED,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 1420,
        salesCount: 56,
        downloadCount: 78,
        averageRating: 4.8,
        reviewCount: 24,
      },
      {
        title: "React 컴포넌트 라이브러리",
        slug: "react-component-library",
        shortDescription: "50개 이상의 재사용 가능한 React UI 컴포넌트",
        description: `# React 컴포넌트 라이브러리

모던하고 접근성 높은 React UI 컴포넌트 모음입니다.

## 컴포넌트 목록
- Button, Input, Select 등 기본 컴포넌트
- Modal, Drawer, Toast 등 오버레이 컴포넌트
- Table, Pagination, Tabs 등 데이터 표시 컴포넌트
- Form 관련 컴포넌트 (with React Hook Form)

## 특징
- ♿ 완벽한 접근성 (WCAG 2.1 AA)
- 🌙 다크모드 지원
- 📱 반응형 디자인
- 🎨 Tailwind CSS 기반
- 📖 Storybook 문서화`,
        categoryId: webAppCategory!.id,
        sellerId: testUser2.id,
        pricingType: PricingType.FREE,
        price: 0,
        licenseType: LicenseType.PERSONAL,
        tags: ["React", "UI", "컴포넌트", "Tailwind", "오픈소스"],
        features: ["50+ 컴포넌트", "다크모드", "접근성", "Storybook", "TypeScript"],
        techStack: ["React", "TypeScript", "Tailwind CSS", "Storybook"],
        status: ProductStatus.PUBLISHED,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 4320,
        salesCount: 0,
        downloadCount: 567,
        averageRating: 4.7,
        reviewCount: 45,
      },
      {
        title: "슬랙 자동화 봇",
        slug: "slack-automation-bot",
        shortDescription: "팀 생산성을 높이는 슬랙 자동화 봇 템플릿",
        description: `# 슬랙 자동화 봇

팀 커뮤니케이션과 업무 프로세스를 자동화하는 슬랙 봇입니다.

## 주요 기능
- 📅 일정 리마인더 자동 발송
- ✅ 업무 할당 및 추적
- 📊 주간 보고서 자동 생성
- 🔔 GitHub/Jira 알림 통합
- 💬 커스텀 명령어 지원

## 배포 방법
1. Heroku 또는 AWS Lambda
2. 환경 변수 설정
3. Slack App 연동`,
        categoryId: automationCategory!.id,
        sellerId: testUser.id,
        pricingType: PricingType.PAID,
        price: 29000,
        licenseType: LicenseType.COMMERCIAL,
        tags: ["슬랙", "자동화", "봇", "생산성", "Node.js"],
        features: ["리마인더", "업무 추적", "보고서 생성", "GitHub 연동", "커스텀 명령어"],
        techStack: ["Node.js", "Slack API", "PostgreSQL"],
        status: ProductStatus.PUBLISHED,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 1890,
        salesCount: 34,
        downloadCount: 156,
        averageRating: 4.5,
        reviewCount: 18,
      },
      {
        title: "노션 데이터베이스 분석기",
        slug: "notion-database-analyzer",
        shortDescription: "노션 데이터를 시각화하고 분석하는 도구",
        description: `# 노션 데이터베이스 분석기

노션 데이터베이스의 데이터를 시각화하고 분석하는 도구입니다.

## 기능
- 📊 차트 및 그래프 생성
- 📈 트렌드 분석
- 📋 자동 대시보드 생성
- 📤 PDF/Excel 내보내기`,
        categoryId: dataAnalyticsCategory!.id,
        sellerId: testUser2.id,
        pricingType: PricingType.PAID,
        price: 45000,
        licenseType: LicenseType.PERSONAL,
        tags: ["노션", "데이터분석", "시각화", "대시보드"],
        features: ["차트 생성", "트렌드 분석", "대시보드", "내보내기"],
        techStack: ["Python", "Notion API", "Chart.js"],
        status: ProductStatus.PUBLISHED,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 2150,
        salesCount: 28,
        downloadCount: 342,
        averageRating: 4.6,
        reviewCount: 32,
      },
      {
        title: "GPT 프롬프트 모음집",
        slug: "gpt-prompt-collection",
        shortDescription: "검증된 200개 이상의 GPT 프롬프트 템플릿",
        description: `# GPT 프롬프트 모음집

ChatGPT, Claude 등 AI 도구를 위한 검증된 프롬프트 템플릿입니다.

## 카테고리
- 📝 글쓰기 (블로그, 마케팅)
- 💻 개발 (코드 리뷰, 디버깅)
- 🎨 디자인 (UI/UX 피드백)
- 📊 비즈니스 (기획, 전략)
- 🎓 학습 (요약, 퀴즈)`,
        categoryId: aiMlCategory!.id,
        sellerId: testUser.id,
        pricingType: PricingType.PAID,
        price: 19000,
        licenseType: LicenseType.PERSONAL,
        tags: ["AI", "프롬프트", "ChatGPT", "Claude", "생산성"],
        features: ["200+ 프롬프트", "5가지 카테고리", "예시 포함", "정기 업데이트"],
        techStack: ["Notion", "Markdown"],
        status: ProductStatus.PUBLISHED,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 5670,
        salesCount: 89,
        downloadCount: 423,
        averageRating: 4.4,
        reviewCount: 67,
      },
      {
        title: "크롬 북마크 매니저",
        slug: "chrome-bookmark-manager",
        shortDescription: "AI 기반 스마트 북마크 정리 확장 프로그램",
        description: `# 크롬 북마크 매니저

AI가 북마크를 자동으로 분류하고 정리해주는 크롬 확장 프로그램입니다.

## 기능
- 🏷️ AI 자동 태깅
- 📁 스마트 폴더 정리
- 🔍 풀텍스트 검색
- 📊 사용 통계`,
        categoryId: chromeExtCategory!.id,
        sellerId: testUser2.id,
        pricingType: PricingType.FREE,
        price: 0,
        licenseType: LicenseType.PERSONAL,
        tags: ["크롬", "확장프로그램", "북마크", "AI", "생산성"],
        features: ["AI 태깅", "스마트 정리", "검색", "통계"],
        techStack: ["JavaScript", "Chrome API", "OpenAI"],
        status: ProductStatus.PUBLISHED,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 3200,
        salesCount: 0,
        downloadCount: 890,
        averageRating: 4.3,
        reviewCount: 52,
      },
      {
        title: "Flutter 쇼핑몰 앱 템플릿",
        slug: "flutter-shopping-app-template",
        shortDescription: "완성형 Flutter 이커머스 앱 템플릿",
        description: `# Flutter 쇼핑몰 앱 템플릿

iOS/Android 동시 지원하는 완성형 쇼핑몰 앱입니다.

## 기능
- 🛒 장바구니 및 결제
- 👤 회원가입/로그인
- 🔍 상품 검색 및 필터
- ❤️ 위시리스트
- 📦 주문 추적`,
        categoryId: mobileAppCategory!.id,
        sellerId: testUser.id,
        pricingType: PricingType.PAID,
        price: 129000,
        originalPrice: 180000,
        licenseType: LicenseType.EXTENDED,
        tags: ["Flutter", "모바일", "쇼핑몰", "이커머스", "앱"],
        features: ["결제 연동", "푸시 알림", "소셜 로그인", "관리자 패널"],
        techStack: ["Flutter", "Dart", "Firebase", "Stripe"],
        status: ProductStatus.PUBLISHED,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 2800,
        salesCount: 42,
        downloadCount: 98,
        averageRating: 4.9,
        reviewCount: 38,
      },
      {
        title: "REST API 보일러플레이트",
        slug: "rest-api-boilerplate",
        shortDescription: "프로덕션 레디 Node.js REST API 템플릿",
        description: `# REST API 보일러플레이트

바로 사용할 수 있는 Node.js REST API 템플릿입니다.

## 포함 기능
- 🔐 JWT 인증
- 📝 Swagger 문서화
- 🧪 테스트 설정
- 🐳 Docker 지원
- 📊 로깅 및 모니터링`,
        categoryId: apiBackendCategory!.id,
        sellerId: testUser2.id,
        pricingType: PricingType.PAID,
        price: 35000,
        licenseType: LicenseType.COMMERCIAL,
        tags: ["Node.js", "API", "REST", "백엔드", "Express"],
        features: ["JWT 인증", "Swagger", "테스트", "Docker", "로깅"],
        techStack: ["Node.js", "Express", "PostgreSQL", "Docker", "Jest"],
        status: ProductStatus.PUBLISHED,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 1650,
        salesCount: 21,
        downloadCount: 145,
        averageRating: 4.7,
        reviewCount: 19,
      },
      {
        title: "Figma 디자인 시스템",
        slug: "figma-design-system",
        shortDescription: "완벽한 UI/UX 디자인 시스템 키트",
        description: `# Figma 디자인 시스템

일관된 디자인을 위한 완벽한 디자인 시스템입니다.

## 구성
- 🎨 컬러 팔레트
- 📝 타이포그래피
- 📦 500+ UI 컴포넌트
- 🖼️ 아이콘 세트
- 📱 반응형 레이아웃`,
        categoryId: designCategory!.id,
        sellerId: testUser.id,
        pricingType: PricingType.PAID,
        price: 59000,
        licenseType: LicenseType.COMMERCIAL,
        tags: ["Figma", "디자인", "UI", "UX", "디자인시스템"],
        features: ["500+ 컴포넌트", "반응형", "다크모드", "아이콘 세트"],
        techStack: ["Figma"],
        status: ProductStatus.PUBLISHED,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 3400,
        salesCount: 67,
        downloadCount: 234,
        averageRating: 4.8,
        reviewCount: 45,
      },
      {
        title: "Python 웹 스크래퍼",
        slug: "python-web-scraper",
        shortDescription: "다목적 웹 스크래핑 자동화 도구",
        description: `# Python 웹 스크래퍼

다양한 웹사이트에서 데이터를 수집하는 자동화 도구입니다.

## 지원 사이트
- 🛒 이커머스 (가격 모니터링)
- 📰 뉴스 사이트
- 📊 금융 데이터
- 🏢 부동산 정보`,
        categoryId: automationCategory!.id,
        sellerId: testUser2.id,
        pricingType: PricingType.PAID,
        price: 25000,
        licenseType: LicenseType.PERSONAL,
        tags: ["Python", "스크래핑", "자동화", "데이터수집"],
        features: ["다중 사이트", "스케줄링", "데이터 정제", "CSV/JSON 내보내기"],
        techStack: ["Python", "Selenium", "BeautifulSoup", "Pandas"],
        status: ProductStatus.PUBLISHED,
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 2100,
        salesCount: 35,
        downloadCount: 178,
        averageRating: 4.5,
        reviewCount: 28,
      },
    ];

    // 상품 생성
    for (const product of sampleProducts) {
      if (product.categoryId) {
        await prisma.product.upsert({
          where: { slug: product.slug },
          update: product,
          create: product,
        });
      }
    }

    console.log("✅ Sample products created!");

    // 샘플 리뷰 생성
    const products = await prisma.product.findMany({ take: 5 });
    const reviewTexts = [
      "정말 잘 만들어진 템플릿입니다. 바로 사용할 수 있어서 시간을 많이 절약했어요!",
      "문서화가 잘 되어있어서 커스터마이징하기 쉬웠습니다. 추천합니다.",
      "가격 대비 훌륭한 퀄리티입니다. 판매자분이 질문에도 빠르게 답변해주셨어요.",
      "코드가 깔끔하고 구조도 잘 잡혀있습니다. 배우는 것도 많았어요.",
      "기대 이상이었습니다. 다음 프로젝트에도 이 판매자의 상품을 구매할 예정입니다.",
    ];

    // 리뷰 생성 (각 사용자는 각 상품에 하나의 리뷰만 작성 가능)
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      // 리뷰어를 번갈아가며 할당 (상품 판매자가 아닌 사용자만)
      const reviewerId = product.sellerId === testUser.id ? testUser2.id : testUser.id;
      
      // 이미 리뷰가 있는지 확인
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_productId: {
            userId: reviewerId,
            productId: product.id
          }
        }
      });

      if (!existingReview) {
        await prisma.review.create({
          data: {
            productId: product.id,
            userId: reviewerId,
            rating: Math.floor(Math.random() * 2) + 4, // 4-5점
            content: reviewTexts[i % reviewTexts.length],
          },
        });
      }
    }

    console.log("✅ Sample reviews created!");

    // 튜토리얼 시드 데이터
    console.log("📚 Creating sample tutorials...");

    const tutorialData = [
    {
      title: "VIBE 코딩 입문: ChatGPT로 첫 앱 만들기",
      slug: "vibe-coding-intro-chatgpt-first-app",
      description: "프로그래밍 경험이 없어도 괜찮아요! AI 도구를 활용해 나만의 첫 웹앱을 만들어보는 완전 입문 가이드입니다.",
      content: `# VIBE 코딩 입문 가이드

## 시작하기 전에
VIBE 코딩은 AI 도구를 활용해 빠르게 프로토타입을 만드는 방법입니다.

## 준비물
- ChatGPT 또는 Claude 계정
- VS Code 또는 Cursor IDE

## Step 1: 아이디어 정리
먼저 만들고 싶은 앱의 기능을 정리합니다...`,
      type: "TUTORIAL" as const,
      duration: 45,
      tags: ["입문", "ChatGPT", "웹앱"],
      isFeatured: true,
    },
    {
      title: "슬랙 봇을 만들어 팀 생산성을 올린 이야기",
      slug: "slack-bot-team-productivity-story",
      description: "반복적인 팀 미팅 리마인더와 일일 보고서 자동화를 위해 슬랙 봇을 만들게 된 과정과 결과를 공유합니다.",
      content: `# 슬랙 봇 제작기

## 문제 상황
매일 반복되는 미팅 리마인더를 수동으로 보내고 있었습니다...

## 해결 과정
1. Slack API 문서 조사
2. Node.js로 봇 개발
3. 배포 및 테스트

## 결과
- 주당 2시간 절약
- 팀원들의 미팅 참석률 15% 향상`,
      type: "MAKING" as const,
      duration: 20,
      tags: ["슬랙", "자동화", "생산성"],
      isFeatured: false,
    },
    {
      title: "효과적인 프롬프트 작성법 10가지",
      slug: "effective-prompt-writing-10-tips",
      description: "AI 도구를 더 효과적으로 활용하기 위한 프롬프트 작성 팁을 정리했습니다. 실전 예시와 함께 알아보세요.",
      content: `# 프롬프트 작성 팁

## 1. 명확한 역할 부여
"당신은 시니어 개발자입니다"로 시작하면 더 전문적인 답변을 받을 수 있습니다.

## 2. 구체적인 요구사항
"좋은 코드 작성해줘" 대신 "Python으로 REST API를 만들어줘. FastAPI를 사용하고..."

## 3. 예시 제공
원하는 출력 형식의 예시를 함께 제공하세요...`,
      type: "TIPS" as const,
      duration: 15,
      tags: ["프롬프트", "AI", "팁"],
      isFeatured: true,
    },
    {
      title: "Cursor AI 공식 문서",
      slug: "cursor-ai-official-docs",
      description: "Cursor AI IDE의 공식 문서입니다. 설치부터 고급 기능까지 모든 것을 배울 수 있습니다.",
      content: `# Cursor AI 가이드

Cursor는 AI 기반 코드 에디터입니다.

## 공식 문서 링크
자세한 내용은 공식 문서를 참고하세요.`,
      type: "EXTERNAL" as const,
      externalUrl: "https://cursor.com/docs",
      tags: ["Cursor", "IDE", "공식문서"],
      isFeatured: false,
    },
    {
      title: "노션 API 활용 가이드: 데이터베이스 자동화",
      slug: "notion-api-database-automation-guide",
      description: "노션 API를 사용해 데이터베이스를 자동으로 관리하는 방법을 단계별로 알려드립니다.",
      content: `# 노션 API 가이드

## 사전 준비
1. Notion Integration 생성
2. API Key 발급
3. 데이터베이스 연결

## 기본 사용법
\`\`\`javascript
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });
\`\`\``,
      type: "TUTORIAL" as const,
      duration: 60,
      tags: ["노션", "API", "자동화"],
      isFeatured: false,
    },
    {
      title: "월 100만원 부수입을 만든 사이드 프로젝트 이야기",
      slug: "side-project-1m-revenue-story",
      description: "직장인으로 일하면서 VIBE 코딩으로 사이드 프로젝트를 시작해 수익화에 성공한 경험담입니다.",
      content: `# 사이드 프로젝트 수익화 이야기

## 시작
처음에는 그냥 재미로 시작했습니다...

## 아이디어 발굴
일상에서 불편함을 느꼈던 부분을 해결하는 도구를 만들기로 했습니다.

## 수익화 전략
1. 무료 버전으로 사용자 확보
2. 프리미엄 기능 추가
3. 구독 모델 도입

## 현재 상황
- 월 활성 사용자: 5,000명
- 유료 전환율: 3%
- 월 수익: 100만원+`,
      type: "MAKING" as const,
      duration: 25,
      tags: ["수익화", "사이드프로젝트", "경험담"],
      isFeatured: true,
    },
    ];

    for (const tutorial of tutorialData) {
      const existingTutorial = await prisma.tutorial.findUnique({
        where: { slug: tutorial.slug },
      });

      if (!existingTutorial) {
        await prisma.tutorial.create({
          data: {
            ...tutorial,
            authorId: testUser.id,
            isPublished: true,
            publishedAt: new Date(),
            viewCount: Math.floor(Math.random() * 5000) + 500,
            likeCount: Math.floor(Math.random() * 300) + 50,
          },
        });
      }
    }

    console.log("✅ Sample tutorials created!");
  }

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
