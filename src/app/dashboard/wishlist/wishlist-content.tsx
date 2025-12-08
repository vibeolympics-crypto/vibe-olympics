"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Heart,
  ShoppingCart,
  Star,
  Download,
  Search,
  HeartOff,
  Loader2,
  Grid3X3,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  X,
  Package,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { useWishlist, useRemoveFromWishlist, useCreatePurchase, useCheckout, useCategories } from "@/hooks/use-api";
import type { Wishlist } from "@/types";

type SortOption = "latest" | "oldest" | "price-low" | "price-high" | "rating" | "sales";
type ViewMode = "grid" | "list";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "price-low", label: "가격 낮은순" },
  { value: "price-high", label: "가격 높은순" },
  { value: "rating", label: "평점 높은순" },
  { value: "sales", label: "판매량순" },
];

export function WishlistContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const { data, isLoading, error } = useWishlist(page, 50); // 정렬/필터를 위해 더 많이 가져옴
  const { data: categoriesData } = useCategories();
  const removeFromWishlistMutation = useRemoveFromWishlist();
  const createPurchaseMutation = useCreatePurchase();
  const checkoutMutation = useCheckout();
  const router = useRouter();

  // wishlists를 useMemo로 래핑하여 안정적인 참조 보장
  const wishlists = useMemo(() => data?.wishlists || [], [data?.wishlists]);
  const categories = categoriesData || [];

  // 필터링 및 정렬 로직
  const processedWishlist = useMemo(() => {
    let filtered = [...wishlists];

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.product?.title?.toLowerCase().includes(query) ||
        item.product?.shortDescription?.toLowerCase().includes(query)
      );
    }

    // 카테고리 필터
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.product?.categoryId === selectedCategory);
    }

    // 정렬
    filtered.sort((a, b) => {
      const productA = a.product;
      const productB = b.product;
      
      switch (sortBy) {
        case "latest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "price-low":
          return (productA?.price || 0) - (productB?.price || 0);
        case "price-high":
          return (productB?.price || 0) - (productA?.price || 0);
        case "rating":
          return (productB?.averageRating || 0) - (productA?.averageRating || 0);
        case "sales":
          return (productB?.salesCount || 0) - (productA?.salesCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [wishlists, searchQuery, selectedCategory, sortBy]);

  // 카테고리별 개수 계산
  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = {};
    wishlists.forEach((item) => {
      const catId = item.product?.categoryId;
      if (catId) {
        counts[catId] = (counts[catId] || 0) + 1;
      }
    });
    return counts;
  }, [wishlists]);

  const handleRemoveFromWishlist = async (productId: string, productTitle: string) => {
    try {
      await removeFromWishlistMutation.mutateAsync(productId);
      toast.success('위시리스트에서 제거되었습니다', {
        description: productTitle,
      });
    } catch (error) {
      console.error("위시리스트 삭제 실패:", error);
      toast.error('위시리스트에서 삭제하는 중 오류가 발생했습니다');
    }
  };

  const handlePurchase = async (productId: string, productTitle: string, price: number, isFree: boolean) => {
    try {
      if (isFree) {
        // 무료 상품: 바로 구매 처리
        await createPurchaseMutation.mutateAsync(productId);
        toast.success('무료 상품을 받았습니다! 🎁', {
          description: productTitle,
          action: {
            label: '다운로드하기',
            onClick: () => router.push('/dashboard/purchases'),
          },
        });
        // 위시리스트에서 제거
        await removeFromWishlistMutation.mutateAsync(productId);
      } else {
        // 유료 상품: Stripe 결제 페이지로 이동
        toast.loading('결제 페이지로 이동 중...');
        await checkoutMutation.mutateAsync(productId);
      }
    } catch (error) {
      console.error("구매 실패:", error);
      const errorMessage = error instanceof Error ? error.message : '구매 중 오류가 발생했습니다';
      toast.error(errorMessage);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSortBy("latest");
  };

  const hasActiveFilters = !!(searchQuery || selectedCategory || sortBy !== "latest");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-[var(--semantic-error)]">위시리스트를 불러오는 중 오류가 발생했습니다</p>
          <p className="text-[var(--text-tertiary)] text-sm mt-2">잠시 후 다시 시도해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">찜한 상품</h1>
        <p className="text-[var(--text-tertiary)] mt-1">
          관심 있는 상품 {wishlists.length}개를 저장했습니다
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Input
              placeholder="상품 검색..."
              icon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">필터</span>
            {selectedCategory && (
              <Badge variant="default" className="ml-1 text-xs">1</Badge>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Sort Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="gap-2 min-w-[140px] justify-between"
            >
              <span className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                {sortOptions.find((o) => o.value === sortBy)?.label}
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showSortDropdown && "rotate-180")} />
            </Button>
            
            <AnimatePresence>
              {showSortDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 py-1 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg shadow-xl z-20"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-surface)] transition-colors",
                        sortBy === option.value
                          ? "text-[var(--primary)] font-medium"
                          : "text-[var(--text-secondary)]"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[var(--bg-surface)] rounded-lg p-1 border border-[var(--bg-border)]">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-4 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">카테고리 필터</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedCategory === null ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  전체 ({wishlists.length})
                </Badge>
                {categories.map((category: { id: string; name: string }) => {
                  const count = categoryCount[category.id] || 0;
                  if (count === 0) return null;
                  return (
                    <Badge
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name} ({count})
                    </Badge>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Info */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-4 text-sm text-[var(--text-tertiary)]">
          <span>{processedWishlist.length}개의 결과</span>
          {selectedCategory && (
            <Badge variant="outline" className="gap-1">
              {categories.find((c: { id: string; name: string }) => c.id === selectedCategory)?.name}
              <button onClick={() => setSelectedCategory(null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Wishlist Items */}
      {processedWishlist.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {processedWishlist.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                layout
              >
                <WishlistCard
                  item={item}
                  onRemove={handleRemoveFromWishlist}
                  onPurchase={handlePurchase}
                  isRemoving={removeFromWishlistMutation.isPending}
                  isPurchasing={createPurchaseMutation.isPending}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {processedWishlist.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                layout
              >
                <WishlistListItem
                  item={item}
                  onRemove={handleRemoveFromWishlist}
                  onPurchase={handlePurchase}
                  isRemoving={removeFromWishlistMutation.isPending}
                  isPurchasing={createPurchaseMutation.isPending}
                />
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <EmptyState hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
      )}

      {/* Click outside to close dropdown */}
      {showSortDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSortDropdown(false)}
        />
      )}
    </div>
  );
}

// 그리드 뷰 카드 컴포넌트
function WishlistCard({
  item,
  onRemove,
  onPurchase,
  isRemoving,
  isPurchasing,
}: {
  item: Wishlist;
  onRemove: (id: string, title: string) => void;
  onPurchase: (id: string, title: string, price: number, isFree: boolean) => void;
  isRemoving: boolean;
  isPurchasing: boolean;
}) {
  const product = item.product;
  const hasDiscount = product?.originalPrice && product?.price && product.originalPrice > product.price;
  const discountPercent = hasDiscount && product?.originalPrice && product?.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const isFree = product?.pricingType === "FREE" || product?.price === 0;

  return (
    <Card variant="glass" className="h-full flex flex-col group">
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Thumbnail */}
        <div className="aspect-video rounded-t-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-violet)]/20 flex items-center justify-center relative overflow-hidden">
          {product?.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Package className="w-12 h-12 text-[var(--text-disabled)]" />
          )}
          {hasDiscount && (
            <Badge variant="danger" className="absolute top-3 left-3">
              {discountPercent}% OFF
            </Badge>
          )}
          <button
            onClick={() => onRemove(item.productId, product?.title || '')}
            disabled={isRemoving}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-50"
            title="위시리스트에서 제거"
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart className="w-4 h-4 fill-current text-[var(--semantic-error)]" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{product?.category?.name || "기타"}</Badge>
          </div>
          <Link
            href={`/marketplace/${item.productId}`}
            className="font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors mb-2 line-clamp-1"
          >
            {product?.title || "상품 정보 없음"}
          </Link>
          <p className="text-sm text-[var(--text-tertiary)] line-clamp-2 mb-4 flex-1">
            {product?.shortDescription}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-[var(--text-disabled)] mb-4">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-[var(--accent-yellow)] fill-current" />
              {product?.averageRating?.toFixed(1) || "0.0"}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {product?.salesCount || 0}
            </span>
            <Link
              href={`/seller/${product?.seller?.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-[var(--primary)]"
            >
              <User className="w-3 h-3" />
              {product?.seller?.name || "알 수 없음"}
            </Link>
          </div>

          {/* Price & Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--bg-border)]">
            <div>
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {product?.pricingType === "FREE" || product?.price === 0
                  ? "무료"
                  : formatPrice(product?.price || 0)}
              </span>
              {hasDiscount && product?.originalPrice && (
                <span className="ml-2 text-sm text-[var(--text-disabled)] line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <Button
              variant="neon"
              size="sm"
              className="gap-1"
              onClick={() => onPurchase(item.productId, product?.title || '', product?.price || 0, isFree)}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isFree ? (
                <Download className="w-4 h-4" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              {isFree ? '받기' : '구매'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 리스트 뷰 아이템 컴포넌트
function WishlistListItem({
  item,
  onRemove,
  onPurchase,
  isRemoving,
  isPurchasing,
}: {
  item: Wishlist;
  onRemove: (id: string, title: string) => void;
  onPurchase: (id: string, title: string, price: number, isFree: boolean) => void;
  isRemoving: boolean;
  isPurchasing: boolean;
}) {
  const product = item.product;
  const hasDiscount = product?.originalPrice && product?.price && product.originalPrice > product.price;
  const discountPercent = hasDiscount && product?.originalPrice && product?.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const isFree = product?.pricingType === "FREE" || product?.price === 0;

  return (
    <Card variant="glass" className="group">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <Link href={`/marketplace/${item.productId}`} className="flex-shrink-0">
            <div className="w-32 h-24 sm:w-40 sm:h-28 rounded-lg bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-violet)]/20 flex items-center justify-center relative overflow-hidden">
              {product?.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <Package className="w-8 h-8 text-[var(--text-disabled)]" />
              )}
              {hasDiscount && (
                <Badge variant="danger" className="absolute top-2 left-2 text-xs">
                  {discountPercent}%
                </Badge>
              )}
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">{product?.category?.name || "기타"}</Badge>
                </div>
                <Link
                  href={`/marketplace/${item.productId}`}
                  className="font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors line-clamp-1"
                >
                  {product?.title || "상품 정보 없음"}
                </Link>
                <p className="text-sm text-[var(--text-tertiary)] line-clamp-1 mt-1">
                  {product?.shortDescription}
                </p>
              </div>
              <button
                onClick={() => onRemove(item.productId, product?.title || '')}
                disabled={isRemoving}
                className="p-2 rounded-full text-[var(--semantic-error)] hover:bg-[var(--semantic-error)]/10 transition-colors disabled:opacity-50"
                title="위시리스트에서 제거"
              >
                {isRemoving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className="w-4 h-4 fill-current" />
                )}
              </button>
            </div>

            {/* Stats & Price Row */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-xs text-[var(--text-disabled)]">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[var(--accent-yellow)] fill-current" />
                  {product?.averageRating?.toFixed(1) || "0.0"} ({product?.reviewCount || 0})
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {product?.salesCount || 0}
                </span>
                <Link
                  href={`/seller/${product?.seller?.id}`}
                  className="hidden sm:flex items-center gap-1 hover:text-[var(--primary)]"
                >
                  <User className="w-3 h-3" />
                  {product?.seller?.name || "알 수 없음"}
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-lg font-bold text-[var(--text-primary)]">
                    {product?.pricingType === "FREE" || product?.price === 0
                      ? "무료"
                      : formatPrice(product?.price || 0)}
                  </span>
                  {hasDiscount && product?.originalPrice && (
                    <span className="ml-2 text-sm text-[var(--text-disabled)] line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
                <Button
                  variant="neon"
                  size="sm"
                  className="gap-1"
                  onClick={() => onPurchase(item.productId, product?.title || '', product?.price || 0, isFree)}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFree ? (
                    <Download className="w-4 h-4" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{isFree ? '받기' : '구매'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 빈 상태 컴포넌트
function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="text-center py-16">
      <HeartOff className="w-16 h-16 mx-auto text-[var(--text-disabled)] mb-4" />
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
        {hasFilters ? "검색 결과가 없습니다" : "찜한 상품이 없습니다"}
      </h3>
      <p className="text-[var(--text-tertiary)] mb-6">
        {hasFilters
          ? "다른 검색어나 필터를 시도해보세요"
          : "마음에 드는 상품을 찜해보세요!"}
      </p>
      {hasFilters ? (
        <Button variant="outline" onClick={onClearFilters}>
          필터 초기화
        </Button>
      ) : (
        <Link href="/marketplace">
          <Button variant="neon">마켓플레이스 둘러보기</Button>
        </Link>
      )}
    </div>
  );
}
