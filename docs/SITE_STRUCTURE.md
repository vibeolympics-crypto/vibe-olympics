# 🗺️ Vibe Olympics - 사이트 구조 & 카테고리 시각화

> 마지막 업데이트: 2025년 12월 12일 (세션 79 완료)
> AI 생성 콘텐츠 마켓플레이스 사이트 구조
> 총 79개 세션 완료 | 8개 단위 테스트 파일 | 97개 API 엔드포인트

---

## 📊 전체 사이트 맵

```
🏠 Vibe Olympics
│
├── 🔐 인증 시스템 (/auth)
│   ├── 로그인 (/auth/login)
│   ├── 회원가입 (/auth/signup)
│   ├── 비밀번호 찾기 (/auth/forgot-password)
│   ├── 비밀번호 재설정 (/auth/reset-password)
│   └── 오류 페이지 (/auth/error)
│
├── 🛍️ 마켓플레이스 (/marketplace)
│   ├── 상품 목록 (/marketplace)
│   ├── 상품 상세 (/marketplace/[id])
│   └── 상품 비교 (/marketplace/compare)
│
├── 🎓 교육 센터 (/education)
│   ├── 튜토리얼 목록 (/education)
│   └── 튜토리얼 상세 (/education/[id])
│
├── 💬 커뮤니티 (/community)
│   ├── 게시글 목록 (/community)
│   └── 게시글 상세 (/community/[id])
│
├── 🎨 아티스트 (/artists)
│   ├── 아티스트 목록 (/artists)
│   └── 아티스트 프로필 (/artists/[slug])
│
├── 🏪 판매자 (/seller)
│   └── 판매자 프로필 (/seller/[id])
│
├── 📊 대시보드 (/dashboard) [로그인 필요]
│   ├── 개요 (/dashboard)
│   ├── � 상품 관리
│   │   ├── 상품 목록 (/dashboard/products)
│   │   ├── 상품 등록 (/dashboard/products/new)
│   │   └── 상품 수정 (/dashboard/products/[id]/edit)
│   ├── 📚 컬렉션 (/dashboard/collections)
│   ├── 🛒 구매 내역 (/dashboard/purchases)
│   ├── ❤️ 위시리스트 (/dashboard/wishlist)
│   ├── 👥 팔로잉 (/dashboard/following)
│   ├── 🔔 알림 (/dashboard/notifications)
│   ├── [판매자 전용]
│   │   ├── 📈 분석 (/dashboard/analytics)
│   │   ├── 💰 정산 관리 (/dashboard/settlements)
│   │   ├── 🎫 쿠폰 관리 (/dashboard/seller/coupons)
│   │   └── 🧪 A/B 테스트 (/dashboard/ab-tests)
│   ├── 💳 구독 관리 (/dashboard/subscriptions)
│   └── ⚙️ 설정 (/dashboard/settings)
│
├── 🔧 관리자 (/admin) [관리자 전용]
│   ├── 대시보드 (/admin)
│   ├── 📊 관리자 통계 (/admin/dashboard)
│   ├── 🧪 A/B 테스트 관리 (/admin/ab-test)
│   ├── 환불 관리 (/admin/refunds)
│   └── 정산 관리 (/admin/settlements)
│
├── 📄 정적 페이지
│   ├── FAQ (/faq)
│   ├── 이용약관 (/terms)
│   ├── 개인정보처리방침 (/privacy)
│   └── 환불정책 (/refund)
│
└── 🔌 API 엔드포인트 (/api) [97개 엔드포인트]
    ├── 인증 (/api/auth/*)
    ├── 상품 (/api/products/*)
    ├── 카테고리 (/api/categories)
    ├── 구매 (/api/purchases/*)
    ├── 결제 (/api/checkout, /api/payment/*)
    ├── 리뷰 (/api/reviews/*)
    ├── 컬렉션 (/api/collections/*)
    ├── 번들 (/api/bundles/*)
    ├── 아티스트 (/api/artists/*)
    ├── 판매자 (/api/sellers/*)
    ├── 추천 (/api/recommendations)
    ├── 검색 (/api/search/*)
    ├── 커뮤니티 (/api/posts/*, /api/unified-comments/*)
    ├── 교육 (/api/tutorials/*)
    ├── 알림 (/api/notifications/*)
    ├── 정산 (/api/settlements/*)
    ├── 환불 (/api/refunds/*)
    ├── 쿠폰 (/api/coupons/*)
    ├── 피드 (/api/feed/*)
    ├── 팔로우 (/api/follows/*)
    ├── 위시리스트 (/api/wishlist/*)
    ├── 반응 (/api/reactions/*)
    ├── 분석 (/api/analytics/*)
    ├── 미리보기 (/api/preview/*)
    ├── 업로드 (/api/upload/*)
    ├── 사용자 (/api/user/*)
    ├── 챗봇 (/api/chat/*)
    ├── 콘텐츠 (/api/content/*)
    ├── 내보내기 (/api/export/*)
    ├── A/B 테스트 (/api/ab-test/*)
    ├── 헬스체크 (/api/health)
    ├── 웹훅 (/api/webhook/*)
    └── 관리자 (/api/admin/*)
```

---

## 🗂️ 전체 카테고리 조직도 (세분화)

> 총 4개 상품 타입, 49개 세부 카테고리

```
📦 Vibe Olympics 마켓플레이스 카테고리
│
│
├─────────────────────────────────────────────────────────────────────────
│  🖥️ DIGITAL_PRODUCT (디지털 상품) - 18개 세부 카테고리
├─────────────────────────────────────────────────────────────────────────
│
├── 💼 비즈니스/업무 (6개)
│   │
│   ├── 🌐 웹 앱
│   │   └── SaaS, 웹 서비스, 랜딩 페이지 템플릿, 대시보드
│   │
│   ├── 🔌 API/백엔드
│   │   └── REST API, GraphQL, 마이크로서비스, 서버 템플릿
│   │
│   ├── 📊 데이터 분석
│   │   └── 대시보드, 시각화 도구, 분석 템플릿, BI 도구
│   │
│   ├── ⚡ 업무 자동화
│   │   └── 워크플로우, 자동화 스크립트, RPA, 봇
│   │
│   ├── 📄 문서/템플릿
│   │   └── 노션 템플릿, 프레젠테이션, 스프레드시트, 계약서
│   │
│   └── 📢 마케팅 도구
│       └── 이메일 템플릿, 소셜 미디어 키트, 분석 도구, 랜딩 페이지
│
│
├── 🛠️ 개발 도구 (6개)
│   │
│   ├── 📱 모바일 앱
│   │   └── iOS, Android, React Native, Flutter, 크로스 플랫폼
│   │
│   ├── 🤖 AI/ML 모델
│   │   └── 머신러닝 모델, AI 서비스, 프롬프트 엔지니어링, 데이터셋
│   │
│   ├── 🔧 브라우저 확장
│   │   └── Chrome 확장, Firefox 애드온, 북마클릿, 생산성 도구
│   │
│   ├── 🎨 디자인 도구
│   │   └── UI 키트, 디자인 시스템, 아이콘 팩, 목업 템플릿
│   │
│   ├── 💻 코드 스니펫
│   │   └── 유틸리티 함수, 컴포넌트, 알고리즘, 보일러플레이트
│   │
│   └── 🗄️ 데이터베이스
│       └── 스키마 템플릿, 마이그레이션 도구, ORM 설정, 쿼리 모음
│
│
├── 🎨 라이프스타일 (6개)
│   │
│   ├── 🎮 게임
│   │   └── 인디 게임, 게임 에셋, 캐주얼 게임, 퍼즐
│   │
│   ├── 💚 건강/웰빙
│   │   └── 명상 가이드, 마인드풀니스, 수면 도구, 스트레스 관리
│   │
│   ├── 💪 피트니스
│   │   └── 운동 플랜, 식단 관리, 트래킹 도구, 홈트레이닝
│   │
│   ├── 🍳 요리/레시피
│   │   └── 레시피 앱, 식단 계획, 요리 가이드, 식재료 관리
│   │
│   ├── ✈️ 여행/모빌리티
│   │   └── 여행 플래너, 지도 도구, 교통 앱, 예약 시스템
│   │
│   └── 🏠 홈/인테리어
│       └── 인테리어 도구, 스마트홈 앱, 가계부, 홈 관리
│
│
├─────────────────────────────────────────────────────────────────────────
│  📚 BOOK (도서) - 15개 세부 카테고리
├─────────────────────────────────────────────────────────────────────────
│
├── 📖 도서 유형 (BookType)
│   │
│   ├── 📱 EBOOK (전자책)
│   ├── 📔 COMIC (만화책)
│   ├── 🌈 PICTURE_BOOK (동화책/그림책)
│   ├── 📕 PRINT_BOOK (종이책)
│   └── 🎧 AUDIO_BOOK (오디오북)
│
│
├── 📚 장르별 카테고리
│   │
│   ├── 📖 소설
│   │   ├── 판타지
│   │   ├── SF (공상과학)
│   │   ├── 로맨스
│   │   ├── 미스터리/스릴러
│   │   ├── 호러
│   │   └── 문학/순수문학
│   │
│   ├── 📘 비소설
│   │   ├── 자기계발
│   │   ├── 경제/경영
│   │   ├── 과학/기술
│   │   ├── 역사/인문
│   │   ├── 에세이
│   │   └── 여행기
│   │
│   ├── 📒 만화/웹툰
│   │   ├── 웹툰
│   │   ├── 일본 만화
│   │   ├── 미국 코믹스
│   │   └── 그래픽 노블
│   │
│   └── 👶 아동/청소년
│       ├── 그림책
│       ├── 동화
│       ├── 학습만화
│       └── 청소년 소설
│
│
├─────────────────────────────────────────────────────────────────────────
│  🎬 VIDEO_SERIES (영상 시리즈) - 10개 세부 카테고리
├─────────────────────────────────────────────────────────────────────────
│
├── 🎥 영상 유형 (VideoSeriesType)
│   │
│   ├── 🎬 MOVIE (영화)
│   ├── 🎨 ANIMATION (애니메이션)
│   ├── 📹 DOCUMENTARY (다큐멘터리)
│   ├── 🎞️ SHORT_FILM (단편)
│   └── 📺 SERIES (시리즈물)
│
│
├── 🎭 장르별 카테고리
│   │
│   ├── 🦸 액션/어드벤처
│   ├── 💕 로맨스/멜로
│   ├── 😂 코미디
│   ├── 👻 호러/스릴러
│   ├── 🚀 SF/판타지
│   ├── 🎭 드라마
│   ├── 🔍 미스터리/범죄
│   ├── 👨‍👩‍👧 가족/어린이
│   ├── 🎓 교육/다큐
│   └── 🎵 뮤지컬/음악
│
│
├── 🎨 제작 방식별
│   │
│   ├── 📷 실사 (Live Action)
│   ├── ✏️ 2D 애니메이션
│   ├── 🎮 3D 애니메이션
│   ├── 🛑 스톱모션
│   └── 🤖 AI 생성 영상
│
│
├─────────────────────────────────────────────────────────────────────────
│  🎵 MUSIC_ALBUM (음악 앨범) - 6개 세부 카테고리
├─────────────────────────────────────────────────────────────────────────
│
├── 🎼 음악 장르 (MusicGenre) - 11개
│   │
│   ├── 🎤 POP (팝)
│   ├── 🎸 ROCK (록)
│   ├── 🎧 HIPHOP (힙합)
│   ├── 🎹 RNB (R&B)
│   ├── 🎛️ ELECTRONIC (일렉트로닉)
│   ├── 🎻 CLASSICAL (클래식)
│   ├── 🎷 JAZZ (재즈)
│   ├── 🌊 AMBIENT (앰비언트)
│   ├── 🎬 SOUNDTRACK (사운드트랙)
│   ├── 🌍 WORLD (월드뮤직)
│   └── 🎵 OTHER (기타)
│
│
├── 💿 앨범 타입
│   │
│   ├── 🎵 Single (싱글)
│   ├── 💽 EP (미니 앨범)
│   ├── 📀 Full Album (정규 앨범)
│   └── 🗂️ Compilation (컴필레이션)
│
│
├── 🎯 용도별 카테고리
│   │
│   ├── 💼 작업용 BGM
│   ├── 😴 수면/릴랙스
│   ├── 💪 운동/피트니스
│   ├── 📚 공부/집중
│   ├── 🚗 드라이브
│   └── 🎉 파티/분위기
│
│
├── 🎙️ 음원 타입
│   │
│   ├── 🎤 보컬 (Vocal)
│   ├── 🎹 인스트루멘탈 (Instrumental)
│   ├── 🔊 효과음 (SFX)
│   └── 🎧 로열티 프리 (Royalty Free)
│
│
└─────────────────────────────────────────────────────────────────────────
```

---

## 📊 카테고리 요약 테이블

| 상품 타입 | 대분류 | 세부 카테고리 수 |
|-----------|--------|------------------|
| 🖥️ DIGITAL_PRODUCT | 3개 (비즈니스, 개발도구, 라이프스타일) | 18개 |
| 📚 BOOK | 5개 도서유형 + 4개 장르 | 15개+ |
| 🎬 VIDEO_SERIES | 5개 영상유형 + 10개 장르 | 10개+ |
| 🎵 MUSIC_ALBUM | 11개 장르 + 4개 앨범타입 + 6개 용도 | 21개+ |
| **총계** | **4개 상품 타입** | **60개+ 세부 카테고리** |

---

## 🛍️ 마켓플레이스 카테고리 구조 (상세)

### 상품 타입 (ProductType)

```
📦 상품 타입
│
├── 🖥️ DIGITAL_PRODUCT (디지털 상품)
│   │
│   ├── 💼 비즈니스/업무
│   │   ├── 노션 템플릿
│   │   ├── 프레젠테이션
│   │   ├── 스프레드시트
│   │   └── 문서 템플릿
│   │
│   ├── 🛠️ 개발도구
│   │   ├── UI 키트
│   │   ├── 코드 템플릿
│   │   ├── 개발 도구
│   │   └── 플러그인
│   │
│   └── 🎨 라이프스타일
│       ├── 디자인 에셋
│       ├── 사진/이미지
│       ├── 아이콘/일러스트
│       └── 소셜 미디어 템플릿
│
├── 📚 BOOK (도서)
│   │
│   ├── 📖 BookType (도서 유형)
│   │   ├── EBOOK (전자책)
│   │   ├── COMIC (만화책)
│   │   ├── PICTURE_BOOK (동화책/그림책)
│   │   ├── PRINT_BOOK (종이책)
│   │   └── AUDIO_BOOK (오디오북)
│   │
│   └── 📋 메타데이터
│       ├── 저자 (author)
│       ├── 출판사 (publisher)
│       ├── ISBN (isbn)
│       ├── 페이지 수 (pageCount)
│       ├── 챕터 수 (chapters)
│       ├── 언어 (language)
│       ├── 형식 (format: PDF, EPUB, MOBI)
│       ├── 연령 등급 (ageRating)
│       ├── 시리즈 정보 (seriesName, seriesOrder)
│       └── 샘플 URL (sampleUrl)
│
├── 🎬 VIDEO_SERIES (영상 시리즈)
│   │
│   ├── 🎥 VideoSeriesType (영상 유형)
│   │   ├── MOVIE (영화)
│   │   ├── ANIMATION (애니메이션)
│   │   ├── DOCUMENTARY (다큐멘터리)
│   │   ├── SHORT_FILM (단편)
│   │   └── SERIES (시리즈물)
│   │
│   └── 📋 메타데이터
│       ├── 감독 (director)
│       ├── 출연진/캐릭터 (cast)
│       ├── 총 러닝타임 (duration)
│       ├── 에피소드 수 (episodes)
│       ├── 시즌 수 (seasons)
│       ├── 해상도 (resolution: 4K, 1080p, 720p)
│       ├── 오디오 포맷 (audioFormat)
│       ├── 자막 언어 (subtitles)
│       ├── 연령 등급 (ageRating)
│       ├── 장르 (genre)
│       └── 예고편 URL (trailerUrl)
│
└── 🎵 MUSIC_ALBUM (음악 앨범)
    │
    ├── 🎼 MusicGenre (음악 장르)
    │   ├── POP (팝)
    │   ├── ROCK (록)
    │   ├── HIPHOP (힙합)
    │   ├── RNB (R&B)
    │   ├── ELECTRONIC (일렉트로닉)
    │   ├── CLASSICAL (클래식)
    │   ├── JAZZ (재즈)
    │   ├── AMBIENT (앰비언트)
    │   ├── SOUNDTRACK (사운드트랙)
    │   ├── WORLD (월드뮤직)
    │   └── OTHER (기타)
    │
    └── 📋 메타데이터
        ├── 아티스트명 (artist)
        ├── 앨범 타입 (albumType: Single, EP, Full Album)
        ├── 세부 장르 (subGenre)
        ├── 분위기 태그 (mood: chill, energetic, melancholic)
        ├── 트랙 수 (trackCount)
        ├── 총 재생시간 (totalDuration)
        ├── 형식 (format: MP3, FLAC, WAV)
        ├── 비트레이트 (bitrate)
        ├── 샘플레이트 (sampleRate)
        ├── 테마 (theme: 작업용, 수면용, 운동용)
        ├── 가사 포함 여부 (hasLyrics)
        └── 미리듣기 트랙 (previewTracks)
```

---

## 📚 컬렉션/번들 시스템

```
📦 컬렉션 타입 (CollectionType)
│
├── 📑 SERIES (시리즈)
│   └── 순차적 구성의 연속 콘텐츠
│       예: 소설 시리즈, 강의 시리즈
│
├── 🎁 BUNDLE (번들)
│   └── 세트 상품 (할인 적용)
│       예: 템플릿 패키지, 개발 도구 모음
│
├── 🎵 PLAYLIST (플레이리스트)
│   └── 음악 재생 목록
│       예: 작업용 BGM 모음, 테마별 음악
│
└── ✨ CURATED (큐레이션)
    └── 선별된 상품 모음
        예: 에디터 추천, 베스트셀러 모음
```

---

## 👤 사용자 유형 & 권한

```
👥 사용자 역할 (UserRole)
│
├── 👤 USER (일반 사용자)
│   ├── 상품 구매
│   ├── 리뷰 작성
│   ├── 위시리스트 관리
│   ├── 커뮤니티 참여
│   └── 튜토리얼 학습
│
├── 🏪 SELLER (판매자) [isSeller: true]
│   ├── USER 권한 포함
│   ├── 상품 등록/관리
│   ├── 컬렉션/번들 생성
│   ├── 판매 분석 대시보드
│   ├── 정산 관리
│   └── 리뷰 답변
│
├── 🎨 ARTIST (아티스트) [isVerifiedArtist: true]
│   ├── SELLER 권한 포함
│   ├── 아티스트 공개 프로필
│   ├── 팔로우 시스템
│   └── 작품 포트폴리오
│
└── 🔧 ADMIN (관리자) [role: ADMIN]
    ├── 전체 권한
    ├── 사용자 관리
    ├── 환불 처리
    ├── 정산 승인
    └── 시스템 설정
```

---

## 🔮 향후 확장 예정 카테고리

### Phase 1: 콘텐츠 확장 (예정)

```
📦 새로운 상품 타입
│
├── 🎮 GAME (게임)
│   ├── 인디 게임
│   ├── 게임 에셋
│   └── 게임 모드/플러그인
│
├── 📐 3D_MODEL (3D 모델)
│   ├── 캐릭터
│   ├── 환경/배경
│   ├── 오브젝트
│   └── 애니메이션
│
└── 🎓 COURSE (온라인 강의)
    ├── 프로그래밍
    ├── 디자인
    ├── 비즈니스
    └── 라이프스타일
```

### Phase 2: 마켓플레이스 기능 확장 (예정)

```
🛍️ 마켓플레이스 확장
│
├── 🏷️ 가격 정책
│   ├── 네임 유어 프라이스 (NAME_YOUR_PRICE)
│   ├── 구독형 (SUBSCRIPTION)
│   └── 멤버십 (MEMBERSHIP)
│
├── 🎫 프로모션
│   ├── 시즌 할인
│   └── 첫 구매 할인
│
├── 🌍 글로벌화
│   ├── 다중 통화
│   └── 지역별 가격
│
└── 🤝 협업 기능
    ├── 공동 작업 상품
    ├── 수익 분배
    └── 콜라보레이션
```

---

## 🗂️ 헤더 네비게이션 구조

```
🔝 메인 네비게이션 (5개 탭 + 검색 + 사용자 메뉴)
│
├── 🔍 검색 버튼 → /marketplace?focus=search
│   └── 마켓플레이스 검색으로 이동
│
├── 🛍️ 마켓플레이스 (/marketplace)
│   └── 상품 목록, 검색, 필터
│
├── 🎨 크리에이터 (/artists)
│   ├── 아티스트 목록
│   ├── 타입별 필터 (작가/디자이너/개발자/뮤지션 등)
│   └── 인증된 아티스트 필터
│
├── 🎓 교육 센터 (/education)
│   └── 튜토리얼, 강의, 가이드
│
├── 💬 커뮤니티 (/community)
│   └── 게시글, 토론, 질문/답변
│
├── ❓ FAQ (/faq)
│   └── 자주 묻는 질문
│
└── 👤 사용자 메뉴 [로그인 후]
    ├── 📊 대시보드
    ├── 🔔 알림 (배지 표시)
    ├── 🌐 언어 전환 (한/영)
    └── 🚪 로그아웃
```

---

## 📱 대시보드 사이드바 구조

```
📊 대시보드 네비게이션 (3개 섹션, 13개 메뉴)
│
├── ═══ 기본 메뉴 (모든 사용자) ═══
│
├── 📊 대시보드 (/dashboard)
│   └── 요약 통계, 최근 활동
│
├── 📦 내 상품 (/dashboard/products)
│   ├── 상품 목록
│   └── 상품 등록 (/dashboard/products/new)
│
├── 📚 컬렉션 (/dashboard/collections)
│   └── 번들, 시리즈, 플레이리스트
│
├── 🛒 구매 내역 (/dashboard/purchases)
│   └── 구매한 상품, 다운로드
│
├── ❤️ 찜한 상품 (/dashboard/wishlist)
│
├── 👥 팔로잉 (/dashboard/following)
│   └── 팔로우한 크리에이터
│
├── 🔔 알림 (/dashboard/notifications)
│   └── 구매, 판매, 리뷰, 시스템 알림
│
├── ═══ 판매자 전용 (isSeller: true) ═══
│
├── 📈 수익/통계 (/dashboard/analytics)
│   └── 판매 분석, 트렌드 차트, ProductType별 분석
│
├── 💰 정산 관리 (/dashboard/settlements)
│   └── 정산 내역, 출금 요청
│
├── 🎫 쿠폰 관리 (/dashboard/seller/coupons)
│   └── 할인 쿠폰 생성/관리
│
├── ═══ 계정 관리 ═══
│
├── 💳 구독 관리 (/dashboard/subscriptions)
│   └── 구독 플랜, 결제 내역
│
├── 🧪 A/B 테스트 (/dashboard/ab-tests) [판매자 전용]
│   └── 실험 관리, 결과 분석
│
└── ⚙️ 설정 (/dashboard/settings)
    ├── 프로필 수정
    ├── 알림 설정
    └── 판매자 설정
```

---

## 🔧 관리자 대시보드 구조

```
🔧 관리자 패널
│
├── 📊 대시보드 (/admin)
│   ├── 전체 통계
│   ├── 최근 가입자
│   └── 시스템 현황
│
├── � 관리자 통계 (/admin/dashboard)
│   ├── 매출 개요 (총매출, 환불률)
│   ├── 상위 판매자 순위
│   ├── 상위 상품 순위
│   ├── 카테고리별 매출
│   ├── 일별 추이 (30일)
│   ├── 결제 수단별 통계
│   └── 사용자 증가 추이
│
├── 🧪 A/B 테스트 관리 (/admin/ab-test)
│   ├── 실험 목록 (상태별 필터)
│   ├── 실험 생성 (2단계 폼)
│   ├── 일괄 작업 (시작/일시정지/보관/삭제)
│   ├── 상세 통계 조회
│   └── 승자 변형 선택
│
├── 💸 환불 관리 (/admin/refunds)
│   ├── 환불 요청 목록
│   ├── 상태별 필터
│   └── 처리/거부
│
└── 💰 정산 관리 (/admin/settlements)
    ├── 정산 요청 목록
    ├── 정산 승인
    └── 정산 완료 처리
```

---

## 📐 API 엔드포인트 구조 (80+ 엔드포인트)

```
🔌 API Routes (/api)
│
├── 🔐 인증 (/api/auth)
│   ├── /api/auth/[...nextauth] - NextAuth 인증
│   ├── /api/auth/signup - 회원가입
│   ├── /api/auth/forgot-password - 비밀번호 찾기
│   └── /api/auth/reset-password - 비밀번호 재설정
│
├── 🛍️ 상품 (/api/products)
│   ├── /api/products - 상품 CRUD
│   ├── /api/products/[id] - 상품 상세
│   ├── /api/products/[id]/download - 다운로드
│   └── /api/products/[id]/view - 조회수
│
├── 📂 카테고리 (/api/categories)
│   └── /api/categories - 카테고리 목록
│
├── 🔍 검색 (/api/search)
│   ├── /api/search/suggestions - 자동완성 (상품, 카테고리, 태그)
│   └── /api/search/popular - 인기 검색어
│
├── 📚 컬렉션 (/api/collections)
│   ├── /api/collections - 컬렉션 CRUD
│   └── /api/collections/purchase - 번들 구매
│
├── 🎁 번들 (/api/bundles)
│   └── /api/bundles - 번들 상품
│
├── 🎨 아티스트 (/api/artists)
│   └── /api/artists - 아티스트 프로필, 목록, 통계
│
├── 🏪 판매자 (/api/sellers)
│   └── /api/sellers - 판매자 프로필
│
├── 👁️ 미리보기 (/api/preview)
│   └── /api/preview - 상품별 미리보기 콘텐츠
│
├── 💰 구매/결제
│   ├── /api/purchases - 구매 내역
│   ├── /api/checkout - 결제 처리
│   ├── /api/payment/bootpay - 부트페이 결제
│   ├── /api/payment/bootpay/verify - 결제 검증
│   ├── /api/payment/bootpay/cancel - 결제 취소
│   ├── /api/payment/bootpay/webhook - 부트페이 웹훅
│   └── /api/payment/portone - PortOne 결제
│
├── 🎫 쿠폰 (/api/coupons)
│   ├── /api/coupons - 쿠폰 목록
│   ├── /api/coupons/[id] - 쿠폰 상세/수정/삭제
│   └── /api/coupons/apply - 쿠폰 적용
│
├── ⭐ 리뷰 (/api/reviews)
│   ├── /api/reviews - 리뷰 CRUD
│   ├── /api/reviews/[id]/helpful - 도움됨 투표
│   └── /api/reviews/[id]/reply - 리뷰 답글
│
├── 🔄 추천 (/api/recommendations)
│   └── /api/recommendations - 개인/글로벌/유사 추천
│
├── 👥 소셜
│   ├── /api/follows - 팔로우/언팔로우
│   ├── /api/follows/following - 팔로잉 목록
│   ├── /api/follows/feed - 팔로우 피드
│   ├── /api/wishlist - 위시리스트
│   ├── /api/wishlist/check - 위시리스트 확인
│   └── /api/reactions - 반응 (좋아요 등)
│
├── 📰 피드 (/api/feed)
│   ├── /api/feed - 개인화된 피드
│   ├── /api/feed/rss - RSS 피드
│   └── /api/feed/atom - Atom 피드
│
├── 📊 분석 (/api/analytics)
│   ├── /api/analytics - 판매 분석 데이터 (ProductType별, 기간별)
│   ├── /api/analytics/conversion - 전환율 분석
│   └── /api/analytics/reactions - 반응 분석
│
├── 💬 커뮤니티
│   ├── /api/posts - 게시글 CRUD
│   ├── /api/posts/[id]/comments - 게시글 댓글
│   ├── /api/posts/[id]/like - 게시글 좋아요
│   └── /api/unified-comments - 통합 댓글 시스템
│
├── 🎓 교육 (/api/tutorials)
│   ├── /api/tutorials - 튜토리얼 목록/상세
│   └── /api/tutorials/[id]/like - 튜토리얼 좋아요
│
├── 📝 콘텐츠 (/api/content)
│   ├── /api/content - 콘텐츠 관리
│   ├── /api/content/auto - 자동 콘텐츠
│   └── /api/content/scheduler - 콘텐츠 스케줄러
│
├── 💸 정산/환불
│   ├── /api/settlements - 정산 요청/내역
│   ├── /api/settlements/report - 기간별 정산 리포트
│   └── /api/refunds - 환불 요청/처리
│
├── 🔔 알림 (/api/notifications)
│   ├── /api/notifications - 알림 목록/읽음 처리
│   └── /api/notifications/push-subscription - 푸시 구독
│
├── 👤 사용자 (/api/user)
│   ├── /api/user/profile - 프로필 수정
│   └── /api/user/notification-settings - 알림 설정
│
├── 📤 업로드 (/api/upload)
│   ├── /api/upload - 파일 업로드
│   ├── /api/upload/cloudinary - Cloudinary 업로드
│   └── /api/upload/delete - 파일 삭제
│
├── 📥 내보내기 (/api/export)
│   ├── /api/export - 데이터 내보내기
│   ├── /api/export/purchases - 구매 내역 내보내기
│   ├── /api/export/settlements - 정산 내역 내보내기
│   └── /api/export/refunds - 환불 내역 내보내기
│
├── 🤖 챗봇 (/api/chat)
│   └── /api/chat - AI 챗봇 (Anthropic)
│
├── 🧪 A/B 테스트 (/api/ab-test)
│   ├── /api/ab-test - 실험 CRUD
│   ├── /api/ab-test/assign - 변형 할당
│   └── /api/ab-test/track - 이벤트 추적
│
├── 🔄 구독 (/api/subscriptions)
│   └── /api/subscriptions - 구독 관리
│
├── 🔌 소켓 (/api/socket)
│   └── /api/socket - WebSocket 연결
│
├── ❤️ 헬스체크 (/api/health)
│   └── /api/health - 서버 상태 확인
│
├── 🔗 웹훅 (/api/webhook)
│   └── /api/webhook/stripe - Stripe 웹훅
│
├── 📊 대시보드 (/api/dashboard)
│   └── /api/dashboard/product-stats - 상품별 통계
│
└── 🔧 관리자 (/api/admin)
    ├── /api/admin/stats - 기본 통계
    ├── /api/admin/users - 사용자 관리
    ├── /api/admin/products - 상품 관리
    ├── /api/admin/refunds - 환불 관리
    ├── /api/admin/settlements - 정산 관리
    ├── /api/admin/dashboard - 종합 통계
    ├── /api/admin/email-test - 이메일 테스트
    ├── /api/admin/ab-test - A/B 테스트 통계
    ├── /api/admin/ab-test/bulk - 일괄 작업
    └── /api/admin/ab-test/analytics - 상세 분석
```

---

## 📅 릴리즈 로드맵

```
📅 개발 진행 상황 (세션 77 기준)
│
├── ✅ Phase 1: 기본 플랫폼 (완료)
│   ├── 인증 시스템 (NextAuth + Supabase)
│   ├── 디지털 상품 마켓플레이스
│   ├── 결제 시스템 (부트페이)
│   └── 기본 대시보드
│
├── ✅ Phase 2: 커뮤니티 & 교육 (완료)
│   ├── 커뮤니티 포럼
│   ├── 튜토리얼 시스템
│   └── 리뷰/평점 시스템
│
├── ✅ Phase 3: 확장 콘텐츠 타입 (완료)
│   ├── 도서 (BOOK)
│   ├── 영상 시리즈 (VIDEO_SERIES)
│   ├── 음악 앨범 (MUSIC_ALBUM)
│   └── AI 생성 콘텐츠 태깅
│
├── ✅ Phase 4: 고급 기능 (완료)
│   ├── 컬렉션/번들 시스템
│   ├── 아티스트 프로필
│   ├── 상품 비교
│   ├── 추천 시스템
│   └── ProductType별 분석 대시보드
│
├── ✅ Phase 5: UX 개선 (완료)
│   ├── 다국어 지원 (한/영)
│   ├── 검색 자동완성 (카테고리 포함)
│   ├── 키보드 네비게이션
│   ├── 고급 필터 UI (AI 생성, 콘텐츠 유형)
│   └── 정렬 옵션 확장 (7개)
│
├── ✅ Phase 6: 결제/알림 시스템 (세션 75 완료)
│   ├── 이메일 알림 시스템 (Resend)
│   ├── 결제 완료 이메일
│   ├── 환불 알림 이메일
│   └── 이메일 템플릿 (HTML/Text)
│
├── ✅ Phase 7: 대시보드 기능 강화 (세션 76 완료)
│   ├── 관리자 종합 통계 대시보드
│   ├── 실시간 판매 알림 (Socket.io)
│   ├── 상품별 통계 위젯
│   ├── 기간별 정산 리포트
│   └── 쿠폰 관리 UI
│
├── ✅ Phase 8: A/B 테스트 관리 (세션 77 완료)
│   ├── A/B 테스트 관리 대시보드
│   ├── 실험 생성/수정/삭제
│   ├── 일괄 작업 (시작/일시정지/보관)
│   ├── 상세 통계 및 분석
│   └── 승자 변형 선택 기능
│
├── ✅ Phase 9: 코드 품질 & UX 개선 (세션 78-79 완료)
│   ├── 97개 API 라우트에 force-dynamic 추가
│   ├── logger 유틸리티 (개발 환경 전용)
│   ├── api-utils.ts (인증/페이지네이션/응답)
│   ├── config.ts (중앙 집중식 URL 관리)
│   ├── 대시보드 사이드바 완성 (11개 메뉴)
│   ├── 관리자 사이드바 추가 (5개 메뉴)
│   ├── 헤더 크리에이터 탭 추가
│   └── GitHub Actions 개선
│
├── 📋 Phase 10: 운영 지원 도구 (세션 80 예정)
│   │
│   ├── 📊 관리자/운영 효율화 (4개)
│   │   ├── 대시보드 실시간 알림
│   │   ├── 벌크 작업 도구
│   │   ├── 운영 로그 대시보드
│   │   └── CSV 가져오기
│   │
│   ├── 📈 판매자 지원 도구 (4개)
│   │   ├── 판매 리포트 이메일
│   │   ├── 재고/다운로드 제한 알림
│   │   ├── 프로모션 스케줄러
│   │   └── 경쟁 상품 분석
│   │
│   ├── 🛡️ 운영 안정성 (4개)
│   │   ├── 서버 헬스 모니터링
│   │   ├── 자동 백업 알림
│   │   ├── Rate Limiting
│   │   └── 감사 로그
│   │
│   ├── 💬 고객 지원 (2개)
│   │   ├── 문의 티켓 시스템
│   │   └── 만족도 조사
│   │
│   ├── 📢 마케팅/성장 (2개)
│   │   ├── 이메일 뉴스레터
│   │   └── 레퍼럴 시스템
│   │
│   └── 🔍 SEO 자동화 완성 (5개)
│       ├── 게시글 SEO 자동화
│       ├── 튜토리얼 SEO 강화
│       ├── 판매자 프로필 SEO
│       ├── 아티스트 프로필 SEO
│       └── 카테고리 페이지 SEO
│
└── 📋 향후 계획
    ├── 검색 콘솔 등록 (Google/Naver/Bing)
    ├── 커스텀 도메인 연결
    └── 어필리에이트 프로그램 (장기)
```

---

## 🧩 UI 컴포넌트 구조 (src/components)

```
📦 Components
│
├── 🎨 ui/ (38개 컴포넌트)
│   ├── advanced-filter.tsx      # 고급 필터 (AI 생성/콘텐츠 유형/가격대)
│   ├── ai-chatbot.tsx           # AI 챗봇 위젯
│   ├── avatar.tsx               # 아바타
│   ├── badge.tsx                # 배지
│   ├── bootpay-payment-selector.tsx  # 부트페이 결제 선택
│   ├── button.tsx               # 버튼
│   ├── card.tsx                 # 카드
│   ├── charts.tsx               # 차트 (매출, 추이)
│   ├── checkbox.tsx             # 체크박스
│   ├── comment-section.tsx      # 댓글 섹션
│   ├── dialog.tsx               # 다이얼로그/모달
│   ├── dropdown-menu.tsx        # 드롭다운 메뉴
│   ├── file-upload.tsx          # 파일 업로드
│   ├── image-upload.tsx         # 이미지 업로드
│   ├── input.tsx                # 입력 필드
│   ├── label.tsx                # 레이블
│   ├── language-switcher.tsx    # 언어 전환 (한/영)
│   ├── markdown-editor.tsx      # 마크다운 에디터
│   ├── markdown-renderer.tsx    # 마크다운 렌더러
│   ├── notification-center.tsx  # 알림 센터
│   ├── payment-method-selector.tsx  # 결제 수단 선택
│   ├── product-type-charts.tsx  # ProductType별 차트
│   ├── reaction-buttons.tsx     # 반응 버튼
│   ├── recommendation-section.tsx   # 추천 섹션
│   ├── review-section.tsx       # 리뷰 섹션
│   ├── scroll-area.tsx          # 스크롤 영역
│   ├── select.tsx               # 셀렉트박스
│   ├── seller-card.tsx          # 판매자 카드
│   ├── separator.tsx            # 구분선
│   ├── skeleton.tsx             # 스켈레톤 로딩
│   ├── slider.tsx               # 슬라이더
│   ├── switch.tsx               # 스위치 토글
│   ├── table.tsx                # 테이블
│   ├── table-of-contents.tsx    # 목차
│   ├── tabs.tsx                 # 탭
│   ├── textarea.tsx             # 텍스트영역
│   └── video-embed.tsx          # 비디오 임베드
│
├── 🏪 marketplace/ (5개 컴포넌트)
│   ├── collection-components.tsx    # 컬렉션 카드, 그리드
│   ├── compare-components.tsx       # 상품 비교
│   ├── preview-components.tsx       # 미리보기 (Book/Video/Music)
│   ├── product-meta-forms.tsx       # 상품 메타데이터 폼
│   └── recently-viewed-widget.tsx   # 최근 본 상품
│
├── 📊 dashboard/ (대시보드 컴포넌트)
│   ├── realtime-sales-widget.tsx    # 실시간 판매 알림
│   └── product-stats-widget.tsx     # 상품 통계 위젯
│
├── 🧪 admin/ (관리자 컴포넌트)
│   ├── ab-test-dashboard.tsx        # A/B 테스트 대시보드
│   ├── create-experiment-dialog.tsx # 실험 생성 다이얼로그
│   └── experiment-detail-modal.tsx  # 실험 상세 모달
│
├── 🏠 home/ (홈 페이지 컴포넌트)
│
├── 📐 layout/ (레이아웃 컴포넌트)
│   ├── Header
│   ├── Footer
│   └── Sidebar
│
├── 📢 ads/ (광고 컴포넌트)
│
└── 🔌 providers/ (Provider 컴포넌트)
    ├── SessionProvider
    ├── QueryProvider
    └── ThemeProvider
```

---

## 📊 테스트 현황

```
🧪 테스트 구조
│
├── ✅ 단위 테스트 (Jest) - 8개 파일
│   ├── src/__tests__/api/
│   │   └── categories.test.ts
│   ├── src/__tests__/components/
│   │   ├── button.test.tsx
│   │   ├── badge.test.tsx
│   │   ├── card.test.tsx
│   │   ├── input.test.tsx
│   │   └── ...
│   └── src/__tests__/hooks/
│       └── use-media-query.test.ts
│
├── ✅ E2E 테스트 (Playwright) - 9개 파일, 158개 테스트
│   ├── e2e/app.spec.ts          # 기본 앱 테스트
│   ├── e2e/api.spec.ts          # API 테스트
│   ├── e2e/auth.spec.ts         # 인증 테스트
│   ├── e2e/marketplace.spec.ts  # 마켓플레이스 테스트
│   ├── e2e/community.spec.ts    # 커뮤니티 테스트
│   ├── e2e/education.spec.ts    # 교육 테스트
│   ├── e2e/responsive.spec.ts   # 반응형 테스트
│   ├── e2e/performance.spec.ts  # 성능 테스트
│   └── e2e/accessibility.spec.ts # 접근성 테스트
│
└── 📋 테스트 스펙 (TEST_SPECS.md) - 520개 케이스
```

---

## 🔧 기술 스택

```
⚙️ 기술 스택
│
├── 🖼️ 프론트엔드
│   ├── Next.js 14.2.33 (App Router)
│   ├── React 18
│   ├── TypeScript 5
│   ├── Tailwind CSS
│   ├── Framer Motion
│   ├── Lucide Icons / Heroicons
│   └── React Query (TanStack Query)
│
├── 🔙 백엔드
│   ├── Next.js API Routes
│   ├── Prisma ORM
│   ├── Supabase PostgreSQL
│   ├── NextAuth.js
│   └── Socket.io (실시간 통신)
│
├── 💳 결제
│   └── 부트페이 (한국)
│
├── 📧 이메일
│   └── Resend (트랜잭션 이메일)
│
├── 🗄️ 스토리지
│   ├── Cloudinary (이미지)
│   └── Supabase Storage (파일)
│
├── 🤖 AI
│   └── Anthropic Claude (챗봇)
│
├── 🌍 국제화
│   └── next-intl (한/영)
│
├── 🧪 테스트
│   ├── Jest (단위 테스트)
│   └── Playwright (E2E 테스트)
│
├── 📁 공통 유틸리티 (세션 78 추가)
│   ├── src/lib/logger.ts - 개발 환경 전용 로깅
│   ├── src/lib/api-utils.ts - API 인증/페이지네이션 헬퍼
│   └── src/lib/config.ts - 중앙 집중식 URL/설정 관리
│
└── 🚀 배포
    ├── Vercel [기본]
    └── Render [현재 활성]
```

---

*이 문서는 Vibe Olympics 프로젝트의 전체 구조를 시각화합니다.*
*업데이트 시 CHANGELOG.md와 함께 관리됩니다.*
*마지막 갱신: 세션 79 (2025-12-12)*
