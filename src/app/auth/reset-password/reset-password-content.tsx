"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // 토큰 유효성 검증
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setError("유효하지 않은 링크입니다");
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (data.valid) {
          setIsValid(true);
          setEmail(data.email);
        } else {
          setError(data.error || "유효하지 않은 링크입니다");
        }
      } catch {
        setError("토큰 확인 중 오류가 발생했습니다");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // 비밀번호 유효성 검사
  const passwordRequirements = [
    { label: "8자 이상", valid: formData.password.length >= 8 },
    { label: "영문 포함", valid: /[a-zA-Z]/.test(formData.password) },
    { label: "숫자 포함", valid: /[0-9]/.test(formData.password) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.valid);
  const doPasswordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError("비밀번호가 요구사항을 충족하지 않습니다");
      return;
    }

    if (!doPasswordsMatch) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "비밀번호 재설정에 실패했습니다");
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("비밀번호 재설정 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 상태
  if (isValidating) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">링크를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 유효하지 않은 토큰
  if (!isValid && !isSuccess) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[var(--semantic-error)]/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-[var(--semantic-error)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            유효하지 않은 링크
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            {error || "이 비밀번호 재설정 링크는 만료되었거나 이미 사용되었습니다."}
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/auth/forgot-password">
              <Button size="lg" className="w-full">
                새 재설정 링크 받기
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full">
                로그인으로 돌아가기
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // 성공 상태
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 rounded-full bg-[var(--semantic-success)]/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[var(--semantic-success)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            비밀번호가 변경되었습니다!
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            새 비밀번호로 로그인할 수 있습니다.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push("/auth/login")}
          >
            로그인하기
          </Button>
        </motion.div>
      </div>
    );
  }

  // 비밀번호 입력 폼
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
            새 비밀번호 설정
          </h1>
          <p className="text-[var(--text-tertiary)] mt-2">
            {email} 계정의 새 비밀번호를 설정해주세요
          </p>
        </div>

        <Card variant="glass">
          <CardContent className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-[var(--semantic-error)]/10 border border-[var(--semantic-error)]/20 flex items-center gap-2 text-[var(--semantic-error)]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  새 비밀번호
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="새 비밀번호 입력"
                    icon={<Lock className="w-4 h-4" />}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] hover:text-[var(--text-secondary)]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="space-y-2">
                  {passwordRequirements.map((req, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-sm ${
                        req.valid
                          ? "text-[var(--semantic-success)]"
                          : "text-[var(--text-disabled)]"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          req.valid ? "opacity-100" : "opacity-30"
                        }`}
                      />
                      {req.label}
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="비밀번호 다시 입력"
                    icon={<Lock className="w-4 h-4" />}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] hover:text-[var(--text-secondary)]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <p
                    className={`mt-2 text-sm ${
                      doPasswordsMatch
                        ? "text-[var(--semantic-success)]"
                        : "text-[var(--semantic-error)]"
                    }`}
                  >
                    {doPasswordsMatch
                      ? "✓ 비밀번호가 일치합니다"
                      : "✗ 비밀번호가 일치하지 않습니다"}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    처리 중...
                  </span>
                ) : (
                  "비밀번호 변경"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
