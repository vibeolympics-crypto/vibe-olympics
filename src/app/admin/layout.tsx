"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  FlaskConical,
  RefreshCcw,
  Wallet,
  Users,
  Package,
  Settings,
  Shield,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
  {
    name: "개요",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "상세 통계",
    href: "/admin/dashboard",
    icon: BarChart3,
  },
  {
    name: "A/B 테스트",
    href: "/admin/ab-test",
    icon: FlaskConical,
  },
  {
    name: "환불 관리",
    href: "/admin/refunds",
    icon: RefreshCcw,
  },
  {
    name: "정산 관리",
    href: "/admin/settlements",
    icon: Wallet,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // 로딩 상태
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 미인증 상태
  if (status === "unauthenticated") {
    redirect("/auth/login?callbackUrl=/admin");
  }

  // 관리자 권한 체크
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  if (!isAdmin) {
    redirect("/");
  }

  // 링크 활성화 체크
  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 bg-[var(--bg-surface)] border-r border-[var(--bg-border)]">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            {/* Admin Header */}
            <div className="px-4 mb-6">
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent-violet)]/10 border border-[var(--primary)]/20">
                <Shield className="w-6 h-6 text-[var(--primary)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">관리자 패널</p>
                  <p className="text-xs text-[var(--text-tertiary)]">시스템 관리</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 space-y-1">
              {adminLinks.map((link) => {
                const isActive = isLinkActive(link.href, link.exact);
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

            {/* Back to Dashboard */}
            <div className="px-4 py-4 border-t border-[var(--bg-border)]">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                대시보드로 돌아가기
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
