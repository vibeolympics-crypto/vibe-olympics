"use client";

import Link from "next/link";
import {
  Star,
  Package,
  Users,
  Download,
  UserPlus,
  UserCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SellerCardData {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  productCount: number;
  followerCount: number;
  averageRating: number;
  totalSales: number;
}

interface SellerCardProps {
  seller: SellerCardData;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  isFollowLoading?: boolean;
  showFollowButton?: boolean;
  className?: string;
}

export function SellerCard({
  seller,
  isFollowing = false,
  onFollowToggle,
  isFollowLoading = false,
  showFollowButton = true,
  className,
}: SellerCardProps) {
  return (
    <Card variant="glass" className={cn("group", className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link href={`/seller/${seller.id}`}>
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex-shrink-0 group-hover:ring-2 ring-[var(--primary)] transition-all">
              {seller.image ? (
                <img
                  src={seller.image}
                  alt={seller.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                  {seller.name?.[0] || "?"}
                </div>
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/seller/${seller.id}`}>
                  <h3 className="font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors truncate">
                    {seller.name}
                  </h3>
                </Link>
                {seller.bio && (
                  <p className="text-sm text-[var(--text-tertiary)] line-clamp-2 mt-1">
                    {seller.bio}
                  </p>
                )}
              </div>

              {showFollowButton && onFollowToggle && (
                <Button
                  variant={isFollowing ? "outline" : "neon"}
                  size="sm"
                  onClick={onFollowToggle}
                  disabled={isFollowLoading}
                  className="flex-shrink-0"
                >
                  {isFollowLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-1" />
                      팔로잉
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      팔로우
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-disabled)]">
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                상품 {seller.productCount}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                팔로워 {seller.followerCount}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[var(--accent-yellow)]" />
                {seller.averageRating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {seller.totalSales}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 컴팩트 버전 (작은 공간용)
interface CompactSellerCardProps {
  seller: SellerCardData;
  className?: string;
}

export function CompactSellerCard({ seller, className }: CompactSellerCardProps) {
  return (
    <Link href={`/seller/${seller.id}`}>
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-surface)] transition-colors",
        className
      )}>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex-shrink-0">
          {seller.image ? (
            <img
              src={seller.image}
              alt={seller.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
              {seller.name?.[0] || "?"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-[var(--text-primary)] truncate">
            {seller.name}
          </p>
          <p className="text-xs text-[var(--text-disabled)]">
            상품 {seller.productCount} · 팔로워 {seller.followerCount}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--accent-yellow)]">
          <Star className="w-3 h-3 fill-current" />
          {seller.averageRating.toFixed(1)}
        </div>
      </div>
    </Link>
  );
}
