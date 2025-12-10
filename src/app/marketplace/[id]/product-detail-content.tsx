"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Download,
  Eye,
  Clock,
  Shield,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Package,
  FileCode,
  Zap,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { useAddToWishlist, useRemoveFromWishlist, useCreatePurchase, useCheckout, useCheckPurchase, useCheckWishlist } from "@/hooks/use-api";
import { ReactionButtons } from "@/components/ui/reaction-buttons";
import { QASection } from "@/components/ui/comment-section";
import { BootpayPaymentSelector } from "@/components/ui/bootpay-payment-selector";
import { initiateBootpayPayment, verifyBootpayPayment, type BootpayPaymentMethod } from "@/lib/bootpay";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

interface Review {
  id: string;
  user: { id: string; name: string; image: string | null };
  rating: number;
  content: string;
  createdAt: string;
  helpful: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number | null;
  pricingType: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  seller: {
    id: string;
    name: string;
    username: string;
    image: string | null;
    bio: string;
    totalProducts: number;
    totalSales: number;
    rating: number;
    verified?: boolean;
  };
  images: string[];
  tags: string[];
  features: string[];
  techStack?: string[];
  rating: number;
  reviewCount: number;
  salesCount: number;
  viewCount: number;
  downloadCount?: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  license: string;
  reviews: Review[];
}

interface ProductDetailContentProps {
  product: Product;
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "qa">("description");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  // 최근 본 상품 추적
  const { addProduct } = useRecentlyViewed();
  
  // 상품 페이지 접근 시 최근 본 상품에 추가
  useEffect(() => {
    addProduct(product.id);
  }, [product.id, addProduct]);

  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const createPurchase = useCreatePurchase();
  const _checkout = useCheckout(); // 향후 Stripe 결제에 사용 예정
  
  // 구매 여부 확인
  const { data: purchaseData } = useCheckPurchase(product.id, !!session);
  const hasPurchased = purchaseData?.purchased || false;
  const purchasedFiles = purchaseData?.purchase?.files || [];

  // 위시리스트 상태 확인 (서버와 동기화)
  const { data: wishlistData } = useCheckWishlist(product.id, !!session);
  const isWishlisted = wishlistData?.isWishlisted || false;

  const isFree = product.pricingType === "FREE" || product.price === 0;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // 결제 취소/성공 URL 파라미터 처리
  useEffect(() => {
    const canceled = searchParams.get('canceled');
    const success = searchParams.get('success');
    
    if (canceled === 'true') {
      toast.error('결제가 취소되었습니다', {
        description: '다시 시도하시려면 구매 버튼을 클릭해주세요.',
      });
      // URL 정리
      router.replace(`/marketplace/${product.id}`);
    }
    
    if (success === 'true') {
      toast.success('결제가 완료되었습니다! 🎉', {
        description: '구매 내역에서 파일을 다운로드할 수 있습니다.',
      });
      router.replace(`/marketplace/${product.id}`);
    }
  }, [searchParams, router, product.id]);

  const handleWishlistToggle = async () => {
    if (!session) {
      toast.error('로그인이 필요합니다', {
        action: {
          label: '로그인',
          onClick: () => router.push('/auth/login'),
        },
      });
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist.mutateAsync(product.id);
        toast.success('위시리스트에서 제거되었습니다');
      } else {
        await addToWishlist.mutateAsync(product.id);
        toast.success('위시리스트에 추가되었습니다 ❤️');
      }
    } catch (error) {
      console.error("Wishlist error:", error);
      toast.error('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: product.title,
      text: product.shortDescription || product.description.slice(0, 100),
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('링크가 복사되었습니다! 📋');
      }
    } catch (error) {
      // 사용자가 공유를 취소한 경우 무시
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share error:', error);
      }
    }
  };

  const handlePurchase = async () => {
    if (!session) {
      toast.error('로그인이 필요합니다', {
        action: {
          label: '로그인',
          onClick: () => router.push('/auth/login'),
        },
      });
      return;
    }

    if (isFree) {
      // 무료 상품: 바로 구매 처리
      setIsPurchasing(true);
      try {
        await createPurchase.mutateAsync(product.id);
        toast.success('무료 상품을 받았습니다! 🎁', {
          description: '구매 내역에서 다운로드할 수 있습니다.',
          action: {
            label: '다운로드하기',
            onClick: () => router.push('/dashboard/purchases'),
          },
        });
      } catch (error) {
        console.error("Purchase error:", error);
        const errorMessage = error instanceof Error ? error.message : "오류가 발생했습니다";
        toast.error(errorMessage);
      } finally {
        setIsPurchasing(false);
      }
    } else {
      // 유료 상품: 결제 수단 선택 모달 표시
      setShowPaymentSelector(true);
    }
  };

  const handlePaymentMethodSelect = async (method: BootpayPaymentMethod) => {
    setIsPurchasing(true);
    try {
      // 부트페이 결제
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await initiateBootpayPayment({
        paymentId,
        productId: product.id,
        productName: product.title,
        amount: product.price,
        buyerName: session?.user?.name || "구매자",
        buyerEmail: session?.user?.email || "",
        method,
      });

      if (result.success && result.receiptId) {
        // 결제 검증
        const verification = await verifyBootpayPayment(result.receiptId, product.id);
        
        if (verification.success) {
          toast.success('결제가 완료되었습니다! 🎉', {
            description: '구매 내역에서 파일을 다운로드할 수 있습니다.',
            action: {
              label: '다운로드하기',
              onClick: () => router.push('/dashboard/purchases'),
            },
          });
          setShowPaymentSelector(false);
          router.refresh();
        } else {
          toast.error('결제 확인 실패', {
            description: verification.error || '고객센터에 문의해주세요.',
          });
        }
      } else {
        // 결제 취소 또는 실패
        if (result.error !== '결제가 취소되었습니다.') {
          toast.error('결제 실패', {
            description: result.error || '다시 시도해주세요.',
          });
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage = error instanceof Error ? error.message : "결제 중 오류가 발생했습니다";
      toast.error(errorMessage, {
        description: '문제가 계속되면 고객센터에 문의해주세요.',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-8">
      <div className="container-app">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-6">
          <Link href="/marketplace" className="hover:text-[var(--text-primary)]">
            마켓플레이스
          </Link>
          <span>/</span>
          <Link
            href={`/marketplace?category=${product.category.slug}`}
            className="hover:text-[var(--text-primary)]"
          >
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-secondary)]">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Card variant="glass" className="overflow-hidden">
                <div className="relative aspect-video bg-[var(--bg-elevated)]">
                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[currentImageIndex]}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-24 h-24 text-[var(--text-disabled)]" />
                    </div>
                  )}

                  {/* Image Navigation */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={cn(
                          "relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors",
                          idx === currentImageIndex
                            ? "border-[var(--primary)]"
                            : "border-transparent hover:border-[var(--bg-border)]"
                        )}
                      >
                        <Image src={img} alt="" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-[var(--bg-border)]">
              <button
                onClick={() => setActiveTab("description")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "description"
                    ? "border-[var(--primary)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                상품 설명
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                  activeTab === "reviews"
                    ? "border-[var(--primary)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                리뷰
                <Badge variant="secondary">
                  {product.reviewCount}
                </Badge>
              </button>
              <button
                onClick={() => setActiveTab("qa")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                  activeTab === "qa"
                    ? "border-[var(--primary)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                <HelpCircle className="w-4 h-4" />
                Q&A
              </button>
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "description" ? (
                <Card variant="glass">
                  <CardContent className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">
                        {product.description}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : activeTab === "qa" ? (
                <Card variant="glass">
                  <CardContent className="p-6">
                    <QASection productId={product.id} />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Review Summary */}
                  <Card variant="glass">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-[var(--text-primary)]">
                            {product.rating.toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "w-4 h-4",
                                  star <= Math.round(product.rating)
                                    ? "text-[var(--accent-yellow)] fill-current"
                                    : "text-[var(--text-disabled)]"
                                )}
                              />
                            ))}
                          </div>
                          <div className="text-sm text-[var(--text-tertiary)] mt-1">
                            {product.reviewCount}개의 리뷰
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = Math.floor(Math.random() * 20);
                            const percentage = (count / product.reviewCount) * 100;
                            return (
                              <div key={rating} className="flex items-center gap-2">
                                <span className="text-sm text-[var(--text-tertiary)] w-8">
                                  {rating}점
                                </span>
                                <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[var(--accent-yellow)]"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reviews List */}
                  {product.reviews.length > 0 ? (
                    product.reviews.map((review) => (
                      <Card key={review.id} variant="glass">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {review.user.image ? (
                              <Image
                                src={review.user.image}
                                alt={review.user.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-medium">
                                  {review.user.name[0]}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-[var(--text-primary)]">
                                    {review.user.name}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={cn(
                                            "w-3 h-3",
                                            star <= review.rating
                                              ? "text-[var(--accent-yellow)] fill-current"
                                              : "text-[var(--text-disabled)]"
                                          )}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-[var(--text-disabled)]">
                                      {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="mt-3 text-[var(--text-secondary)]">
                                {review.content}
                              </p>
                              <button className="mt-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex items-center gap-1">
                                👍 도움이 됐어요 ({review.helpful})
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card variant="glass">
                      <CardContent className="p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-[var(--text-disabled)] mx-auto mb-3" />
                        <p className="text-[var(--text-tertiary)]">
                          아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Purchase Info */}
          <div className="space-y-6">
            {/* Main Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="glass" className="sticky top-24">
                <CardContent className="p-6">
                  {/* Category & Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="violet">{product.category.name}</Badge>
                    {product.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                    {product.title}
                  </h1>

                  {/* Reaction Buttons */}
                  <div className="mb-4 pb-4 border-b border-[var(--bg-border)]">
                    <ReactionButtons
                      targetType="PRODUCT"
                      targetId={product.id}
                      enabledReactions={["LIKE", "RECOMMEND", "HELPFUL", "BOOKMARK"]}
                      showLabels={true}
                      size="sm"
                      variant="minimal"
                    />
                  </div>

                  {/* Rating & Stats */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[var(--accent-yellow)] fill-current" />
                      <span className="font-medium text-[var(--text-primary)]">
                        {product.rating}
                      </span>
                      <span className="text-[var(--text-tertiary)]">
                        ({product.reviewCount})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
                      <Download className="w-4 h-4" />
                      <span>{product.salesCount} 판매</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
                      <Eye className="w-4 h-4" />
                      <span>{product.viewCount}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-3">
                      {isFree ? (
                        <Badge variant="free" className="text-xl px-4 py-2">무료</Badge>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-[var(--text-primary)]">
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <>
                              <span className="text-lg text-[var(--text-disabled)] line-through">
                                {formatPrice(product.originalPrice)}
                              </span>
                              <Badge variant="danger">{discount}% OFF</Badge>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {product.features.length > 0 ? (
                      product.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <Check className="w-4 h-4 text-[var(--accent-green)]" />
                          {feature}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-[var(--text-tertiary)]">
                        라이선스: {product.license}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    {hasPurchased ? (
                      // 구매 완료 상태 - 다운로드 버튼 표시
                      <>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 mb-4">
                          <Check className="w-5 h-5 text-[var(--accent-green)]" />
                          <span className="text-sm text-[var(--accent-green)] font-medium">
                            구매 완료된 상품입니다
                          </span>
                        </div>
                        {purchasedFiles.length > 0 ? (
                          <div className="space-y-2">
                            {purchasedFiles.map((file) => (
                              <a
                                key={file.id}
                                href={file.url}
                                download={file.name}
                                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--bg-border)] transition-colors group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                                  <Download className="w-5 h-5 text-[var(--primary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-[var(--text-tertiary)]">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <Button variant="neon" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Download className="w-4 h-4" />
                                  다운로드
                                </Button>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <Button variant="neon" size="lg" className="w-full gap-2" disabled>
                            <Download className="w-5 h-5" />
                            다운로드 준비 중
                          </Button>
                        )}
                      </>
                    ) : (
                      // 미구매 상태 - 구매/결제 버튼 표시
                      <Button 
                        variant="neon" 
                        size="lg" 
                        className="w-full gap-2"
                        onClick={handlePurchase}
                        disabled={isPurchasing}
                      >
                        {isPurchasing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            처리 중...
                          </>
                        ) : isFree ? (
                          <>
                            <Download className="w-5 h-5" />
                            무료 다운로드
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            구매하기
                          </>
                        )}
                      </Button>
                    )}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 gap-2"
                        onClick={handleWishlistToggle}
                        disabled={addToWishlist.isPending || removeFromWishlist.isPending}
                      >
                        <Heart
                          className={cn(
                            "w-5 h-5",
                            isWishlisted && "fill-current text-[var(--semantic-error)]"
                          )}
                        />
                        {isWishlisted ? "찜 해제" : "찜하기"}
                      </Button>
                      <Button variant="outline" size="lg" className="flex-1 gap-2" onClick={handleShare}>
                        <Share2 className="w-5 h-5" />
                        공유
                      </Button>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t border-[var(--bg-border)] grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                      <Shield className="w-4 h-4 text-[var(--accent-green)]" />
                      안전 결제
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                      <Clock className="w-4 h-4 text-[var(--accent-cyan)]" />
                      즉시 다운로드
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                      <FileCode className="w-4 h-4 text-[var(--primary)]" />
                      소스코드 포함
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                      <Zap className="w-4 h-4 text-[var(--accent-yellow)]" />
                      평생 이용
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Seller Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="glass">
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-4">
                    판매자 정보
                  </h3>
                  <Link
                    href={`/seller/${product.seller.id}`}
                    className="flex items-center gap-4 mb-4 group"
                  >
                    {product.seller.image ? (
                      <Image
                        src={product.seller.image}
                        alt={product.seller.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center">
                        <span className="text-white font-medium text-lg">
                          {product.seller.name[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                        {product.seller.name}
                      </div>
                      <div className="text-sm text-[var(--text-tertiary)]">
                        @{product.seller.username}
                      </div>
                    </div>
                  </Link>

                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    {product.seller.bio}
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)]">
                        {product.seller.totalProducts}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">상품</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)]">
                        {product.seller.totalSales}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">판매</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)] flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-[var(--accent-yellow)] fill-current" />
                        {product.seller.rating}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">평점</div>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <MessageSquare className="w-4 h-4" />
                    문의하기
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 결제 수단 선택 모달 (부트페이) */}
      <BootpayPaymentSelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        onSelect={handlePaymentMethodSelect}
        productName={product.title}
        price={product.price}
        isLoading={isPurchasing}
      />
    </div>
  );
}
