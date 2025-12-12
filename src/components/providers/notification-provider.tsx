"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationSocket } from "@/hooks/use-socket";
import { logger } from "@/lib/logger";
import type { NotificationPayload } from "@/lib/socket";

// 알림 컨텍스트 타입
interface NotificationContextType {
  // 상태
  notifications: NotificationPayload[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 액션
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 알림 Provider Props
interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Socket Hook 사용
  const {
    isConnected,
    error: socketError,
    notifications: socketNotifications,
    unreadCount: socketUnreadCount,
    markAsRead: socketMarkAsRead,
    markAllAsRead: socketMarkAllAsRead,
    deleteNotification: socketDeleteNotification,
    setNotifications,
    setUnreadCount,
  } = useNotificationSocket({
    onNewNotification: (notification) => {
      // 새 알림 수신 시 토스트 표시 (선택적)
      logger.log("[Notification] New:", notification.title);
      
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onUnreadCountChange: (count) => {
      // 읽지 않은 수 변경 시
      logger.log("[Notification] Unread count:", count);
    },
  });

  // 초기 알림 로드
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/notifications?limit=50");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      
      const data = await response.json();
      
      // 소켓 상태 업데이트
      setNotifications(data.notifications.map((n: {
        id: string;
        type: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
        isRead: boolean;
        createdAt: string;
      }) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })));
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("[Notification] Fetch error:", error);
      setApiError(error instanceof Error ? error.message : "Failed to fetch notifications");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, setNotifications, setUnreadCount]);

  // 세션 변경 시 알림 로드
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
    }
  }, [session?.user?.id, fetchNotifications]);

  // 알림 읽음 처리 (API + Socket)
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // API 호출
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      // Socket 이벤트 발송 (다른 탭/기기 동기화)
      socketMarkAsRead(notificationId);
      
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("[Notification] Mark as read error:", error);
      throw error;
    }
  }, [socketMarkAsRead, queryClient]);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      // Socket 이벤트 발송
      socketMarkAllAsRead();
      
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("[Notification] Mark all as read error:", error);
      throw error;
    }
  }, [socketMarkAllAsRead, queryClient]);

  // 알림 삭제
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete notification");

      // Socket 이벤트 발송
      socketDeleteNotification(notificationId);
      
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("[Notification] Delete error:", error);
      throw error;
    }
  }, [socketDeleteNotification, queryClient]);

  // 컨텍스트 값
  const value: NotificationContextType = {
    notifications: socketNotifications,
    unreadCount: socketUnreadCount,
    isConnected,
    isLoading,
    error: socketError || apiError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  
  return context;
}
