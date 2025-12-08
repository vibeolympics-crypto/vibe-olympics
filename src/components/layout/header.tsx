"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import {
  Menu,
  X,
  Search,
  LogOut,
  Settings,
  ShoppingBag,
  LayoutDashboard,
  ChevronDown,
  Bell,
  Check,
  Trash2,
  ShoppingCart,
  DollarSign,
  Star,
  Info,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { cn } from "@/lib/utils";
import { 
  useNotifications, 
  useUnreadNotificationCount,
  useMarkNotificationsAsRead,
  useDeleteNotification 
} from "@/hooks/use-api";
import type { Notification } from "@/lib/api";

const navigation = [
  { name: "마켓플레이스", href: "/marketplace" },
  { name: "교육 센터", href: "/education" },
  { name: "커뮤니티", href: "/community" },
  { name: "FAQ", href: "/faq" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const locale = useLocale();
  const t = useTranslations("common");

  // 알림 데이터
  const { data: notificationsData, refetch: refetchNotifications } = useNotifications(1, 10, false);
  const { data: unreadCount } = useUnreadNotificationCount();
  const markAsReadMutation = useMarkNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  // 알림 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 알림 타입별 아이콘
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "PURCHASE":
        return <ShoppingCart className="w-4 h-4 text-[var(--primary)]" />;
      case "SALE":
        return <DollarSign className="w-4 h-4 text-[var(--semantic-success)]" />;
      case "REVIEW":
        return <Star className="w-4 h-4 text-[var(--accent-amber)]" />;
      case "SYSTEM":
        return <Info className="w-4 h-4 text-[var(--accent-cyan)]" />;
      case "PROMOTION":
        return <Gift className="w-4 h-4 text-[var(--accent-magenta)]" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId?: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId ? [notificationId] : undefined);
      refetchNotifications();
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  // 알림 삭제
  const handleDeleteNotification = async (notificationId?: string) => {
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      refetchNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // 시간 포맷팅
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded-lg focus:outline-none"
      >
        본문으로 건너뛰기
      </a>
      
      <header className="fixed top-0 left-0 right-0 z-50 glass" role="banner">
      <nav className="container-app">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] via-[var(--accent-violet)] to-[var(--accent-magenta)] flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--primary)] via-[var(--accent-violet)] to-[var(--accent-magenta)] blur-lg opacity-50" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)] hidden sm:block">
              Vibe <span className="heading-gradient">Olympics</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label={t("search")}>
              <Search className="h-5 w-5" />
            </Button>

            {/* Language Switcher */}
            <LanguageSwitcher currentLocale={locale} />

            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] animate-pulse" />
            ) : session ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                    className="relative p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                    aria-label={`알림${(unreadCount ?? 0) > 0 ? ` (읽지 않은 알림 ${unreadCount}개)` : ''}`}
                    aria-expanded={notificationMenuOpen}
                    aria-haspopup="true"
                  >
                    <Bell className="h-5 w-5 text-[var(--text-secondary)]" aria-hidden="true" />
                    {(unreadCount ?? 0) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[var(--semantic-error)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {(unreadCount ?? 0) > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notificationMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setNotificationMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl shadow-2xl z-20 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--bg-border)]">
                          <h3 className="font-semibold text-[var(--text-primary)]">알림</h3>
                          <div className="flex items-center gap-2">
                            {(unreadCount ?? 0) > 0 && (
                              <button
                                onClick={() => handleMarkAsRead()}
                                className="text-xs text-[var(--primary)] hover:underline"
                              >
                                모두 읽음
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-96 overflow-y-auto">
                          {notificationsData?.notifications && notificationsData.notifications.length > 0 ? (
                            notificationsData.notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={cn(
                                  "px-4 py-3 border-b border-[var(--bg-border)] hover:bg-[var(--bg-elevated)] transition-colors",
                                  !notification.isRead && "bg-[var(--bg-elevated)]/50"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                                      {formatTimeAgo(notification.createdAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {!notification.isRead && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkAsRead(notification.id);
                                        }}
                                        className="p-1 hover:bg-[var(--bg-border)] rounded transition-colors"
                                        title="읽음 처리"
                                      >
                                        <Check className="w-3 h-3 text-[var(--text-tertiary)]" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteNotification(notification.id);
                                      }}
                                      className="p-1 hover:bg-[var(--bg-border)] rounded transition-colors"
                                      title="삭제"
                                    >
                                      <Trash2 className="w-3 h-3 text-[var(--text-tertiary)]" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center">
                              <Bell className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-2 opacity-50" />
                              <p className="text-sm text-[var(--text-tertiary)]">알림이 없습니다</p>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        {notificationsData?.notifications && notificationsData.notifications.length > 0 && (
                          <div className="px-4 py-2 border-t border-[var(--bg-border)] flex items-center justify-between">
                            <button
                              onClick={() => handleDeleteNotification()}
                              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--semantic-error)] transition-colors"
                            >
                              전체 삭제
                            </button>
                            <Link
                              href="/dashboard"
                              className="text-xs text-[var(--primary)] hover:underline"
                              onClick={() => setNotificationMenuOpen(false)}
                            >
                              대시보드에서 보기
                            </Link>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-[var(--bg-elevated)] transition-colors"
                    aria-label="사용자 메뉴"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {session.user?.name?.[0] || "U"}
                      </span>
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 py-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl shadow-2xl z-20">
                      <div className="px-4 py-2 border-b border-[var(--bg-border)]">
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-sm text-[var(--text-tertiary)] truncate">
                          {session.user?.email}
                        </p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        대시보드
                      </Link>
                      <Link
                        href="/dashboard/products"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        내 상품
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        설정
                      </Link>
                      <div className="border-t border-[var(--bg-border)] mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--semantic-error)] hover:bg-[var(--bg-elevated)] w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          로그아웃
                        </button>
                      </div>
                    </div>
                  </>
                )}
                </div>
              </>
            ) : (
              /* Not logged in */
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="neon" size="sm">
                    시작하기
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-[var(--text-secondary)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          role="navigation"
          aria-label="모바일 메뉴"
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-2 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {session ? (
              /* Mobile - Logged in */
              <>
                <div className="border-t border-[var(--bg-border)] mt-2 pt-4 px-4">
                  <div className="flex items-center gap-3 mb-4">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center">
                        <span className="text-white font-medium">
                          {session.user?.name?.[0] || "U"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {session.user?.name}
                      </p>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  대시보드
                </Link>
                <Link
                  href="/dashboard/products"
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingBag className="w-4 h-4" />
                  내 상품
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-[var(--semantic-error)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors flex items-center gap-3 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </>
            ) : (
              /* Mobile - Not logged in */
              <div className="flex gap-2 px-4 pt-2 border-t border-[var(--bg-border)] mt-2">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    로그인
                  </Button>
                </Link>
                <Link href="/auth/signup" className="flex-1">
                  <Button variant="neon" size="sm" className="w-full">
                    시작하기
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
    </>
  );
}
