"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function ForgotPasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "요청 처리 중 오류가 발생했습니다");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center py-12 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] rounded-full blur-[200px] opacity-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-magenta)] rounded-full blur-[200px] opacity-10" />
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            비밀번호 찾기
          </h1>
          <p className="text-[var(--text-tertiary)] mt-2">
            가입하신 이메일 주소를 입력해주세요
          </p>
        </div>

        <Card variant="glass">
          <CardContent className="p-6">
            {isSubmitted ? (
              // 성공 상태
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--semantic-success)]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[var(--semantic-success)]" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  이메일을 확인해주세요
                </h2>
                <p className="text-[var(--text-secondary)] mb-6">
                  <span className="font-medium text-[var(--text-primary)]">{email}</span>
                  <br />
                  로 비밀번호 재설정 링크를 발송했습니다.
                </p>
                <p className="text-sm text-[var(--text-tertiary)] mb-6">
                  이메일이 도착하지 않았다면 스팸 폴더를 확인해주세요.
                  <br />
                  링크는 1시간 동안 유효합니다.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                    }}
                  >
                    다른 이메일로 시도
                  </Button>
                  <Link href="/auth/login" className="w-full">
                    <Button variant="ghost" size="lg" className="w-full gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      로그인으로 돌아가기
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              // 입력 폼
              <>
                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-3 rounded-lg bg-[var(--semantic-error)]/10 border border-[var(--semantic-error)]/20 flex items-center gap-2 text-[var(--semantic-error)]">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      이메일
                    </label>
                    <Input
                      type="email"
                      placeholder="hello@example.com"
                      icon={<Mail className="w-4 h-4" />}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        처리 중...
                      </span>
                    ) : (
                      "비밀번호 재설정 링크 받기"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/auth/login"
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    로그인으로 돌아가기
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <p className="mt-6 text-center text-sm text-[var(--text-disabled)]">
          GitHub으로 가입하셨나요?{" "}
          <Link
            href="/auth/login"
            className="text-[var(--primary)] hover:underline"
          >
            GitHub 로그인
          </Link>
          을 이용해주세요.
        </p>
      </motion.div>
    </div>
  );
}
