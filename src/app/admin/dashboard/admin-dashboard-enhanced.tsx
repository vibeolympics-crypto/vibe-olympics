"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CreditCard,
  Award,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardData {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalPurchases: number;
    totalRevenue: number;
    totalRefunds: number;
  };
  period: {
    name: string;
    startDate: string;
    newUsers: number;
    newProducts: number;
    purchases: number;
    revenue: number;
  };
  refunds: {
    total: number;
    pending: number;
    rate: number;
    amount: number;
  };
  topSellers: Array<{
    id: string;
    name: string;
    email: string;
    image: string | null;
    revenue: number;
    sales: number;
    products: number;
  }>;
  topProducts: Array<{
    id: string;
    title: string;
    price: number;
    sales: number;
    views: number;
    thumbnail: string | null;
    seller: string;
  }>;
  categoryStats: Array<{
    id: string;
    name: string;
    productCount: number;
    salesCount: number;
    revenue: number;
  }>;
  dailyTrend: Array<{
    date: string;
    purchases: number;
    revenue: number;
    refunds: number;
    newUsers: number;
  }>;
  paymentMethodStats: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;
  userGrowth: Array<{
    month: string;
    users: number;
  }>;
}

async function fetchDashboard(period: string): Promise<DashboardData> {
  const response = await fetch(`/api/admin/dashboard?period=${period}`);
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }
  return response.json();
}

export function AdminDashboardEnhanced() {
  const [period, setPeriod] = useState("month");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["adminDashboard", period],
    queryFn: () => fetchDashboard(period),
    refetchInterval: 60000, // 1분마다 자동 갱신
  });

  if (error) {
    return (
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
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("ko-KR").format(value);
  };

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case "day": return "오늘";
      case "week": return "이번 주";
      case "month": return "이번 달";
      case "year": return "올해";
      default: return "이번 달";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="text-[var(--text-secondary)]">
            플랫폼 전체 현황을 한눈에 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">오늘</SelectItem>
              <SelectItem value="week">이번 주</SelectItem>
              <SelectItem value="month">이번 달</SelectItem>
              <SelectItem value="year">올해</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-[var(--bg-secondary)] rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">총 매출</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(data.overview.totalRevenue)}
                    </p>
                    <p className="text-xs text-[var(--semantic-success)] flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      {getPeriodLabel(period)} {formatCurrency(data.period.revenue)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">총 사용자</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(data.overview.totalUsers)}
                    </p>
                    <p className="text-xs text-[var(--semantic-success)] flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +{formatNumber(data.period.newUsers)} {getPeriodLabel(period)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">총 판매</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(data.overview.totalPurchases)}
                    </p>
                    <p className="text-xs text-[var(--semantic-success)] flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +{formatNumber(data.period.purchases)} {getPeriodLabel(period)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <ShoppingCart className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">환불률</p>
                    <p className="text-2xl font-bold">{data.refunds.rate}%</p>
                    <p className="text-xs text-[var(--text-secondary)] flex items-center mt-1">
                      <RefreshCcw className="w-3 h-3 mr-1" />
                      대기 {data.refunds.pending}건
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${
                    data.refunds.rate < 3
                      ? "bg-green-100 dark:bg-green-900/30"
                      : data.refunds.rate < 5
                      ? "bg-yellow-100 dark:bg-yellow-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
                  }`}>
                    <TrendingDown className={`w-6 h-6 ${
                      data.refunds.rate < 3
                        ? "text-green-600"
                        : data.refunds.rate < 5
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Daily Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  일별 매출 추이 (최근 30일)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-end gap-1">
                  {data.dailyTrend.slice(-14).map((day, i) => {
                    const maxRevenue = Math.max(
                      ...data.dailyTrend.map((d) => d.revenue)
                    );
                    const height = maxRevenue > 0
                      ? (day.revenue / maxRevenue) * 100
                      : 0;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center gap-1"
                        title={`${day.date}: ${formatCurrency(day.revenue)}`}
                      >
                        <div
                          className="w-full bg-[var(--primary)] rounded-t transition-all hover:bg-[var(--primary-hover)]"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        {i % 2 === 0 && (
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            {day.date.slice(5)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Category Revenue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  카테고리별 매출
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.categoryStats.slice(0, 6).map((cat, i) => {
                    const totalRevenue = data.categoryStats.reduce(
                      (sum, c) => sum + c.revenue,
                      0
                    );
                    const percentage = totalRevenue > 0
                      ? ((cat.revenue / totalRevenue) * 100).toFixed(1)
                      : "0";
                    const colors = [
                      "bg-blue-500",
                      "bg-purple-500",
                      "bg-green-500",
                      "bg-yellow-500",
                      "bg-red-500",
                      "bg-pink-500",
                    ];
                    return (
                      <div key={cat.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{cat.name}</span>
                          <span className="text-[var(--text-secondary)]">
                            {formatCurrency(cat.revenue)} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[i % colors.length]} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rankings Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Sellers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  판매자 순위 TOP 10
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topSellers.map((seller, i) => (
                    <div
                      key={seller.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30"
                          : i === 1
                          ? "bg-gray-100 text-gray-700 dark:bg-gray-800"
                          : i === 2
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                        {seller.image ? (
                          <Image
                            src={seller.image}
                            alt={seller.name || ""}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                            {seller.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{seller.name || "알 수 없음"}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {seller.products}개 상품 · {formatNumber(seller.sales)}건 판매
                        </p>
                      </div>
                      <span className="font-bold text-[var(--semantic-success)]">
                        {formatCurrency(seller.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  인기 상품 TOP 10
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topProducts.map((product, i) => (
                    <Link
                      key={product.id}
                      href={`/marketplace/${product.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30"
                          : i === 1
                          ? "bg-gray-100 text-gray-700 dark:bg-gray-800"
                          : i === 2
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="w-10 h-10 rounded bg-[var(--bg-secondary)] overflow-hidden">
                        {product.thumbnail ? (
                          <Image
                            src={product.thumbnail}
                            alt={product.title}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-[var(--text-secondary)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.title}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {product.seller} · {formatCurrency(product.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatNumber(product.sales)}건</p>
                        <p className="text-xs text-[var(--text-secondary)] flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {formatNumber(product.views)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods & User Growth */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  결제 수단별 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.paymentMethodStats.map((pm) => {
                    const totalCount = data.paymentMethodStats.reduce(
                      (sum, p) => sum + p.count,
                      0
                    );
                    const percentage = totalCount > 0
                      ? ((pm.count / totalCount) * 100).toFixed(1)
                      : "0";
                    return (
                      <div key={pm.method} className="flex items-center gap-4">
                        <div className="w-24 font-medium">{pm.method || "기타"}</div>
                        <div className="flex-1">
                          <div className="h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--primary)] transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-32 text-right">
                          <span className="font-medium">{formatNumber(pm.count)}건</span>
                          <span className="text-[var(--text-secondary)] ml-2">
                            ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* User Growth */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  월별 가입자 추이 (최근 12개월)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-end gap-2">
                  {data.userGrowth.map((month) => {
                    const maxUsers = Math.max(
                      ...data.userGrowth.map((m) => m.users)
                    );
                    const height = maxUsers > 0
                      ? (month.users / maxUsers) * 100
                      : 0;
                    return (
                      <div
                        key={month.month}
                        className="flex-1 flex flex-col items-center gap-1"
                        title={`${month.month}: ${formatNumber(month.users)}명`}
                      >
                        <span className="text-xs font-medium">
                          {month.users > 0 ? month.users : ""}
                        </span>
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          {month.month.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/admin/refunds">
              <Card className="hover:border-[var(--primary)] transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <RefreshCcw className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium">환불 관리</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      대기 {data.refunds.pending}건
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settlements">
              <Card className="hover:border-[var(--primary)] transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">정산 관리</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      정산 내역 확인
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin?tab=users">
              <Card className="hover:border-[var(--primary)] transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">사용자 관리</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      총 {formatNumber(data.overview.totalUsers)}명
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin?tab=products">
              <Card className="hover:border-[var(--primary)] transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Package className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">상품 관리</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      총 {formatNumber(data.overview.totalProducts)}개
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
