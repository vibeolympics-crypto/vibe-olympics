/**
 * SEO 유틸리티 함수
 * 상품 등록 시 자동으로 SEO 최적화를 수행합니다
 */

import { ProductType, BookType, VideoSeriesType, MusicGenre } from "@/types";

// Slug 생성 함수 (한글 지원)
export function generateSlug(title: string): string {
  // 한글 -> 로마자 변환 (간단한 음절 변환)
  const koreanToRoman: Record<string, string> = {
    // 초성
    'ㄱ': 'g', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄹ': 'r', 'ㅁ': 'm',
    'ㅂ': 'b', 'ㅅ': 's', 'ㅇ': '', 'ㅈ': 'j', 'ㅊ': 'ch',
    'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h',
    'ㄲ': 'kk', 'ㄸ': 'tt', 'ㅃ': 'pp', 'ㅆ': 'ss', 'ㅉ': 'jj',
    // 중성
    'ㅏ': 'a', 'ㅓ': 'eo', 'ㅗ': 'o', 'ㅜ': 'u', 'ㅡ': 'eu', 'ㅣ': 'i',
    'ㅐ': 'ae', 'ㅔ': 'e', 'ㅑ': 'ya', 'ㅕ': 'yeo', 'ㅛ': 'yo', 'ㅠ': 'yu',
    'ㅒ': 'yae', 'ㅖ': 'ye', 'ㅘ': 'wa', 'ㅙ': 'wae', 'ㅚ': 'oe',
    'ㅝ': 'wo', 'ㅞ': 'we', 'ㅟ': 'wi', 'ㅢ': 'ui',
    // 종성
    'ㄱ종': 'k', 'ㄴ종': 'n', 'ㄷ종': 't', 'ㄹ종': 'l', 'ㅁ종': 'm',
    'ㅂ종': 'p', 'ㅅ종': 't', 'ㅇ종': 'ng', 'ㅈ종': 't', 'ㅊ종': 't',
    'ㅋ종': 'k', 'ㅌ종': 't', 'ㅍ종': 'p', 'ㅎ종': 't',
  };

  // 한글 문자열을 로마자로 변환하는 함수
  function romanize(text: string): string {
    const result: string[] = [];
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);
      
      // 한글 음절 (가-힣)
      if (code >= 0xAC00 && code <= 0xD7A3) {
        const syllableIndex = code - 0xAC00;
        const cho = Math.floor(syllableIndex / 588);
        const jung = Math.floor((syllableIndex % 588) / 28);
        const jong = syllableIndex % 28;
        
        const choList = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
        const jungList = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
        const jongList = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
        
        result.push(choList[cho] || '');
        result.push(jungList[jung] || '');
        result.push(jongList[jong] || '');
      }
      // 영문, 숫자
      else if (/[a-zA-Z0-9]/.test(char)) {
        result.push(char.toLowerCase());
      }
      // 공백, 하이픈
      else if (/[\s\-_]/.test(char)) {
        result.push('-');
      }
      // 그 외는 무시
    }
    
    return result.join('');
  }

  const romanized = romanize(title);
  
  return romanized
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// 메타 설명 자동 생성
export function generateMetaDescription(
  title: string,
  shortDescription: string,
  productType: ProductType,
  price: number,
  tags: string[]
): string {
  const typeNames: Record<ProductType, string> = {
    DIGITAL_PRODUCT: '디지털 상품',
    BOOK: '전자책/도서',
    VIDEO_SERIES: '영상 시리즈',
    MUSIC_ALBUM: '음악 앨범',
  };

  const priceText = price === 0 ? '무료' : `₩${price.toLocaleString()}`;
  const tagText = tags.slice(0, 3).join(', ');
  
  let description = `${title} - ${typeNames[productType]}. ${shortDescription}`;
  
  if (tagText) {
    description += ` #${tagText.replace(/,\s*/g, ' #')}`;
  }
  
  description += ` | ${priceText}`;
  
  // 메타 설명은 155자 이내가 권장
  if (description.length > 155) {
    description = description.slice(0, 152) + '...';
  }
  
  return description;
}

// 키워드 자동 생성
export function generateKeywords(
  title: string,
  shortDescription: string,
  productType: ProductType,
  tags: string[],
  category?: string
): string[] {
  const keywords = new Set<string>();
  
  // 기본 키워드
  keywords.add('Vibe Olympics');
  keywords.add('AI 콘텐츠');
  
  // 상품 타입 키워드
  const typeKeywords: Record<ProductType, string[]> = {
    DIGITAL_PRODUCT: ['디지털 상품', '디지털 템플릿', '소스코드', '디지털 다운로드'],
    BOOK: ['전자책', 'ebook', 'AI 도서', '전자출판'],
    VIDEO_SERIES: ['영상 콘텐츠', '동영상', 'AI 영상', '비디오'],
    MUSIC_ALBUM: ['음악', '음원', 'AI 음악', '앨범'],
  };
  
  typeKeywords[productType].forEach(kw => keywords.add(kw));
  
  // 태그 추가
  tags.forEach(tag => keywords.add(tag));
  
  // 카테고리 추가
  if (category) {
    keywords.add(category);
  }
  
  // 제목에서 핵심 단어 추출
  const titleWords = title.split(/\s+/).filter(w => w.length >= 2);
  titleWords.forEach(word => keywords.add(word));
  
  // 설명에서 핵심 단어 추출 (2글자 이상)
  const descWords = shortDescription.split(/\s+/).filter(w => w.length >= 2 && !/^[a-zA-Z0-9]+$/.test(w));
  descWords.slice(0, 5).forEach(word => keywords.add(word));
  
  return Array.from(keywords).slice(0, 15);
}

// JSON-LD 구조화 데이터 생성 (Product)
export function generateProductJsonLd(data: {
  title: string;
  description: string;
  shortDescription: string;
  productType: ProductType;
  price: number;
  originalPrice?: number | null;
  thumbnail?: string | null;
  images?: string[];
  slug: string;
  seller?: { name?: string | null; id: string };
  averageRating?: number;
  reviewCount?: number;
  isAiGenerated?: boolean;
  aiTool?: string | null;
}): Record<string, unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vibe-olympics.onrender.com';
  
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.title,
    description: data.shortDescription,
    image: data.images?.length ? data.images : (data.thumbnail ? [data.thumbnail] : undefined),
    url: `${baseUrl}/marketplace/${data.slug}`,
    brand: {
      '@type': 'Brand',
      name: 'Vibe Olympics',
    },
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/marketplace/${data.slug}`,
      seller: data.seller ? {
        '@type': 'Organization',
        name: data.seller.name || '익명 판매자',
      } : undefined,
    },
  };
  
  // 할인가 표시
  if (data.originalPrice && data.originalPrice > data.price) {
    (jsonLd.offers as Record<string, unknown>).priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    (jsonLd.offers as Record<string, unknown>).highPrice = data.originalPrice;
    (jsonLd.offers as Record<string, unknown>).lowPrice = data.price;
  }
  
  // 리뷰 데이터
  if (data.averageRating && data.reviewCount && data.reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.averageRating,
      reviewCount: data.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  
  // AI 생성 정보 추가
  if (data.isAiGenerated) {
    jsonLd.additionalProperty = [
      {
        '@type': 'PropertyValue',
        name: 'AI Generated',
        value: 'true',
      },
    ];
    
    if (data.aiTool) {
      (jsonLd.additionalProperty as unknown[]).push({
        '@type': 'PropertyValue',
        name: 'AI Tool',
        value: data.aiTool,
      });
    }
  }
  
  return jsonLd;
}

// 도서용 JSON-LD 생성
export function generateBookJsonLd(data: {
  title: string;
  shortDescription: string;
  thumbnail?: string | null;
  slug: string;
  price: number;
  bookMeta?: {
    author?: string | null;
    publisher?: string | null;
    isbn?: string | null;
    pageCount?: number | null;
    language?: string;
    bookType?: BookType;
  };
}): Record<string, unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vibe-olympics.onrender.com';
  
  const bookTypeToFormat: Record<BookType, string> = {
    EBOOK: 'EBook',
    COMIC: 'GraphicNovel',
    PICTURE_BOOK: 'EBook',
    AUDIO_BOOK: 'Audiobook',
    PRINT_BOOK: 'Paperback',
  };
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: data.title,
    description: data.shortDescription,
    image: data.thumbnail,
    url: `${baseUrl}/marketplace/${data.slug}`,
    author: data.bookMeta?.author ? {
      '@type': 'Person',
      name: data.bookMeta.author,
    } : undefined,
    publisher: data.bookMeta?.publisher ? {
      '@type': 'Organization',
      name: data.bookMeta.publisher,
    } : undefined,
    isbn: data.bookMeta?.isbn,
    numberOfPages: data.bookMeta?.pageCount,
    inLanguage: data.bookMeta?.language || 'ko',
    bookFormat: data.bookMeta?.bookType ? bookTypeToFormat[data.bookMeta.bookType] : 'EBook',
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
    },
  };
}

// 영상용 JSON-LD 생성
export function generateVideoJsonLd(data: {
  title: string;
  shortDescription: string;
  thumbnail?: string | null;
  slug: string;
  videoMeta?: {
    director?: string | null;
    duration?: number | null;
    episodes?: number | null;
    videoType?: VideoSeriesType;
    trailerUrl?: string | null;
    genre?: string[];
  };
}): Record<string, unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vibe-olympics.onrender.com';
  
  const videoTypeToSchema: Record<VideoSeriesType, string> = {
    MOVIE: 'Movie',
    ANIMATION: 'Movie',
    DOCUMENTARY: 'Movie',
    SHORT_FILM: 'VideoObject',
    SERIES: 'TVSeries',
  };
  
  const schemaType = data.videoMeta?.videoType ? videoTypeToSchema[data.videoMeta.videoType] : 'VideoObject';
  
  return {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: data.title,
    description: data.shortDescription,
    thumbnailUrl: data.thumbnail,
    url: `${baseUrl}/marketplace/${data.slug}`,
    director: data.videoMeta?.director ? {
      '@type': 'Person',
      name: data.videoMeta.director,
    } : undefined,
    duration: data.videoMeta?.duration ? `PT${data.videoMeta.duration}M` : undefined,
    numberOfEpisodes: data.videoMeta?.episodes,
    trailer: data.videoMeta?.trailerUrl ? {
      '@type': 'VideoObject',
      url: data.videoMeta.trailerUrl,
    } : undefined,
    genre: data.videoMeta?.genre,
  };
}

// 음악용 JSON-LD 생성
export function generateMusicJsonLd(data: {
  title: string;
  shortDescription: string;
  thumbnail?: string | null;
  slug: string;
  price: number;
  musicMeta?: {
    artist?: string | null;
    trackCount?: number | null;
    totalDuration?: number | null;
    genre?: MusicGenre;
    albumType?: string | null;
  };
}): Record<string, unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vibe-olympics.onrender.com';
  
  const genreNames: Record<MusicGenre, string> = {
    POP: 'Pop',
    ROCK: 'Rock',
    HIPHOP: 'Hip Hop',
    RNB: 'R&B',
    ELECTRONIC: 'Electronic',
    CLASSICAL: 'Classical',
    JAZZ: 'Jazz',
    AMBIENT: 'Ambient',
    SOUNDTRACK: 'Soundtrack',
    WORLD: 'World Music',
    OTHER: 'Other',
  };
  
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: data.title,
    description: data.shortDescription,
    image: data.thumbnail,
    url: `${baseUrl}/marketplace/${data.slug}`,
    byArtist: data.musicMeta?.artist ? {
      '@type': 'MusicGroup',
      name: data.musicMeta.artist,
    } : undefined,
    numTracks: data.musicMeta?.trackCount,
    duration: data.musicMeta?.totalDuration ? `PT${data.musicMeta.totalDuration}M` : undefined,
    genre: data.musicMeta?.genre ? genreNames[data.musicMeta.genre] : undefined,
    albumReleaseType: data.musicMeta?.albumType || 'AlbumRelease',
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
    },
  };
}

// Open Graph 메타 데이터 생성
export function generateOpenGraphMeta(data: {
  title: string;
  shortDescription: string;
  thumbnail?: string | null;
  productType: ProductType;
  price: number;
  slug: string;
}): Record<string, string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vibe-olympics.onrender.com';
  
  const typeNames: Record<ProductType, string> = {
    DIGITAL_PRODUCT: '디지털 상품',
    BOOK: '도서',
    VIDEO_SERIES: '영상',
    MUSIC_ALBUM: '음악',
  };
  
  return {
    'og:title': `${data.title} | Vibe Olympics ${typeNames[data.productType]}`,
    'og:description': data.shortDescription,
    'og:type': 'product',
    'og:url': `${baseUrl}/marketplace/${data.slug}`,
    'og:image': data.thumbnail || `${baseUrl}/og-default.png`,
    'og:site_name': 'Vibe Olympics',
    'og:locale': 'ko_KR',
    'product:price:amount': data.price.toString(),
    'product:price:currency': 'KRW',
  };
}

// Twitter Card 메타 데이터 생성
export function generateTwitterMeta(data: {
  title: string;
  shortDescription: string;
  thumbnail?: string | null;
}): Record<string, string> {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': data.title,
    'twitter:description': data.shortDescription,
    'twitter:image': data.thumbnail || '',
  };
}

// SEO 데이터 일괄 생성
export function generateSeoData(data: {
  title: string;
  shortDescription: string;
  description: string;
  productType: ProductType;
  price: number;
  originalPrice?: number | null;
  thumbnail?: string | null;
  images?: string[];
  tags: string[];
  category?: string;
  seller?: { name?: string | null; id: string };
  averageRating?: number;
  reviewCount?: number;
  isAiGenerated?: boolean;
  aiTool?: string | null;
  bookMeta?: Parameters<typeof generateBookJsonLd>[0]['bookMeta'];
  videoMeta?: Parameters<typeof generateVideoJsonLd>[0]['videoMeta'];
  musicMeta?: Parameters<typeof generateMusicJsonLd>[0]['musicMeta'];
}): {
  slug: string;
  metaDescription: string;
  keywords: string[];
  jsonLd: Record<string, unknown>;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
} {
  const slug = generateSlug(data.title);
  const metaDescription = generateMetaDescription(
    data.title,
    data.shortDescription,
    data.productType,
    data.price,
    data.tags
  );
  const keywords = generateKeywords(
    data.title,
    data.shortDescription,
    data.productType,
    data.tags,
    data.category
  );
  
  // 상품 타입에 따른 JSON-LD 생성
  let jsonLd: Record<string, unknown>;
  
  switch (data.productType) {
    case 'BOOK':
      jsonLd = generateBookJsonLd({
        title: data.title,
        shortDescription: data.shortDescription,
        thumbnail: data.thumbnail,
        slug,
        price: data.price,
        bookMeta: data.bookMeta,
      });
      break;
    case 'VIDEO_SERIES':
      jsonLd = generateVideoJsonLd({
        title: data.title,
        shortDescription: data.shortDescription,
        thumbnail: data.thumbnail,
        slug,
        videoMeta: data.videoMeta,
      });
      break;
    case 'MUSIC_ALBUM':
      jsonLd = generateMusicJsonLd({
        title: data.title,
        shortDescription: data.shortDescription,
        thumbnail: data.thumbnail,
        slug,
        price: data.price,
        musicMeta: data.musicMeta,
      });
      break;
    default:
      jsonLd = generateProductJsonLd({
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        productType: data.productType,
        price: data.price,
        originalPrice: data.originalPrice,
        thumbnail: data.thumbnail,
        images: data.images,
        slug,
        seller: data.seller,
        averageRating: data.averageRating,
        reviewCount: data.reviewCount,
        isAiGenerated: data.isAiGenerated,
        aiTool: data.aiTool,
      });
  }
  
  const openGraph = generateOpenGraphMeta({
    title: data.title,
    shortDescription: data.shortDescription,
    thumbnail: data.thumbnail,
    productType: data.productType,
    price: data.price,
    slug,
  });
  
  const twitter = generateTwitterMeta({
    title: data.title,
    shortDescription: data.shortDescription,
    thumbnail: data.thumbnail,
  });
  
  return {
    slug,
    metaDescription,
    keywords,
    jsonLd,
    openGraph,
    twitter,
  };
}
