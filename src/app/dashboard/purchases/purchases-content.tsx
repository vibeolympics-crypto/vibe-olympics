"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  Star,
  ExternalLink,
  Package,
  Calendar,
  CheckCircle2,
  Loader2,
  X,
  FileText,
  Receipt,
  Clock,
  User,
  CreditCard,
  Copy,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { usePurchases, usePurchaseDetail } from "@/hooks/use-api";

export function PurchasesContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const hasHandledSuccess = useRef(false);

  const { data, isLoading, error } = usePurchases(page, 12);

  const purchases = data?.purchases || [];
  const pagination = data?.pagination;

  // 결제 성공 시 토스트 메시지 표시를 위한 콜백
  const handlePaymentSuccess = useCallback(() => {
    if (hasHandledSuccess.current) return;
    hasHandledSuccess.current = true;
    setShowSuccessToast(true);
    // URL에서 success 파라미터 제거 (히스토리 교체)
    const url = new URL(window.location.href);
    url.searchParams.delete("success");
    url.searchParams.delete("session_id");
    window.history.replaceState({}, "", url.pathname);
    
    // 5초 후 토스트 자동 닫기
    setTimeout(() => setShowSuccessToast(false), 5000);
  }, []);

  // 결제 성공 시 토스트 메시지 표시
  // URL 파라미터 기반 일회성 상태 초기화로, 이 패턴은 정당한 사용 사례입니다
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handlePaymentSuccess();
    }
  }, [searchParams, handlePaymentSuccess]);

  const filteredPurchases = purchases.filter((purchase) =>
    purchase.product?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSpent = purchases.reduce((sum, p) => sum + (p.price || 0), 0);

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
          <p className="text-[var(--semantic-error)]">구매 내역을 불러오는 중 오류가 발생했습니다</p>
          <p className="text-[var(--text-tertiary)] text-sm mt-2">잠시 후 다시 시도해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-[var(--accent-green)] text-white shadow-lg shadow-[var(--accent-green)]/30">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="font-medium">결제가 완료되었습니다!</p>
                <p className="text-sm opacity-90">구매한 상품을 다운로드할 수 있습니다.</p>
              </div>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="ml-4 p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">구매 내역</h1>
          <p className="text-[var(--text-tertiary)] mt-1">
            총 {pagination?.total || purchases.length}개의 상품을 구매했습니다
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = "/api/export/purchases"}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card variant="glass">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">구매 상품</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {pagination?.total || purchases.length}개
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent-violet)]/10 flex items-center justify-center">
              <Download className="w-6 h-6 text-[var(--accent-violet)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">총 다운로드</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {purchases.reduce((sum, p) => sum + (p.downloadCount || 0), 0)}회
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent-cyan)]/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">총 결제 금액</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {formatPrice(totalSpent)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="구매한 상품 검색..."
          icon={<Search className="w-4 h-4" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:w-64"
        />
      </div>

      {/* Purchase List */}
      <div className="space-y-4">
        {filteredPurchases.map((purchase, index) => (
          <motion.div
            key={purchase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card variant="glass">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Product Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {purchase.product?.thumbnailUrl ? (
                      <img
                        src={purchase.product.thumbnailUrl}
                        alt={purchase.product.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xl font-bold">
                          {purchase.product?.title?.[0] || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/marketplace/${purchase.product?.id}`}
                            className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                          >
                            {purchase.product?.title || "상품 정보 없음"}
                          </Link>
                          <p className="text-sm text-[var(--text-tertiary)]">
                            판매자: {purchase.product?.seller?.name || "알 수 없음"}
                          </p>
                        </div>
                        <Badge variant="success" className="flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {purchase.status === "COMPLETED" ? "구매 완료" : purchase.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--text-tertiary)]">
                        <span>주문번호: {purchase.id.slice(0, 8)}...</span>
                        <span>{new Date(purchase.createdAt).toLocaleString("ko-KR")}</span>
                        <span>
                          {purchase.price === 0
                            ? "무료"
                            : formatPrice(purchase.price || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Button variant="neon" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      다운로드
                    </Button>
                    {!purchase.hasReviewed ? (
                      <Link href={`/marketplace/${purchase.product?.id}?review=true`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Star className="w-4 h-4" />
                          리뷰 작성
                        </Button>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-[var(--text-tertiary)]">
                        <Star className="w-4 h-4 text-[var(--accent-yellow)] fill-current" />
                        리뷰 작성됨
                      </div>
                    )}
                    <Link href={`/marketplace/${purchase.product?.id}`}>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setSelectedPurchaseId(purchase.id)}
                      title="상세 보기"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredPurchases.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-[var(--text-disabled)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              구매 내역이 없습니다
            </h3>
            <p className="text-[var(--text-tertiary)] mb-6">
              마켓플레이스에서 다양한 상품을 둘러보세요!
            </p>
            <Link href="/marketplace">
              <Button variant="neon">마켓플레이스 가기</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            이전
          </Button>
          <span className="flex items-center px-4 text-sm text-[var(--text-tertiary)]">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
          >
            다음
          </Button>
        </div>
      )}

      {/* Purchase Detail Modal */}
      <AnimatePresence>
        {selectedPurchaseId && (
          <PurchaseDetailModal
            purchaseId={selectedPurchaseId}
            onClose={() => setSelectedPurchaseId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 구매 상세 모달 컴포넌트
function PurchaseDetailModal({
  purchaseId,
  onClose,
}: {
  purchaseId: string;
  onClose: () => void;
}) {
  const { data, isLoading, error } = usePurchaseDetail(purchaseId);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "files" | "receipt">("info");

  const purchase = data?.purchase;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--bg-surface)] border border-[var(--bg-border)] shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--bg-border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            구매 상세 정보
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
          ) : error || !purchase ? (
            <div className="text-center py-16">
              <p className="text-[var(--semantic-error)]">정보를 불러올 수 없습니다</p>
            </div>
          ) : (
            <>
              {/* Product Info */}
              <div className="p-6 border-b border-[var(--bg-border)]">
                <div className="flex gap-4">
                  {purchase.product.thumbnailUrl ? (
                    <img
                      src={purchase.product.thumbnailUrl}
                      alt={purchase.product.title}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-2xl font-bold">
                        {purchase.product.title[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                      {purchase.product.title}
                    </h3>
                    <p className="text-sm text-[var(--text-tertiary)] line-clamp-2 mb-2">
                      {purchase.product.shortDescription}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        구매 완료
                      </Badge>
                      <span className="text-[var(--text-tertiary)]">
                        {new Date(purchase.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[var(--bg-border)]">
                {[
                  { id: "info", label: "기본 정보", icon: Package },
                  { id: "files", label: "다운로드", icon: Download },
                  { id: "receipt", label: "영수증", icon: Receipt },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "info" && (
                  <div className="space-y-4">
                    <InfoRow 
                      icon={<Calendar className="w-4 h-4" />}
                      label="구매일시"
                      value={new Date(purchase.createdAt).toLocaleString("ko-KR")}
                    />
                    <InfoRow 
                      icon={<CreditCard className="w-4 h-4" />}
                      label="결제 금액"
                      value={purchase.price === 0 ? "무료" : formatPrice(purchase.price)}
                    />
                    <InfoRow 
                      icon={<FileText className="w-4 h-4" />}
                      label="라이선스"
                      value={purchase.product.licenseType || "Standard"}
                    />
                    <InfoRow 
                      icon={<User className="w-4 h-4" />}
                      label="판매자"
                      value={purchase.product.seller.name}
                      link={`/seller/${purchase.product.seller.id}`}
                    />
                    <InfoRow 
                      icon={<Download className="w-4 h-4" />}
                      label="다운로드 횟수"
                      value={`${purchase.downloadCount}회`}
                    />
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-elevated)]">
                      <span className="text-[var(--text-tertiary)]">#</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text-tertiary)] mb-1">주문번호</p>
                        <p className="text-sm font-mono text-[var(--text-primary)] truncate">
                          {purchase.id}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(purchase.id, "orderId")}
                        className="p-1.5 rounded hover:bg-[var(--bg-border)] transition-colors"
                      >
                        {copiedField === "orderId" ? (
                          <Check className="w-4 h-4 text-[var(--semantic-success)]" />
                        ) : (
                          <Copy className="w-4 h-4 text-[var(--text-tertiary)]" />
                        )}
                      </button>
                    </div>

                    {/* Review Status */}
                    {purchase.review ? (
                      <div className="p-4 rounded-lg bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-[var(--accent-yellow)] fill-current" />
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            내가 작성한 리뷰
                          </span>
                          <div className="flex items-center gap-0.5 ml-auto">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < purchase.review!.rating
                                    ? "text-[var(--accent-yellow)] fill-current"
                                    : "text-[var(--text-disabled)]"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {purchase.review.content}
                        </p>
                      </div>
                    ) : (
                      <Link href={`/marketplace/${purchase.product.id}?review=true`}>
                        <Button variant="outline" className="w-full gap-2">
                          <Star className="w-4 h-4" />
                          리뷰 작성하기
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {activeTab === "files" && (
                  <div className="space-y-4">
                    {purchase.product.files.length > 0 ? (
                      <>
                        <p className="text-sm text-[var(--text-tertiary)] mb-4">
                          총 {purchase.product.files.length}개의 파일을 다운로드할 수 있습니다.
                        </p>
                        {purchase.product.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-4 p-4 rounded-lg bg-[var(--bg-elevated)]"
                          >
                            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-[var(--primary)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[var(--text-primary)] truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-[var(--text-tertiary)]">
                                {formatFileSize(file.size)} • {file.type}
                              </p>
                            </div>
                            <a href={file.url} download target="_blank" rel="noopener noreferrer">
                              <Button variant="neon" size="sm" className="gap-2">
                                <Download className="w-4 h-4" />
                                다운로드
                              </Button>
                            </a>
                          </div>
                        ))}

                        {/* Download History */}
                        {purchase.downloadHistory.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-[var(--bg-border)]">
                            <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              다운로드 이력
                            </h4>
                            <div className="space-y-2">
                              {purchase.downloadHistory.slice(0, 5).map((dl) => (
                                <div
                                  key={dl.id}
                                  className="flex items-center justify-between text-sm py-2"
                                >
                                  <span className="text-[var(--text-tertiary)]">
                                    {dl.fileName}
                                  </span>
                                  <span className="text-[var(--text-tertiary)]">
                                    {new Date(dl.downloadedAt).toLocaleString("ko-KR")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 mx-auto text-[var(--text-disabled)] mb-4" />
                        <p className="text-[var(--text-tertiary)]">
                          다운로드 가능한 파일이 없습니다
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "receipt" && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)]">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                          전자 영수증
                        </h3>
                        <p className="text-sm text-[var(--text-tertiary)]">
                          VIBE Olympics Marketplace
                        </p>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-[var(--bg-border)]">
                          <span className="text-[var(--text-tertiary)]">주문번호</span>
                          <span className="font-mono text-[var(--text-primary)]">
                            {purchase.receipt.orderNumber.slice(0, 12)}...
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[var(--bg-border)]">
                          <span className="text-[var(--text-tertiary)]">결제일</span>
                          <span className="text-[var(--text-primary)]">
                            {new Date(purchase.receipt.paymentDate).toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[var(--bg-border)]">
                          <span className="text-[var(--text-tertiary)]">상품명</span>
                          <span className="text-[var(--text-primary)]">
                            {purchase.receipt.productTitle}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[var(--bg-border)]">
                          <span className="text-[var(--text-tertiary)]">판매자</span>
                          <span className="text-[var(--text-primary)]">
                            {purchase.receipt.sellerName}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[var(--bg-border)]">
                          <span className="text-[var(--text-tertiary)]">결제수단</span>
                          <span className="text-[var(--text-primary)]">
                            {purchase.receipt.paymentMethod || "무료"}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[var(--bg-border)]">
                          <span className="text-[var(--text-tertiary)]">라이선스</span>
                          <span className="text-[var(--text-primary)]">
                            {purchase.receipt.licenseType}
                          </span>
                        </div>
                        <div className="flex justify-between py-4 text-lg font-semibold">
                          <span className="text-[var(--text-primary)]">결제 금액</span>
                          <span className="text-[var(--primary)]">
                            {purchase.receipt.amount === 0 
                              ? "무료" 
                              : formatPrice(purchase.receipt.amount)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[var(--bg-border)] text-center">
                        <p className="text-xs text-[var(--text-tertiary)]">
                          구매자: {purchase.receipt.buyerEmail}
                        </p>
                        {purchase.receipt.paymentId && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-1 font-mono">
                            거래 ID: {purchase.receipt.paymentId}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button variant="outline" className="w-full gap-2" onClick={() => window.print()}>
                      <Receipt className="w-4 h-4" />
                      영수증 인쇄
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// 정보 행 컴포넌트
function InfoRow({
  icon,
  label,
  value,
  link,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  link?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)]">
      <span className="text-[var(--text-tertiary)]">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-tertiary)] mb-0.5">{label}</p>
        <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
      </div>
      {link && <ExternalLink className="w-4 h-4 text-[var(--text-tertiary)]" />}
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
