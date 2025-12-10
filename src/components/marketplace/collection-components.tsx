"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Package, 
  Layers, 
  Music2, 
  Film,
  ShoppingCart,
  Percent,
  Check,
  Eye,
  TrendingUp,
  Star,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface CollectionItem {
  productId: string;
  title: string;
  thumbnail: string | null;
  originalPrice: number;
  isRequired: boolean;
  itemDiscountRate?: number;
  alreadyPurchased?: boolean;
}

interface Collection {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  type: "SERIES" | "BUNDLE" | "PLAYLIST" | "CURATED";
  productType?: string;
  bundlePrice: number | null;
  discountRate: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  salesCount: number;
  items: {
    product: {
      id: string;
      title: string;
      price: number | null;
      thumbnail: string | null;
      productType: string;
      averageRating?: number;
    };
    isRequired: boolean;
    itemDiscountRate?: number;
  }[];
  seller: {
    id: string;
    name: string | null;
    image: string | null;
  };
  itemCount?: number;
  originalTotal?: number;
  finalPrice?: number;
  savings?: number;
}

interface BundlePricing {
  collection: {
    id: string;
    title: string;
    type: string;
    bundlePrice: number | null;
    discountRate: number | null;
  };
  pricing: {
    originalTotal: number;
    selectedTotal: number;
    newItemsTotal: number;
    discountAmount: number;
    finalPrice: number;
    savings: number;
  };
  items: CollectionItem[];
  summary: {
    totalItems: number;
    selectedItems: number;
    newItems: number;
    alreadyPurchased: number;
  };
}

// 컬렉션 타입 아이콘
const COLLECTION_TYPE_ICONS: Record<string, React.ElementType> = {
  SERIES: Layers,
  BUNDLE: Package,
  PLAYLIST: Music2,
  CURATED: Sparkles,
};

// 컬렉션 타입 색상
const COLLECTION_TYPE_COLORS: Record<string, string> = {
  SERIES: "bg-blue-500",
  BUNDLE: "bg-green-500",
  PLAYLIST: "bg-purple-500",
  CURATED: "bg-orange-500",
};

// 컬렉션 타입 레이블
const COLLECTION_TYPE_LABELS: Record<string, string> = {
  SERIES: "시리즈",
  BUNDLE: "번들",
  PLAYLIST: "플레이리스트",
  CURATED: "큐레이션",
};

// 가격 포맷
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(price);
};

// 컬렉션 카드 컴포넌트
export function CollectionCard({ 
  collection, 
  onPurchase 
}: { 
  collection: Collection;
  onPurchase?: (id: string) => void;
}) {
  const router = useRouter();
  const TypeIcon = COLLECTION_TYPE_ICONS[collection.type] || Package;
  
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {collection.thumbnail ? (
          <Image
            src={collection.thumbnail}
            alt={collection.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* 타입 배지 */}
        <Badge 
          className={cn(
            "absolute top-2 left-2 text-white",
            COLLECTION_TYPE_COLORS[collection.type]
          )}
        >
          <TypeIcon className="w-3 h-3 mr-1" />
          {COLLECTION_TYPE_LABELS[collection.type]}
        </Badge>

        {/* 할인율 배지 */}
        {collection.savings && collection.savings > 0 && (
          <Badge className="absolute top-2 right-2 bg-red-500 text-white">
            <Percent className="w-3 h-3 mr-1" />
            {collection.savings}% 할인
          </Badge>
        )}

        {/* Featured 배지 */}
        {collection.isFeatured && (
          <Badge className="absolute bottom-2 left-2 bg-yellow-500 text-black">
            <Star className="w-3 h-3 mr-1 fill-current" />
            추천
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-lg">{collection.title}</CardTitle>
        {collection.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {collection.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pb-2">
        {/* 미리보기 아이템 */}
        <div className="flex -space-x-2 mb-3">
          {collection.items.slice(0, 4).map((item, idx) => (
            <div
              key={item.product.id}
              className="w-10 h-10 rounded-lg border-2 border-background overflow-hidden bg-muted"
              style={{ zIndex: 4 - idx }}
            >
              {item.product.thumbnail ? (
                <Image
                  src={item.product.thumbnail}
                  alt={item.product.title}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {collection.itemCount && collection.itemCount > 4 && (
            <div className="w-10 h-10 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
              +{collection.itemCount - 4}
            </div>
          )}
        </div>

        {/* 가격 정보 */}
        <div className="space-y-1">
          {collection.originalTotal !== collection.finalPrice && (
            <p className="text-sm text-muted-foreground line-through">
              {formatPrice(collection.originalTotal || 0)}
            </p>
          )}
          <p className="text-xl font-bold text-primary">
            {formatPrice(collection.finalPrice || 0)}
          </p>
        </div>

        {/* 통계 */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {collection.viewCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {collection.salesCount.toLocaleString()} 판매
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {collection.itemCount || collection.items.length}개
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex w-full gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => router.push(`/marketplace/collections/${collection.id}`)}
          >
            상세보기
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button 
            className="flex-1"
            onClick={() => onPurchase?.(collection.id)}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            구매하기
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// 번들 구매 다이얼로그
export function BundlePurchaseDialog({
  collectionId,
  trigger,
}: {
  collectionId: string;
  trigger?: React.ReactNode;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<BundlePricing | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [purchasing, setPurchasing] = useState(false);

  // 가격 정보 로드
  useEffect(() => {
    if (open && collectionId) {
      loadPricing();
    }
  }, [open, collectionId, selectedItems]);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const selectedItemIds = Array.from(selectedItems).join(",");
      const url = `/api/collections/purchase?collectionId=${collectionId}${
        selectedItemIds ? `&selectedItemIds=${selectedItemIds}` : ""
      }`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setPricing(data);
        // 초기 선택 상태 설정 (필수 아이템 제외)
        if (selectedItems.size === 0) {
          const optionalItems = data.items
            .filter((item: CollectionItem) => !item.isRequired && !item.alreadyPurchased)
            .map((item: CollectionItem) => item.productId);
          setSelectedItems(new Set(optionalItems));
        }
      }
    } catch (error) {
      console.error("Failed to load pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (productId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handlePurchase = async () => {
    if (!session) {
      router.push("/auth/login?callbackUrl=" + encodeURIComponent(window.location.href));
      return;
    }

    setPurchasing(true);
    try {
      const res = await fetch("/api/collections/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          selectedItemIds: Array.from(selectedItems),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // 결제 페이지로 이동 또는 성공 처리
        router.push(`/checkout?bundleId=${collectionId}`);
      } else {
        alert(data.error || "구매 처리 중 오류가 발생했습니다");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("구매 처리 중 오류가 발생했습니다");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <ShoppingCart className="w-4 h-4 mr-2" />
            번들 구매
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {pricing?.collection.title || "번들 구매"}
          </DialogTitle>
          <DialogDescription>
            구매할 상품을 선택하세요. 이미 구매한 상품은 자동으로 제외됩니다.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : pricing ? (
          <>
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-2">
                {pricing.items.map((item) => (
                  <div
                    key={item.productId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      item.alreadyPurchased && "opacity-50 bg-muted"
                    )}
                  >
                    <Checkbox
                      checked={item.isRequired || selectedItems.has(item.productId)}
                      disabled={item.isRequired || item.alreadyPurchased}
                      onCheckedChange={() => handleItemToggle(item.productId)}
                    />
                    
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{item.title}</p>
                      <div className="flex items-center gap-2 text-sm">
                        {item.alreadyPurchased ? (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            구매완료
                          </Badge>
                        ) : item.isRequired ? (
                          <Badge variant="outline" className="text-xs">필수</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">선택</Badge>
                        )}
                        {item.itemDiscountRate && (
                          <Badge className="text-xs bg-red-500">
                            {item.itemDiscountRate}% 할인
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className={cn(
                      "font-medium",
                      item.alreadyPurchased && "line-through"
                    )}>
                      {formatPrice(item.originalPrice)}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            {/* 가격 요약 */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">선택 상품</span>
                <span>{pricing.summary.selectedItems}개</span>
              </div>
              {pricing.summary.alreadyPurchased > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>이미 구매한 상품</span>
                  <span>-{pricing.summary.alreadyPurchased}개</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">정가 합계</span>
                <span>{formatPrice(pricing.pricing.newItemsTotal)}</span>
              </div>
              {pricing.pricing.discountAmount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>번들 할인 ({pricing.pricing.savings}%)</span>
                  <span>-{formatPrice(pricing.pricing.discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>최종 결제 금액</span>
                <span className="text-primary">{formatPrice(pricing.pricing.finalPrice)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            가격 정보를 불러올 수 없습니다
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button 
            onClick={handlePurchase}
            disabled={purchasing || !pricing || pricing.summary.newItems === 0}
          >
            {purchasing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                처리 중...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                {pricing ? formatPrice(pricing.pricing.finalPrice) : "구매하기"} 구매
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 컬렉션 리스트 컴포넌트
export function CollectionList({
  type,
  productType,
  featured,
  limit = 8,
  showViewAll = true,
}: {
  type?: "SERIES" | "BUNDLE" | "PLAYLIST" | "CURATED";
  productType?: string;
  featured?: boolean;
  limit?: number;
  showViewAll?: boolean;
}) {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, [type, productType, featured, limit]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("isPublished", "true");
      params.set("limit", limit.toString());
      if (type) params.set("type", type);
      if (productType) params.set("productType", productType);
      if (featured) params.set("isFeatured", "true");

      const res = await fetch(`/api/collections?${params}`);
      const data = await res.json();

      if (res.ok) {
        setCollections(data.collections);
      }
    } catch (error) {
      console.error("Failed to load collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (collectionId: string) => {
    // BundlePurchaseDialog를 열거나 직접 구매 페이지로 이동
    router.push(`/marketplace/collections/${collectionId}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-video bg-muted" />
            <CardHeader>
              <div className="h-5 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>등록된 컬렉션이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {collections.map((collection) => (
          <CollectionCard 
            key={collection.id} 
            collection={collection}
            onPurchase={handlePurchase}
          />
        ))}
      </div>

      {showViewAll && collections.length >= limit && (
        <div className="text-center pt-4">
          <Button 
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams();
              if (type) params.set("type", type);
              if (productType) params.set("productType", productType);
              router.push(`/marketplace/collections?${params}`);
            }}
          >
            더 보기
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

// 번들 추천 섹션
export function FeaturedBundles() {
  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-green-500" />
              추천 번들
            </h2>
            <p className="text-muted-foreground mt-1">
              묶음 구매로 더 저렴하게 만나보세요
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            <Percent className="w-4 h-4 mr-1" />
            최대 50% 할인
          </Badge>
        </div>
        
        <CollectionList type="BUNDLE" featured limit={4} />
      </div>
    </section>
  );
}

// 시리즈 섹션
export function SeriesSection({ productType }: { productType?: string }) {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-500" />
              시리즈 컬렉션
            </h2>
            <p className="text-muted-foreground mt-1">
              연재물과 시리즈를 한번에
            </p>
          </div>
        </div>
        
        <CollectionList type="SERIES" productType={productType} limit={4} />
      </div>
    </section>
  );
}

// 플레이리스트 섹션 (음악/영상용)
export function PlaylistSection() {
  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Music2 className="w-6 h-6 text-purple-500" />
              플레이리스트
            </h2>
            <p className="text-muted-foreground mt-1">
              큐레이션된 음악과 영상 컬렉션
            </p>
          </div>
        </div>
        
        <CollectionList type="PLAYLIST" limit={4} />
      </div>
    </section>
  );
}
