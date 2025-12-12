"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  MapPin,
  Globe,
  Github,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Music,
  Palette,
  ShoppingBag,
  Star,
  Eye,
  Users,
  Heart,
  Check,
  ExternalLink,
  Grid3X3,
  Package,
  BookOpen,
  Film,
  Music2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface ArtistProfile {
  id: string;
  name: string | null;
  displayName: string | null;
  slug: string | null;
  image: string | null;
  coverImage: string | null;
  bio: string | null;
  artistType: string | null;
  specialties: string[];
  location: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  linkedin: string | null;
  soundcloud: string | null;
  behance: string | null;
  isSeller: boolean;
  sellerVerified: boolean;
  isVerifiedArtist: boolean;
  totalSales: number;
  createdAt: string;
  stats: {
    productCount: number;
    followerCount: number;
    followingCount: number;
    totalSales: number;
    totalViews: number;
    averageRating: number;
    reviewCount: number;
  };
}

interface Product {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  productType: string;
  price: number;
  averageRating: number;
  salesCount: number;
}

interface Collection {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  type: string;
  itemCount: number;
}

// ProductType 아이콘
const PRODUCT_TYPE_ICONS: Record<string, React.ElementType> = {
  DIGITAL_PRODUCT: Package,
  BOOK: BookOpen,
  VIDEO_SERIES: Film,
  MUSIC_ALBUM: Music2,
};

// 소셜 링크 아이콘
const SOCIAL_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  website: { icon: Globe, color: "text-gray-600", label: "웹사이트" },
  github: { icon: Github, color: "text-gray-800", label: "GitHub" },
  twitter: { icon: Twitter, color: "text-blue-400", label: "Twitter" },
  instagram: { icon: Instagram, color: "text-pink-500", label: "Instagram" },
  youtube: { icon: Youtube, color: "text-red-500", label: "YouTube" },
  linkedin: { icon: Linkedin, color: "text-blue-600", label: "LinkedIn" },
  soundcloud: { icon: Music, color: "text-orange-500", label: "SoundCloud" },
  behance: { icon: Palette, color: "text-blue-500", label: "Behance" },
};

// 가격 포맷
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(price);
};

export default function ArtistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [seoData, setSeoData] = useState<{ jsonLd: object } | null>(null);

  useEffect(() => {
    if (slug) {
      loadProfile();
    }
  }, [slug]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/artists?slug=${slug}`);
      const data = await res.json();

      if (res.ok) {
        setProfile(data.profile);
        setRecentProducts(data.recentProducts);
        setPopularProducts(data.popularProducts);
        setCollections(data.collections);
        setSeoData(data.seo); // SEO 데이터 저장
        // TODO: 팔로우 상태 확인
      } else {
        router.push("/404");
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!session) {
      router.push("/auth/login?callbackUrl=" + encodeURIComponent(window.location.href));
      return;
    }

    setFollowLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profile?.id }),
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
        if (profile) {
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followerCount: profile.stats.followerCount + (isFollowing ? -1 : 1),
            },
          });
        }
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return null;
  }

  const displayName = profile.displayName || profile.name || "익명";
  const socialLinks = Object.entries(SOCIAL_ICONS).filter(
    ([key]) => profile[key as keyof ArtistProfile]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD SEO 구조화 데이터 */}
      {seoData?.jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.jsonLd) }}
        />
      )}
      
      {/* 커버 이미지 */}
      <div className="relative h-48 md:h-64 lg:h-80 bg-gradient-to-r from-primary/20 to-primary/5">
        {profile.coverImage && (
          <Image
            src={profile.coverImage}
            alt={`${displayName} 커버`}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container relative -mt-20 pb-12">
        {/* 프로필 헤더 */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-8">
          <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-xl">
            <AvatarImage src={profile.image || undefined} alt={displayName} />
            <AvatarFallback className="text-4xl">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{displayName}</h1>
              {profile.isVerifiedArtist && (
                <Badge className="bg-blue-500">
                  <Check className="w-3 h-3 mr-1" />
                  인증 아티스트
                </Badge>
              )}
              {profile.sellerVerified && (
                <Badge variant="secondary">
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  인증 판매자
                </Badge>
              )}
            </div>

            {profile.artistType && (
              <p className="text-lg text-muted-foreground">{profile.artistType}</p>
            )}

            {profile.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </p>
            )}

            {/* 전문 분야 */}
            {profile.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((specialty, idx) => (
                  <Badge key={idx} variant="outline">
                    {specialty}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            {session?.user?.id !== profile.id && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : isFollowing ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    팔로잉
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    팔로우
                  </>
                )}
              </Button>
            )}
            {session?.user?.id === profile.id && (
              <Button variant="outline" onClick={() => router.push("/dashboard/profile")}>
                프로필 편집
              </Button>
            )}
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={Package}
            label="작품"
            value={profile.stats.productCount}
          />
          <StatCard
            icon={ShoppingBag}
            label="판매"
            value={profile.stats.totalSales}
          />
          <StatCard
            icon={Eye}
            label="조회"
            value={profile.stats.totalViews}
          />
          <StatCard
            icon={Star}
            label="평점"
            value={profile.stats.averageRating.toFixed(1)}
          />
          <StatCard
            icon={Users}
            label="팔로워"
            value={profile.stats.followerCount}
          />
          <StatCard
            icon={Heart}
            label="리뷰"
            value={profile.stats.reviewCount}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 사이드바 */}
          <div className="space-y-6">
            {/* 소개 */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    소개
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 소셜 링크 */}
            {socialLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    링크
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {socialLinks.map(([key, { icon: Icon, color, label }]) => {
                    const value = profile[key as keyof ArtistProfile] as string;
                    const href = key === "website" ? value : 
                      key === "github" ? `https://github.com/${value}` :
                      key === "twitter" ? `https://twitter.com/${value}` :
                      key === "instagram" ? `https://instagram.com/${value}` :
                      key === "youtube" ? value :
                      key === "linkedin" ? value :
                      key === "soundcloud" ? `https://soundcloud.com/${value}` :
                      key === "behance" ? `https://behance.net/${value}` :
                      value;

                    return (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Icon className={cn("w-5 h-5", color)} />
                        <span className="flex-1 truncate">{label}</span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </a>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="products" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  작품
                </TabsTrigger>
                <TabsTrigger value="popular" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  인기
                </TabsTrigger>
                <TabsTrigger value="collections" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  컬렉션
                </TabsTrigger>
              </TabsList>

              {/* 최근 작품 */}
              <TabsContent value="products" className="space-y-4">
                {recentProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {recentProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Package} message="등록된 작품이 없습니다" />
                )}
                
                {profile.stats.productCount > 8 && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/marketplace?sellerId=${profile.id}`)}
                    >
                      전체 작품 보기
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* 인기 작품 */}
              <TabsContent value="popular" className="space-y-4">
                {popularProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {popularProducts.map((product) => (
                      <ProductCard key={product.id} product={product} showRank />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={TrendingUp} message="아직 판매 기록이 없습니다" />
                )}
              </TabsContent>

              {/* 컬렉션 */}
              <TabsContent value="collections" className="space-y-4">
                {collections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {collections.map((collection) => (
                      <CollectionCard key={collection.id} collection={collection} />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Package} message="등록된 컬렉션이 없습니다" />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string;
}) {
  const displayValue = typeof value === "number" 
    ? value.toLocaleString() 
    : value;

  return (
    <Card>
      <CardContent className="pt-4 text-center">
        <Icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
        <p className="text-2xl font-bold">{displayValue}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// 상품 카드 컴포넌트
function ProductCard({ 
  product, 
  showRank 
}: { 
  product: Product; 
  showRank?: boolean;
}) {
  const TypeIcon = PRODUCT_TYPE_ICONS[product.productType] || Package;

  return (
    <Link href={`/marketplace/${product.slug}`}>
      <Card className="group overflow-hidden hover:shadow-md transition-all">
        <div className="relative aspect-square bg-muted">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          {showRank && product.salesCount > 0 && (
            <Badge className="absolute top-2 left-2 bg-yellow-500">
              <TrendingUp className="w-3 h-3 mr-1" />
              {product.salesCount}판매
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <p className="font-medium line-clamp-1">{product.title}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm font-bold text-primary">
              {formatPrice(product.price)}
            </p>
            {product.averageRating > 0 && (
              <span className="flex items-center text-xs text-muted-foreground">
                <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                {product.averageRating.toFixed(1)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// 컬렉션 카드 컴포넌트
function CollectionCard({ collection }: { collection: Collection }) {
  const typeIcons: Record<string, React.ElementType> = {
    SERIES: BookOpen,
    BUNDLE: Package,
    PLAYLIST: Music2,
    CURATED: Sparkles,
  };
  const TypeIcon = typeIcons[collection.type] || Package;

  return (
    <Link href={`/marketplace/collections/${collection.slug}`}>
      <Card className="group overflow-hidden hover:shadow-md transition-all">
        <div className="flex">
          <div className="relative w-24 h-24 bg-muted flex-shrink-0">
            {collection.thumbnail ? (
              <Image
                src={collection.thumbnail}
                alt={collection.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <TypeIcon className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <CardContent className="p-4 flex-1">
            <p className="font-medium line-clamp-1">{collection.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <TypeIcon className="w-3 h-3 mr-1" />
                {collection.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {collection.itemCount}개 상품
              </span>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

// 빈 상태 컴포넌트
function EmptyState({ 
  icon: Icon, 
  message 
}: { 
  icon: React.ElementType; 
  message: string;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// 로딩 스켈레톤
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-64 w-full" />
      <div className="container -mt-20 pb-12">
        <div className="flex gap-6 items-end mb-8">
          <Skeleton className="w-40 h-40 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
