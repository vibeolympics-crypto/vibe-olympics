// ==========================================
// User Types
// ==========================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  isSeller: boolean;
  sellerVerified: boolean;
  sellerBio: string | null;
  totalSales: number;
  totalRevenue: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Product Types
// ==========================================

export type PricingType = "FREE" | "PAID";
export type LicenseType = "PERSONAL" | "COMMERCIAL" | "EXTENDED";
export type ProductStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SUSPENDED";
export type ProductType = "DIGITAL_PRODUCT" | "BOOK" | "VIDEO_SERIES" | "MUSIC_ALBUM";

// 도서 타입
export type BookType = "EBOOK" | "COMIC" | "PICTURE_BOOK" | "PRINT_BOOK" | "AUDIO_BOOK";

// 영상 시리즈 타입
export type VideoSeriesType = "MOVIE" | "ANIMATION" | "DOCUMENTARY" | "SHORT_FILM" | "SERIES";

// 음악 장르
export type MusicGenre = "POP" | "ROCK" | "HIPHOP" | "RNB" | "ELECTRONIC" | "CLASSICAL" | "JAZZ" | "AMBIENT" | "SOUNDTRACK" | "WORLD" | "OTHER";

export interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  productType: ProductType;
  categoryId: string;
  sellerId: string;
  pricingType: PricingType;
  price: number;
  originalPrice: number | null;
  licenseType: LicenseType;
  thumbnail: string | null;
  thumbnailUrl?: string | null; // API 응답에서 반환되는 필드
  images: string[];
  previewUrl: string | null;
  tags: string[];
  features: string[];
  techStack: string[];
  // AI 생성 정보
  isAiGenerated: boolean;
  aiTool: string | null;
  aiPrompt: string | null;
  status: ProductStatus;
  isPublished: boolean;
  publishedAt: Date | null;
  viewCount: number;
  salesCount: number;
  downloadCount: number;
  averageRating: number;
  rating?: number; // API 응답에서 반환되는 필드 (averageRating의 별칭)
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  category?: Category;
  seller?: User;
  files?: ProductFile[];
  reviews?: Review[];
  bookMeta?: BookMeta;
  videoSeriesMeta?: VideoSeriesMeta;
  musicAlbumMeta?: MusicAlbumMeta;
  _count?: {
    reviews: number;
    wishlists: number;
    purchases: number;
  };
}

// 도서 메타데이터
export interface BookMeta {
  id: string;
  productId: string;
  bookType: BookType;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  pageCount: number | null;
  chapters: number | null;
  language: string;
  format: string[];
  ageRating: string | null;
  seriesName: string | null;
  seriesOrder: number | null;
  sampleUrl: string | null;
}

// 영상 시리즈 메타데이터
export interface VideoSeriesMeta {
  id: string;
  productId: string;
  videoType: VideoSeriesType;
  director: string | null;
  cast: string[];
  duration: number | null;
  episodes: number | null;
  seasons: number | null;
  resolution: string | null;
  audioFormat: string | null;
  subtitles: string[];
  ageRating: string | null;
  genre: string[];
  trailerUrl: string | null;
  seriesName: string | null;
  seriesOrder: number | null;
}

// 음악 앨범 메타데이터
export interface MusicAlbumMeta {
  id: string;
  productId: string;
  artist: string | null;
  albumType: string | null;
  genre: MusicGenre;
  subGenre: string | null;
  mood: string[];
  trackCount: number | null;
  totalDuration: number | null;
  format: string[];
  bitrate: string | null;
  sampleRate: string | null;
  theme: string | null;
  hasLyrics: boolean;
  isInstrumental: boolean;
  previewTracks: string[];
}

export interface ProductFile {
  id: string;
  productId: string;
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: Date;
}

// ==========================================
// Category Types
// ==========================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  parentId: string | null;
  productType: ProductType;
  createdAt: Date;
  updatedAt: Date;
  parent?: Category;
  children?: Category[];
  _count?: {
    products: number;
  };
}

// ==========================================
// Review Types
// ==========================================

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string | null;
  content: string;
  helpfulCount: number;
  sellerReply: string | null;
  sellerRepliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  product?: Product;
}

// ==========================================
// Purchase Types
// ==========================================

export type PurchaseStatus = "PENDING" | "COMPLETED" | "REFUNDED" | "CANCELLED";

export interface Purchase {
  id: string;
  buyerId: string;
  productId: string;
  amount: number;
  price?: number; // amount의 별칭 (편의를 위해)
  currency: string;
  paymentMethod: string | null;
  paymentId: string | null;
  status: PurchaseStatus;
  downloadCount: number;
  lastDownloadAt: Date | null;
  hasReviewed?: boolean; // 리뷰 작성 여부
  createdAt: Date;
  updatedAt: Date;
  buyer?: User;
  product?: Product;
}

// ==========================================
// Wishlist Types
// ==========================================

export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
  user?: User;
  product?: Product;
}

// ==========================================
// Notification Types
// ==========================================

export type NotificationType = "PURCHASE" | "SALE" | "REVIEW" | "SYSTEM" | "PROMOTION";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

// ==========================================
// Educational Content Types (for future)
// ==========================================

export type ContentType = "TUTORIAL" | "MAKING_STORY" | "TIPS" | "EXTERNAL_LINK";

export interface EducationalContent {
  id: string;
  userId: string;
  productId: string | null;
  title: string;
  content: string;
  type: ContentType;
  thumbnailUrl: string | null;
  isApproved: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  product?: Product;
}

// ==========================================
// Community Types (for future)
// ==========================================

export type PostCategory = "FREE" | "QA" | "FEEDBACK" | "NOTICE";

export interface Post {
  id: string;
  userId: string;
  category: PostCategory;
  title: string;
  content: string;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  user?: User;
}

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
