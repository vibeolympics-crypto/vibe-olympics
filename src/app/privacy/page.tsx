import { Shield, ChevronLeft, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { getLegalDocument, extractMetadata } from "@/lib/markdown";

export const metadata = {
  title: "개인정보처리방침 | Vibe Olympics",
  description: "Vibe Olympics 개인정보처리방침",
};

export default function PrivacyPage() {
  const content = getLegalDocument("privacy");
  const { title, lastModified } = extractMetadata(content);

  // 첫 번째 제목과 최종 수정일 라인 제거 (헤더에서 별도로 표시)
  const bodyContent = content
    .replace(/^# .+\n/, "")
    .replace(/\*\*최종 수정일:.+\*\*\n/, "")
    .replace(/---\n/, "");

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--bg-border)]">
        <div className="container-app py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" />
              홈으로
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-green)] to-[var(--accent-cyan)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {title || "개인정보처리방침"}
              </h1>
              {lastModified && (
                <p className="text-sm text-[var(--text-tertiary)]">
                  최종 수정일: {lastModified}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-app py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--bg-surface)] rounded-xl p-8 border border-[var(--bg-border)]">
            <MarkdownContent content={bodyContent} />
          </div>

          {/* Contact */}
          <div className="mt-12 p-6 bg-[var(--bg-elevated)] rounded-xl border border-[var(--bg-border)]">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold text-[var(--text-primary)]">문의하기</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              개인정보처리방침에 대한 문의사항이 있으시면 아래 이메일로 연락해 주세요.
            </p>
            <a
              href="mailto:privacy@vibeolympics.com"
              className="text-[var(--primary)] hover:underline text-sm"
            >
              privacy@vibeolympics.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
