"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatbotProps {
  className?: string;
}

export function AIChatbot({ className }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 초기 환영 메시지
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "안녕하세요! 👋 Vibe Olympics AI 어시스턴트입니다.\n\n상품, 튜토리얼, 사용 방법 등에 대해 궁금한 점이 있으면 편하게 물어보세요!",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  // 스크롤 최하단으로 이동
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 채팅창 열릴 때 입력 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // 메시지 전송
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("응답 실패");
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "죄송합니다, 응답을 생성하지 못했습니다.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "죄송합니다, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 대화 초기화
  const handleClear = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "대화가 초기화되었습니다. 새로운 질문을 해주세요! 😊",
        timestamp: new Date(),
      },
    ]);
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* 채팅 버튼 */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-violet)] text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 채팅창 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-[380px] h-[550px] bg-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--bg-border)] flex flex-col overflow-hidden"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--bg-border)] bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent-violet)]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-violet)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    AI 어시스턴트
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    무엇이든 물어보세요
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  title="대화 초기화"
                  className="p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-2"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* 아바타 */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                      message.role === "user"
                        ? "bg-[var(--primary)]"
                        : "bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-violet)]"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* 메시지 내용 */}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5",
                      message.role === "user"
                        ? "bg-[var(--primary)] text-white rounded-tr-sm"
                        : "bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-tl-sm"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        message.role === "user"
                          ? "text-white/70"
                          : "text-[var(--text-tertiary)]"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* 로딩 상태 */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-violet)] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-[var(--bg-elevated)] rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" />
                      <span className="text-sm text-[var(--text-tertiary)]">
                        생각하는 중...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="p-4 border-t border-[var(--bg-border)]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:border-[var(--primary)] disabled:opacity-50"
                />
                <Button
                  variant="neon"
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)] text-center mt-2">
                AI 응답은 참고용이며, 정확하지 않을 수 있습니다.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
