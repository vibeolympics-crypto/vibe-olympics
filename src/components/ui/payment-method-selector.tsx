"use client";

import { useState } from "react";
import { X, CreditCard, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";

export type PaymentMethod = "CARD" | "KAKAOPAY" | "TOSSPAY" | "STRIPE";

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
}

interface PaymentMethodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
  productName: string;
  price: number;
  isLoading?: boolean;
}

const paymentMethodOptions: PaymentMethodOption[] = [
  {
    id: "STRIPE",
    name: "신용/체크카드 (해외)",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
      </svg>
    ),
    description: "Visa, Mastercard, AMEX 등",
    available: true,
  },
  {
    id: "KAKAOPAY",
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
    id: "TOSSPAY",
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
    id: "CARD",
    name: "국내 카드 결제",
    icon: <CreditCard className="w-6 h-6" />,
    description: "국내 신용/체크카드",
    available: true,
  },
];

export function PaymentMethodSelector({
  isOpen,
  onClose,
  onSelect,
  productName,
  price,
  isLoading = false,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

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
              <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
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
