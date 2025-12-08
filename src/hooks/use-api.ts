"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productsApi,
  categoriesApi,
  reviewsApi,
  wishlistApi,
  purchasesApi,
  searchApi,
  uploadApi,
  notificationsApi,
  postsApi,
  tutorialsApi,
  sellersApi,
  followsApi,
  notificationSettingsApi,
  type ProductsParams,
  type ReviewsParams,
  type PostsParams,
  type TutorialsParams,
  type NotificationSettings,
} from "@/lib/api";
import type { Product } from "@/types";

// ==========================================
// 상품 훅
// ==========================================

export const useProducts = (params?: ProductsParams) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.getAll(params),
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: Partial<Product>) => productsApi.create(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

// ==========================================
// 카테고리 훅
// ==========================================

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
    staleTime: 1000 * 60 * 60, // 1시간 캐시
  });
};

// ==========================================
// 검색 훅
// ==========================================

export const useSearchSuggestions = (query: string, options?: { enabled?: boolean }) => {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: () => searchApi.getSuggestions(query),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 30, // 30초 캐시
  });
};

export const usePopularTags = (limit = 10) => {
  return useQuery({
    queryKey: ["popular-tags", limit],
    queryFn: () => searchApi.getPopular(limit),
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });
};

// ==========================================
// 리뷰 훅
// ==========================================

export const useReviews = (params: ReviewsParams) => {
  return useQuery({
    queryKey: ["reviews", params],
    queryFn: () => reviewsApi.getByProductId(params),
    enabled: !!params.productId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewsApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", { productId: variables.productId }] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.productId] });
    },
  });
};

// ==========================================
// 위시리스트 훅
// ==========================================

export const useWishlist = (page = 1, limit = 12) => {
  return useQuery({
    queryKey: ["wishlist", page, limit],
    queryFn: () => wishlistApi.getAll(page, limit),
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => wishlistApi.add(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist", "check", productId] });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist", "check", productId] });
    },
  });
};

export const useCheckWishlist = (productId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["wishlist", "check", productId],
    queryFn: () => wishlistApi.check(productId),
    enabled: !!productId && enabled,
  });
};

// ==========================================
// 판매자 훅
// ==========================================

export const useSellerProfile = (sellerId: string) => {
  return useQuery({
    queryKey: ["seller", sellerId],
    queryFn: () => sellersApi.getProfile(sellerId),
    enabled: !!sellerId,
  });
};

// ==========================================
// 팔로우 훅
// ==========================================

// 팔로우 상태 조회
export const useFollowStatus = (targetUserId: string) => {
  return useQuery({
    queryKey: ["followStatus", targetUserId],
    queryFn: () => followsApi.getStatus(targetUserId),
    enabled: !!targetUserId,
  });
};

// 팔로우/언팔로우 토글
export const useFollowToggle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) => followsApi.toggle(targetUserId),
    onSuccess: (data, targetUserId) => {
      // 팔로우 상태 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["followStatus", targetUserId] });
      // 판매자 프로필도 갱신 (팔로워 수 반영)
      queryClient.invalidateQueries({ queryKey: ["seller", targetUserId] });
      // 팔로잉 목록 갱신
      queryClient.invalidateQueries({ queryKey: ["following"] });
      // 팔로잉 피드 갱신
      queryClient.invalidateQueries({ queryKey: ["followingFeed"] });
    },
  });
};

// 팔로잉 목록 조회
export const useFollowingList = (page = 1, limit = 12) => {
  return useQuery({
    queryKey: ["following", page, limit],
    queryFn: () => followsApi.getFollowing(page, limit),
  });
};

// 팔로잉 피드 조회
export const useFollowingFeed = (page = 1, limit = 12) => {
  return useQuery({
    queryKey: ["followingFeed", page, limit],
    queryFn: () => followsApi.getFeed(page, limit),
  });
};

// ==========================================
// 구매 훅
// ==========================================

export const usePurchases = (page = 1, limit = 12, status?: string) => {
  return useQuery({
    queryKey: ["purchases", page, limit, status],
    queryFn: () => purchasesApi.getAll(page, limit, status),
  });
};

export const usePurchaseDetail = (id: string) => {
  return useQuery({
    queryKey: ["purchase", id],
    queryFn: () => purchasesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => purchasesApi.create(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
};

// 결제 체크아웃 훅 (유료 상품용)
export const useCheckout = () => {
  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "결제 세션 생성 실패");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Stripe 결제 페이지로 리다이렉트
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
};

// 특정 상품 구매 여부 확인 훅
export const useCheckPurchase = (productId: string, enabled = true) => {
  return useQuery({
    queryKey: ["purchase-check", productId],
    queryFn: () => purchasesApi.checkPurchase(productId),
    enabled: enabled && !!productId,
    staleTime: 1000 * 60, // 1분간 캐시
  });
};

// ==========================================
// 내 상품 훅 (판매자 대시보드용)
// ==========================================

export const useMyProducts = (sellerId: string | undefined, params?: Omit<ProductsParams, "sellerId">) => {
  return useQuery({
    queryKey: ["my-products", sellerId, params],
    queryFn: () => productsApi.getAll({ ...params, sellerId }),
    enabled: !!sellerId,
  });
};

// ==========================================
// 파일 업로드 훅
// ==========================================

export const useUploadFile = () => {
  return useMutation({
    mutationFn: ({
      file,
      type,
      productId,
    }: {
      file: File;
      type: "image" | "product" | "avatar";
      productId?: string;
    }) => uploadApi.upload(file, type, productId),
  });
};

export const useDeleteFile = () => {
  return useMutation({
    mutationFn: ({ bucket, path }: { bucket: string; path: string }) =>
      uploadApi.delete(bucket, path),
  });
};

// ==========================================
// 알림 훅
// ==========================================

export const useNotifications = (page = 1, limit = 20, unreadOnly = false) => {
  return useQuery({
    queryKey: ["notifications", page, limit, unreadOnly],
    queryFn: () => notificationsApi.getAll(page, limit, unreadOnly),
    refetchInterval: 30000, // 30초마다 자동 새로고침
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: async () => {
      const data = await notificationsApi.getAll(1, 1, false);
      return data.unreadCount;
    },
    refetchInterval: 30000,
  });
};

export const useMarkNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds?: string[]) => 
      notificationIds 
        ? notificationsApi.markAsRead(notificationIds)
        : notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId?: string) =>
      notificationId
        ? notificationsApi.delete(notificationId)
        : notificationsApi.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// ==========================================
// 커뮤니티 (게시글) 훅
// ==========================================

export const usePosts = (params: PostsParams = {}) => {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => postsApi.getAll(params),
  });
};

export const usePost = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["post", id],
    queryFn: () => postsApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; content: string; category: string }) =>
      postsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; content?: string; category?: string } }) =>
      postsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.id] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useTogglePostLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsApi.toggleLike(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
};

export const useComments = (postId: string, enabled = true) => {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => postsApi.getComments(postId),
    enabled: enabled && !!postId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) =>
      postsApi.createComment(postId, { content, parentId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
    },
  });
};

// ==========================================
// 튜토리얼 훅
// ==========================================

export const useTutorials = (params?: TutorialsParams) => {
  return useQuery({
    queryKey: ["tutorials", params],
    queryFn: () => tutorialsApi.getAll(params),
  });
};

export const useFeaturedTutorials = () => {
  return useQuery({
    queryKey: ["tutorials", "featured"],
    queryFn: () => tutorialsApi.getFeatured(),
  });
};

export const useTutorial = (id: string) => {
  return useQuery({
    queryKey: ["tutorial", id],
    queryFn: () => tutorialsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateTutorial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tutorialData: {
      title: string;
      description: string;
      content: string;
      type?: string;
      thumbnail?: string;
      videoUrl?: string;
      externalUrl?: string;
      duration?: string;
      tags?: string[];
    }) => tutorialsApi.create(tutorialData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorials"] });
    },
  });
};

export const useUpdateTutorial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{
      title: string;
      description: string;
      content: string;
      type: string;
      thumbnail: string;
      videoUrl: string;
      externalUrl: string;
      duration: string;
      tags: string[];
    }> }) => tutorialsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tutorials"] });
      queryClient.invalidateQueries({ queryKey: ["tutorial", variables.id] });
    },
  });
};

export const useDeleteTutorial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tutorialsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorials"] });
    },
  });
};

export const useToggleTutorialLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tutorialId: string) => tutorialsApi.toggleLike(tutorialId),
    onSuccess: (_, tutorialId) => {
      queryClient.invalidateQueries({ queryKey: ["tutorials"] });
      queryClient.invalidateQueries({ queryKey: ["tutorial", tutorialId] });
    },
  });
};

// ==========================================
// 알림 설정 훅
// ==========================================

export const useNotificationSettings = () => {
  return useQuery({
    queryKey: ["notification-settings"],
    queryFn: notificationSettingsApi.get,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) => 
      notificationSettingsApi.update(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
};
