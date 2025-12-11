"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, ShoppingBag, X, Volume2, VolumeX } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SaleNotification {
  id: string;
  productId: string;
  productTitle: string;
  productThumbnail?: string;
  buyerName: string;
  price: number;
  quantity: number;
  createdAt: string;
}

interface RealtimeSalesWidgetProps {
  userId: string;
  maxItems?: number;
}

export function RealtimeSalesWidget({
  userId,
  maxItems = 5,
}: RealtimeSalesWidgetProps) {
  const [sales, setSales] = useState<SaleNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const { getSocket, isConnected } = useSocket();
  const socket = getSocket();

  // 알림음 재생
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && typeof window !== "undefined") {
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {
          // 자동 재생 차단 시 무시
        });
      } catch {
        // 오디오 재생 실패 시 무시
      }
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!socket) return;

    const handleNewSale = (sale: SaleNotification) => {
      setSales((prev) => {
        const newSales = [sale, ...prev].slice(0, maxItems);
        return newSales;
      });
      playNotificationSound();
    };

    socket.on("sale:new", handleNewSale);

    return () => {
      socket.off("sale:new", handleNewSale);
    };
  }, [socket, maxItems, playNotificationSound]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return date.toLocaleDateString("ko-KR");
  };

  const removeSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
  };

  if (sales.length === 0 && !isConnected) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[var(--bg-border)]">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-semibold">실시간 판매</h3>
          {isConnected && (
            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30">
              연결됨
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "알림음 끄기" : "알림음 켜기"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "접기" : "펼치기"}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="divide-y divide-[var(--bg-border)]">
          {sales.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>새로운 판매가 발생하면 여기에 표시됩니다</p>
            </div>
          ) : (
            sales.map((sale) => (
              <div
                key={sale.id}
                className="p-4 flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors animate-in slide-in-from-top-2"
              >
                <div className="w-12 h-12 rounded-lg bg-[var(--bg-secondary)] overflow-hidden flex-shrink-0">
                  {sale.productThumbnail ? (
                    <Image
                      src={sale.productThumbnail}
                      alt={sale.productTitle}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-[var(--text-secondary)]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/marketplace/${sale.productId}`}
                    className="font-medium hover:text-[var(--primary)] truncate block"
                  >
                    {sale.productTitle}
                  </Link>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {sale.buyerName}님이 구매
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-[var(--semantic-success)]">
                    {formatCurrency(sale.price)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {formatTime(sale.createdAt)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-50 hover:opacity-100"
                  onClick={() => removeSale(sale.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
