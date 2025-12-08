"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Settings,
  BarChart3,
  UserCog,
  Shield,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalPurchases: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  newProductsThisMonth: number;
  salesThisMonth: number;
  dailyStats: Array<{
    date: string;
    users: number;
    products: number;
    sales: number;
  }>;
  categoryStats: Array<{
    name: string;
    count: number;
  }>;
}

async function fetchAdminStats(): Promise<AdminStats> {
  const response = await fetch("/api/admin/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch admin stats");
  }
  return response.json();
}

export function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "products">(
    "overview"
  );

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["adminStats"],
    queryFn: fetchAdminStats,
  });

  if (error) {
    return (
      <div className="container-app py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertTriangle className="w-16 h-16 text-[var(--semantic-error)] mb-4" />
          <h2 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            관리자만 접근할 수 있는 페이지입니다.
          </p>
          <Link href="/">
            <Button variant="default">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-[var(--primary)]" />
            관리자 대시보드
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Vibe Olympics 플랫폼 관리
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/settings">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              설정
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 border-b border-[var(--bg-border)] pb-4">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          onClick={() => setActiveTab("overview")}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          개요
        </Button>
        <Button
          variant={activeTab === "users" ? "default" : "ghost"}
          onClick={() => setActiveTab("users")}
        >
          <UserCog className="w-4 h-4 mr-2" />
          사용자 관리
        </Button>
        <Button
          variant={activeTab === "products" ? "default" : "ghost"}
          onClick={() => setActiveTab("products")}
        >
          <Package className="w-4 h-4 mr-2" />
          상품 관리
        </Button>
      </div>

      {activeTab === "overview" && (
        <OverviewTab stats={stats} isLoading={isLoading} />
      )}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "products" && <ProductsTab />}
    </div>
  );
}

function OverviewTab({
  stats,
  isLoading,
}: {
  stats?: AdminStats;
  isLoading: boolean;
}) {
  const statCards = [
    {
      title: "총 사용자",
      value: stats?.totalUsers || 0,
      change: `+${stats?.newUsersThisMonth || 0} 이번 달`,
      icon: Users,
      color: "var(--primary)",
    },
    {
      title: "총 상품",
      value: stats?.totalProducts || 0,
      change: `+${stats?.newProductsThisMonth || 0} 이번 달`,
      icon: Package,
      color: "var(--accent-violet)",
    },
    {
      title: "총 판매",
      value: stats?.totalPurchases || 0,
      change: `+${stats?.salesThisMonth || 0} 이번 달`,
      icon: ShoppingCart,
      color: "var(--semantic-success)",
    },
    {
      title: "총 수익",
      value: `₩${(stats?.totalRevenue || 0).toLocaleString()}`,
      change: "전체 누적",
      icon: DollarSign,
      color: "var(--accent-amber)",
    },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {isLoading ? (
                      <span className="h-8 w-24 bg-[var(--bg-elevated)] rounded animate-pulse inline-block" />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[var(--semantic-success)]" />
                    {stat.change}
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">최근 7일 활동</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 bg-[var(--bg-elevated)] rounded animate-pulse" />
            ) : (
              <div className="space-y-4">
                {stats?.dailyStats?.map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[var(--text-secondary)] w-24">
                      {new Date(day.date).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {day.users}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Package className="w-3 h-3 mr-1" />
                        {day.products}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        {day.sales}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">카테고리별 상품</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 bg-[var(--bg-elevated)] rounded animate-pulse" />
            ) : (
              <div className="space-y-3">
                {stats?.categoryStats?.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="text-sm text-[var(--text-secondary)] w-32 truncate">
                      {cat.name}
                    </span>
                    <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] rounded-full"
                        style={{
                          width: `${Math.min(
                            (cat.count /
                              Math.max(
                                ...(stats.categoryStats?.map((c) => c.count) ||
                                  [1])
                              )) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">빠른 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-4 rounded-lg border border-[var(--bg-border)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <UserCog className="w-5 h-5 text-[var(--primary)]" />
                <span>사용자 관리</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)]" />
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center justify-between p-4 rounded-lg border border-[var(--bg-border)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-[var(--accent-violet)]" />
                <span>상품 관리</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)]" />
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center justify-between p-4 rounded-lg border border-[var(--bg-border)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--semantic-warning)]" />
                <span>신고 관리</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)]" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function UsersTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["adminUsers", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>사용자 관리</CardTitle>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="이름 또는 이메일 검색..."
              className="px-3 py-2 rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] text-sm w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[var(--bg-elevated)] rounded animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--bg-border)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    사용자
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    역할
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    상품
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    구매
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    가입일
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.users?.map(
                  (user: {
                    id: string;
                    email: string;
                    name: string | null;
                    role: string;
                    isSeller: boolean;
                    createdAt: string;
                    _count: { products: number; purchases: number };
                  }) => (
                    <tr
                      key={user.id}
                      className="border-b border-[var(--bg-border)] hover:bg-[var(--bg-elevated)]"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{user.name || "이름 없음"}</p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {user.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={user.role === "ADMIN" ? "default" : "outline"}
                        >
                          {user.role === "ADMIN" ? "관리자" : "사용자"}
                        </Badge>
                        {user.isSeller && (
                          <Badge variant="outline" className="ml-1">
                            판매자
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">{user._count.products}</td>
                      <td className="py-3 px-4">{user._count.purchases}</td>
                      <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                        {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">
                          관리
                        </Button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--bg-border)]">
            <p className="text-sm text-[var(--text-secondary)]">
              총 {data.pagination.total}명 중 {(page - 1) * 10 + 1}-
              {Math.min(page * 10, data.pagination.total)}명
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProductsTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["adminProducts", page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(status && { status }),
      });
      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>상품 관리</CardTitle>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">모든 상태</option>
              <option value="DRAFT">초안</option>
              <option value="PENDING_REVIEW">검토 대기</option>
              <option value="PUBLISHED">게시됨</option>
              <option value="REJECTED">거부됨</option>
              <option value="SUSPENDED">일시 중지</option>
            </select>
            <input
              type="text"
              placeholder="상품명 검색..."
              className="px-3 py-2 rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] text-sm w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[var(--bg-elevated)] rounded animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--bg-border)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    상품
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    판매자
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    가격
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    상태
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    판매
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.products?.map(
                  (product: {
                    id: string;
                    title: string;
                    price: number;
                    status: string;
                    salesCount: number;
                    seller: { name: string | null; email: string };
                    category: { name: string };
                  }) => (
                    <tr
                      key={product.id}
                      className="border-b border-[var(--bg-border)] hover:bg-[var(--bg-elevated)]"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium line-clamp-1">
                            {product.title}
                          </p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {product.category.name}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {product.seller.name || product.seller.email}
                      </td>
                      <td className="py-3 px-4">
                        ₩{Number(product.price).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            product.status === "PUBLISHED"
                              ? "default"
                              : product.status === "DRAFT"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {product.status === "PUBLISHED"
                            ? "게시됨"
                            : product.status === "DRAFT"
                            ? "초안"
                            : product.status === "PENDING_REVIEW"
                            ? "검토 대기"
                            : product.status === "REJECTED"
                            ? "거부됨"
                            : "일시 중지"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{product.salesCount}</td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">
                          관리
                        </Button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--bg-border)]">
            <p className="text-sm text-[var(--text-secondary)]">
              총 {data.pagination.total}개 중 {(page - 1) * 10 + 1}-
              {Math.min(page * 10, data.pagination.total)}개
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
