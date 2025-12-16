"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [purchaseInfo, setPurchaseInfo] = useState<{
    purchaseId?: string;
    productTitle?: string;
  }>({});

  const paymentId = searchParams.get("paymentId");
  const productId = searchParams.get("productId");

  const verifyPayment = useCallback(async () => {
    try {
      const response = await fetch("/api/payment/portone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          productId
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationStatus("success");
        setPurchaseInfo({
          purchaseId: data.purchaseId,
          productTitle: data.productTitle,
        });
      } else {
        setVerificationStatus("error");
        setErrorMessage(data.error || "결제 확인에 실패했습니다.");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setVerificationStatus("error");
      setErrorMessage("결제 확인 중 오류가 발생했습니다.");
    }
  }, [paymentId, productId]);

  useEffect(() => {
    // 세션 로딩 중이면 대기
    if (status === "loading") return;

    // 로그인 필요
    if (!session) {
      router.push("/auth/login?callbackUrl=" + encodeURIComponent(window.location.href));
      return;
    }

    // 결제 ID 없으면 에러
    if (!paymentId) {
      setVerificationStatus("error");
      setErrorMessage("결제 정보가 없습니다.");
      return;
    }

    // 결제 검증
    verifyPayment();
  }, [session, status, paymentId, router, verifyPayment]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card variant="glass">
          <CardContent className="p-8 text-center">
            {verificationStatus === "loading" && (
              <>
                <div className="mb-6">
                  <Loader2 className="w-16 h-16 mx-auto text-[var(--accent-primary)] animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  결제 확인 중...
                </h1>
                <p className="text-[var(--text-secondary)]">
                  결제 정보를 확인하고 있습니다. 잠시만 기다려주세요.
                </p>
              </>
            )}

            {verificationStatus === "success" && (
              <>
                <div className="mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                  >
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                  </motion.div>
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  결제 완료! 🎉
                </h1>
                <p className="text-[var(--text-secondary)] mb-6">
                  {purchaseInfo.productTitle 
                    ? `"${purchaseInfo.productTitle}" 구매가 완료되었습니다.`
                    : "구매가 성공적으로 완료되었습니다."}
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push("/dashboard/purchases")}
                    className="w-full"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    구매 내역 보기
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/marketplace")}
                    className="w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    판도라 샵으로 돌아가기
                  </Button>
                </div>
              </>
            )}

            {verificationStatus === "error" && (
              <>
                <div className="mb-6">
                  <XCircle className="w-16 h-16 mx-auto text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  결제 확인 실패
                </h1>
                <p className="text-[var(--text-secondary)] mb-6">
                  {errorMessage}
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push("/marketplace")}
                    className="w-full"
                  >
                    판도라 샵으로 돌아가기
                  </Button>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    문제가 계속되면{" "}
                    <a href="/faq" className="text-[var(--accent-primary)] hover:underline">
                      고객센터
                    </a>
                    에 문의해주세요.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function CheckoutConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
