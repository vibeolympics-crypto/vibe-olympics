"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  UserPlus,
  ShoppingBag,
  RotateCcw,
  Package,
  Star,
  MessageSquare,
  BadgeCheck,
  Wallet,
  X,
  Check,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 이벤트 타입
type EventType = 
  | "USER_SIGNUP"
  | "PURCHASE"
  | "REFUND"
  | "PRODUCT_CREATED"
  | "REVIEW_CREATED"
  | "TICKET_CREATED"
  | "SELLER_APPROVED"
  | "WITHDRAWAL";

interface RealtimeEvent {
  id: string;
  type: EventType;
  timestamp: number;
  data: {
    title: string;
    description: string;
    userId?: string;
    userName?: string;
    amount?: number;
    productId?: string;
    productTitle?: string;
    metadata?: Record<string, unknown>;
  };
  read: boolean;
}

// 이벤트 아이콘 컴포넌트
const EventIcon = ({ type }: { type: EventType }) => {
  const icons: Record<EventType, React.ReactNode> = {
    USER_SIGNUP: <UserPlus className="w-4 h-4" />,
    PURCHASE: <ShoppingBag className="w-4 h-4" />,
    REFUND: <RotateCcw className="w-4 h-4" />,
    PRODUCT_CREATED: <Package className="w-4 h-4" />,
    REVIEW_CREATED: <Star className="w-4 h-4" />,
    TICKET_CREATED: <MessageSquare className="w-4 h-4" />,
    SELLER_APPROVED: <BadgeCheck className="w-4 h-4" />,
    WITHDRAWAL: <Wallet className="w-4 h-4" />,
  };
  return icons[type] || <Bell className="w-4 h-4" />;
};

// 이벤트 색상
const getEventColor = (type: EventType): string => {
  const colors: Record<EventType, string> = {
    USER_SIGNUP: "bg-cyan-500",
    PURCHASE: "bg-green-500",
    REFUND: "bg-amber-500",
    PRODUCT_CREATED: "bg-violet-500",
    REVIEW_CREATED: "bg-pink-500",
    TICKET_CREATED: "bg-blue-500",
    SELLER_APPROVED: "bg-emerald-500",
    WITHDRAWAL: "bg-orange-500",
  };
  return colors[type] || "bg-gray-500";
};

// 상대적 시간 포맷
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return "방금 전";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return `${Math.floor(diff / 86400000)}일 전`;
};

interface RealtimeNotificationsProps {
  className?: string;
}

export default function RealtimeNotifications({ className }: RealtimeNotificationsProps) {
  const { data: session } = useSession();
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<number>(0);

  // 이벤트 가져오기
  const fetchEvents = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const since = lastFetchRef.current || undefined;
      const url = `/api/admin/realtime-events?limit=20${since ? `&since=${since}` : ""}`;
      const res = await fetch(url);
      
      if (!res.ok) return;
      
      const data = await res.json();
      
      if (since && data.events.length > 0) {
        // 새 이벤트가 있으면 기존 목록에 추가
        setEvents(prev => {
          const newEvents = data.events.filter(
            (e: RealtimeEvent) => !prev.some(p => p.id === e.id)
          );
          return [...newEvents, ...prev].slice(0, 50);
        });
      } else if (!since) {
        // 초기 로드
        setEvents(data.events);
      }
      
      setUnreadCount(data.unreadCount);
      lastFetchRef.current = Date.now();
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // 초기 로드 및 폴링
  useEffect(() => {
    fetchEvents();
    
    // 30초마다 새 이벤트 확인
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 개별 읽음 처리
  const handleMarkAsRead = async (eventId: string) => {
    try {
      await fetch("/api/admin/realtime-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAsRead", eventId }),
      });
      
      setEvents(prev => 
        prev.map(e => e.id === eventId ? { ...e, read: true } : e)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // 전체 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/admin/realtime-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllAsRead" }),
      });
      
      setEvents(prev => prev.map(e => ({ ...e, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // 관리자/판매자가 아니면 표시하지 않음
  const user = session?.user as { role?: string; isSeller?: boolean } | undefined;
  if (!user || (user.role !== "ADMIN" && !user.isSeller)) {
    return null;
  }

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* 알림 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* 드롭다운 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--bg-border)]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="font-semibold">실시간 알림</h3>
                {unreadCount > 0 && (
                  <Badge variant="danger" className="text-xs">
                    {unreadCount}개 새 알림
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={handleMarkAllAsRead}
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    모두 읽음
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-tertiary)]">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">새로운 알림이 없습니다</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--bg-border)]">
                  {events.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-3 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group",
                        !event.read && "bg-[var(--primary)]/5"
                      )}
                    >
                      <div className="flex gap-3">
                        {/* 아이콘 */}
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0",
                          getEventColor(event.type)
                        )}>
                          <EventIcon type={event.type} />
                        </div>
                        
                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "text-sm line-clamp-2",
                              !event.read && "font-medium"
                            )}>
                              {event.data.description}
                            </p>
                            {!event.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(event.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--bg-surface)] rounded"
                              >
                                <Check className="w-3 h-3 text-[var(--text-tertiary)]" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[var(--text-tertiary)]">
                              {formatRelativeTime(event.timestamp)}
                            </span>
                            {event.data.amount && (
                              <Badge variant="secondary" className="text-xs">
                                ₩{event.data.amount.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* 푸터 */}
            {events.length > 0 && (
              <div className="p-3 border-t border-[var(--bg-border)] text-center">
                <button
                  onClick={() => {
                    // TODO: 전체 알림 페이지로 이동
                    setIsOpen(false);
                  }}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  모든 알림 보기
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
