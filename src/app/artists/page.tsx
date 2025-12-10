"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Package,
  Star,
  Check,
  TrendingUp,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Artist {
  id: string;
  name: string | null;
  displayName: string | null;
  slug: string | null;
  image: string | null;
  coverImage: string | null;
  bio: string | null;
  artistType: string | null;
  specialties: string[];
  isVerifiedArtist: boolean;
  totalSales: number;
  productCount: number;
  followerCount: number;
}

// 아티스트 타입 옵션
const ARTIST_TYPES = [
  { value: "", label: "전체" },
  { value: "작가", label: "작가" },
  { value: "디자이너", label: "디자이너" },
  { value: "개발자", label: "개발자" },
  { value: "뮤지션", label: "뮤지션" },
  { value: "영상 크리에이터", label: "영상 크리에이터" },
  { value: "AI 아티스트", label: "AI 아티스트" },
];

export default function ArtistsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [artistType, setArtistType] = useState(searchParams.get("type") || "");
  const [featured, setFeatured] = useState(searchParams.get("featured") === "true");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadArtists();
  }, [artistType, featured, page]);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (artistType) params.set("artistType", artistType);
      if (featured) params.set("featured", "true");

      const res = await fetch(`/api/artists?${params}`);
      const data = await res.json();

      if (res.ok) {
        setArtists(data.artists);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to load artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = search
    ? artists.filter(a => 
        (a.displayName || a.name || "").toLowerCase().includes(search.toLowerCase()) ||
        a.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()))
      )
    : artists;

  return (
    <div className="min-h-screen bg-background">
      {/* 히어로 섹션 */}
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Users className="w-10 h-10 text-primary" />
            아티스트
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            VIBE 코딩으로 창작하는 작가, 디자이너, 개발자, 뮤지션들을 만나보세요.
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* 필터 바 */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="아티스트 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={artistType} onValueChange={setArtistType}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="분야" />
            </SelectTrigger>
            <SelectContent>
              {ARTIST_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={featured ? "default" : "outline"}
            onClick={() => setFeatured(!featured)}
          >
            <Star className={cn("w-4 h-4 mr-2", featured && "fill-current")} />
            인증 아티스트
          </Button>

          <div className="flex gap-1 border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 아티스트 목록 */}
        {loading ? (
          <div className={cn(
            "gap-6",
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col"
          )}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className={cn(
            "gap-6",
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col"
          )}>
            {filteredArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-2">아티스트를 찾을 수 없습니다</h3>
            <p className="text-muted-foreground">
              다른 검색어나 필터를 시도해보세요
            </p>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              이전
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ArtistCard({ 
  artist, 
  viewMode 
}: { 
  artist: Artist; 
  viewMode: "grid" | "list";
}) {
  const displayName = artist.displayName || artist.name || "익명";
  const profileUrl = artist.slug ? `/artists/${artist.slug}` : `/artists/id/${artist.id}`;

  if (viewMode === "list") {
    return (
      <Link href={profileUrl}>
        <Card className="group hover:shadow-md transition-all">
          <div className="flex items-center p-4 gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={artist.image || undefined} alt={displayName} />
              <AvatarFallback className="text-2xl">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{displayName}</h3>
                {artist.isVerifiedArtist && (
                  <Badge className="bg-blue-500">
                    <Check className="w-3 h-3" />
                  </Badge>
                )}
              </div>
              {artist.artistType && (
                <p className="text-sm text-muted-foreground mb-2">{artist.artistType}</p>
              )}
              {artist.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {artist.specialties.slice(0, 3).map((s, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-6 text-center">
              <div>
                <p className="text-xl font-bold">{artist.productCount}</p>
                <p className="text-xs text-muted-foreground">작품</p>
              </div>
              <div>
                <p className="text-xl font-bold">{artist.totalSales}</p>
                <p className="text-xs text-muted-foreground">판매</p>
              </div>
              <div>
                <p className="text-xl font-bold">{artist.followerCount}</p>
                <p className="text-xs text-muted-foreground">팔로워</p>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={profileUrl}>
      <Card className="group overflow-hidden hover:shadow-md transition-all h-full">
        {/* 커버 이미지 */}
        <div className="relative h-24 bg-gradient-to-r from-primary/20 to-purple-500/20">
          {artist.coverImage && (
            <Image
              src={artist.coverImage}
              alt={`${displayName} 커버`}
              fill
              className="object-cover"
            />
          )}
        </div>

        <CardHeader className="-mt-12 relative pb-2">
          <Avatar className="w-20 h-20 border-4 border-background">
            <AvatarImage src={artist.image || undefined} alt={displayName} />
            <AvatarFallback className="text-2xl">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="font-semibold text-lg line-clamp-1">{displayName}</h3>
            {artist.isVerifiedArtist && (
              <Badge className="bg-blue-500 flex-shrink-0">
                <Check className="w-3 h-3" />
              </Badge>
            )}
          </div>
          {artist.artistType && (
            <p className="text-sm text-muted-foreground">{artist.artistType}</p>
          )}
        </CardHeader>

        <CardContent className="pb-2">
          {artist.bio ? (
            <p className="text-sm text-muted-foreground line-clamp-2">{artist.bio}</p>
          ) : artist.specialties.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {artist.specialties.slice(0, 3).map((s, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="pt-2">
          <div className="flex justify-around w-full text-center text-sm">
            <div>
              <p className="font-bold">{artist.productCount}</p>
              <p className="text-xs text-muted-foreground">작품</p>
            </div>
            <div>
              <p className="font-bold">{artist.totalSales}</p>
              <p className="text-xs text-muted-foreground">판매</p>
            </div>
            <div>
              <p className="font-bold">{artist.followerCount}</p>
              <p className="text-xs text-muted-foreground">팔로워</p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
