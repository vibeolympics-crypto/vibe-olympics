"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { List, ChevronRight } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
  className?: string;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    // 모든 헤딩 요소 관찰
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
        <List className="w-4 h-4" />
        <span>목차</span>
      </div>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              onClick={() => handleClick(heading.id)}
              className={cn(
                "w-full text-left text-sm py-1 px-2 rounded transition-colors flex items-center gap-1",
                heading.level === 3 && "ml-4",
                activeId === heading.id
                  ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              )}
            >
              {heading.level === 2 && (
                <ChevronRight
                  className={cn(
                    "w-3 h-3 transition-transform",
                    activeId === heading.id && "rotate-90"
                  )}
                />
              )}
              <span className="line-clamp-1">{heading.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// 컴팩트 버전 (모바일/상단용)
interface CompactTableOfContentsProps {
  headings: Heading[];
  className?: string;
}

export function CompactTableOfContents({
  headings,
  className,
}: CompactTableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (headings.length === 0) {
    return null;
  }

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
      >
        <List className="w-4 h-4" />
        <span>목차</span>
        <ChevronRight
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-90"
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 z-50 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg shadow-lg py-2 min-w-[200px] max-h-[60vh] overflow-y-auto">
            {headings.map((heading) => (
              <button
                key={heading.id}
                onClick={() => handleClick(heading.id)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-elevated)] transition-colors",
                  heading.level === 3 && "pl-8",
                  "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {heading.text}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
