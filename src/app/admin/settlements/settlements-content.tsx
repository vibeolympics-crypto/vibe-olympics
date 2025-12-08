"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Calendar,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  ArrowLeft,
  User,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface Settlement {
  id: string;
  sellerId: string;
  seller: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  salesCount: number;
  platformFee: number;
  paymentFee: number;
  netAmount: number;
  status: string;
  processedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  _count: { settlementItems: number };
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "정산 대기", color: "bg-yellow-500/10 text-yellow-600", icon: Clock },
  READY: { label: "정산 준비", color: "bg-blue-500/10 text-blue-600", icon: Clock },
  PROCESSING: { label: "처리 중", color: "bg-purple-500/10 text-purple-600", icon: Loader2 },
  COMPLETED: { label: "완료", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  FAILED: { label: "실패", color: "bg-red-500/10 text-red-600", icon: AlertCircle },
  CANCELLED: { label: "취소", color: "bg-gray-500/10 text-gray-600", icon: AlertCircle },
};

export function SettlementsContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedSettlement, setSelectedSettlement] = useState<string | null>(null);

  // 정산 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ["adminSettlements", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/settlements?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // 정산 상태 변경
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, transactionId }: { id: string; status: string; transactionId?: string }) => {
      const res = await fetch(`/api/settlements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, transactionId }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSettlements"] });
    },
  });

  // 엑셀 다운로드
  const handleExportExcel = async () => {
    const params = new URLSearchParams({
      ...(statusFilter && { status: statusFilter }),
    });
    window.location.href = `/api/export/settlements?${params}`;
  };

  const settlements: Settlement[] = data?.settlements || [];
  const pagination = data?.pagination;

  // 통계 계산
  const stats = {
    pending: settlements.filter(s => s.status === "PENDING").length,
    processing: settlements.filter(s => s.status === "PROCESSING").length,
    completed: settlements.filter(s => s.status === "COMPLETED").length,
    totalAmount: settlements
      .filter(s => s.status === "COMPLETED")
      .reduce((sum, s) => sum + Number(s.netAmount), 0),
  };

  return (
    <div className="container-app py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              관리자 홈
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-[var(--primary)]" />
              정산 관리
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              판매자 정산 현황을 관리합니다
            </p>
          </div>
        </div>
        <Button onClick={handleExportExcel} variant="outline">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">대기 중</p>
                <p className="text-xl font-bold">{stats.pending}건</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Loader2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">처리 중</p>
                <p className="text-xl font-bold">{stats.processing}건</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">완료</p>
                <p className="text-xl font-bold">{stats.completed}건</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--primary)]/10">
                <DollarSign className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">총 정산액</p>
                <p className="text-xl font-bold">{formatPrice(stats.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="text-sm text-[var(--text-secondary)]">상태:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("")}
              >
                전체
              </Button>
              {Object.entries(statusConfig).map(([key, config]) => (
                <Button
                  key={key}
                  variant={statusFilter === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(key)}
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">정산 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              정산 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--bg-border)]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">판매자</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">정산 기간</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">판매액</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">정산액</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">상태</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((settlement) => {
                    const config = statusConfig[settlement.status] || statusConfig.PENDING;
                    const StatusIcon = config.icon;
                    
                    return (
                      <tr key={settlement.id} className="border-b border-[var(--bg-border)] hover:bg-[var(--bg-elevated)]">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                              <User className="w-4 h-4 text-[var(--text-tertiary)]" />
                            </div>
                            <div>
                              <p className="font-medium">{settlement.seller.name || "이름 없음"}</p>
                              <p className="text-xs text-[var(--text-tertiary)]">{settlement.seller.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                            <span>
                              {new Date(settlement.periodStart).toLocaleDateString("ko-KR")} ~{" "}
                              {new Date(settlement.periodEnd).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            {settlement.salesCount}건
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatPrice(Number(settlement.totalSales))}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[var(--semantic-success)]">
                          {formatPrice(Number(settlement.netAmount))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={config.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSettlement(settlement.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {settlement.status === "PENDING" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateMutation.mutate({ id: settlement.id, status: "PROCESSING" })}
                                disabled={updateMutation.isPending}
                              >
                                처리 시작
                              </Button>
                            )}
                            {settlement.status === "PROCESSING" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => updateMutation.mutate({ id: settlement.id, status: "COMPLETED" })}
                                disabled={updateMutation.isPending}
                              >
                                완료
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[var(--text-secondary)]">
                {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
