"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Search,
  Grid3X3,
  List,
  Briefcase,
  Zap,
  BarChart3,
  Heart,
  Code2,
  Puzzle,
  Star,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useProducts, useCategories, useSearchSuggestions, usePopularTags } from "@/hooks/use-api";
import { AdvancedFilter, ActiveFilters, type FilterState } from "@/components/ui/advanced-filter";
import { RecommendationSection } from "@/components/ui/recommendation-section";
import { RecentlyViewedWidget } from "@/components/marketplace/recently-viewed-widget";
import { CompareButton } from "@/components/marketplace/compare-components";
import type { Product, Category } from "@/types";

// 카테고리별 아이콘 매핑
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "business-model": Briefcase,
  "automation": Zap,
  "data-analysis": BarChart3,
  "lifestyle": Heart,
  "dev-tool": Code2,
  "education": Code2,
  "content": Puzzle,
  "finance": BarChart3,
  "health": Heart,
  "other": Puzzle,
};

const sortOptions = [
  { id: "latest", name: "최신순" },
  { id: "popular", name: "인기순" },
  { id: "price-low", name: "가격 낮은순" },
  { id: "price-high", name: "가격 높은순" },
  { id: "rating", name: "평점순" },
];

// 콘텐츠 타입 필터
const contentTypes = [
  { id: "all", name: "전체", icon: Grid3X3 },
  { id: "DIGITAL_PRODUCT", name: "디지털 상품", icon: Code2 },
  { id: "BOOK", name: "AI 도서", icon: Briefcase },
  { id: "VIDEO_SERIES", name: "AI 영상", icon: Heart },
  { id: "MUSIC_ALBUM", name: "AI 음악", icon: Zap },
];

export function MarketplaceContent() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string>("all");
  const [sortBy, setSortBy] = useState("latest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [page, setPage] = useState(1);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // 고급 필터 상태
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    priceRange: [0, 1000000],
    rating: 0,
    pricingType: "all",
    licenses: [],
    sortBy: "latest",
    tags: [],
  });

  const defaultFilters: FilterState = {
    priceRange: [0, 1000000],
    rating: 0,
    pricingType: "all",
    licenses: [],
    sortBy: "latest",
    tags: [],
  };

  const resetFilters = () => {
    setAdvancedFilters(defaultFilters);
  };

  const removeFilter = (key: keyof FilterState, value?: string) => {
    if (key === "licenses" && value) {
      setAdvancedFilters((prev) => ({
        ...prev,
        licenses: prev.licenses.filter((l) => l !== value),
      }));
    } else if (key === "tags" && value) {
      setAdvancedFilters((prev) => ({
        ...prev,
        tags: prev.tags.filter((t) => t !== value),
      }));
    } else if (key === "priceRange") {
      setAdvancedFilters((prev) => ({ ...prev, priceRange: [0, 1000000] }));
    } else if (key === "rating") {
      setAdvancedFilters((prev) => ({ ...prev, rating: 0 }));
    } else if (key === "pricingType") {
      setAdvancedFilters((prev) => ({ ...prev, pricingType: "all" }));
    }
  };

  // 검색어 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // 검색 시 첫 페이지로
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 검색 자동완성 (debounced)
  const [suggestionQuery, setSuggestionQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuggestionQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 검색 자동완성 및 인기 태그 데이터
  const { data: suggestionsData } = useSearchSuggestions(suggestionQuery, {
    enabled: showSuggestions && suggestionQuery.length > 0,
  });
  const { data: popularTagsData } = usePopularTags(10);

  // 외부 클릭 시 검색 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 태그 선택/해제
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setSearchQuery(tag);
    setShowSuggestions(false);
  };

  // 자동완성 항목 클릭
  const handleSuggestionClick = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);
  };

  // 카테고리 데이터
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  
  // sortBy를 API 파라미터로 변환
  const sortMapping: Record<string, { sortBy: string; sortOrder: "asc" | "desc" }> = {
    latest: { sortBy: "createdAt", sortOrder: "desc" },
    popular: { sortBy: "downloadCount", sortOrder: "desc" },
    "price-low": { sortBy: "price", sortOrder: "asc" },
    "price-high": { sortBy: "price", sortOrder: "desc" },
    rating: { sortBy: "rating", sortOrder: "desc" },
  };

  const currentSort = sortMapping[sortBy] || sortMapping.latest;

  // 상품 데이터
  const { 
    data: productsData, 
    isLoading: productsLoading, 
    error: productsError,
    refetch 
  } = useProducts({
    page,
    limit: 12,
    category: selectedCategory || undefined,
    search: debouncedSearch || undefined,
    isFree: priceFilter === "free" ? true : priceFilter === "paid" ? false : undefined,
    sortBy: currentSort.sortBy,
    sortOrder: currentSort.sortOrder,
    productType: selectedContentType !== "all" ? selectedContentType : undefined,
  });

  // 카테고리 목록 (전체 포함)
  const categories = useMemo(() => {
    const allCategory = {
      id: null as string | null,
      name: "전체",
      icon: Grid3X3,
      count: productsData?.pagination?.total || 0,
    };
    
    const dbCategories = (categoriesData || []).map((cat: Category) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: categoryIcons[cat.slug] || Puzzle,
      count: cat._count?.products || 0,
    }));

    return [allCategory, ...dbCategories];
  }, [categoriesData, productsData]);

  const products = productsData?.products || [];
  const totalProducts = productsData?.pagination?.total || 0;
  const totalPages = productsData?.pagination?.totalPages || 1;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Hero Section */}
      <section className="py-16 bg-[var(--bg-surface)] border-b border-[var(--bg-border)]">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Pandora Shop
            </h1>
            <p className="text-[var(--text-tertiary)] mb-8">
              VIBE 코딩으로 제작된 다양한 디지털 상품을 둘러보세요.
              <br />
              비즈니스부터 개발 도구까지, 당신이 필요한 솔루션이 있습니다.
            </p>

            {/* Search Bar with Autocomplete */}
            <div ref={searchRef} className="relative">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    placeholder="상품 검색..."
                    icon={<Search className="w-5 h-5" />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    className="flex-1"
                  />
                </div>
                <AdvancedFilter
                  filters={advancedFilters}
                  onChange={setAdvancedFilters}
                  availableTags={popularTagsData?.tags?.map((t: { tag: string }) => t.tag) || []}
                  onReset={resetFilters}
                  isOpen={showAdvancedFilter}
                  onToggle={() => setShowAdvancedFilter(!showAdvancedFilter)}
                />
              </div>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-12 mt-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    {/* 검색 결과가 있을 때 */}
                    {suggestionQuery && suggestionsData && (
                      <>
                        {suggestionsData.products?.length > 0 && (
                          <div className="p-3">
                            <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2">
                              상품
                            </p>
                            {suggestionsData.products.slice(0, 5).map((product: { id: string; title: string; thumbnail?: string | null; price: number }) => (
                              <button
                                key={product.id}
                                onClick={() => handleSuggestionClick(product.title)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center overflow-hidden">
                                  {product.thumbnail ? (
                                    <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Puzzle className="w-5 h-5 text-[var(--text-tertiary)]" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                    {product.title}
                                  </p>
                                  <p className="text-xs text-[var(--text-tertiary)]">
                                    {product.price === 0 ? "무료" : `₩${product.price.toLocaleString()}`}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {suggestionsData.tags?.length > 0 && (
                          <div className="p-3 border-t border-[var(--bg-border)]">
                            <p className="text-xs font-medium text-[var(--text-tertiary)] mb-2">
                              태그
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {suggestionsData.tags.slice(0, 8).map((tag: string) => (
                                <button
                                  key={tag}
                                  onClick={() => handleTagToggle(tag)}
                                  className="px-2 py-1 text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {(!suggestionsData.products?.length && !suggestionsData.tags?.length) && (
                          <div className="p-4 text-center text-sm text-[var(--text-tertiary)]">
                            검색 결과가 없습니다
                          </div>
                        )}
                      </>
                    )}

                    {/* 인기 태그 (검색어가 없을 때) */}
                    {!suggestionQuery && popularTagsData?.tags && popularTagsData.tags.length > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
                          <p className="text-xs font-medium text-[var(--text-tertiary)]">
                            인기 검색어
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {popularTagsData.tags.map((tag: { tag: string; count: number }) => (
                            <button
                              key={tag.tag}
                              onClick={() => handleTagToggle(tag.tag)}
                              className="px-3 py-1.5 text-sm bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-full hover:bg-[var(--accent-primary)] hover:text-white transition-colors flex items-center gap-1"
                            >
                              <span>#{tag.tag}</span>
                              <span className="text-xs opacity-60">({tag.count})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 선택된 태그 표시 */}
            {selectedTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 flex flex-wrap gap-2"
              >
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => handleTagToggle(tag)}
                  >
                    #{tag}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
                <button
                  onClick={() => {
                    setSelectedTags([]);
                    setSearchQuery("");
                  }}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  전체 삭제
                </button>
              </motion.div>
            )}

            {/* 활성 필터 표시 */}
            <div className="mt-4">
              <ActiveFilters
                filters={advancedFilters}
                onRemove={removeFilter}
                onReset={resetFilters}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Type Tabs */}
      <section className="py-4 bg-[var(--bg-surface)] border-b border-[var(--bg-border)] sticky top-16 z-40">
        <div className="container-app">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedContentType(type.id);
                  setSelectedCategory(null);
                  setPage(1);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedContentType === type.id
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                )}
              >
                <type.icon className="w-4 h-4" />
                {type.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Recommendation Section - 로그인한 사용자에게만 표시 */}
      {session?.user && (
        <section className="py-8 border-b border-[var(--bg-border)]">
          <div className="container-app">
            <RecommendationSection 
              type="products" 
              title="맞춤 추천 상품"
              limit={6}
              showRefresh={true}
            />
          </div>
        </section>
      )}

      {/* Popular Products Section - 비로그인 사용자에게도 표시 */}
      {!session?.user && (
        <section className="py-8 border-b border-[var(--bg-border)]">
          <div className="container-app">
            <RecommendationSection 
              type="popular" 
              title="인기 상품"
              limit={6}
              showRefresh={false}
            />
          </div>
        </section>
      )}

      <div className="container-app py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">
                카테고리
              </h2>
              <nav className="space-y-1">
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
                  </div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id || "all"}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setPage(1);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                        selectedCategory === category.id
                          ? "bg-[var(--primary)] text-white"
                          : "text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <category.icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{category.name}</span>
                      <span className="text-xs opacity-70">{category.count}</span>
                    </button>
                  ))
                )}
              </nav>

              {/* Price Filter */}
              <div className="mt-8">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">
                  가격
                </h2>
                <div className="space-y-2">
                  {[
                    { id: "all", name: "전체" },
                    { id: "free", name: "무료" },
                    { id: "paid", name: "유료" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setPriceFilter(option.id as typeof priceFilter);
                        setPage(1);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                        priceFilter === option.id
                          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--primary)]"
                          : "text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]"
                      )}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 최근 본 상품 위젯 */}
              <div className="mt-8">
                <RecentlyViewedWidget variant="sidebar" maxItems={5} />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-[var(--text-tertiary)]">
                <span className="text-[var(--text-primary)] font-medium">
                  {totalProducts}
                </span>
                개의 상품
              </p>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>

                {/* View Mode */}
                <div className="flex border border-[var(--bg-border)] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "grid"
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "list"
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                <span className="ml-3 text-[var(--text-tertiary)]">상품을 불러오는 중...</span>
              </div>
            ) : productsError ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                  오류가 발생했습니다
                </h3>
                <p className="text-[var(--text-tertiary)] mb-4">
                  상품을 불러오는 중 문제가 발생했습니다.
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  다시 시도
                </Button>
              </div>
            ) : products.length > 0 ? (
              <>
                <div
                  className={cn(
                    "grid gap-6",
                    viewMode === "grid"
                      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1"
                  )}
                >
                  {products.map((product: Product, index: number) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard product={product} viewMode={viewMode} />
                    </motion.div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      이전
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={cn(
                              "w-8 h-8 rounded-lg text-sm transition-all",
                              page === pageNum
                                ? "bg-[var(--primary)] text-white"
                                : "text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]"
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      다음
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                  <Search className="w-8 h-8 text-[var(--text-disabled)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-[var(--text-tertiary)]">
                  다른 키워드로 검색하거나 필터를 변경해보세요.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  viewMode: "grid" | "list";
}

function ProductCard({ product, viewMode }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  // API 데이터에서 필요한 값 추출
  const isFree = product.price === 0;
  const rating = product.rating || 0;
  const _reviewCount = product._count?.reviews || 0; // 향후 UI에 사용 예정
  const downloads = product.downloadCount || 0;
  const views = product.viewCount || 0;
  const tags = product.tags || [];
  const sellerName = product.seller?.name || "익명";

  if (viewMode === "list") {
    return (
      <Link href={`/marketplace/${product.id}`}>
        <Card className="group cursor-pointer">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div className="w-32 h-24 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.thumbnailUrl ? (
                  <img 
                    src={product.thumbnailUrl} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {product.title[0]}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                    {product.title}
                  </h3>
                  <Badge variant={isFree ? "free" : "secondary"}>
                    {isFree ? "무료" : `₩${formatPrice(product.price)}`}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--text-tertiary)] line-clamp-2 mb-3">
                  {product.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-[var(--text-disabled)]">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[var(--accent-amber)]" />
                    {rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {views}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/marketplace/${product.id}`}>
      <Card className="group cursor-pointer h-full flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
          {/* Thumbnail */}
          <div className="aspect-video rounded-t-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center relative overflow-hidden">
            {product.thumbnailUrl ? (
              <img 
                src={product.thumbnailUrl} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-4xl font-bold">
                {product.title[0]}
              </span>
            )}
            {/* Price Badge */}
            <div className="absolute top-3 right-3">
              <Badge variant={isFree ? "free" : "premium"}>
                {isFree ? "무료" : `₩${formatPrice(product.price)}`}
              </Badge>
            </div>
            {/* Compare Button */}
            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <CompareButton productId={product.id} variant="icon" />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--primary)] transition-colors">
              {product.title}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] line-clamp-2 mb-4 flex-1">
              {product.description}
            </p>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tags.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--bg-border)]">
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/seller/${product.seller?.id}`;
                }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-violet)] flex items-center justify-center overflow-hidden">
                  {product.seller?.image ? (
                    <img 
                      src={product.seller.image} 
                      alt={sellerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xs font-medium">
                      {sellerName[0]}
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors">
                  {sellerName}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-disabled)]">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[var(--accent-amber)]" />
                  {rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {downloads}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
