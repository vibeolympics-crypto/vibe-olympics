"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
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
  XCircle,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface RefundRequest {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  purchaseId: string;
  purchase: {
    product: {
      id: string;
      title: string;
    };
  };
  amount: number;
  reason: string;
  reasonDetail: string | null;
  status: string;
  processedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "검토 대기", color: "bg-yellow-500/10 text-yellow-600", icon: Clock },
  REVIEWING: { label: "검토 중", color: "bg-blue-500/10 text-blue-600", icon: Eye },
  APPROVED: { label: "승인", color: "bg-purple-500/10 text-purple-600", icon: CheckCircle2 },
  COMPLETED: { label: "환불 완료", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  REJECTED: { label: "거절", color: "bg-red-500/10 text-red-600", icon: XCircle },
  CANCELLED: { label: "취소", color: "bg-gray-500/10 text-gray-600", icon: AlertCircle },
};

const reasonLabels: Record<string, string> = {
  PRODUCT_MISMATCH: "상품 설명과 다름",
  DOWNLOAD_ISSUE: "다운로드 불가",
  DUPLICATE_PURCHASE: "중복 결제",
  COPYRIGHT_ISSUE: "저작권 문제",
  TECHNICAL_ISSUE: "기술적 문제",
  OTHER: "기타",
};

export function RefundsContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [_selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [_adminNotes, setAdminNotes] = useState("");

  // 환불 요청 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ["adminRefunds", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/refunds?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // 환불 상태 변경
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const res = await fetch(`/api/refunds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminRefunds"] });
      setSelectedRefund(null);
      setAdminNotes("");
    },
  });

  // 엑셀 다운로드
  const handleExportExcel = async () => {
    const params = new URLSearchParams({
      ...(statusFilter && { status: statusFilter }),
    });
    window.location.href = `/api/export/refunds?${params}`;
  };

  const refunds: RefundRequest[] = data?.refunds || [];
  const pagination = data?.pagination;

  // 통계 계산
  const stats = {
    pending: refunds.filter(r => r.status === "PENDING").length,
    reviewing: refunds.filter(r => r.status === "REVIEWING").length,
    completed: refunds.filter(r => r.status === "COMPLETED").length,
    totalAmount: refunds
      .filter(r => r.status === "COMPLETED")
      .reduce((sum, r) => sum + Number(r.amount), 0),
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
              <RotateCcw className="w-6 h-6 text-[var(--primary)]" />
              환불 관리
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              환불 요청을 검토하고 처리합니다
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
                <p className="text-sm text-[var(--text-secondary)]">검토 대기</p>
                <p className="text-xl font-bold">{stats.pending}건</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">검토 중</p>
                <p className="text-xl font-bold">{stats.reviewing}건</p>
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
                <p className="text-sm text-[var(--text-secondary)]">처리 완료</p>
                <p className="text-xl font-bold">{stats.completed}건</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <RotateCcw className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">총 환불액</p>
                <p className="text-xl font-bold">{formatPrice(stats.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="text-sm text-[var(--text-secondary)]">상태:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
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

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">환불 요청 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              환불 요청이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--bg-border)]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">요청자</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">상품</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">사유</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">금액</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">상태</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">요청일</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => {
                    const config = statusConfig[refund.status] || statusConfig.PENDING;
                    const StatusIcon = config.icon;
                    
                    return (
                      <tr key={refund.id} className="border-b border-[var(--bg-border)] hover:bg-[var(--bg-elevated)]">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                              <User className="w-4 h-4 text-[var(--text-tertiary)]" />
                            </div>
                            <div>
                              <p className="font-medium">{refund.user.name || "이름 없음"}</p>
                              <p className="text-xs text-[var(--text-tertiary)]">{refund.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-[var(--text-tertiary)]" />
                            <span className="text-sm truncate max-w-[200px]">
                              {refund.purchase.product.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{reasonLabels[refund.reason] || refund.reason}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatPrice(Number(refund.amount))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={config.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-[var(--text-secondary)]">
                          {new Date(refund.createdAt).toLocaleDateString("ko-KR")}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {(refund.status === "PENDING" || refund.status === "REVIEWING") && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updateMutation.mutate({ id: refund.id, status: "APPROVED" })}
                                  disabled={updateMutation.isPending}
                                >
                                  승인
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateMutation.mutate({ id: refund.id, status: "REJECTED" })}
                                  disabled={updateMutation.isPending}
                                >
                                  거절
                                </Button>
                              </>
                            )}
                            {refund.status === "COMPLETED" && (
                              <span className="text-xs text-green-600">처리됨</span>
                            )}
                            {refund.status === "REJECTED" && (
                              <span className="text-xs text-red-600">거절됨</span>
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
