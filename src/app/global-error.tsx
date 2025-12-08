"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
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
    <html>
      <body>
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-[var(--accent-red)]/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-[var(--accent-red)]" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
              문제가 발생했습니다
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              예상치 못한 오류가 발생했습니다. 문제가 지속되면 고객 지원팀에 문의해 주세요.
            </p>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mb-8 p-4 bg-[var(--bg-surface)] rounded-lg text-left">
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
                  <Home className="w-4 h-4 mr-2" />
                  홈으로 이동
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
