"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Heart,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  Users,
  Layers,
  Bell,
  Wallet,
  CreditCard,
  Ticket,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 기본 메뉴 (모든 사용자)
const mainLinks = [
  {
    name: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "내 상품",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    name: "컬렉션",
    href: "/dashboard/collections",
    icon: Layers,
  },
  {
    name: "구매 내역",
    href: "/dashboard/purchases",
    icon: ShoppingBag,
  },
  {
    name: "찜한 상품",
    href: "/dashboard/wishlist",
    icon: Heart,
  },
  {
    name: "팔로잉",
    href: "/dashboard/following",
    icon: Users,
  },
  {
    name: "알림",
    href: "/dashboard/notifications",
    icon: Bell,
  },
];

// 판매자 전용 메뉴
const sellerLinks = [
  {
    name: "수익/통계",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "정산 관리",
    href: "/dashboard/settlements",
    icon: Wallet,
  },
  {
    name: "쿠폰 관리",
    href: "/dashboard/seller/coupons",
    icon: Ticket,
  },
];

// 구독/설정 메뉴
const bottomLinks = [
  {
    name: "구독 관리",
    href: "/dashboard/subscriptions",
    icon: CreditCard,
  },
  {
    name: "A/B 테스트",
    href: "/dashboard/ab-tests",
    icon: FlaskConical,
    sellerOnly: true,
  },
  {
    name: "설정",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // 판매자 여부 확인
  const isSeller = (session?.user as { isSeller?: boolean })?.isSeller ?? false;

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  // 링크 활성화 체크 (하위 경로 포함)
  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 bg-[var(--bg-surface)] border-r border-[var(--bg-border)]">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            {/* New Product Button */}
            <div className="px-4 mb-6">
              <Link href="/dashboard/products/new">
                <Button variant="neon" className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  새 상품 등록
                </Button>
              </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-2 space-y-1">
              {/* 기본 메뉴 */}
              {mainLinks.map((link) => {
                const isActive = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}

              {/* 판매자 전용 메뉴 */}
              {isSeller && (
                <>
                  <div className="pt-4 pb-2 px-3">
                    <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      판매자
                    </p>
                  </div>
                  {sellerLinks.map((link) => {
                    const isActive = isLinkActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                          isActive
                            ? "bg-[var(--primary)] text-white"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <link.icon className="w-5 h-5" />
                        {link.name}
                      </Link>
                    );
                  })}
                </>
              )}

              {/* 하단 메뉴 */}
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  계정
                </p>
              </div>
              {bottomLinks.map((link) => {
                // 판매자 전용 메뉴 필터링
                if ('sellerOnly' in link && link.sellerOnly && !isSeller) {
                  return null;
                }
                const isActive = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Help */}
            <div className="px-4 py-4 border-t border-[var(--bg-border)]">
              <Link
                href="/faq"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                도움말
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
