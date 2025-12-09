"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Camera,
  X,
  CheckCircle,
  Send,
  Loader2,
  Filter,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 타입 정의
export interface ReviewUser {
  id: string;
  name: string;
  image: string | null;
}

export interface Review {
  id: string;
  user: ReviewUser;
  rating: number;
  title?: string;
  content: string;
  images?: string[];
  helpfulCount: number;
  isVerifiedPurchase?: boolean;
  sellerReply?: string | null;
  sellerRepliedAt?: string | null;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

// 리뷰 통계 카드
export function ReviewStatsCard({
  stats,
  onFilterChange,
}: {
  stats: ReviewStats;
  onFilterChange?: (rating: number | null) => void;
}) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleRatingClick = (rating: number) => {
    const newRating = selectedRating === rating ? null : rating;
    setSelectedRating(newRating);
    onFilterChange?.(newRating);
  };

  return (
    <Card variant="glass">
      <CardContent className="p-6">
        <div className="flex items-start gap-8">
          {/* 평균 평점 */}
          <div className="text-center">
            <div className="text-5xl font-bold text-[var(--text-primary)]">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-5 h-5",
                    star <= Math.round(stats.averageRating)
                      ? "text-[var(--accent-yellow)] fill-current"
                      : "text-[var(--text-disabled)]"
                  )}
                />
              ))}
            </div>
            <div className="text-sm text-[var(--text-tertiary)] mt-2">
              {stats.totalReviews.toLocaleString()} reviews
            </div>
          </div>

          {/* 평점 분포 */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating] || 0;
              const percentage = stats.totalReviews > 0
                ? (count / stats.totalReviews) * 100
                : 0;
              const isSelected = selectedRating === rating;

              return (
                <button
                  key={rating}
                  onClick={() => handleRatingClick(rating)}
                  className={cn(
                    "w-full flex items-center gap-3 p-1.5 rounded-lg transition-all",
                    isSelected
                      ? "bg-[var(--primary)]/10"
                      : "hover:bg-[var(--bg-elevated)]"
                  )}
                >
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      {rating}
                    </span>
                    <Star className="w-3.5 h-3.5 text-[var(--accent-yellow)] fill-current" />
                  </div>
                  <div className="flex-1 h-2.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[var(--accent-yellow)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-sm text-[var(--text-tertiary)] w-12 text-right">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 필터 표시 */}
        {selectedRating && (
          <div className="mt-4 pt-4 border-t border-[var(--bg-border)] flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">
              Showing {selectedRating}-star reviews only
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedRating(null);
                onFilterChange?.(null);
              }}
            >
              Clear filter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 정렬 옵션
type SortOption = "latest" | "helpful" | "rating-high" | "rating-low";

// 리뷰 정렬 컨트롤
export function ReviewSortControl({
  sort,
  onSortChange,
  showImagesOnly,
  onShowImagesOnlyChange,
}: {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  showImagesOnly: boolean;
  onShowImagesOnlyChange: (show: boolean) => void;
}) {
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "latest", label: "Latest" },
    { value: "helpful", label: "Most Helpful" },
    { value: "rating-high", label: "Highest Rated" },
    { value: "rating-low", label: "Lowest Rated" },
  ];

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-sm text-[var(--text-secondary)]">Sort by:</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="bg-[var(--bg-elevated)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-1.5 border border-[var(--bg-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => onShowImagesOnlyChange(!showImagesOnly)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all",
          showImagesOnly
            ? "bg-[var(--primary)] text-white"
            : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        )}
      >
        <ImageIcon className="w-4 h-4" />
        With photos
      </button>
    </div>
  );
}

// 개별 리뷰 카드
export function ReviewCard({
  review,
  sellerId,
  onHelpfulClick,
}: {
  review: Review;
  sellerId?: string;
  onHelpfulClick?: (reviewId: string) => void;
}) {
  const { data: session } = useSession();
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [isVoting, setIsVoting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState(review.sellerReply || "");
  const [isReplying, setIsReplying] = useState(false);
  const [localSellerReply, setLocalSellerReply] = useState(review.sellerReply);
  const [showFullContent, setShowFullContent] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isCurrentUserSeller = session?.user?.id === sellerId;
  const isContentLong = review.content.length > 300;

  const handleHelpfulClick = async () => {
    if (!session?.user || isVoting) return;
    if (session.user.id === review.user.id) return; // 본인 리뷰 투표 불가

    setIsVoting(true);
    try {
      const response = await fetch(`/api/reviews/${review.id}/helpful`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setIsHelpful(data.voted);
        setHelpfulCount(data.helpfulCount);
        onHelpfulClick?.(review.id);
      }
    } catch (error) {
      console.error("Vote error:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || isReplying) return;

    setIsReplying(true);
    try {
      const response = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });

      if (response.ok) {
        const data = await response.json();
        setLocalSellerReply(data.sellerReply);
        setShowReplyForm(false);
      }
    } catch (error) {
      console.error("Reply error:", error);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <Card variant="glass">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* 프로필 이미지 */}
          {review.user.image ? (
            <Image
              src={review.user.image}
              alt={review.user.name}
              width={44}
              height={44}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium">
                {review.user.name?.[0] || "U"}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--text-primary)]">
                    {review.user.name}
                  </span>
                  {review.isVerifiedPurchase && (
                    <Badge variant="success" className="text-xs gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified Purchase
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= review.rating
                            ? "text-[var(--accent-yellow)] fill-current"
                            : "text-[var(--text-disabled)]"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[var(--text-disabled)]">
                    {new Date(review.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* 제목 */}
            {review.title && (
              <h4 className="font-semibold text-[var(--text-primary)] mt-3">
                {review.title}
              </h4>
            )}

            {/* 내용 */}
            <div className="mt-2">
              <p className="text-[var(--text-secondary)] whitespace-pre-wrap">
                {isContentLong && !showFullContent
                  ? review.content.slice(0, 300) + "..."
                  : review.content}
              </p>
              {isContentLong && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-[var(--primary)] text-sm mt-1 hover:underline flex items-center gap-1"
                >
                  {showFullContent ? (
                    <>
                      Show less <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 이미지 */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {review.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--bg-border)] hover:border-[var(--primary)] transition-colors"
                  >
                    <Image
                      src={image}
                      alt={`Review image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={handleHelpfulClick}
                disabled={isVoting || !session?.user || session.user.id === review.user.id}
                className={cn(
                  "flex items-center gap-1.5 text-sm transition-all",
                  isHelpful
                    ? "text-[var(--primary)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
                  (isVoting || !session?.user) && "opacity-50 cursor-not-allowed"
                )}
              >
                <ThumbsUp className={cn("w-4 h-4", isHelpful && "fill-current")} />
                Helpful ({helpfulCount})
              </button>

              {isCurrentUserSeller && !localSellerReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                >
                  <MessageSquare className="w-4 h-4" />
                  Reply
                </button>
              )}
            </div>

            {/* 판매자 답글 폼 */}
            <AnimatePresence>
              {showReplyForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply to this review..."
                    rows={3}
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="neon"
                      size="sm"
                      onClick={handleReplySubmit}
                      disabled={!replyContent.trim() || isReplying}
                    >
                      {isReplying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          Submit Reply
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReplyForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 판매자 답글 */}
            {localSellerReply && (
              <div className="mt-4 p-4 bg-[var(--bg-elevated)] rounded-lg border-l-4 border-[var(--primary)]">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="violet" className="text-xs">
                    Seller Response
                  </Badge>
                  {review.sellerRepliedAt && (
                    <span className="text-xs text-[var(--text-disabled)]">
                      {new Date(review.sellerRepliedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {localSellerReply}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* 이미지 모달 */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <Image
              src={selectedImage}
              alt="Review image"
              width={800}
              height={600}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// 리뷰 작성 폼
export function ReviewForm({
  productId,
  onSuccess,
  onCancel,
}: {
  productId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || images.length >= 5) return;

    // TODO: 실제 이미지 업로드 구현
    // 현재는 placeholder
    const newImages = [...images];
    for (let i = 0; i < Math.min(files.length, 5 - images.length); i++) {
      // 임시로 object URL 사용 (실제로는 Supabase에 업로드)
      newImages.push(URL.createObjectURL(files[i]));
    }
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          content: content.trim(),
          images: images.length > 0 ? images : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit review");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="glass">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Write a Review
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 평점 선택 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Rating *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      star <= (hoverRating || rating)
                        ? "text-[var(--accent-yellow)] fill-current"
                        : "text-[var(--text-disabled)]"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-[var(--text-secondary)]">
                {rating > 0 && ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
              </span>
            </div>
          </div>

          {/* 제목 (선택) */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Review *
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this product (minimum 10 characters)"
              rows={5}
              maxLength={2000}
            />
            <div className="text-xs text-[var(--text-disabled)] text-right mt-1">
              {content.length}/2000
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Photos (optional, max 5)
            </label>
            <div className="flex gap-2 flex-wrap">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <Image
                    src={image}
                    alt={`Upload ${index + 1}`}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 p-1 bg-[var(--semantic-error)] rounded-full text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-[var(--bg-border)] rounded-lg flex items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors">
                  <Camera className="w-6 h-6 text-[var(--text-disabled)]" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-[var(--semantic-error)]/10 text-[var(--semantic-error)] rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="neon"
              disabled={rating === 0 || content.length < 10 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// 리뷰 목록 (전체 구성)
export function ReviewSection({
  productId,
  sellerId,
  reviews: initialReviews,
  stats,
  hasPurchased,
}: {
  productId: string;
  sellerId: string;
  reviews: Review[];
  stats: ReviewStats;
  hasPurchased: boolean;
}) {
  const { data: session } = useSession();
  const [reviews, _setReviews] = useState(initialReviews);
  const [sort, setSort] = useState<SortOption>("latest");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [showImagesOnly, setShowImagesOnly] = useState(false);
  const [showWriteForm, setShowWriteForm] = useState(false);

  // 이미 리뷰를 작성했는지 확인
  const hasWrittenReview = reviews.some((r) => r.user.id === session?.user?.id);
  const canWriteReview = hasPurchased && !hasWrittenReview && session?.user;

  // 필터링된 리뷰
  const filteredReviews = reviews.filter((review) => {
    if (ratingFilter && review.rating !== ratingFilter) return false;
    if (showImagesOnly && (!review.images || review.images.length === 0)) return false;
    return true;
  });

  // 정렬된 리뷰
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sort) {
      case "helpful":
        return b.helpfulCount - a.helpfulCount;
      case "rating-high":
        return b.rating - a.rating;
      case "rating-low":
        return a.rating - b.rating;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleReviewSuccess = () => {
    setShowWriteForm(false);
    // TODO: 리뷰 목록 새로고침
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* 리뷰 작성 버튼 */}
      {canWriteReview && !showWriteForm && (
        <Button
          variant="neon"
          onClick={() => setShowWriteForm(true)}
          className="w-full"
        >
          <Star className="w-4 h-4 mr-2" />
          Write a Review
        </Button>
      )}

      {/* 리뷰 작성 폼 */}
      <AnimatePresence>
        {showWriteForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ReviewForm
              productId={productId}
              onSuccess={handleReviewSuccess}
              onCancel={() => setShowWriteForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 통계 카드 */}
      {stats.totalReviews > 0 && (
        <ReviewStatsCard stats={stats} onFilterChange={setRatingFilter} />
      )}

      {/* 정렬 컨트롤 */}
      {reviews.length > 0 && (
        <ReviewSortControl
          sort={sort}
          onSortChange={setSort}
          showImagesOnly={showImagesOnly}
          onShowImagesOnlyChange={setShowImagesOnly}
        />
      )}

      {/* 리뷰 목록 */}
      <div className="space-y-4">
        {sortedReviews.length > 0 ? (
          sortedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} sellerId={sellerId} />
          ))
        ) : reviews.length > 0 ? (
          <Card variant="glass">
            <CardContent className="p-8 text-center">
              <p className="text-[var(--text-tertiary)]">
                No reviews match your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card variant="glass">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-[var(--text-disabled)] mx-auto mb-3" />
              <p className="text-[var(--text-tertiary)]">
                No reviews yet. Be the first to review this product!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
