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

export interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  sellerId: string;
  pricingType: PricingType;
  price: number;
  originalPrice: number | null;
  licenseType: LicenseType;
  thumbnail: string | null;
  thumbnailUrl?: string | null; // API 응답에서 반환되는 필드
  images: string[];
  tags: string[];
  features: string[];
  techStack: string[];
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
  _count?: {
    reviews: number;
    wishlists: number;
    purchases: number;
  };
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
  createdAt: Date;
  updatedAt: Date;
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
