/**
 * Realtime Events Utility
 * 실시간 이벤트 저장 및 조회 유틸리티
 * 
 * Phase 11 - 대시보드 실시간 알림
 */

// 이벤트 타입
export type EventType = 
  | "USER_SIGNUP"      // 신규 가입
  | "PURCHASE"         // 구매 완료
  | "REFUND"           // 환불 요청
  | "PRODUCT_CREATED"  // 상품 등록
  | "REVIEW_CREATED"   // 리뷰 작성
  | "TICKET_CREATED"   // 티켓 생성
  | "SELLER_APPROVED"  // 판매자 승인
  | "WITHDRAWAL";      // 출금 요청

// 이벤트 인터페이스
export interface RealtimeEvent {
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

// 메모리 내 이벤트 저장소
const eventsStore: RealtimeEvent[] = [];

// 최대 저장 개수 (메모리 관리)
const MAX_EVENTS = 100;

/**
 * 고유 ID 생성
 */
function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 이벤트 타입별 제목 생성
 */
function getEventTitle(type: EventType): string {
  const titles: Record<EventType, string> = {
    USER_SIGNUP: "신규 회원 가입",
    PURCHASE: "새 구매 완료",
    REFUND: "환불 요청",
    PRODUCT_CREATED: "새 상품 등록",
    REVIEW_CREATED: "새 리뷰 작성",
    TICKET_CREATED: "새 문의 등록",
    SELLER_APPROVED: "판매자 승인",
    WITHDRAWAL: "출금 요청",
  };
  return titles[type] || "알 수 없는 이벤트";
}

/**
 * 이벤트 타입별 아이콘 (클라이언트용)
 */
export function getEventIcon(type: EventType): string {
  const icons: Record<EventType, string> = {
    USER_SIGNUP: "UserPlus",
    PURCHASE: "ShoppingBag",
    REFUND: "RotateCcw",
    PRODUCT_CREATED: "Package",
    REVIEW_CREATED: "Star",
    TICKET_CREATED: "MessageSquare",
    SELLER_APPROVED: "BadgeCheck",
    WITHDRAWAL: "Wallet",
  };
  return icons[type] || "Bell";
}

/**
 * 이벤트 타입별 색상 (클라이언트용)
 */
export function getEventColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    USER_SIGNUP: "cyan",
    PURCHASE: "green",
    REFUND: "amber",
    PRODUCT_CREATED: "violet",
    REVIEW_CREATED: "magenta",
    TICKET_CREATED: "blue",
    SELLER_APPROVED: "green",
    WITHDRAWAL: "amber",
  };
  return colors[type] || "gray";
}

/**
 * 신규 이벤트 기록
 */
export function recordEvent(
  type: EventType,
  data: Omit<RealtimeEvent["data"], "title">
): RealtimeEvent {
  const event: RealtimeEvent = {
    id: generateId(),
    type,
    timestamp: Date.now(),
    data: {
      title: getEventTitle(type),
      ...data,
    },
    read: false,
  };

  eventsStore.unshift(event); // 최신 이벤트를 앞에 추가

  // 오래된 이벤트 제거
  if (eventsStore.length > MAX_EVENTS) {
    eventsStore.splice(MAX_EVENTS);
  }

  return event;
}

/**
 * 이벤트 조회 (최근 N개)
 */
export function getEvents(limit: number = 20, since?: number): RealtimeEvent[] {
  let events = eventsStore;
  
  if (since) {
    events = events.filter(e => e.timestamp > since);
  }
  
  return events.slice(0, limit);
}

/**
 * 읽지 않은 이벤트 수
 */
export function getUnreadCount(): number {
  return eventsStore.filter(e => !e.read).length;
}

/**
 * 이벤트 읽음 처리
 */
export function markAsRead(eventId: string): boolean {
  const event = eventsStore.find(e => e.id === eventId);
  if (event) {
    event.read = true;
    return true;
  }
  return false;
}

/**
 * 모든 이벤트 읽음 처리
 */
export function markAllAsRead(): void {
  eventsStore.forEach(e => e.read = true);
}

/**
 * 이벤트 통계
 */
export function getEventStats(since?: number) {
  const events = since 
    ? eventsStore.filter(e => e.timestamp >= since)
    : eventsStore;

  const stats: Record<EventType, number> = {
    USER_SIGNUP: 0,
    PURCHASE: 0,
    REFUND: 0,
    PRODUCT_CREATED: 0,
    REVIEW_CREATED: 0,
    TICKET_CREATED: 0,
    SELLER_APPROVED: 0,
    WITHDRAWAL: 0,
  };

  events.forEach(e => {
    stats[e.type]++;
  });

  const totalRevenue = events
    .filter(e => e.type === "PURCHASE" && e.data.amount)
    .reduce((sum, e) => sum + (e.data.amount || 0), 0);

  const totalRefunds = events
    .filter(e => e.type === "REFUND" && e.data.amount)
    .reduce((sum, e) => sum + (e.data.amount || 0), 0);

  return {
    counts: stats,
    totalEvents: events.length,
    totalRevenue,
    totalRefunds,
    unreadCount: events.filter(e => !e.read).length,
  };
}

// Helper 함수들 - API에서 이벤트 기록 시 사용

/**
 * 신규 가입 이벤트 기록
 */
export function recordSignup(userId: string, userName: string) {
  return recordEvent("USER_SIGNUP", {
    description: `${userName}님이 회원가입했습니다`,
    userId,
    userName,
  });
}

/**
 * 구매 완료 이벤트 기록
 */
export function recordPurchase(
  userId: string,
  userName: string,
  productId: string,
  productTitle: string,
  amount: number
) {
  return recordEvent("PURCHASE", {
    description: `${userName}님이 "${productTitle}"을(를) 구매했습니다`,
    userId,
    userName,
    productId,
    productTitle,
    amount,
  });
}

/**
 * 환불 요청 이벤트 기록
 */
export function recordRefund(
  userId: string,
  userName: string,
  productId: string,
  productTitle: string,
  amount: number
) {
  return recordEvent("REFUND", {
    description: `${userName}님이 "${productTitle}" 환불을 요청했습니다`,
    userId,
    userName,
    productId,
    productTitle,
    amount,
  });
}

/**
 * 상품 등록 이벤트 기록
 */
export function recordProductCreated(
  userId: string,
  userName: string,
  productId: string,
  productTitle: string
) {
  return recordEvent("PRODUCT_CREATED", {
    description: `${userName}님이 "${productTitle}"을(를) 등록했습니다`,
    userId,
    userName,
    productId,
    productTitle,
  });
}

/**
 * 리뷰 작성 이벤트 기록
 */
export function recordReviewCreated(
  userId: string,
  userName: string,
  productId: string,
  productTitle: string
) {
  return recordEvent("REVIEW_CREATED", {
    description: `${userName}님이 "${productTitle}"에 리뷰를 남겼습니다`,
    userId,
    userName,
    productId,
    productTitle,
  });
}

/**
 * 티켓 생성 이벤트 기록
 */
export function recordTicketCreated(
  userId: string,
  userName: string,
  ticketTitle: string
) {
  return recordEvent("TICKET_CREATED", {
    description: `${userName}님이 문의를 등록했습니다: ${ticketTitle}`,
    userId,
    userName,
    metadata: { ticketTitle },
  });
}

/**
 * 출금 요청 이벤트 기록
 */
export function recordWithdrawal(
  userId: string,
  userName: string,
  amount: number
) {
  return recordEvent("WITHDRAWAL", {
    description: `${userName}님이 ${amount.toLocaleString()}원 출금을 요청했습니다`,
    userId,
    userName,
    amount,
  });
}
