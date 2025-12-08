"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Package,
  Star,
  Download,
  Loader2,
  ShoppingBag,
  Rss,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { useFollowingList, useFollowingFeed, useFollowToggle } from "@/hooks/use-api";
import { SellerCard, type SellerCardData } from "@/components/ui/seller-card";
import type { FollowingListResponse, FollowingFeedResponse, FollowingFeedProduct } from "@/lib/api";

type TabType = "sellers" | "feed";

export function FollowingContent() {
  const [activeTab, setActiveTab] = useState<TabType>("sellers");
  const [sellersPage, setSellersPage] = useState(1);
  const [feedPage, setFeedPage] = useState(1);

  const { data: sellersData, isLoading: sellersLoading } = useFollowingList(sellersPage, 12);
  const { data: feedData, isLoading: feedLoading } = useFollowingFeed(feedPage, 12);
  const followToggleMutation = useFollowToggle();

  const handleUnfollow = async (sellerId: string) => {
    try {
      await followToggleMutation.mutateAsync(sellerId);
    } catch (error) {
      console.error("언팔로우 실패:", error);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">팔로잉</h1>
        <p className="text-[var(--text-tertiary)] mt-1">
          {sellersData?.pagination.total || 0}명의 판매자를 팔로우하고 있습니다
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[var(--bg-border)]">
        <button
          onClick={() => setActiveTab("sellers")}
          className={cn(
            "pb-4 px-2 text-sm font-medium transition-colors relative flex items-center gap-2",
            activeTab === "sellers"
              ? "text-[var(--primary)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
        >
          <Users className="w-4 h-4" />
          판매자 목록
          {activeTab === "sellers" && (
            <motion.div
              layoutId="followingTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          className={cn(
            "pb-4 px-2 text-sm font-medium transition-colors relative flex items-center gap-2",
            activeTab === "feed"
              ? "text-[var(--primary)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
        >
          <Rss className="w-4 h-4" />
          최신 상품
          {feedData && feedData.pagination.total > 0 && (
            <Badge variant="secondary" className="text-xs">
              {feedData.pagination.total}
            </Badge>
          )}
          {activeTab === "feed" && (
            <motion.div
              layoutId="followingTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "sellers" ? (
        <SellersTab
          data={sellersData}
          isLoading={sellersLoading}
          page={sellersPage}
          setPage={setSellersPage}
          onUnfollow={handleUnfollow}
          isUnfollowing={followToggleMutation.isPending}
        />
      ) : (
        <FeedTab
          data={feedData}
          isLoading={feedLoading}
          page={feedPage}
          setPage={setFeedPage}
        />
      )}
    </div>
  );
}

// 판매자 목록 탭
function SellersTab({
  data,
  isLoading,
  page,
  setPage,
  onUnfollow,
  isUnfollowing,
}: {
  data: FollowingListResponse | undefined;
  isLoading: boolean;
  page: number;
  setPage: (page: number) => void;
  onUnfollow: (id: string) => void;
  isUnfollowing: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const following = data?.following || [];

  if (following.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="w-16 h-16 mx-auto text-[var(--text-disabled)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          팔로우한 판매자가 없습니다
        </h3>
        <p className="text-[var(--text-tertiary)] mb-6">
          마켓플레이스에서 관심 있는 판매자를 팔로우해보세요!
        </p>
        <Link href="/marketplace">
          <Button variant="neon">마켓플레이스 둘러보기</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {following.map((seller: SellerCardData, index: number) => (
          <motion.div
            key={seller.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <SellerCard
              seller={seller}
              isFollowing={true}
              onFollowToggle={() => onUnfollow(seller.id)}
              isFollowLoading={isUnfollowing}
            />
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            이전
          </Button>
          <span className="flex items-center px-4 text-sm text-[var(--text-tertiary)]">
            {page} / {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
            disabled={page >= data.pagination.totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </>
  );
}

// 피드 탭 (최신 상품)
function FeedTab({
  data,
  isLoading,
  page,
  setPage,
}: {
  data: FollowingFeedResponse | undefined;
  isLoading: boolean;
  page: number;
  setPage: (page: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const products = data?.products || [];

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="w-16 h-16 mx-auto text-[var(--text-disabled)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          표시할 상품이 없습니다
        </h3>
        <p className="text-[var(--text-tertiary)] mb-6">
          판매자를 팔로우하면 새 상품이 여기에 표시됩니다
        </p>
        <Link href="/marketplace">
          <Button variant="neon">마켓플레이스 둘러보기</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product: FollowingFeedProduct, index: number) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <FeedProductCard product={product} />
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            이전
          </Button>
          <span className="flex items-center px-4 text-sm text-[var(--text-tertiary)]">
            {page} / {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
            disabled={page >= data.pagination.totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </>
  );
}

// 피드용 상품 카드
function FeedProductCard({ product }: { product: FollowingFeedProduct }) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount && product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link href={`/marketplace/${product.id}`}>
      <Card variant="glass" className="h-full group cursor-pointer hover:border-[var(--primary)] transition-colors">
        <CardContent className="p-0">
          {/* Thumbnail */}
          <div className="aspect-video rounded-t-xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-surface)] relative overflow-hidden">
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-disabled)]">
                <Package className="w-12 h-12" />
              </div>
            )}
            {hasDiscount && (
              <Badge variant="danger" className="absolute top-3 left-3">
                {discountPercent}% OFF
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Seller */}
            <Link
              href={`/seller/${product.seller.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 mb-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)]"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)]">
                {product.seller.image ? (
                  <img src={product.seller.image} alt={product.seller.name ?? "Seller"} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-white text-[10px]">
                    {product.seller.name?.[0] || "?"}
                  </span>
                )}
              </div>
              {product.seller.name}
            </Link>

            <Badge variant="secondary" className="mb-2">
              {product.category.name}
            </Badge>

            <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors mb-1">
              {product.title}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] line-clamp-2 mb-3">
              {product.shortDescription}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-[var(--text-disabled)] mb-3">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[var(--accent-yellow)] fill-current" />
                {product.averageRating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {product.salesCount}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {product.pricingType === "FREE" || product.price === 0
                    ? "무료"
                    : formatPrice(product.price)}
                </span>
                {hasDiscount && product.originalPrice && (
                  <span className="ml-2 text-sm text-[var(--text-disabled)] line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
