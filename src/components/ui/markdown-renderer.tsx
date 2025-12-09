"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import { VideoEmbed } from "./video-embed";

// 코드 하이라이팅 스타일 (다크 테마)
import "highlight.js/styles/github-dark.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // 제목 스타일링
          h1: ({ children, ...props }) => (
            <h1
              className="text-3xl font-bold text-[var(--text-primary)] mt-8 mb-4 first:mt-0"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              id={typeof children === "string" ? children.toString().toLowerCase().replace(/\s+/g, "-") : undefined}
              className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4 pb-2 border-b border-[var(--bg-border)] scroll-mt-20"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              id={typeof children === "string" ? children.toString().toLowerCase().replace(/\s+/g, "-") : undefined}
              className="text-xl font-semibold text-[var(--text-primary)] mt-6 mb-3 scroll-mt-20"
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              className="text-lg font-medium text-[var(--text-primary)] mt-4 mb-2"
              {...props}
            >
              {children}
            </h4>
          ),

          // 문단
          p: ({ children, node: _node, ...props }) => {
            // 영상 URL 감지 (YouTube, Vimeo)
            const text = typeof children === "string" ? children : "";
            const youtubeMatch = text.match(
              /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
            );
            const vimeoMatch = text.match(
              /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/
            );

            if (youtubeMatch) {
              return <VideoEmbed type="youtube" videoId={youtubeMatch[1]} />;
            }
            if (vimeoMatch) {
              return <VideoEmbed type="vimeo" videoId={vimeoMatch[1]} />;
            }

            return (
              <p
                className="text-[var(--text-secondary)] leading-relaxed mb-4"
                {...props}
              >
                {children}
              </p>
            );
          },

          // 리스트
          ul: ({ children, ...props }) => (
            <ul
              className="list-disc list-inside text-[var(--text-secondary)] mb-4 ml-4 space-y-1"
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              className="list-decimal list-inside text-[var(--text-secondary)] mb-4 ml-4 space-y-1"
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-[var(--text-secondary)]" {...props}>
              {children}
            </li>
          ),

          // 인용문
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-[var(--primary)] pl-4 py-2 my-4 bg-[var(--bg-elevated)] rounded-r-lg italic text-[var(--text-tertiary)]"
              {...props}
            >
              {children}
            </blockquote>
          ),

          // 코드
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            
            if (isInline) {
              return (
                <code
                  className="bg-[var(--bg-elevated)] text-[var(--accent-pink)] px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code className={cn(className, "text-sm")} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre
              className="bg-[var(--bg-elevated)] rounded-lg p-4 overflow-x-auto mb-4 border border-[var(--bg-border)]"
              {...props}
            >
              {children}
            </pre>
          ),

          // 링크
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-[var(--primary)] hover:underline"
              {...props}
            >
              {children}
            </a>
          ),

          // 이미지
          img: ({ src, alt, ...props }) => (
            <figure className="my-6">
              { }
              <img
                src={src}
                alt={alt || ""}
                className="rounded-lg max-w-full h-auto mx-auto"
                loading="lazy"
                {...props}
              />
              {alt && (
                <figcaption className="text-center text-sm text-[var(--text-tertiary)] mt-2">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),

          // 테이블
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table
                className="min-w-full border-collapse border border-[var(--bg-border)] rounded-lg"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-[var(--bg-elevated)]" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th
              className="px-4 py-2 text-left text-sm font-semibold text-[var(--text-primary)] border border-[var(--bg-border)]"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className="px-4 py-2 text-sm text-[var(--text-secondary)] border border-[var(--bg-border)]"
              {...props}
            >
              {children}
            </td>
          ),

          // 구분선
          hr: ({ ...props }) => (
            <hr
              className="my-8 border-t border-[var(--bg-border)]"
              {...props}
            />
          ),

          // 체크박스 (GFM)
          input: ({ type, checked, ...props }) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 accent-[var(--primary)]"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// 마크다운에서 제목 추출 (목차 생성용)
export function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }
  
  return headings;
}
