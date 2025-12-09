"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  ShoppingBag,
  MessageSquare,
  Heart,
  Star,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Package,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// NotificationType 매핑 (Prisma 스키마 기반)
type NotificationType =
  | "PURCHASE"
  | "SALE"
  | "REVIEW"
  | "SYSTEM"
  | "PROMOTION"
  | "FOLLOWER"
  | "COMMENT"
  | "WISHLIST"
  | "PRODUCT_UPDATE";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any> | null;
  createdAt: string;
}

interface NotificationCenterProps {
  className?: string;
}

// 알림 타입별 아이콘 및 색상 매핑
const notificationConfig: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bgColor: string }
> = {
  FOLLOWER: {
    icon: Users,
    color: "text-[var(--primary)]",
    bgColor: "bg-[var(--primary)]/10",
  },
  COMMENT: {
    icon: MessageSquare,
    color: "text-[var(--accent-violet)]",
    bgColor: "bg-[var(--accent-violet)]/10",
  },
  REVIEW: {
    icon: Star,
    color: "text-[var(--accent-yellow)]",
    bgColor: "bg-[var(--accent-yellow)]/10",
  },
  PURCHASE: {
    icon: ShoppingBag,
    color: "text-[var(--semantic-success)]",
    bgColor: "bg-[var(--semantic-success)]/10",
  },
  SALE: {
    icon: DollarSign,
    color: "text-[var(--semantic-success)]",
    bgColor: "bg-[var(--semantic-success)]/10",
  },
  PRODUCT_UPDATE: {
    icon: Package,
    color: "text-[var(--accent-cyan)]",
    bgColor: "bg-[var(--accent-cyan)]/10",
  },
  SYSTEM: {
    icon: AlertCircle,
    color: "text-[var(--text-secondary)]",
    bgColor: "bg-[var(--bg-elevated)]",
  },
  PROMOTION: {
    icon: TrendingUp,
    color: "text-[var(--accent-orange)]",
    bgColor: "bg-[var(--accent-orange)]/10",
  },
  WISHLIST: {
    icon: Heart,
    color: "text-[var(--semantic-error)]",
    bgColor: "bg-[var(--semantic-error)]/10",
  },
};

// 시간 포맷
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// 개별 알림 아이템
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = notificationConfig[notification.type] || notificationConfig.SYSTEM;
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // data에 link가 있으면 이동
    if (notification.data?.link) {
      window.location.href = notification.data.link;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "flex items-start gap-3 p-4 border-b border-[var(--bg-border)] cursor-pointer transition-colors",
        notification.isRead
          ? "bg-transparent"
          : "bg-[var(--primary)]/5"
      )}
      onClick={handleClick}
    >
      {/* 아이콘 */}
      <div className={cn("p-2 rounded-lg flex-shrink-0", config.bgColor)}>
        <Icon className={cn("w-5 h-5", config.color)} />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              "text-sm font-medium line-clamp-1",
              notification.isRead
                ? "text-[var(--text-secondary)]"
                : "text-[var(--text-primary)]"
            )}
          >
            {notification.title}
          </h4>
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <span className="text-xs text-[var(--text-disabled)] mt-1 block">
          {formatTimeAgo(notification.createdAt)}
        </span>
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// 알림 센터 드롭다운
export function NotificationCenter({ className }: NotificationCenterProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 알림 가져오기
  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      const res = await fetch(
        `/api/notifications?limit=20&unreadOnly=${filter === "unread"}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [session?.user, filter]);

  // 초기 로딩 및 폴링 설정
  useEffect(() => {
    if (session?.user) {
      fetchNotifications();

      // 30초마다 새 알림 확인 (실시간 대안)
      pollingRef.current = setInterval(fetchNotifications, 30000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [session?.user, fetchNotifications]);

  // 드롭다운 바깥 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 열릴 때 알림 다시 로드
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // 단일 알림 읽음 처리
  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "markAsRead",
          notificationIds: [id],
        }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllAsRead" }),
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 알림 삭제
  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });

      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // 모든 알림 삭제
  const deleteAllNotifications = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/notifications?all=true", {
        method: "DELETE",
      });

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) return null;

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* 알림 벨 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[var(--primary)] text-white text-xs font-medium rounded-full flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* 드롭다운 패널 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[380px] max-h-[500px] bg-[var(--bg-primary)] border border-[var(--bg-border)] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* 헤더 */}
            <div className="p-4 border-b border-[var(--bg-border)] bg-[var(--bg-secondary)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <Badge variant="cyan" className="text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      disabled={isLoading}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={deleteAllNotifications}
                      disabled={isLoading}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--semantic-error)] transition-colors"
                      title="Delete all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <a
                    href="/dashboard/settings?tab=notifications"
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    title="Notification settings"
                  >
                    <Settings className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* 필터 탭 */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setFilter("all")}
                  className={cn(
                    "px-3 py-1 text-sm rounded-lg transition-colors",
                    filter === "all"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={cn(
                    "px-3 py-1 text-sm rounded-lg transition-colors",
                    filter === "unread"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  Unread
                </button>
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-[350px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)] mx-auto" />
                </div>
              ) : notifications.length > 0 ? (
                <div className="group">
                  <AnimatePresence mode="popLayout">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-[var(--text-disabled)] mx-auto mb-3" />
                  <p className="text-[var(--text-tertiary)]">
                    {filter === "unread"
                      ? "No unread notifications"
                      : "No notifications yet"}
                  </p>
                </div>
              )}
            </div>

            {/* 푸터 */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-[var(--bg-border)] bg-[var(--bg-secondary)]">
                <a
                  href="/dashboard/notifications"
                  className="block text-center text-sm text-[var(--primary)] hover:underline"
                >
                  View all notifications
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 알림 페이지용 전체 리스트 컴포넌트
export function NotificationList() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?page=${page}&limit=20&unreadOnly=${filter === "unread"}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, page, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "markAsRead",
          notificationIds: [id],
        }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllAsRead" }),
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });

      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // 필터링된 알림
  const filteredNotifications =
    typeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === typeFilter);

  if (!session?.user) {
    return (
      <Card variant="glass">
        <CardContent className="p-8 text-center">
          <p className="text-[var(--text-tertiary)]">Please sign in to view notifications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              You have {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 text-sm rounded-lg transition-colors",
              filter === "all"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-4 py-2 text-sm rounded-lg transition-colors",
              filter === "unread"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
            )}
          >
            Unread only
          </button>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as NotificationType | "all")}
          className="bg-[var(--bg-elevated)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-2 border border-[var(--bg-border)]"
        >
          <option value="all">All types</option>
          <option value="PURCHASE">Purchases</option>
          <option value="SALE">Sales</option>
          <option value="FOLLOWER">Followers</option>
          <option value="COMMENT">Comments</option>
          <option value="REVIEW">Reviews</option>
          <option value="WISHLIST">Wishlist</option>
          <option value="PRODUCT_UPDATE">Product Updates</option>
          <option value="PROMOTION">Promotions</option>
          <option value="SYSTEM">System</option>
        </select>
      </div>

      {/* 알림 목록 */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mx-auto" />
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const config =
              notificationConfig[notification.type] || notificationConfig.SYSTEM;
            const Icon = config.icon;

            return (
              <Card
                key={notification.id}
                variant="glass"
                className={cn(
                  "transition-colors",
                  !notification.isRead && "border-[var(--primary)]/30"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-lg", config.bgColor)}>
                      <Icon className={cn("w-6 h-6", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3
                            className={cn(
                              "font-medium",
                              notification.isRead
                                ? "text-[var(--text-secondary)]"
                                : "text-[var(--text-primary)]"
                            )}
                          >
                            {notification.title}
                          </h3>
                          <p className="text-sm text-[var(--text-tertiary)] mt-1">
                            {notification.message}
                          </p>
                          <span className="text-xs text-[var(--text-disabled)] mt-2 block">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--primary)]"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--semantic-error)]"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <Bell className="w-16 h-16 text-[var(--text-disabled)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
              No notifications
            </h3>
            <p className="text-[var(--text-tertiary)]">
              {filter === "unread"
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-[var(--text-secondary)]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
