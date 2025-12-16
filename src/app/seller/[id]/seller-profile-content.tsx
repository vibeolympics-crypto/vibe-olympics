"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Star,
  ShoppingBag,
  Users,
  Download,
  ExternalLink,
  Github,
  Twitter,
  Globe,
  Calendar,
  Package,
  Loader2,
  Heart,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import { useSellerProfile, useFollowStatus, useFollowToggle } from "@/hooks/use-api";

interface SellerProfileContentProps {
  sellerId: string;
}

export function SellerProfileContent({ sellerId }: SellerProfileContentProps) {
  const { data: session } = useSession();
  const { data, isLoading, error } = useSellerProfile(sellerId);
  const { data: followData } = useFollowStatus(sellerId);
  const followToggleMutation = useFollowToggle();
  const [activeTab, setActiveTab] = useState<"products" | "about">("products");

  const isOwnProfile = session?.user?.id === sellerId;
  const isFollowing = followData?.isFollowing || false;

  const handleFollowToggle = async () => {
    if (!session) {
      alert("로그인이 필요합니다");
      return;
    }
    try {
      await followToggleMutation.mutateAsync(sellerId);
    } catch (error) {
      console.error("팔로우 실패:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--semantic-error)]">판매자 정보를 불러올 수 없습니다</p>
          <Link href="/marketplace">
            <Button variant="outline" className="mt-4">
              판도라 샵으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { seller, stats, products } = data;
  const followerCount = followData?.followerCount ?? seller.followerCount ?? 0;

  const joinedTimeAgo = formatDistanceToNow(new Date(seller.joinedAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 via-[var(--accent-violet)]/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--primary-rgb),0.15),transparent_50%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-[var(--bg-elevated)] shadow-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)]">
                {seller.image ? (
                  <img
                    src={seller.image}
                    alt={seller.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                    {seller.name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-[var(--semantic-success)] text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </motion.div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2"
              >
                {seller.name}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[var(--text-tertiary)] mb-4 flex items-center justify-center md:justify-start gap-2"
              >
                <Calendar className="w-4 h-4" />
                {joinedTimeAgo} 가입
              </motion.p>

              {seller.bio && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-[var(--text-secondary)] max-w-2xl mb-6"
                >
                  {seller.bio}
                </motion.p>
              )}

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center md:justify-start gap-3"
              >
                {seller.website && (
                  <a
                    href={seller.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {seller.github && (
                  <a
                    href={`https://github.com/${seller.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {seller.twitter && (
                  <a
                    href={`https://twitter.com/${seller.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}

                {/* Follow Button */}
                {!isOwnProfile && (
                  <Button
                    variant={isFollowing ? "outline" : "neon"}
                    size="sm"
                    onClick={handleFollowToggle}
                    disabled={followToggleMutation.isPending}
                    className="ml-4 gap-2"
                  >
                    {followToggleMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      <UserCheck className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    {isFollowing ? "팔로잉" : "팔로우"}
                  </Button>
                )}
              </motion.div>
            </div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8"
          >
            <StatCard
              icon={Package}
              label="등록 상품"
              value={seller.productCount}
              suffix="개"
            />
            <StatCard
              icon={Download}
              label="총 판매"
              value={stats.totalSales}
              suffix="건"
            />
            <StatCard
              icon={Star}
              label="평균 평점"
              value={stats.averageRating.toFixed(1)}
              suffix=""
              highlight
            />
            <StatCard
              icon={Users}
              label="팔로워"
              value={followerCount}
              suffix="명"
            />
            <StatCard
              icon={Heart}
              label="리뷰"
              value={stats.totalReviews}
              suffix="개"
            />
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[var(--bg-border)]">
          <button
            onClick={() => setActiveTab("products")}
            className={cn(
              "pb-4 px-2 text-sm font-medium transition-colors relative",
              activeTab === "products"
                ? "text-[var(--primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            상품 ({seller.productCount})
            {activeTab === "products" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={cn(
              "pb-4 px-2 text-sm font-medium transition-colors relative",
              activeTab === "about"
                ? "text-[var(--primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            소개
            {activeTab === "about" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "products" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Package className="w-12 h-12 mx-auto text-[var(--text-disabled)] mb-4" />
                <p className="text-[var(--text-tertiary)]">아직 등록된 상품이 없습니다</p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl">
            <Card variant="glass">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                  판매자 소개
                </h2>
                {seller.bio ? (
                  <p className="text-[var(--text-secondary)] whitespace-pre-wrap">
                    {seller.bio}
                  </p>
                ) : (
                  <p className="text-[var(--text-tertiary)]">
                    아직 소개글이 작성되지 않았습니다.
                  </p>
                )}

                {(seller.website || seller.github || seller.twitter) && (
                  <div className="mt-6 pt-6 border-t border-[var(--bg-border)]">
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                      링크
                    </h3>
                    <div className="space-y-2">
                      {seller.website && (
                        <a
                          href={seller.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[var(--primary)] hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          {seller.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {seller.github && (
                        <a
                          href={`https://github.com/${seller.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[var(--primary)] hover:underline"
                        >
                          <Github className="w-4 h-4" />
                          github.com/{seller.github}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {seller.twitter && (
                        <a
                          href={`https://twitter.com/${seller.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[var(--primary)] hover:underline"
                        >
                          <Twitter className="w-4 h-4" />
                          twitter.com/{seller.twitter}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix: string;
  highlight?: boolean;
}) {
  return (
    <Card variant="glass">
      <CardContent className="p-4 text-center">
        <Icon
          className={cn(
            "w-6 h-6 mx-auto mb-2",
            highlight ? "text-[var(--accent-yellow)]" : "text-[var(--text-tertiary)]"
          )}
        />
        <div className="text-2xl font-bold text-[var(--text-primary)]">
          {value}
          <span className="text-sm font-normal text-[var(--text-tertiary)]">{suffix}</span>
        </div>
        <div className="text-xs text-[var(--text-tertiary)]">{label}</div>
      </CardContent>
    </Card>
  );
}

// Product Card Component
function ProductCard({ product }: { product: {
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
  category: { id: string; name: string; slug: string };
}}) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
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
                {product.averageRating.toFixed(1)} ({product.reviewCount})
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
                {hasDiscount && (
                  <span className="ml-2 text-sm text-[var(--text-disabled)] line-through">
                    {formatPrice(product.originalPrice!)}
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
