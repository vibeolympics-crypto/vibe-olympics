'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  TrendingUp,
  Users,
  BookOpen,
  Package,
  ChevronRight,
  Star,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecommendedProduct {
  id: string;
  title: string;
  price: number;
  thumbnailUrl: string | null;
  tags: string[];
  matchScore?: number;
  recommendReason?: string;
  seller: {
    id: string;
    name: string | null;
    image: string | null;
  };
  category: {
    id: string;
    name: string;
  };
  _count?: {
    purchases: number;
    reviews: number;
  };
  averageRating?: number;
}

interface RecommendedTutorial {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  type: string;
  matchScore?: number;
  recommendReason?: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count?: {
    likes: number;
    comments: number;
  };
}

interface RecommendedSeller {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  matchScore?: number;
  recommendReason?: string;
  _count?: {
    products: number;
    followers: number;
  };
}

interface RecommendationResponse {
  type: string;
  products?: RecommendedProduct[];
  tutorials?: RecommendedTutorial[];
  sellers?: RecommendedSeller[];
  popular?: RecommendedProduct[];
}

interface RecommendationSectionProps {
  type?: 'products' | 'tutorials' | 'sellers' | 'popular';
  title?: string;
  limit?: number;
  showRefresh?: boolean;
  className?: string;
}

export function RecommendationSection({
  type = 'products',
  title,
  limit = 6,
  showRefresh = true,
  className,
}: RecommendationSectionProps) {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recommendations?type=${type}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('추천 데이터를 불러오지 못했습니다.');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [type, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const getIcon = () => {
    switch (type) {
      case 'products':
        return <Package className="h-5 w-5" />;
      case 'tutorials':
        return <BookOpen className="h-5 w-5" />;
      case 'sellers':
        return <Users className="h-5 w-5" />;
      case 'popular':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'products':
        return '추천 상품';
      case 'tutorials':
        return '추천 튜토리얼';
      case 'sellers':
        return '추천 셀러';
      case 'popular':
        return '인기 콘텐츠';
      default:
        return '맞춤 추천';
    }
  };

  if (error) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {getIcon()}
            {getTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchRecommendations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {getTitle()}
          </CardTitle>
          {showRefresh && !loading && (
            <Button variant="ghost" size="sm" onClick={fetchRecommendations}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <RecommendationSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {type === 'products' && data?.products && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.products.map((product) => (
                  <ProductRecommendationCard key={product.id} product={product} />
                ))}
              </div>
            )}
            {type === 'tutorials' && data?.tutorials && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.tutorials.map((tutorial) => (
                  <TutorialRecommendationCard key={tutorial.id} tutorial={tutorial} />
                ))}
              </div>
            )}
            {type === 'sellers' && data?.sellers && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.sellers.map((seller) => (
                  <SellerRecommendationCard key={seller.id} seller={seller} />
                ))}
              </div>
            )}
            {type === 'popular' && data?.popular && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.popular.map((product) => (
                  <ProductRecommendationCard key={product.id} product={product} isPopular />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ProductRecommendationCard({
  product,
  isPopular = false,
}: {
  product: RecommendedProduct;
  isPopular?: boolean;
}) {
  return (
    <Link href={`/marketplace/${product.id}`}>
      <div className="group relative bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all">
        {/* Thumbnail */}
        <div className="aspect-video relative bg-muted">
          {product.thumbnailUrl ? (
            <Image
              src={product.thumbnailUrl}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          {isPopular && (
            <Badge className="absolute top-2 left-2 bg-orange-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              인기
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h4>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-primary">
              ₩{product.price.toLocaleString()}
            </span>
            {product.averageRating && product.averageRating > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {product.averageRating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Recommend Reason */}
          {product.recommendReason && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
              <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
              {product.recommendReason}
            </p>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function TutorialRecommendationCard({ tutorial }: { tutorial: RecommendedTutorial }) {
  return (
    <Link href={`/education/${tutorial.id}`}>
      <div className="group relative bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all">
        {/* Thumbnail */}
        <div className="aspect-video relative bg-muted">
          {tutorial.thumbnailUrl ? (
            <Image
              src={tutorial.thumbnailUrl}
              alt={tutorial.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <Badge className="absolute top-2 left-2" variant="secondary">
            {tutorial.type === 'TUTORIAL'
              ? '튜토리얼'
              : tutorial.type === 'MAKING'
              ? '제작기'
              : '팁'}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-3">
          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {tutorial.title}
          </h4>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {tutorial.author.image && (
              <Image
                src={tutorial.author.image}
                alt={tutorial.author.name || ''}
                width={16}
                height={16}
                className="rounded-full"
              />
            )}
            <span>{tutorial.author.name}</span>
          </div>

          {/* Recommend Reason */}
          {tutorial.recommendReason && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
              <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
              {tutorial.recommendReason}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function SellerRecommendationCard({ seller }: { seller: RecommendedSeller }) {
  return (
    <Link href={`/seller/${seller.id}`}>
      <div className="group relative bg-card border rounded-lg p-4 hover:shadow-lg transition-all">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative w-12 h-12 rounded-full bg-muted overflow-hidden">
            {seller.image ? (
              <Image
                src={seller.image}
                alt={seller.name || ''}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
              {seller.name || '익명 셀러'}
            </h4>
            {seller._count && (
              <p className="text-xs text-muted-foreground">
                상품 {seller._count.products}개 · 팔로워 {seller._count.followers}명
              </p>
            )}
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        {/* Bio */}
        {seller.bio && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{seller.bio}</p>
        )}

        {/* Recommend Reason */}
        {seller.recommendReason && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
            <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
            {seller.recommendReason}
          </p>
        )}
      </div>
    </Link>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// 컴팩트 버전 (사이드바용)
interface CompactRecommendationProps {
  type?: 'products' | 'tutorials' | 'popular';
  limit?: number;
  className?: string;
}

export function CompactRecommendation({
  type = 'products',
  limit = 4,
  className,
}: CompactRecommendationProps) {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/recommendations?type=${type}&limit=${limit}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch {
        console.error('Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type, limit]);

  const items = type === 'products' ? data?.products : type === 'tutorials' ? data?.tutorials : data?.popular;

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={type === 'tutorials' ? `/education/${item.id}` : `/marketplace/${item.id}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="relative w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
            {'thumbnailUrl' in item && item.thumbnailUrl ? (
              <Image
                src={item.thumbnailUrl}
                alt={'title' in item ? item.title : ''}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {type === 'tutorials' ? (
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Package className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-1">
              {'title' in item ? item.title : ''}
            </p>
            {'price' in item && (
              <p className="text-xs text-primary font-medium">
                ₩{(item as RecommendedProduct).price.toLocaleString()}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
