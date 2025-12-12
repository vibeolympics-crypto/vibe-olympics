"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Mail,
  Download,
  RefreshCw,
  Package,
  Eye,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface TopProduct {
  title: string;
  sales: number;
  revenue: number;
}

interface DailyStat {
  day: string;
  revenue: number;
  count: number;
}

interface WeeklyReport {
  sellerName: string;
  weekStart: string;
  weekEnd: string;
  totalRevenue: number;
  salesCount: number;
  platformFee: number;
  paymentFee: number;
  netAmount: number;
  previousWeekRevenue: number;
  growthRate: number;
  topProducts: TopProduct[];
  dailyStats: DailyStat[];
  viewCount: number;
  conversionRate: number;
}

interface MonthlyReport {
  sellerName: string;
  month: string;
  totalSales: number;
  salesCount: number;
  platformFee: number;
  paymentFee: number;
  netAmount: number;
  topProducts: TopProduct[];
}

export function ReportsContent() {
  const { data: session } = useSession();
  const [reportType, setReportType] = useState<"weekly" | "monthly">("weekly");
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport(reportType);
  }, [reportType]);

  const fetchReport = async (type: "weekly" | "monthly") => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/seller/sales-report?type=${type}`);
      const data = await res.json();
      
      if (data.success) {
        if (type === "weekly") {
          setWeeklyReport(data.data);
        } else {
          setMonthlyReport(data.data);
        }
      } else {
        setError(data.error || "리포트를 불러올 수 없습니다.");
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    setSendSuccess(null);
    setError(null);

    try {
      const res = await fetch("/api/seller/sales-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          type: reportType,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setSendSuccess(data.message);
        setTimeout(() => setSendSuccess(null), 5000);
      } else {
        setError(data.error);
      }
    } catch {
      setError("이메일 발송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  const report = reportType === "weekly" ? weeklyReport : monthlyReport;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-violet-600" />
            판매 리포트
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            주간/월간 판매 현황을 확인하고 이메일로 받아보세요.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 리포트 타입 선택 */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setReportType("weekly")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                reportType === "weekly"
                  ? "bg-white dark:bg-gray-700 text-violet-600 shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              주간
            </button>
            <button
              onClick={() => setReportType("monthly")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                reportType === "monthly"
                  ? "bg-white dark:bg-gray-700 text-violet-600 shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              월간
            </button>
          </div>

          <button
            onClick={() => fetchReport(reportType)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="새로고침"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 알림 메시지 */}
      <AnimatePresence>
        {sendSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200">{sendSuccess}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : report ? (
        <>
          {/* 기간 표시 */}
          <div className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">
              {reportType === "weekly" && weeklyReport
                ? `${weeklyReport.weekStart} ~ ${weeklyReport.weekEnd}`
                : monthlyReport?.month}
            </span>
          </div>

          {/* 핵심 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* 총 매출 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-violet-100">총 매출</span>
                <DollarSign className="w-5 h-5 text-violet-200" />
              </div>
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(reportType === "weekly" ? weeklyReport?.totalRevenue || 0 : monthlyReport?.totalSales || 0)}
              </div>
              {reportType === "weekly" && weeklyReport && (
                <div className="flex items-center gap-1 text-sm">
                  {weeklyReport.growthRate >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className={weeklyReport.growthRate >= 0 ? "text-green-200" : "text-red-200"}>
                    {weeklyReport.growthRate >= 0 ? "+" : ""}
                    {weeklyReport.growthRate.toFixed(1)}% 지난주 대비
                  </span>
                </div>
              )}
            </motion.div>

            {/* 판매 건수 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">판매 건수</span>
                <ShoppingCart className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {(reportType === "weekly" ? weeklyReport?.salesCount : monthlyReport?.salesCount) || 0}
                <span className="text-lg font-normal text-gray-500 ml-1">건</span>
              </div>
            </motion.div>

            {/* 조회수 (주간만) */}
            {reportType === "weekly" && weeklyReport && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">조회수</span>
                  <Eye className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {weeklyReport.viewCount.toLocaleString()}
                  <span className="text-lg font-normal text-gray-500 ml-1">회</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  전환율 {weeklyReport.conversionRate.toFixed(2)}%
                </div>
              </motion.div>
            )}

            {/* 예상 정산금 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reportType === "weekly" ? 0.3 : 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">예상 정산금</span>
                <Package className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency((reportType === "weekly" ? weeklyReport?.netAmount : monthlyReport?.netAmount) || 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                수수료 13.5% 공제 후
              </div>
            </motion.div>
          </div>

          {/* 수수료 상세 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              💰 수수료 내역
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">총 매출</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(reportType === "weekly" ? weeklyReport?.totalRevenue || 0 : monthlyReport?.totalSales || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">플랫폼 수수료 (10%)</span>
                <span className="font-medium text-red-500">
                  -{formatCurrency((reportType === "weekly" ? weeklyReport?.platformFee : monthlyReport?.platformFee) || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">PG 수수료 (3.5%)</span>
                <span className="font-medium text-red-500">
                  -{formatCurrency((reportType === "weekly" ? weeklyReport?.paymentFee : monthlyReport?.paymentFee) || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-semibold text-gray-900 dark:text-white">예상 정산 금액</span>
                <span className="font-bold text-lg text-emerald-600">
                  {formatCurrency((reportType === "weekly" ? weeklyReport?.netAmount : monthlyReport?.netAmount) || 0)}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* 일별 판매 추이 (주간만) */}
            {reportType === "weekly" && weeklyReport && weeklyReport.dailyStats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-violet-500" />
                  일별 판매 추이
                </h3>
                <div className="space-y-2">
                  {weeklyReport.dailyStats.map((stat, i) => {
                    const maxRevenue = Math.max(...weeklyReport.dailyStats.map(s => s.revenue));
                    const percentage = maxRevenue > 0 ? (stat.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-20">
                          {stat.day}
                        </span>
                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.5 + i * 0.05 }}
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-24 text-right">
                          {formatCurrency(stat.revenue)}
                        </span>
                        <span className="text-xs text-gray-500 w-10 text-right">
                          {stat.count}건
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 인기 상품 */}
            {(reportType === "weekly" ? weeklyReport?.topProducts : monthlyReport?.topProducts)?.length ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🏆 인기 상품 TOP {reportType === "weekly" ? 5 : 3}
                </h3>
                <div className="space-y-3">
                  {(reportType === "weekly" ? weeklyReport?.topProducts : monthlyReport?.topProducts)?.map((product, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            i === 0
                              ? "bg-amber-400 text-white"
                              : i === 1
                              ? "bg-gray-400 text-white"
                              : i === 2
                              ? "bg-amber-700 text-white"
                              : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                          {product.title}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(product.revenue)}
                        </div>
                        <div className="text-xs text-gray-500">{product.sales}건</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </div>

          {/* 액션 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📧 리포트 내보내기
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                {sending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {sending ? "발송 중..." : "이메일로 받기"}
              </button>
              <button
                disabled
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-not-allowed opacity-50"
              >
                <Download className="w-5 h-5" />
                PDF 다운로드 (준비중)
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              * 이메일은 {session?.user?.email}로 발송됩니다.
            </p>
          </motion.div>

          {/* 자동 발송 안내 */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  자동 리포트 발송 안내
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  주간 리포트는 매주 월요일 오전 9시, 월간 리포트는 매월 1일에 자동으로 발송됩니다.
                  이메일 수신을 원치 않으시면 설정에서 변경해 주세요.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-gray-500">
          리포트 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
