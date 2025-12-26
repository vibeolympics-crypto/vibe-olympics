"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import {
  Github,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { trackSignUp } from "@/components/providers";

const passwordRequirements = [
  { id: "length", label: "8자 이상", check: (p: string) => p.length >= 8 },
  { id: "letter", label: "영문 포함", check: (p: string) => /[a-zA-Z]/.test(p) },
  { id: "number", label: "숫자 포함", check: (p: string) => /[0-9]/.test(p) },
];

export function SignupContent() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const isPasswordValid = passwordRequirements.every((req) =>
    req.check(formData.password)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;
    if (!isPasswordValid) {
      setError("비밀번호 조건을 모두 충족해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      // GA4: sign_up 이벤트 트래킹
      trackSignUp("credentials");

      router.push("/auth/login?signup=success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSignup = () => {
    // GA4: sign_up 이벤트 트래킹 (GitHub OAuth)
    trackSignUp("github");
    signIn("github", { callbackUrl: "/" });
  };

  const handleGoogleSignup = () => {
    // GA4: sign_up 이벤트 트래킹 (Google OAuth)
    trackSignUp("google");
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center py-12 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--accent-cyan)] rounded-full blur-[200px] opacity-10" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[var(--accent-violet)] rounded-full blur-[200px] opacity-10" />
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
            창작의 여정을 시작하세요
          </h1>
          <p className="text-[var(--text-tertiary)] mt-2">
            무료 가입, 쉬운 시작
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

            {/* Social Login */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3"
                onClick={handleGitHubSignup}
              >
                <Github className="w-5 h-5" />
                GitHub으로 시작하기
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3"
                onClick={handleGoogleSignup}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 시작하기
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--bg-border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[var(--bg-surface)] text-[var(--text-disabled)]">
                  또는 이메일로 가입
                </span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  이름
                </label>
                <Input
                  type="text"
                  placeholder="홍길동"
                  icon={<User className="w-4 h-4" />}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  이메일
                </label>
                <Input
                  type="email"
                  placeholder="hello@example.com"
                  icon={<Mail className="w-4 h-4" />}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] hover:text-[var(--text-tertiary)]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="flex gap-3 mt-2">
                    {passwordRequirements.map((req) => {
                      const passed = req.check(formData.password);
                      return (
                        <span
                          key={req.id}
                          className={cn(
                            "text-xs flex items-center gap-1",
                            passed
                              ? "text-[var(--accent-green)]"
                              : "text-[var(--text-disabled)]"
                          )}
                        >
                          <Check
                            className={cn(
                              "w-3 h-3",
                              passed ? "opacity-100" : "opacity-30"
                            )}
                          />
                          {req.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-[var(--bg-border)] bg-[var(--bg-surface)] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-offset-0"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-[var(--text-tertiary)]"
                >
                  <Link
                    href="/terms"
                    className="text-[var(--primary)] hover:underline"
                  >
                    이용약관
                  </Link>{" "}
                  및{" "}
                  <Link
                    href="/privacy"
                    className="text-[var(--primary)] hover:underline"
                  >
                    개인정보처리방침
                  </Link>
                  에 동의합니다
                </label>
              </div>

              <Button
                type="submit"
                variant="neon"
                size="lg"
                className="w-full mt-6"
                isLoading={isLoading}
                disabled={!agreedToTerms}
              >
                회원가입
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <p className="text-center mt-6 text-[var(--text-tertiary)]">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/auth/login"
            className="text-[var(--primary)] font-medium hover:underline"
          >
            로그인
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
