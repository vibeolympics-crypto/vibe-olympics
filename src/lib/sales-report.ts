/**
 * 판매 리포트 생성 유틸리티
 * - 주간/월간 판매 데이터 집계
 * - 성장률 계산
 * - 인기 상품 분석
 */

import { prisma } from "@/lib/prisma";
import { sendWeeklySalesReportEmail, sendMonthlyTransactionReportEmail } from "@/lib/email";

// 기간 계산 유틸리티
export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일 시작
  
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

export function getPreviousWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  d.setDate(d.getDate() - 7);
  return getWeekRange(d);
}

export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatMonth(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

// 요일 이름
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

interface SalesData {
  totalRevenue: number;
  salesCount: number;
  platformFee: number;
  paymentFee: number;
  netAmount: number;
}

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

// 기간별 판매 데이터 조회
async function getSalesData(sellerId: string, start: Date, end: Date): Promise<SalesData> {
  const purchases = await prisma.purchase.findMany({
    where: {
      product: { sellerId },
      status: "COMPLETED",
      createdAt: { gte: start, lte: end },
    },
    include: {
      product: { select: { price: true } },
    },
  });

  const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.product.price), 0);
  const salesCount = purchases.length;
  const platformFee = Math.floor(totalRevenue * 0.1);
  const paymentFee = Math.floor(totalRevenue * 0.035);
  const netAmount = totalRevenue - platformFee - paymentFee;

  return { totalRevenue, salesCount, platformFee, paymentFee, netAmount };
}

// 인기 상품 조회
async function getTopProducts(sellerId: string, start: Date, end: Date, limit: number = 5): Promise<TopProduct[]> {
  const purchases = await prisma.purchase.findMany({
    where: {
      product: { sellerId },
      status: "COMPLETED",
      createdAt: { gte: start, lte: end },
    },
    include: {
      product: { select: { id: true, title: true, price: true } },
    },
  });

  // 상품별 집계
  const productMap = new Map<string, { title: string; sales: number; revenue: number }>();
  
  for (const purchase of purchases) {
    const existing = productMap.get(purchase.product.id);
    if (existing) {
      existing.sales += 1;
      existing.revenue += Number(purchase.product.price);
    } else {
      productMap.set(purchase.product.id, {
        title: purchase.product.title,
        sales: 1,
        revenue: Number(purchase.product.price),
      });
    }
  }

  // 매출 순 정렬
  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// 일별 판매 통계
async function getDailyStats(sellerId: string, start: Date, end: Date): Promise<DailyStat[]> {
  const purchases = await prisma.purchase.findMany({
    where: {
      product: { sellerId },
      status: "COMPLETED",
      createdAt: { gte: start, lte: end },
    },
    include: {
      product: { select: { price: true } },
    },
  });

  // 일별 집계
  const dayMap = new Map<string, { revenue: number; count: number }>();
  
  // 기간 내 모든 날짜 초기화
  const current = new Date(start);
  while (current <= end) {
    const dayName = `${current.getMonth() + 1}/${current.getDate()} (${DAY_NAMES[current.getDay()]})`;
    dayMap.set(dayName, { revenue: 0, count: 0 });
    current.setDate(current.getDate() + 1);
  }

  // 실제 데이터 집계
  for (const purchase of purchases) {
    const d = new Date(purchase.createdAt);
    const dayName = `${d.getMonth() + 1}/${d.getDate()} (${DAY_NAMES[d.getDay()]})`;
    const existing = dayMap.get(dayName);
    if (existing) {
      existing.revenue += Number(purchase.product.price);
      existing.count += 1;
    }
  }

  return Array.from(dayMap.entries()).map(([day, stats]) => ({
    day,
    ...stats,
  }));
}

// 조회수 조회 (지난 7일간)
async function getViewCount(sellerId: string, start: Date, end: Date): Promise<number> {
  // ViewLog가 없으면 Product의 viewCount 합계 사용
  const products = await prisma.product.findMany({
    where: { sellerId },
    select: { viewCount: true },
  });
  
  return products.reduce((sum, p) => sum + p.viewCount, 0);
}

// 주간 판매 리포트 생성
export interface WeeklySalesReport {
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

export async function generateWeeklySalesReport(sellerId: string): Promise<WeeklySalesReport | null> {
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { name: true, email: true },
  });

  if (!seller) return null;

  const { start: weekStart, end: weekEnd } = getWeekRange();
  const { start: prevStart, end: prevEnd } = getPreviousWeekRange();

  const [currentData, previousData, topProducts, dailyStats, viewCount] = await Promise.all([
    getSalesData(sellerId, weekStart, weekEnd),
    getSalesData(sellerId, prevStart, prevEnd),
    getTopProducts(sellerId, weekStart, weekEnd, 5),
    getDailyStats(sellerId, weekStart, weekEnd),
    getViewCount(sellerId, weekStart, weekEnd),
  ]);

  const growthRate = previousData.totalRevenue > 0
    ? ((currentData.totalRevenue - previousData.totalRevenue) / previousData.totalRevenue) * 100
    : currentData.totalRevenue > 0 ? 100 : 0;

  const conversionRate = viewCount > 0
    ? (currentData.salesCount / viewCount) * 100
    : 0;

  return {
    sellerName: seller.name || "판매자",
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
    ...currentData,
    previousWeekRevenue: previousData.totalRevenue,
    growthRate,
    topProducts,
    dailyStats,
    viewCount,
    conversionRate,
  };
}

// 월간 판매 리포트 생성
export interface MonthlySalesReport {
  sellerName: string;
  month: string;
  totalSales: number;
  salesCount: number;
  platformFee: number;
  paymentFee: number;
  netAmount: number;
  topProducts: TopProduct[];
}

export async function generateMonthlySalesReport(sellerId: string): Promise<MonthlySalesReport | null> {
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { name: true },
  });

  if (!seller) return null;

  const { start, end } = getMonthRange();
  const [salesData, topProducts] = await Promise.all([
    getSalesData(sellerId, start, end),
    getTopProducts(sellerId, start, end, 3),
  ]);

  return {
    sellerName: seller.name || "판매자",
    month: formatMonth(new Date()),
    totalSales: salesData.totalRevenue,
    salesCount: salesData.salesCount,
    platformFee: salesData.platformFee,
    paymentFee: salesData.paymentFee,
    netAmount: salesData.netAmount,
    topProducts,
  };
}

// 전체 판매자에게 주간 리포트 발송
export async function sendWeeklyReportsToAllSellers(): Promise<{ success: number; failed: number }> {
  const sellers = await prisma.user.findMany({
    where: {
      OR: [
        { isSeller: true },
        { role: "ADMIN" },
      ],
      emailVerified: { not: null },
    },
    select: { id: true, email: true },
  });

  let success = 0;
  let failed = 0;

  for (const seller of sellers) {
    try {
      const report = await generateWeeklySalesReport(seller.id);
      if (report && seller.email) {
        await sendWeeklySalesReportEmail(seller.email, report);
        success++;
      }
    } catch (error) {
      console.error(`Failed to send weekly report to ${seller.email}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

// 전체 판매자에게 월간 리포트 발송
export async function sendMonthlyReportsToAllSellers(): Promise<{ success: number; failed: number }> {
  const sellers = await prisma.user.findMany({
    where: {
      OR: [
        { isSeller: true },
        { role: "ADMIN" },
      ],
      emailVerified: { not: null },
    },
    select: { id: true, email: true },
  });

  let success = 0;
  let failed = 0;

  for (const seller of sellers) {
    try {
      const report = await generateMonthlySalesReport(seller.id);
      if (report && seller.email) {
        await sendMonthlyTransactionReportEmail(seller.email, report);
        success++;
      }
    } catch (error) {
      console.error(`Failed to send monthly report to ${seller.email}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

// 특정 판매자에게 주간 리포트 미리보기 (관리자/테스트용)
export async function previewWeeklySalesReport(sellerId: string) {
  return generateWeeklySalesReport(sellerId);
}

// 특정 판매자에게 즉시 리포트 발송
export async function sendImmediateSalesReport(
  sellerId: string, 
  email: string, 
  type: "weekly" | "monthly"
): Promise<boolean> {
  try {
    if (type === "weekly") {
      const report = await generateWeeklySalesReport(sellerId);
      if (report) {
        await sendWeeklySalesReportEmail(email, report);
        return true;
      }
    } else {
      const report = await generateMonthlySalesReport(sellerId);
      if (report) {
        await sendMonthlyTransactionReportEmail(email, report);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Failed to send immediate report:", error);
    return false;
  }
}
