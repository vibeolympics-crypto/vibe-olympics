"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "서버 설정 오류",
    description: "인증 서비스 설정에 문제가 있습니다. 관리자에게 문의해주세요.",
  },
  AccessDenied: {
    title: "접근이 거부되었습니다",
    description: "이 리소스에 접근할 권한이 없습니다.",
  },
  Verification: {
    title: "인증 링크 오류",
    description: "인증 링크가 만료되었거나 이미 사용되었습니다.",
  },
  OAuthSignin: {
    title: "OAuth 로그인 오류",
    description: "OAuth 로그인을 시작하는 중 오류가 발생했습니다.",
  },
  OAuthCallback: {
    title: "OAuth 콜백 오류",
    description: "OAuth 제공자로부터 응답을 처리하는 중 오류가 발생했습니다.",
  },
  OAuthCreateAccount: {
    title: "계정 생성 오류",
    description: "OAuth 계정을 생성하는 중 오류가 발생했습니다.",
  },
  EmailCreateAccount: {
    title: "계정 생성 오류",
    description: "이메일 계정을 생성하는 중 오류가 발생했습니다.",
  },
  Callback: {
    title: "콜백 오류",
    description: "인증 콜백을 처리하는 중 오류가 발생했습니다.",
  },
  OAuthAccountNotLinked: {
    title: "계정 연동 오류",
    description:
      "이 이메일은 이미 다른 로그인 방식으로 가입되어 있습니다. 기존 방식으로 로그인해주세요.",
  },
  EmailSignin: {
    title: "이메일 전송 오류",
    description: "인증 이메일을 전송하는 중 오류가 발생했습니다.",
  },
  CredentialsSignin: {
    title: "로그인 실패",
    description: "이메일 또는 비밀번호가 올바르지 않습니다.",
  },
  SessionRequired: {
    title: "로그인 필요",
    description: "이 페이지에 접근하려면 로그인이 필요합니다.",
  },
  Default: {
    title: "인증 오류",
    description: "인증 과정에서 오류가 발생했습니다. 다시 시도해주세요.",
  },
};

export function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center py-12 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[var(--semantic-error)] rounded-full blur-[200px] opacity-10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] via-[var(--accent-violet)] to-[var(--accent-magenta)] flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
          </Link>
        </div>

        <Card variant="glass">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--semantic-error)]/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-[var(--semantic-error)]" />
            </div>

            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              {errorInfo.title}
            </h1>
            <p className="text-[var(--text-tertiary)] mb-6">
              {errorInfo.description}
            </p>

            <div className="flex flex-col gap-3">
              <Link href="/auth/login">
                <Button variant="neon" size="lg" className="w-full gap-2">
                  <RefreshCw className="w-4 h-4" />
                  다시 로그인하기
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  홈으로 돌아가기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center mt-6 text-sm text-[var(--text-tertiary)]">
          문제가 계속되면{" "}
          <Link
            href="/support"
            className="text-[var(--primary)] hover:underline"
          >
            고객 지원
          </Link>
          에 문의해주세요.
        </p>
      </motion.div>
    </div>
  );
}
