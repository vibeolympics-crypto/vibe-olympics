import axios from "axios";
import type {
  Product,
  Category,
  Review,
  Purchase,
  Wishlist,
} from "@/types";

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// 상품 API
// ==========================================

export interface ProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: "latest" | "popular" | "rating" | "price-low" | "price-high";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  pricingType?: "FREE" | "PAID";
  isFree?: boolean;
  sellerId?: string;
  productType?: string; // DIGITAL_PRODUCT, BOOK, VIDEO_SERIES, MUSIC_ALBUM
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalCount: number;
    totalPages: number;
  };
}

export const productsApi = {
  // 상품 목록 조회
  getAll: async (params?: ProductsParams): Promise<ProductsResponse> => {
    const { data } = await api.get("/products", { params });
    return data;
  },

  // 상품 상세 조회
  getById: async (id: string): Promise<{ product: Product }> => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  // 상품 생성
  create: async (productData: Partial<Product>): Promise<{ product: Product }> => {
    const { data } = await api.post("/products", productData);
    return data;
  },

  // 상품 수정
  update: async (id: string, productData: Partial<Product>): Promise<{ product: Product }> => {
    const { data } = await api.put(`/products/${id}`, productData);
    return data;
  },

  // 상품 삭제
  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },
};

// ==========================================
// 카테고리 API
// ==========================================

export type CategoriesResponse = (Category & { _count?: { products: number } })[];

export const categoriesApi = {
  getAll: async (): Promise<CategoriesResponse> => {
    const { data } = await api.get("/categories");
    return data.categories || data;
  },
};

// ==========================================
// 검색 API
// ==========================================

export interface SearchSuggestionsResponse {
  products: { id: string; title: string; thumbnail?: string | null; price: number; category?: string; categorySlug?: string }[];
  categories: { id: string; name: string; slug: string; productCount: number }[];
  tags: string[];
}

export interface PopularTagsResponse {
  tags: { tag: string; count: number }[];
  categories: { id: string; name: string; slug: string; productCount: number }[];
}

export const searchApi = {
  // 검색 자동완성
  getSuggestions: async (query: string, limit = 5): Promise<SearchSuggestionsResponse> => {
    const { data } = await api.get("/search/suggestions", {
      params: { q: query, limit },
    });
    return data;
  },

  // 인기 태그/검색어
  getPopular: async (limit = 10): Promise<PopularTagsResponse> => {
    const { data } = await api.get("/search/popular", { params: { limit } });
    return data;
  },
};

// ==========================================
// 리뷰 API
// ==========================================

export interface ReviewsParams {
  productId: string;
  page?: number;
  limit?: number;
  sort?: "latest" | "helpful" | "rating-high" | "rating-low";
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
  };
}

export const reviewsApi = {
  getByProductId: async (params: ReviewsParams): Promise<ReviewsResponse> => {
    const { data } = await api.get("/reviews", { params });
    return data;
  },

  create: async (reviewData: {
    productId: string;
    rating: number;
    title?: string;
    content: string;
  }): Promise<{ review: Review }> => {
    const { data } = await api.post("/reviews", reviewData);
    return data;
  },
};

// ==========================================
// 위시리스트 API
// ==========================================

export interface WishlistResponse {
  wishlists: Wishlist[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const wishlistApi = {
  getAll: async (page = 1, limit = 12): Promise<WishlistResponse> => {
    const { data } = await api.get("/wishlist", { params: { page, limit } });
    return data;
  },

  add: async (productId: string): Promise<{ wishlist: Wishlist }> => {
    const { data } = await api.post("/wishlist", { productId });
    return data;
  },

  remove: async (productId: string): Promise<{ message: string }> => {
    const { data } = await api.delete("/wishlist", { params: { productId } });
    return data;
  },

  check: async (productId: string): Promise<{ isWishlisted: boolean }> => {
    const { data } = await api.get("/wishlist/check", { params: { productId } });
    return data;
  },
};

// ==========================================
// 판매자 API
// ==========================================

export interface SellerProfile {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  joinedAt: string;
  productCount: number;
  totalSales: number;
  followerCount: number;
}

export interface SellerStats {
  totalSales: number;
  averageRating: number;
  totalReviews: number;
}

export interface SellerProduct {
  id: string;
  title: string;
  shortDescription: string;
  thumbnail: string | null;
  price: number;
  originalPrice: number | null;
  pricingType: string;
  averageRating: number;
  reviewCount: number;
  salesCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
}

export interface SellerProfileResponse {
  seller: SellerProfile;
  stats: SellerStats;
  products: SellerProduct[];
}

export const sellersApi = {
  getProfile: async (id: string): Promise<SellerProfileResponse> => {
    const { data } = await api.get(`/sellers/${id}`);
    return data;
  },
};

// ==========================================
// 팔로우 API
// ==========================================

export interface FollowStatusResponse {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
}

export interface FollowToggleResponse {
  action: "followed" | "unfollowed";
  isFollowing: boolean;
  followerCount: number;
  message: string;
}

export interface FollowingSeller {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  isSeller: boolean;
  joinedAt: string;
  followedAt: string;
  productCount: number;
  followerCount: number;
  averageRating: number;
  totalSales: number;
}

export interface FollowingListResponse {
  following: FollowingSeller[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FollowingFeedProduct {
  id: string;
  title: string;
  shortDescription: string;
  thumbnail: string | null;
  price: number;
  originalPrice: number | null;
  pricingType: string;
  averageRating: number;
  reviewCount: number;
  salesCount: number;
  createdAt: string;
  category: { id: string; name: string; slug: string };
  seller: { id: string; name: string | null; image: string | null };
}

export interface FollowingFeedResponse {
  products: FollowingFeedProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const followsApi = {
  // 팔로우 상태 조회
  getStatus: async (targetUserId: string): Promise<FollowStatusResponse> => {
    const { data } = await api.get("/follows", { params: { targetUserId } });
    return data;
  },

  // 팔로우/언팔로우 토글
  toggle: async (targetUserId: string): Promise<FollowToggleResponse> => {
    const { data } = await api.post("/follows", { targetUserId });
    return data;
  },

  // 팔로잉 목록 조회
  getFollowing: async (page = 1, limit = 12): Promise<FollowingListResponse> => {
    const { data } = await api.get("/follows/following", { params: { page, limit } });
    return data;
  },

  // 팔로잉 피드 조회
  getFeed: async (page = 1, limit = 12): Promise<FollowingFeedResponse> => {
    const { data } = await api.get("/follows/feed", { params: { page, limit } });
    return data;
  },
};

// ==========================================
// 구매 API
// ==========================================

export interface PurchasesResponse {
  purchases: Purchase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PurchaseCheckResponse {
  purchased: boolean;
  purchase: {
    id: string;
    purchasedAt: string;
    files: Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      url: string;
    }>;
  } | null;
}

export interface PurchaseDetailReceipt {
  orderNumber: string;
  paymentDate: string;
  paymentMethod: string;
  paymentId: string | null;
  amount: number;
  buyerEmail: string;
  sellerName: string;
  productTitle: string;
  licenseType: string;
}

export interface PurchaseDetail {
  id: string;
  status: string;
  price: number;
  paymentMethod: string | null;
  paymentId: string | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    title: string;
    shortDescription: string;
    thumbnailUrl: string | null;
    price: number;
    pricingType: string;
    licenseType: string;
    category: { id: string; name: string; slug: string } | null;
    seller: { id: string; name: string; image: string | null; email: string };
    files: Array<{ id: string; name: string; size: number; type: string; url: string }>;
  };
  review: {
    id: string;
    rating: number;
    title: string | null;
    content: string;
    createdAt: string;
  } | null;
  downloadHistory: Array<{
    id: string;
    downloadedAt: string;
    fileId: string | null;
    fileName: string;
  }>;
  receipt: PurchaseDetailReceipt;
}

export const purchasesApi = {
  getAll: async (page = 1, limit = 12, status?: string): Promise<PurchasesResponse> => {
    const { data } = await api.get("/purchases", { params: { page, limit, status } });
    return data;
  },

  // 구매 상세 조회
  getById: async (id: string): Promise<{ purchase: PurchaseDetail }> => {
    const { data } = await api.get(`/purchases/${id}`);
    return data;
  },

  // 특정 상품 구매 여부 확인
  checkPurchase: async (productId: string): Promise<PurchaseCheckResponse> => {
    const { data } = await api.get("/purchases", { params: { productId } });
    return data;
  },

  create: async (productId: string): Promise<{ purchase: Purchase }> => {
    const { data } = await api.post("/purchases", { productId });
    return data;
  },
};

// ==========================================
// 인증 API
// ==========================================

export const authApi = {
  signup: async (userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ message: string; user: { id: string; name: string; email: string } }> => {
    const { data } = await api.post("/auth/signup", userData);
    return data;
  },
};

// ==========================================
// 알림 API
// ==========================================

export interface Notification {
  id: string;
  userId: string;
  type: "PURCHASE" | "SALE" | "REVIEW" | "SYSTEM" | "PROMOTION";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const notificationsApi = {
  // 알림 목록 조회
  getAll: async (page = 1, limit = 20, unreadOnly = false): Promise<NotificationsResponse> => {
    const { data } = await api.get("/notifications", { 
      params: { page, limit, unreadOnly } 
    });
    return data;
  },

  // 모든 알림 읽음 처리
  markAllAsRead: async (): Promise<{ message: string }> => {
    const { data } = await api.patch("/notifications", {
      action: "markAllAsRead",
    });
    return data;
  },

  // 특정 알림들 읽음 처리
  markAsRead: async (notificationIds: string[]): Promise<{ message: string }> => {
    const { data } = await api.patch("/notifications", {
      action: "markAsRead",
      notificationIds,
    });
    return data;
  },

  // 특정 알림 삭제
  delete: async (notificationId: string): Promise<{ message: string }> => {
    const { data } = await api.delete("/notifications", {
      params: { id: notificationId },
    });
    return data;
  },

  // 모든 알림 삭제
  deleteAll: async (): Promise<{ message: string }> => {
    const { data } = await api.delete("/notifications", {
      params: { all: true },
    });
    return data;
  },
};

// ==========================================
// 파일 업로드 API
// ==========================================

export interface UploadResponse {
  success: boolean;
  file: {
    name: string;
    size: number;
    type: string;
    path: string;
    url: string;
  };
}

export const uploadApi = {
  // 파일 업로드
  upload: async (
    file: File,
    type: "image" | "product" | "avatar",
    productId?: string
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    if (productId) {
      formData.append("productId", productId);
    }

    const { data } = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  // 파일 삭제
  delete: async (bucket: string, path: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.delete("/upload", {
      params: { bucket, path },
    });
    return data;
  },
};

// ==========================================
// 커뮤니티 (게시글) API
// ==========================================

export interface Post {
  id: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    isSeller: boolean;
  };
  category: "FREE" | "QA" | "FEEDBACK" | "NOTICE";
  title: string;
  content: string;
  viewCount: number;
  likeCount: number;
  commentCount?: number;
  isPinned: boolean;
  isDeleted: boolean;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    isSeller: boolean;
  };
  postId: string;
  parentId: string | null;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface PostsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: "latest" | "popular" | "views";
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const postsApi = {
  // 게시글 목록 조회
  getAll: async (params?: PostsParams): Promise<PostsResponse> => {
    const { data } = await api.get("/posts", { params });
    return data;
  },

  // 게시글 상세 조회
  getById: async (id: string): Promise<{ post: Post & { comments: Comment[] } }> => {
    const { data } = await api.get(`/posts/${id}`);
    return data;
  },

  // 게시글 생성
  create: async (postData: {
    title: string;
    content: string;
    category: string;
  }): Promise<{ post: Post }> => {
    const { data } = await api.post("/posts", postData);
    return data;
  },

  // 게시글 수정
  update: async (
    id: string,
    postData: Partial<{ title: string; content: string; category: string }>
  ): Promise<{ post: Post }> => {
    const { data } = await api.patch(`/posts/${id}`, postData);
    return data;
  },

  // 게시글 삭제
  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/posts/${id}`);
    return data;
  },

  // 좋아요 토글
  toggleLike: async (id: string): Promise<{ liked: boolean; likeCount: number }> => {
    const { data } = await api.post(`/posts/${id}/like`);
    return data;
  },

  // 댓글 목록 조회
  getComments: async (postId: string): Promise<{ comments: Comment[] }> => {
    const { data } = await api.get(`/posts/${postId}/comments`);
    return data;
  },

  // 댓글 생성
  createComment: async (
    postId: string,
    commentData: { content: string; parentId?: string }
  ): Promise<{ comment: Comment }> => {
    const { data } = await api.post(`/posts/${postId}/comments`, commentData);
    return data;
  },

  // 댓글 삭제
  deleteComment: async (postId: string, commentId: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/posts/${postId}/comments`, {
      params: { commentId },
    });
    return data;
  },
};

// ==========================================
// 튜토리얼 API
// ==========================================

export interface Tutorial {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  type: "tutorial" | "making" | "tips" | "external";
  thumbnail: string | null;
  videoUrl: string | null;
  externalUrl: string | null;
  duration: string | null;
  tags: string[];
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  isLiked?: boolean;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    bio?: string | null;
  };
  createdAt: string;
}

export interface TutorialsParams {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  featured?: boolean;
}

export interface TutorialsResponse {
  tutorials: Tutorial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const tutorialsApi = {
  // 튜토리얼 목록 조회
  getAll: async (params?: TutorialsParams): Promise<TutorialsResponse> => {
    const { data } = await api.get("/tutorials", { params });
    return data;
  },

  // 추천 튜토리얼 조회
  getFeatured: async (): Promise<TutorialsResponse> => {
    const { data } = await api.get("/tutorials", { params: { featured: true, limit: 3 } });
    return data;
  },

  // 튜토리얼 상세 조회
  getById: async (id: string): Promise<{ tutorial: Tutorial }> => {
    const { data } = await api.get(`/tutorials/${id}`);
    return data;
  },

  // 튜토리얼 생성
  create: async (tutorialData: {
    title: string;
    description: string;
    content: string;
    type?: string;
    thumbnail?: string;
    videoUrl?: string;
    externalUrl?: string;
    duration?: string;
    tags?: string[];
  }): Promise<{ tutorial: Tutorial }> => {
    const { data } = await api.post("/tutorials", tutorialData);
    return data;
  },

  // 튜토리얼 수정
  update: async (
    id: string,
    tutorialData: Partial<{
      title: string;
      description: string;
      content: string;
      type: string;
      thumbnail: string;
      videoUrl: string;
      externalUrl: string;
      duration: string;
      tags: string[];
    }>
  ): Promise<{ tutorial: Tutorial }> => {
    const { data } = await api.patch(`/tutorials/${id}`, tutorialData);
    return data;
  },

  // 튜토리얼 삭제
  delete: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/tutorials/${id}`);
    return data;
  },

  // 좋아요 토글
  toggleLike: async (id: string): Promise<{ isLiked: boolean; likeCount: number }> => {
    const { data } = await api.post(`/tutorials/${id}/like`);
    return data;
  },
};

// ==========================================
// 알림 설정 API
// ==========================================

export interface NotificationSettings {
  email: {
    sales: boolean;
    reviews: boolean;
    purchases: boolean;
    marketing: boolean;
    community: boolean;
    followers: boolean;
    newsletter: boolean;
  };
  push: {
    sales: boolean;
    reviews: boolean;
    purchases: boolean;
    marketing: boolean;
    community: boolean;
    followers: boolean;
    mentions: boolean;
  };
}

export interface NotificationSettingsResponse {
  settings: NotificationSettings;
}

export const notificationSettingsApi = {
  // 알림 설정 조회
  get: async (): Promise<NotificationSettingsResponse> => {
    const { data } = await api.get("/user/notification-settings");
    return data;
  },

  // 알림 설정 업데이트
  update: async (settings: Partial<NotificationSettings>): Promise<NotificationSettingsResponse & { message: string }> => {
    const { data } = await api.patch("/user/notification-settings", { settings });
    return data;
  },
};

export default api;
