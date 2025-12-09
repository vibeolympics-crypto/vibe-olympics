"use client";

import { useState } from "react";
import { X, CreditCard, Loader2, Smartphone, Building2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import type { BootpayPaymentMethod } from "@/lib/bootpay";

interface PaymentMethodOption {
  id: BootpayPaymentMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
}

interface BootpayPaymentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (method: BootpayPaymentMethod) => void;
  productName: string;
  price: number;
  isLoading?: boolean;
}

const paymentMethodOptions: PaymentMethodOption[] = [
  {
    id: "card",
    name: "신용/체크카드",
    icon: <CreditCard className="w-6 h-6" />,
    description: "모든 국내 카드 결제 가능",
    available: true,
  },
  {
    id: "kakao",
    name: "카카오페이",
    icon: (
      <div className="w-6 h-6 bg-[#FEE500] rounded flex items-center justify-center">
        <span className="text-black text-xs font-bold">K</span>
      </div>
    ),
    description: "카카오페이로 간편 결제",
    available: true,
  },
  {
    id: "naver",
    name: "네이버페이",
    icon: (
      <div className="w-6 h-6 bg-[#03C75A] rounded flex items-center justify-center">
        <span className="text-white text-xs font-bold">N</span>
      </div>
    ),
    description: "네이버페이로 간편 결제",
    available: true,
  },
  {
    id: "toss",
    name: "토스페이",
    icon: (
      <div className="w-6 h-6 bg-[#0064FF] rounded flex items-center justify-center">
        <span className="text-white text-xs font-bold">T</span>
      </div>
    ),
    description: "토스페이로 간편 결제",
    available: true,
  },
  {
    id: "phone",
    name: "휴대폰 결제",
    icon: <Smartphone className="w-6 h-6" />,
    description: "휴대폰 소액결제",
    available: true,
  },
  {
    id: "bank",
    name: "계좌이체",
    icon: <Building2 className="w-6 h-6" />,
    description: "실시간 계좌이체",
    available: true,
  },
  {
    id: "vbank",
    name: "가상계좌",
    icon: <FileText className="w-6 h-6" />,
    description: "가상계좌 입금",
    available: true,
  },
];

export function BootpayPaymentSelector({
  isOpen,
  onClose,
  onSelect,
  productName,
  price,
  isLoading = false,
}: BootpayPaymentSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<BootpayPaymentMethod | null>(null);

  const handleConfirm = () => {
    if (selectedMethod) {
      onSelect(selectedMethod);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
          >
            <Card className="bg-[var(--bg-surface)] border-[var(--bg-border)] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--bg-border)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  결제 수단 선택
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--bg-border)]">
                <p className="text-sm text-[var(--text-secondary)] mb-1">구매 상품</p>
                <p className="font-medium text-[var(--text-primary)] line-clamp-1">
                  {productName}
                </p>
                <p className="text-xl font-bold text-[var(--primary)] mt-2">
                  {formatPrice(price)}
                </p>
              </div>

              {/* Payment Methods */}
              <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto">
                {paymentMethodOptions.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    disabled={!method.available || isLoading}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 transition-all text-left",
                      "flex items-center gap-4",
                      selectedMethod === method.id
                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                        : "border-[var(--bg-border)] hover:border-[var(--text-tertiary)]",
                      !method.available && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex-shrink-0 text-[var(--text-primary)]">
                      {method.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)]">
                        {method.name}
                      </p>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        {method.description}
                      </p>
                    </div>
                    {selectedMethod === method.id && (
                      <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[var(--bg-border)]">
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedMethod || isLoading}
                  variant="neon"
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      결제 처리 중...
                    </>
                  ) : (
                    `${formatPrice(price)} 결제하기`
                  )}
                </Button>
                <p className="text-xs text-[var(--text-disabled)] text-center mt-3">
                  결제 진행 시 서비스 이용약관에 동의하는 것으로 간주됩니다.
                </p>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
