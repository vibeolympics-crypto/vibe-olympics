"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  TrendingUp,
  FileSpreadsheet,
  Package,
  Wallet,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface Settlement {
  id: string;
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
  COMPLETED: { label: "입금 완료", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  FAILED: { label: "실패", color: "bg-red-500/10 text-red-600", icon: AlertCircle },
  CANCELLED: { label: "취소", color: "bg-gray-500/10 text-gray-600", icon: AlertCircle },
};

export function SettlementsContent() {
  const [page, setPage] = useState(1);

  // 정산 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ["mySettlements", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      const res = await fetch(`/api/settlements?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // 엑셀 다운로드
  const handleExportExcel = async () => {
    window.location.href = "/api/export/settlements";
  };

  const settlements: Settlement[] = data?.settlements || [];
  const pagination = data?.pagination;

  // 통계 계산
  const stats = {
    pending: settlements
      .filter(s => ["PENDING", "READY", "PROCESSING"].includes(s.status))
      .reduce((sum, s) => sum + Number(s.netAmount), 0),
    completed: settlements
      .filter(s => s.status === "COMPLETED")
      .reduce((sum, s) => sum + Number(s.netAmount), 0),
    totalSales: settlements.reduce((sum, s) => sum + Number(s.totalSales), 0),
    totalFees: settlements.reduce((sum, s) => sum + Number(s.platformFee) + Number(s.paymentFee), 0),
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[var(--primary)]" />
            정산 현황
          </h1>
          <p className="text-[var(--text-tertiary)] mt-1">
            판매 수익 정산 현황을 확인하세요
          </p>
        </div>
        <Button variant="outline" onClick={handleExportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">총 판매액</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {formatPrice(stats.totalSales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">정산 대기</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {formatPrice(stats.pending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">정산 완료</p>
                <p className="text-xl font-bold text--[var(--semantic-success)]">
                  {formatPrice(stats.completed)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">총 수수료</p>
                <p className="text-xl font-bold text-[var(--semantic-error)]">
                  -{formatPrice(stats.totalFees)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-[var(--text-primary)]">정산 안내</h3>
              <ul className="mt-2 text-sm text-[var(--text-secondary)] space-y-1">
                <li>• 플랫폼 수수료: 판매가의 <strong>10%</strong></li>
                <li>• PG 수수료: 판매가의 약 <strong>3.5%</strong> (Stripe)</li>
                <li>• 환불 대기 기간: 결제 후 <strong>7일</strong></li>
                <li>• 정산 처리: 환불 대기 기간 종료 후 순차 처리</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settlements List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">정산 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-4" />
              <p className="text-[var(--text-secondary)]">아직 정산 내역이 없습니다.</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                상품이 판매되면 정산 내역이 생성됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {settlements.map((settlement) => {
                const config = statusConfig[settlement.status] || statusConfig.PENDING;
                const StatusIcon = config.icon;
                
                return (
                  <div
                    key={settlement.id}
                    className="p-4 rounded-lg border border-[var(--bg-border)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={config.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        <span className="text-sm text-[var(--text-tertiary)]">
                          {settlement.salesCount}건
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Calendar className="w-4 h-4" />
                        {new Date(settlement.periodStart).toLocaleDateString("ko-KR")} ~{" "}
                        {new Date(settlement.periodEnd).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">총 판매액</p>
                        <p className="font-semibold">{formatPrice(Number(settlement.totalSales))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">플랫폼 수수료</p>
                        <p className="font-semibold text-red-500">-{formatPrice(Number(settlement.platformFee))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">PG 수수료</p>
                        <p className="font-semibold text-red-500">-{formatPrice(Number(settlement.paymentFee))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">정산 금액</p>
                        <p className="font-bold text-[var(--semantic-success)]">
                          {formatPrice(Number(settlement.netAmount))}
                        </p>
                      </div>
                    </div>
                    
                    {settlement.paidAt && (
                      <div className="mt-3 pt-3 border-t border-[var(--bg-border)]">
                        <p className="text-xs text-[var(--text-tertiary)]">
                          입금일: {new Date(settlement.paidAt).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
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
