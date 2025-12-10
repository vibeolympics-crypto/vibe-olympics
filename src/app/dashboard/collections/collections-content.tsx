"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Layers,
  Package,
  Book,
  Film,
  Music,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  X,
  Check,
  AlertCircle,
  ImagePlus,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatPrice } from "@/lib/utils";

// 컬렉션 타입 정의
interface CollectionItem {
  id: string;
  productId: string;
  order: number;
  itemDiscountRate?: number;
  isRequired: boolean;
  product?: {
    id: string;
    title: string;
    thumbnail?: string;
    price: number;
    discountPrice?: number;
    productType: string;
  };
}

interface Collection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  type: "SERIES" | "BUNDLE" | "PLAYLIST" | "CURATED";
  productType?: string;
  bundlePrice?: number;
  discountRate?: number;
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  salesCount: number;
  createdAt: string;
  items?: CollectionItem[];
  _count?: { items: number };
  typeLabel?: string;
}

interface Product {
  id: string;
  title: string;
  thumbnail?: string;
  price: number;
  discountPrice?: number;
  productType: string;
}

// 상수
const COLLECTION_TYPES = [
  { id: "BUNDLE", name: "번들", icon: Package, description: "세트 상품 묶음" },
  { id: "SERIES", name: "시리즈", icon: Layers, description: "순차적 콘텐츠" },
  { id: "PLAYLIST", name: "플레이리스트", icon: Music, description: "음악 모음" },
  { id: "CURATED", name: "큐레이션", icon: Filter, description: "선별된 상품" },
];

const PRODUCT_TYPE_ICONS: Record<string, React.ElementType> = {
  DIGITAL_PRODUCT: Package,
  BOOK: Book,
  VIDEO_SERIES: Film,
  MUSIC_ALBUM: Music,
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  DIGITAL_PRODUCT: "디지털 상품",
  BOOK: "도서",
  VIDEO_SERIES: "영상 시리즈",
  MUSIC_ALBUM: "음악 앨범",
};

export function CollectionsContent() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 컬렉션 목록 조회
  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      params.set("includeItems", "true");
      
      const response = await fetch(`/api/collections?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // 컬렉션 삭제
  const handleDelete = async (id: string) => {
    if (!confirm("컬렉션을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/collections?id=${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setCollections(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
    }
  };

  // 발행 상태 토글
  const handleTogglePublish = async (collection: Collection) => {
    try {
      const response = await fetch("/api/collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: collection.id,
          isPublished: !collection.isPublished,
        }),
      });

      if (response.ok) {
        setCollections(prev =>
          prev.map(c =>
            c.id === collection.id
              ? { ...c, isPublished: !c.isPublished }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle publish:", error);
    }
  };

  // 필터링된 컬렉션
  const filteredCollections = collections.filter(c => {
    if (searchQuery) {
      return c.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            컬렉션 관리
          </h1>
          <p className="text-[var(--text-tertiary)] mt-1">
            상품 번들 및 시리즈를 관리하세요
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          새 컬렉션
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <Input
            placeholder="컬렉션 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
          >
            전체
          </Button>
          {COLLECTION_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={filterType === type.id ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type.id)}
                className="gap-1.5 whitespace-nowrap"
              >
                <Icon className="w-4 h-4" />
                {type.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : filteredCollections.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-16 text-center">
            <Layers className="w-16 h-16 mx-auto mb-4 text-[var(--text-tertiary)] opacity-50" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {searchQuery ? "검색 결과가 없습니다" : "컬렉션이 없습니다"}
            </h3>
            <p className="text-[var(--text-tertiary)] mb-6">
              {searchQuery
                ? "다른 검색어로 시도해보세요"
                : "상품을 묶어 번들이나 시리즈를 만들어보세요"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                첫 컬렉션 만들기
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCollections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <CollectionCard
                  collection={collection}
                  onEdit={() => setEditingCollection(collection)}
                  onDelete={() => handleDelete(collection.id)}
                  onTogglePublish={() => handleTogglePublish(collection)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingCollection) && (
          <CollectionModal
            collection={editingCollection}
            onClose={() => {
              setShowCreateModal(false);
              setEditingCollection(null);
            }}
            onSave={() => {
              fetchCollections();
              setShowCreateModal(false);
              setEditingCollection(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 컬렉션 카드 컴포넌트
interface CollectionCardProps {
  collection: Collection;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}

function CollectionCard({
  collection,
  onEdit,
  onDelete,
  onTogglePublish,
}: CollectionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const TypeIcon = COLLECTION_TYPES.find(t => t.id === collection.type)?.icon || Layers;
  const ProductTypeIcon = collection.productType
    ? PRODUCT_TYPE_ICONS[collection.productType]
    : Package;

  return (
    <Card variant="glass" className="overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[var(--bg-elevated)]">
        {collection.thumbnail ? (
          <img
            src={collection.thumbnail}
            alt={collection.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="w-12 h-12 text-[var(--text-tertiary)] opacity-50" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2 flex gap-2">
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              collection.isPublished
                ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]"
                : "bg-[var(--text-tertiary)]/20 text-[var(--text-tertiary)]"
            )}
          >
            {collection.isPublished ? "공개" : "비공개"}
          </span>
          {collection.isFeatured && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--primary)]/20 text-[var(--primary)]">
              추천
            </span>
          )}
        </div>

        {/* Menu Button */}
        <div className="absolute top-2 right-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </Button>
            
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg shadow-lg z-20 overflow-hidden">
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-border)] flex items-center gap-2"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit();
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    수정
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-border)] flex items-center gap-2"
                    onClick={() => {
                      setShowMenu(false);
                      onTogglePublish();
                    }}
                  >
                    {collection.isPublished ? (
                      <>
                        <Eye className="w-4 h-4" />
                        비공개로
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        공개하기
                      </>
                    )}
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-[var(--semantic-error)] hover:bg-[var(--bg-border)] flex items-center gap-2"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete();
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Type & Product Type */}
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
            <TypeIcon className="w-3.5 h-3.5" />
            {collection.typeLabel}
          </span>
          {collection.productType && (
            <>
              <span className="text-[var(--text-tertiary)]">•</span>
              <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                <ProductTypeIcon className="w-3.5 h-3.5" />
                {PRODUCT_TYPE_LABELS[collection.productType]}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[var(--text-primary)] mb-2 truncate">
          {collection.title}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            {collection._count?.items || 0}개
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {collection.viewCount}
          </span>
          {collection.bundlePrice && (
            <span className="font-medium text-[var(--primary)]">
              {formatPrice(collection.bundlePrice)}
            </span>
          )}
        </div>

        {/* Preview Items */}
        {collection.items && collection.items.length > 0 && (
          <div className="flex -space-x-2 mt-3 overflow-hidden">
            {collection.items.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="w-8 h-8 rounded-lg bg-[var(--bg-border)] border-2 border-[var(--bg-elevated)] overflow-hidden"
              >
                {item.product?.thumbnail ? (
                  <img
                    src={item.product.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-3 h-3 text-[var(--text-tertiary)]" />
                  </div>
                )}
              </div>
            ))}
            {(collection._count?.items || 0) > 4 && (
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-border)] border-2 border-[var(--bg-elevated)] flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                +{(collection._count?.items || 0) - 4}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 컬렉션 생성/수정 모달
interface CollectionModalProps {
  collection: Collection | null;
  onClose: () => void;
  onSave: () => void;
}

function CollectionModal({ collection, onClose, onSave }: CollectionModalProps) {
  const isEditing = !!collection;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState(collection?.title || "");
  const [description, setDescription] = useState(collection?.description || "");
  const [thumbnail, setThumbnail] = useState(collection?.thumbnail || "");
  const [type, setType] = useState<Collection["type"]>(collection?.type || "BUNDLE");
  const [bundlePrice, setBundlePrice] = useState<string>(
    collection?.bundlePrice?.toString() || ""
  );
  const [discountRate, setDiscountRate] = useState<string>(
    collection?.discountRate?.toString() || ""
  );
  const [isPublished, setIsPublished] = useState(collection?.isPublished || false);
  
  // Products selection
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    collection?.items?.map(i => i.productId) || []
  );
  const [productSearch, setProductSearch] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Load user's products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const response = await fetch("/api/products?limit=100");
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter products
  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      setError("제목을 입력해주세요");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        ...(isEditing && { id: collection?.id }),
        title,
        description,
        thumbnail: thumbnail || undefined,
        type,
        bundlePrice: bundlePrice ? parseFloat(bundlePrice) : undefined,
        discountRate: discountRate ? parseInt(discountRate) : undefined,
        isPublished,
        items: selectedProducts.map((productId, index) => ({
          productId,
          order: index,
          isRequired: true,
        })),
      };

      const response = await fetch("/api/collections", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "저장 중 오류가 발생했습니다");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[var(--bg-base)] rounded-2xl border border-[var(--bg-border)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--bg-border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {isEditing ? "컬렉션 수정" : "새 컬렉션"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--semantic-error)]/10 text-[var(--semantic-error)]">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              컬렉션 유형
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COLLECTION_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id as Collection["type"])}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      type === t.id
                        ? "border-[var(--primary)] bg-[var(--primary)]/10"
                        : "border-[var(--bg-border)] hover:border-[var(--primary)]/50"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 mb-1",
                      type === t.id ? "text-[var(--primary)]" : "text-[var(--text-tertiary)]"
                    )} />
                    <div className="font-medium text-sm text-[var(--text-primary)]">{t.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{t.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              제목 <span className="text-[var(--semantic-error)]">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="컬렉션 제목"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="컬렉션에 대한 설명..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--bg-border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              rows={3}
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              썸네일 URL
            </label>
            <Input
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Price & Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                번들 가격 (원)
              </label>
              <Input
                type="number"
                value={bundlePrice}
                onChange={(e) => setBundlePrice(e.target.value)}
                placeholder="번들 특가"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                할인율 (%)
              </label>
              <Input
                type="number"
                value={discountRate}
                onChange={(e) => setDiscountRate(e.target.value)}
                placeholder="0-100"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Products Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              포함 상품 ({selectedProducts.length}개 선택)
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="상품 검색..."
                className="pl-10"
              />
            </div>
            
            <div className="border border-[var(--bg-border)] rounded-lg max-h-48 overflow-y-auto">
              {isLoadingProducts ? (
                <div className="p-4 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--text-tertiary)]" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-[var(--text-tertiary)]">
                  상품이 없습니다
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  const ProductIcon = PRODUCT_TYPE_ICONS[product.productType] || Package;
                  
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSelectedProducts(prev =>
                          isSelected
                            ? prev.filter(id => id !== product.id)
                            : [...prev, product.id]
                        );
                      }}
                      className={cn(
                        "w-full p-3 flex items-center gap-3 border-b border-[var(--bg-border)] last:border-0 transition-colors",
                        isSelected ? "bg-[var(--primary)]/10" : "hover:bg-[var(--bg-elevated)]"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center",
                        isSelected
                          ? "bg-[var(--primary)] border-[var(--primary)]"
                          : "border-[var(--bg-border)]"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="w-10 h-10 rounded bg-[var(--bg-border)] overflow-hidden flex-shrink-0">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ProductIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-sm text-[var(--text-primary)] truncate">
                          {product.title}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {formatPrice(product.discountPrice || product.price)}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                isPublished ? "bg-[var(--primary)]" : "bg-[var(--bg-border)]"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all",
                  isPublished ? "left-6" : "left-0.5"
                )}
              />
            </button>
            <span className="text-sm text-[var(--text-primary)]">
              {isPublished ? "공개" : "비공개"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--bg-border)]">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isEditing ? "수정" : "생성"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
