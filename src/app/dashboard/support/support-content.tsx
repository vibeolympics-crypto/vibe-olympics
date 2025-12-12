"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  ChevronRight,
  User,
  Calendar,
  Tag,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// 티켓 타입 정의
interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  email: string;
  name: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  messageCount: number;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

// 상태별 스타일
const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "outline"; icon: React.ReactNode }> = {
  OPEN: { label: "접수됨", variant: "default", icon: <AlertCircle className="w-3 h-3" /> },
  IN_PROGRESS: { label: "처리 중", variant: "warning", icon: <Clock className="w-3 h-3" /> },
  WAITING: { label: "응답 대기", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
  RESOLVED: { label: "해결됨", variant: "success", icon: <CheckCircle className="w-3 h-3" /> },
  CLOSED: { label: "종료됨", variant: "outline", icon: <CheckCircle className="w-3 h-3" /> },
};

// 우선순위별 스타일
const priorityStyles: Record<string, { label: string; color: string }> = {
  LOW: { label: "낮음", color: "text-gray-500" },
  NORMAL: { label: "보통", color: "text-blue-500" },
  HIGH: { label: "높음", color: "text-orange-500" },
  URGENT: { label: "긴급", color: "text-red-500" },
};

// 카테고리별 라벨
const categoryLabels: Record<string, string> = {
  GENERAL: "일반 문의",
  ORDER: "주문/결제",
  REFUND: "환불 요청",
  PRODUCT: "상품 문의",
  ACCOUNT: "계정 문의",
  TECHNICAL: "기술 지원",
  REPORT: "신고",
  SELLER: "판매자 문의",
  OTHER: "기타",
};

export default function SupportTicketsContent() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<Record<string, number> | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 필터 상태
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    search: "",
  });

  // 새 티켓 모달 상태
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  // 티켓 목록 불러오기
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      
      if (filters.status) params.set("status", filters.status);
      if (filters.category) params.set("category", filters.category);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/support/tickets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch tickets");
      
      const data = await res.json();
      setTickets(data.tickets || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
      setStatusCounts(data.statusCounts);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // 필터 변경 핸들러
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">고객 지원</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            문의 및 지원 요청을 관리합니다
          </p>
        </div>
        <Button onClick={() => setShowNewTicket(true)}>
          <Plus className="w-4 h-4 mr-2" />
          새 문의
        </Button>
      </div>

      {/* 상태별 카운트 (관리자용) */}
      {statusCounts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(statusStyles).map(([status, style]) => (
            <button
              key={status}
              onClick={() => handleFilterChange("status", filters.status === status ? "" : status)}
              className={`p-4 rounded-lg border transition-colors ${
                filters.status === status
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {style.icon}
                <span>{style.label}</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {statusCounts[status] || 0}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 필터 & 검색 */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="제목 또는 이메일로 검색..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
        </form>
        
        <div className="flex gap-2">
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger className="w-[140px]">
              <Tag className="w-4 h-4 mr-2" />
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority}
            onValueChange={(value) => handleFilterChange("priority", value)}
          >
            <SelectTrigger className="w-[120px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="우선순위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {Object.entries(priorityStyles).map(([key, style]) => (
                <SelectItem key={key} value={key}>{style.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filters.status || filters.category || filters.priority || filters.search) && (
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ status: "", category: "", priority: "", search: "" });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              초기화
            </Button>
          )}
        </div>
      </div>

      {/* 티켓 목록 */}
      <div className="border rounded-lg divide-y dark:border-gray-800 dark:divide-gray-800">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            로딩 중...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700" />
            <h3 className="mt-4 text-lg font-medium">문의 내역이 없습니다</h3>
            <p className="mt-2 text-gray-500">
              새로운 문의를 등록해주세요.
            </p>
            <Button className="mt-4" onClick={() => setShowNewTicket(true)}>
              <Plus className="w-4 h-4 mr-2" />
              새 문의 등록
            </Button>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicket(ticket.id)}
            />
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            총 {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}개
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* 새 티켓 모달 */}
      {showNewTicket && (
        <NewTicketModal
          onClose={() => setShowNewTicket(false)}
          onSuccess={() => {
            setShowNewTicket(false);
            fetchTickets();
          }}
        />
      )}

      {/* 티켓 상세 모달 */}
      {selectedTicket && (
        <TicketDetailModal
          ticketId={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={fetchTickets}
        />
      )}
    </div>
  );
}

// 티켓 행 컴포넌트
function TicketRow({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const status = statusStyles[ticket.status] || statusStyles.OPEN;
  const priority = priorityStyles[ticket.priority] || priorityStyles.NORMAL;

  return (
    <button
      onClick={onClick}
      className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={status.variant} className="flex items-center gap-1">
              {status.icon}
              {status.label}
            </Badge>
            <span className={`text-xs font-medium ${priority.color}`}>
              {priority.label}
            </span>
            <span className="text-xs text-gray-400">
              #{ticket.id.slice(-6).toUpperCase()}
            </span>
          </div>
          
          <h3 className="font-medium truncate">{ticket.subject}</h3>
          
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {categoryLabels[ticket.category] || ticket.category}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {ticket.user?.name || ticket.name || ticket.email}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {ticket.messageCount}개 메시지
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ko })}
            </span>
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
      </div>
    </button>
  );
}

// 새 티켓 모달
function NewTicketModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "GENERAL",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.subject.length < 5) {
      alert("제목은 5자 이상 입력해주세요.");
      return;
    }
    if (form.message.length < 10) {
      alert("내용은 10자 이상 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "문의 등록에 실패했습니다");
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to create ticket:", error);
      alert(error instanceof Error ? error.message : "문의 등록에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-950 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">새 문의 등록</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">카테고리</label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">제목</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="문의 제목을 입력해주세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">내용</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="문의 내용을 상세히 작성해주세요"
                className="w-full h-40 px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-900 dark:border-gray-800"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "등록 중..." : "문의 등록"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 티켓 상세 모달
function TicketDetailModal({
  ticketId,
  onClose,
  onUpdate,
}: {
  ticketId: string;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // 티켓 상세 불러오기
  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(`/api/support/tickets/${ticketId}`);
        if (!res.ok) throw new Error("Failed to fetch ticket");
        const data = await res.json();
        setTicket(data.ticket);
      } catch (error) {
        console.error("Failed to fetch ticket:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [ticketId]);

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      // 티켓 다시 불러오기
      const ticketRes = await fetch(`/api/support/tickets/${ticketId}`);
      const data = await ticketRes.json();
      setTicket(data.ticket);
      setNewMessage("");
      onUpdate();
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("메시지 전송에 실패했습니다");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-950 rounded-lg p-8">
          로딩 중...
        </div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const status = statusStyles[ticket.status] || statusStyles.OPEN;
  const priority = priorityStyles[ticket.priority] || priorityStyles.NORMAL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-950 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={status.variant} className="flex items-center gap-1">
              {status.icon}
              {status.label}
            </Badge>
            <span className={`text-xs font-medium ${priority.color}`}>
              {priority.label}
            </span>
            <span className="text-xs text-gray-400">
              #{ticket.id.slice(-6).toUpperCase()}
            </span>
          </div>
          <h2 className="text-lg font-bold">{ticket.subject}</h2>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span>{categoryLabels[ticket.category]}</span>
            <span>•</span>
            <span>{ticket.user?.name || ticket.name || ticket.email}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ko })}</span>
          </div>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {ticket.messages?.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.isStaff ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.isStaff
                    ? "bg-gray-100 dark:bg-gray-800"
                    : "bg-primary text-white"
                }`}
              >
                <div className="text-xs opacity-70 mb-1">
                  {msg.isStaff ? "운영팀" : msg.user?.name || "나"}
                  {" • "}
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ko })}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 메시지 입력 */}
        {ticket.status !== "CLOSED" && (
          <div className="p-4 border-t dark:border-gray-800">
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-3 py-2 border rounded-lg resize-none h-20 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-900 dark:border-gray-800"
              />
              <Button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                className="self-end"
              >
                {sending ? "전송 중..." : "전송"}
              </Button>
            </div>
          </div>
        )}

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
