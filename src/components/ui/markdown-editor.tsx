"use client";

import { useState, useRef, useCallback } from "react";
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  Minus,
  Eye,
  Edit,
  Columns,
  Youtube,
  FileCode,
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./markdown-renderer";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
}

type ViewMode = "edit" | "preview" | "split";

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  shortcut?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "마크다운으로 작성해주세요...",
  className,
  minHeight = "300px",
  maxHeight = "600px",
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트 삽입 헬퍼
  const insertText = useCallback((before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newValue = 
      value.substring(0, start) + 
      before + textToInsert + after + 
      value.substring(end);
    
    onChange(newValue);

    // 커서 위치 조정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(
        selectedText ? newCursorPos + after.length : start + before.length,
        selectedText ? newCursorPos + after.length : start + before.length + placeholder.length
      );
    }, 0);
  }, [value, onChange]);

  // 줄 시작에 텍스트 삽입
  const insertAtLineStart = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    
    const newValue = 
      value.substring(0, lineStart) + 
      prefix + 
      value.substring(lineStart);
    
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }, [value, onChange]);

  // 툴바 버튼 정의
  const toolbarButtons: (ToolbarButton | "divider")[] = [
    {
      icon: <Heading1 className="w-4 h-4" />,
      label: "제목 1",
      action: () => insertAtLineStart("# "),
      shortcut: "Ctrl+1",
    },
    {
      icon: <Heading2 className="w-4 h-4" />,
      label: "제목 2",
      action: () => insertAtLineStart("## "),
      shortcut: "Ctrl+2",
    },
    {
      icon: <Heading3 className="w-4 h-4" />,
      label: "제목 3",
      action: () => insertAtLineStart("### "),
      shortcut: "Ctrl+3",
    },
    "divider",
    {
      icon: <Bold className="w-4 h-4" />,
      label: "굵게",
      action: () => insertText("**", "**", "굵은 텍스트"),
      shortcut: "Ctrl+B",
    },
    {
      icon: <Italic className="w-4 h-4" />,
      label: "기울임",
      action: () => insertText("*", "*", "기울인 텍스트"),
      shortcut: "Ctrl+I",
    },
    {
      icon: <Strikethrough className="w-4 h-4" />,
      label: "취소선",
      action: () => insertText("~~", "~~", "취소선 텍스트"),
    },
    "divider",
    {
      icon: <List className="w-4 h-4" />,
      label: "목록",
      action: () => insertAtLineStart("- "),
    },
    {
      icon: <ListOrdered className="w-4 h-4" />,
      label: "순서 목록",
      action: () => insertAtLineStart("1. "),
    },
    {
      icon: <Quote className="w-4 h-4" />,
      label: "인용",
      action: () => insertAtLineStart("> "),
    },
    "divider",
    {
      icon: <Code className="w-4 h-4" />,
      label: "인라인 코드",
      action: () => insertText("`", "`", "코드"),
    },
    {
      icon: <FileCode className="w-4 h-4" />,
      label: "코드 블록",
      action: () => insertText("\n```\n", "\n```\n", "코드를 입력하세요"),
    },
    "divider",
    {
      icon: <Link className="w-4 h-4" />,
      label: "링크",
      action: () => insertText("[", "](URL)", "링크 텍스트"),
      shortcut: "Ctrl+K",
    },
    {
      icon: <Image className="w-4 h-4" />,
      label: "이미지",
      action: () => insertText("![", "](이미지 URL)", "이미지 설명"),
    },
    {
      icon: <Youtube className="w-4 h-4" />,
      label: "유튜브 영상",
      action: () => insertText("\nhttps://www.youtube.com/watch?v=", "", "VIDEO_ID"),
    },
    "divider",
    {
      icon: <Minus className="w-4 h-4" />,
      label: "구분선",
      action: () => insertText("\n---\n", ""),
    },
  ];

  // 키보드 단축키 처리
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          insertText("**", "**", "굵은 텍스트");
          break;
        case "i":
          e.preventDefault();
          insertText("*", "*", "기울인 텍스트");
          break;
        case "k":
          e.preventDefault();
          insertText("[", "](URL)", "링크 텍스트");
          break;
        case "1":
          e.preventDefault();
          insertAtLineStart("# ");
          break;
        case "2":
          e.preventDefault();
          insertAtLineStart("## ");
          break;
        case "3":
          e.preventDefault();
          insertAtLineStart("### ");
          break;
      }
    }
  }, [insertText, insertAtLineStart]);

  return (
    <div className={cn("border border-[var(--bg-border)] rounded-lg overflow-hidden", className)}>
      {/* 툴바 */}
      <div className="flex items-center justify-between border-b border-[var(--bg-border)] bg-[var(--bg-elevated)] px-2 py-1">
        <div className="flex items-center gap-1 flex-wrap">
          {toolbarButtons.map((button, index) => 
            button === "divider" ? (
              <div 
                key={`divider-${index}`} 
                className="w-px h-5 bg-[var(--bg-border)] mx-1" 
              />
            ) : (
              <Button
                key={button.label}
                type="button"
                variant="ghost"
                size="sm"
                onClick={button.action}
                title={button.shortcut ? `${button.label} (${button.shortcut})` : button.label}
                className="p-1.5 h-7 w-7"
              >
                {button.icon}
              </Button>
            )
          )}
        </div>

        {/* 뷰 모드 전환 */}
        <div className="flex items-center gap-1 border-l border-[var(--bg-border)] pl-2 ml-2">
          <Button
            type="button"
            variant={viewMode === "edit" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("edit")}
            title="편집"
            className="p-1.5 h-7"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "split" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("split")}
            title="분할"
            className="p-1.5 h-7"
          >
            <Columns className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("preview")}
            title="미리보기"
            className="p-1.5 h-7"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 에디터 영역 */}
      <div 
        className={cn(
          "flex",
          viewMode === "split" ? "divide-x divide-[var(--bg-border)]" : ""
        )}
        style={{ minHeight, maxHeight }}
      >
        {/* 편집 영역 */}
        {viewMode !== "preview" && (
          <div className={cn("flex-1", viewMode === "split" ? "w-1/2" : "w-full")}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "w-full h-full p-4 resize-none",
                "bg-transparent text-[var(--text-primary)]",
                "placeholder:text-[var(--text-tertiary)]",
                "focus:outline-none",
                "font-mono text-sm leading-relaxed"
              )}
              style={{ minHeight, maxHeight }}
            />
          </div>
        )}

        {/* 미리보기 영역 */}
        {viewMode !== "edit" && (
          <div 
            className={cn(
              "flex-1 overflow-auto p-4 bg-[var(--bg-primary)]",
              viewMode === "split" ? "w-1/2" : "w-full"
            )}
            style={{ minHeight, maxHeight }}
          >
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-[var(--text-tertiary)] italic">
                미리보기가 여기에 표시됩니다
              </p>
            )}
          </div>
        )}
      </div>

      {/* 하단 정보 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--bg-border)] bg-[var(--bg-elevated)] text-xs text-[var(--text-tertiary)]">
        <span>마크다운 문법 지원 • 유튜브/비메오 링크 자동 임베드</span>
        <span>{value.length.toLocaleString()} 자</span>
      </div>
    </div>
  );
}
