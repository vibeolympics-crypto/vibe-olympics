"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  ShoppingBag,
  Package,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useMyProducts, useDeleteProduct } from "@/hooks/use-api";

const statusConfig = {
  PUBLISHED: { label: "판매중", variant: "success" as const },
  DRAFT: { label: "임시저장", variant: "warning" as const },
  PENDING_REVIEW: { label: "검토중", variant: "cyan" as const },
  REJECTED: { label: "반려됨", variant: "danger" as const },
};

export function ProductsContent() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data, isLoading, error } = useMyProducts(session?.user?.id);
  const deleteProductMutation = useDeleteProduct();

  const products = data?.products || [];

  // 필터링 - 서버 측 검색이 아닌 클라이언트 측 필터링
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = products.reduce(
    (sum, p) => sum + (p.price || 0) * (p.salesCount || 0),
    0
  );
  const totalSales = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);

  const handleDelete = async (productId: string, productTitle: string) => {
    // Toast 기반 확인 대화상자
    toast.warning(`"${productTitle}" 상품을 삭제하시겠습니까?`, {
      description: '삭제된 상품은 복구할 수 없습니다.',
      action: {
        label: '삭제',
        onClick: async () => {
          try {
            await deleteProductMutation.mutateAsync(productId);
            toast.success('상품이 삭제되었습니다');
            setOpenMenu(null);
          } catch (error) {
            console.error("삭제 실패:", error);
            toast.error('상품 삭제에 실패했습니다', {
              description: '잠시 후 다시 시도해주세요.',
            });
          }
        },
      },
      cancel: {
        label: '취소',
        onClick: () => {},
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-[var(--semantic-error)]">상품을 불러오는 중 오류가 발생했습니다</p>
          <p className="text-[var(--text-tertiary)] text-sm mt-2">잠시 후 다시 시도해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">내 상품</h1>
          <p className="text-[var(--text-tertiary)] mt-1">
            총 {products.length}개의 상품을 관리하고 있습니다
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button variant="neon" className="gap-2">
            <Plus className="w-4 h-4" />
            새 상품 등록
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card variant="glass">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">총 상품</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {products.length}개
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent-green)]/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-[var(--accent-green)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">총 판매</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {totalSales.toLocaleString()}건
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent-cyan)]/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">총 수익</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {formatPrice(totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="상품 검색..."
          icon={<Search className="w-4 h-4" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:w-64"
        />
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "전체" },
            { value: "PUBLISHED", label: "판매중" },
            { value: "DRAFT", label: "임시저장" },
            { value: "PENDING_REVIEW", label: "검토중" },
          ].map((status) => (
            <Button
              key={status.value}
              variant={statusFilter === status.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status.value)}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <Card variant="glass">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--bg-border)]">
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-tertiary)]">
                    상품
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-tertiary)]">
                    상태
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-tertiary)]">
                    가격
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-tertiary)]">
                    판매
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-tertiary)]">
                    평점
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-[var(--text-tertiary)]">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-[var(--bg-border)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {product.thumbnailUrl ? (
                          <img
                            src={product.thumbnailUrl}
                            alt={product.title}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold">
                              {product.title[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">
                            {product.title}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {product.category?.name} · {new Date(product.createdAt).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={
                          statusConfig[product.status as keyof typeof statusConfig]?.variant || "default"
                        }
                      >
                        {statusConfig[product.status as keyof typeof statusConfig]?.label || product.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[var(--text-primary)]">
                        {product.pricingType === "FREE" || product.price === 0
                          ? "무료"
                          : formatPrice(product.price || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                        <ShoppingBag className="w-4 h-4" />
                        {product.salesCount || 0}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {(product.averageRating || 0) > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-[var(--accent-yellow)] fill-current" />
                          <span className="text-[var(--text-secondary)]">
                            {product.averageRating?.toFixed(1)}
                          </span>
                          <span className="text-[var(--text-disabled)]">
                            ({product.reviewCount || 0})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-disabled)]">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/marketplace/${product.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setOpenMenu(openMenu === product.id ? null : product.id)
                            }
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                          {openMenu === product.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenu(null)}
                              />
                              <div className="absolute right-0 mt-2 w-40 py-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg shadow-xl z-20">
                                <Link
                                  href={`/dashboard/products/${product.id}/edit`}
                                  className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  수정
                                </Link>
                                <button
                                  onClick={() => handleDelete(product.id, product.title)}
                                  disabled={deleteProductMutation.isPending}
                                  className="w-full px-4 py-2 text-left text-sm text-[var(--semantic-error)] hover:bg-[var(--bg-elevated)] flex items-center gap-2 disabled:opacity-50"
                                >
                                  {deleteProductMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                  삭제
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-[var(--text-disabled)] mb-4" />
              <p className="text-[var(--text-tertiary)]">
                {products.length === 0
                  ? "등록된 상품이 없습니다"
                  : "검색 결과가 없습니다"}
              </p>
              {products.length === 0 && (
                <Link href="/dashboard/products/new" className="inline-block mt-4">
                  <Button variant="neon" className="gap-2">
                    <Plus className="w-4 h-4" />
                    첫 상품 등록하기
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
