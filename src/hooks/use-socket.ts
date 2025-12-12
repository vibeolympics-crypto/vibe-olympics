"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { logger } from "@/lib/logger";
import type { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  NotificationPayload 
} from "@/lib/socket";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface UseSocketReturn {
  getSocket: () => TypedSocket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: <T extends keyof ClientToServerEvents>(
    event: T,
    ...args: Parameters<ClientToServerEvents[T]>
  ) => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true, reconnectAttempts = 5, reconnectDelay = 3000 } = options;
  const { data: session, status } = useSession();
  
  const socketRef = useRef<TypedSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 소켓 연결
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    
    socketRef.current = io(socketUrl, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: reconnectAttempts,
      reconnectionDelay: reconnectDelay,
      timeout: 10000,
    });

    // 연결 성공
    socketRef.current.on("connect", () => {
      logger.log("[Socket] Connected:", socketRef.current?.id);
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;

      // 세션이 있으면 인증
      if (session?.user?.id) {
        socketRef.current?.emit("auth", { userId: session.user.id });
      }
    });

    // 연결 해제
    socketRef.current.on("disconnect", (reason) => {
      logger.log("[Socket] Disconnected:", reason);
      setIsConnected(false);
      setIsAuthenticated(false);
    });

    // 연결 에러
    socketRef.current.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      setError(`Connection error: ${err.message}`);
      reconnectAttemptsRef.current++;
    });

    // 서버 에러
    socketRef.current.on("error", (data) => {
      console.error("[Socket] Server error:", data.message);
      setError(data.message);
    });
  }, [session?.user?.id, reconnectAttempts, reconnectDelay]);

  // 소켓 연결 해제
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsAuthenticated(false);
    }
  }, []);

  // 이벤트 발송
  const emit = useCallback(<T extends keyof ClientToServerEvents>(
    event: T,
    ...args: Parameters<ClientToServerEvents[T]>
  ) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, ...args);
    } else {
      console.warn("[Socket] Cannot emit - not connected");
    }
  }, []);

  // 자동 연결 및 세션 변경 처리
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (autoConnect && session?.user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, session?.user?.id, status, connect, disconnect]);

  // 세션 변경 시 재인증
  useEffect(() => {
    if (isConnected && session?.user?.id) {
      socketRef.current?.emit("auth", { userId: session.user.id });
      setIsAuthenticated(true);
    }
  }, [isConnected, session?.user?.id]);

  // Socket getter (렌더링 중 ref 접근 방지)
  const getSocket = useCallback(() => socketRef.current, []);

  return {
    getSocket,
    isConnected,
    isAuthenticated,
    error,
    connect,
    disconnect,
    emit,
  };
}

// 알림 전용 Hook
interface UseNotificationSocketOptions {
  onNewNotification?: (notification: NotificationPayload) => void;
  onNotificationRead?: (notificationId: string) => void;
  onAllNotificationsRead?: () => void;
  onNotificationDeleted?: (notificationId: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

export function useNotificationSocket(options: UseNotificationSocketOptions = {}) {
  const {
    onNewNotification,
    onNotificationRead,
    onAllNotificationsRead,
    onNotificationDeleted,
    onUnreadCountChange,
  } = options;

  const { getSocket, isConnected, isAuthenticated, error, connect, disconnect } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  // 이벤트 리스너 등록
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isConnected) return;

    // 새 알림
    const handleNewNotification = (notification: NotificationPayload) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      onNewNotification?.(notification);
    };

    // 알림 읽음
    const handleNotificationRead = (data: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      onNotificationRead?.(data.notificationId);
    };

    // 모든 알림 읽음
    const handleAllRead = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      onAllNotificationsRead?.();
    };

    // 알림 삭제
    const handleNotificationDeleted = (data: { notificationId: string }) => {
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === data.notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== data.notificationId);
      });
      onNotificationDeleted?.(data.notificationId);
    };

    // 읽지 않은 수 업데이트
    const handleUnreadCount = (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
      onUnreadCountChange?.(data.unreadCount);
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:read", handleNotificationRead);
    socket.on("notification:readAll", handleAllRead);
    socket.on("notification:delete", handleNotificationDeleted);
    socket.on("notification:count", handleUnreadCount);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:read", handleNotificationRead);
      socket.off("notification:readAll", handleAllRead);
      socket.off("notification:delete", handleNotificationDeleted);
      socket.off("notification:count", handleUnreadCount);
    };
  }, [
    getSocket,
    isConnected,
    onNewNotification,
    onNotificationRead,
    onAllNotificationsRead,
    onNotificationDeleted,
    onUnreadCountChange,
  ]);

  // 알림 읽음 처리
  const markAsRead = useCallback((notificationId: string) => {
    getSocket()?.emit("notification:markRead", { notificationId });
  }, [getSocket]);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(() => {
    getSocket()?.emit("notification:markAllRead");
  }, [getSocket]);

  // 알림 삭제
  const deleteNotification = useCallback((notificationId: string) => {
    getSocket()?.emit("notification:delete", { notificationId });
  }, [getSocket]);

  return {
    getSocket,
    isConnected,
    isAuthenticated,
    error,
    connect,
    disconnect,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setNotifications,
    setUnreadCount,
  };
}
