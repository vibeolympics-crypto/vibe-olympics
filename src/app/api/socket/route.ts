// Socket.io API 엔드포인트 (Next.js App Router)
import { NextResponse } from "next/server";

// Socket.io는 Next.js의 Edge Runtime과 호환되지 않으므로
// 이 엔드포인트는 Socket.io 연결 상태 확인 및 헬스체크용으로 사용
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Socket.io endpoint - Use WebSocket connection for real-time features",
    path: "/api/socket",
    documentation: {
      events: {
        clientToServer: [
          "auth - Authenticate user with { userId, token? }",
          "notification:markRead - Mark notification as read { notificationId }",
          "notification:markAllRead - Mark all notifications as read",
          "notification:delete - Delete notification { notificationId }",
          "notification:subscribe - Subscribe to notifications",
          "notification:unsubscribe - Unsubscribe from notifications",
        ],
        serverToClient: [
          "notification:new - New notification received",
          "notification:read - Notification marked as read",
          "notification:readAll - All notifications marked as read",
          "notification:delete - Notification deleted",
          "notification:count - Unread notification count update",
          "error - Error message",
        ],
      },
    },
  });
}

// POST는 서버 상태 정보 반환 (관리자용)
export async function POST() {
  const { getOnlineUsersCount } = await import("@/lib/socket");
  
  return NextResponse.json({
    status: "ok",
    onlineUsers: getOnlineUsersCount(),
    timestamp: new Date().toISOString(),
  });
}
