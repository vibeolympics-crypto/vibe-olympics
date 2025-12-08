import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 관리자 권한 확인 함수
 * 서버 컴포넌트나 API 라우트에서 사용
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

/**
 * 관리자 권한 확인 및 에러 응답 반환
 * API 라우트에서 사용
 */
export async function requireAdmin(): Promise<{ isAdmin: true; userId: string } | { isAdmin: false; error: Response }> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return {
      isAdmin: false,
      error: new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return {
      isAdmin: false,
      error: new Response(JSON.stringify({ error: "관리자 권한이 필요합니다." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return { isAdmin: true, userId: user.id };
}

/**
 * 관리자 통계 데이터 조회
 */
export async function getAdminStats() {
  const [
    totalUsers,
    totalProducts,
    totalPurchases,
    totalRevenue,
    newUsersThisMonth,
    newProductsThisMonth,
    salesThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.purchase.count({ where: { status: "COMPLETED" } }),
    prisma.purchase.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.product.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.purchase.count({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  return {
    totalUsers,
    totalProducts,
    totalPurchases,
    totalRevenue: Number(totalRevenue._sum.amount || 0),
    newUsersThisMonth,
    newProductsThisMonth,
    salesThisMonth,
  };
}
