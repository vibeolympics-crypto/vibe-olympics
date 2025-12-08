"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-[var(--accent-red)]/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-[var(--accent-red)]" />
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
          오류가 발생했습니다
        </h2>
        <p className="text-[var(--text-secondary)] mb-8">
          페이지를 로드하는 중 문제가 발생했습니다. 다시 시도해 주세요.
        </p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-8 p-4 bg-[var(--bg-surface)] rounded-lg text-left border border-[var(--bg-border)]">
            <p className="text-sm font-mono text-[var(--accent-red)] break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전 페이지
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
