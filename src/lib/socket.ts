// Socket.io 서버 및 유틸리티
import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";

// 전역 Socket.io 서버 인스턴스
let io: SocketIOServer | null = null;

// 사용자 ID → Socket ID 매핑
const userSocketMap = new Map<string, Set<string>>();

// Socket.io 이벤트 타입 정의
export interface ServerToClientEvents {
  "notification:new": (data: NotificationPayload) => void;
  "notification:read": (data: { notificationId: string }) => void;
  "notification:readAll": () => void;
  "notification:delete": (data: { notificationId: string }) => void;
  "notification:count": (data: { unreadCount: number }) => void;
  "user:online": (data: { userId: string }) => void;
  "user:offline": (data: { userId: string }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  "auth": (data: { userId: string; token?: string }) => void;
  "notification:markRead": (data: { notificationId: string }) => void;
  "notification:markAllRead": () => void;
  "notification:delete": (data: { notificationId: string }) => void;
  "notification:subscribe": () => void;
  "notification:unsubscribe": () => void;
}

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface SocketData {
  userId: string;
  authenticated: boolean;
}

// Socket.io 서버 초기화
export function initSocketServer(httpServer: NetServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // 인증 처리
    socket.on("auth", async (data) => {
      const { userId } = data;
      
      if (!userId) {
        socket.emit("error", { message: "User ID is required for authentication" });
        return;
      }

      // 소켓 데이터에 사용자 정보 저장
      socket.data.userId = userId;
      socket.data.authenticated = true;

      // 사용자-소켓 매핑 추가
      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
      }
      userSocketMap.get(userId)?.add(socket.id);

      // 사용자 전용 룸에 조인
      socket.join(`user:${userId}`);

      console.log(`[Socket] User authenticated: ${userId} (socket: ${socket.id})`);
    });

    // 알림 읽음 처리
    socket.on("notification:markRead", async (data) => {
      const { notificationId } = data;
      const userId = socket.data.userId;

      if (!userId) {
        socket.emit("error", { message: "Not authenticated" });
        return;
      }

      // 해당 사용자의 모든 소켓에 브로드캐스트
      io?.to(`user:${userId}`).emit("notification:read", { notificationId });
    });

    // 모든 알림 읽음 처리
    socket.on("notification:markAllRead", async () => {
      const userId = socket.data.userId;

      if (!userId) {
        socket.emit("error", { message: "Not authenticated" });
        return;
      }

      io?.to(`user:${userId}`).emit("notification:readAll");
    });

    // 알림 삭제
    socket.on("notification:delete", async (data) => {
      const { notificationId } = data;
      const userId = socket.data.userId;

      if (!userId) {
        socket.emit("error", { message: "Not authenticated" });
        return;
      }

      io?.to(`user:${userId}`).emit("notification:delete", { notificationId });
    });

    // 연결 해제
    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      
      if (userId) {
        // 사용자-소켓 매핑에서 제거
        const userSockets = userSocketMap.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            userSocketMap.delete(userId);
          }
        }
      }

      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Socket.io 서버 인스턴스 가져오기
export function getSocketServer(): SocketIOServer | null {
  return io;
}

// 특정 사용자에게 알림 전송
export function emitToUser(userId: string, event: keyof ServerToClientEvents, data: unknown) {
  if (!io) {
    console.warn("[Socket] Server not initialized");
    return false;
  }

  io.to(`user:${userId}`).emit(event, data as never);
  return true;
}

// 특정 사용자에게 새 알림 전송
export function sendNotificationToUser(userId: string, notification: NotificationPayload) {
  return emitToUser(userId, "notification:new", notification);
}

// 특정 사용자에게 읽지 않은 알림 수 전송
export function sendUnreadCountToUser(userId: string, unreadCount: number) {
  return emitToUser(userId, "notification:count", { unreadCount });
}

// 사용자 온라인 상태 확인
export function isUserOnline(userId: string): boolean {
  return userSocketMap.has(userId) && (userSocketMap.get(userId)?.size ?? 0) > 0;
}

// 온라인 사용자 수 가져오기
export function getOnlineUsersCount(): number {
  return userSocketMap.size;
}

// 특정 사용자의 소켓 수 가져오기
export function getUserSocketCount(userId: string): number {
  return userSocketMap.get(userId)?.size ?? 0;
}
