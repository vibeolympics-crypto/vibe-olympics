"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * 마크다운 콘텐츠 렌더링 컴포넌트
 * 법률 문서 (약관, 환불정책, 개인정보처리방침) 표시용
 */
export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div className={`markdown-legal-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // 제목 스타일
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">
                {String(children).match(/^(\d+)\./)?.[1] || "#"}
              </span>
              {String(children).replace(/^\d+\.\s*/, "")}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-3">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-semibold text-[var(--text-primary)] mt-4 mb-2">
              {children}
            </h4>
          ),

          // 단락
          p: ({ children }) => (
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              {children}
            </p>
          ),

          // 리스트
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 mb-4 ml-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-[var(--text-secondary)] space-y-2 mb-4 ml-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm">
              {children}
            </li>
          ),

          // 테이블
          table: ({ children }) => (
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-[var(--bg-border)]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="text-left py-3 px-4 text-[var(--text-primary)] font-semibold">
              {children}
            </th>
          ),
          tbody: ({ children }) => (
            <tbody className="text-[var(--text-secondary)]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-[var(--bg-border)]">
              {children}
            </tr>
          ),
          td: ({ children }) => (
            <td className="py-3 px-4">
              {children}
            </td>
          ),

          // 블록쿼트 (중요 안내 등)
          blockquote: ({ children }) => (
            <div className="mb-8 p-6 bg-gradient-to-r from-[var(--accent-orange)]/10 to-[var(--accent-red)]/10 rounded-xl border border-[var(--accent-orange)]/30">
              <div className="text-[var(--text-secondary)] [&>p]:mb-2 [&>p:last-child]:mb-0">
                {children}
              </div>
            </div>
          ),

          // 수평선
          hr: () => (
            <hr className="my-8 border-[var(--bg-border)]" />
          ),

          // 링크
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-[var(--primary)] hover:underline"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),

          // 강조
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--text-primary)]">
              {children}
            </strong>
          ),

          // 코드
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 bg-[var(--bg-elevated)] rounded text-sm">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
