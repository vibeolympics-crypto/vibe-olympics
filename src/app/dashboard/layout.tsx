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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sidebarLinks = [
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
    name: "수익/통계",
    href: "/dashboard/analytics",
    icon: BarChart3,
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
  const { status } = useSession();

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

            {/* Navigation */}
            <nav className="flex-1 px-2 space-y-1">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href;
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
                href="/support"
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
