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
  LucideIcon,
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

// 툴바 버튼 액션 타입
type ToolbarActionType = 
  | { type: "insertText"; before: string; after: string; placeholder: string }
  | { type: "insertAtLineStart"; prefix: string };

interface ToolbarButtonDef {
  Icon: LucideIcon;
  label: string;
  actionDef: ToolbarActionType;
  shortcut?: string;
}

// 정적 툴바 버튼 정의 (컴포넌트 외부에서 정의하여 렌더링 시 ref 접근 방지)
const TOOLBAR_BUTTONS: (ToolbarButtonDef | "divider")[] = [
  {
    Icon: Heading1,
    label: "제목 1",
    actionDef: { type: "insertAtLineStart", prefix: "# " },
    shortcut: "Ctrl+1",
  },
  {
    Icon: Heading2,
    label: "제목 2",
    actionDef: { type: "insertAtLineStart", prefix: "## " },
    shortcut: "Ctrl+2",
  },
  {
    Icon: Heading3,
    label: "제목 3",
    actionDef: { type: "insertAtLineStart", prefix: "### " },
    shortcut: "Ctrl+3",
  },
  "divider",
  {
    Icon: Bold,
    label: "굵게",
    actionDef: { type: "insertText", before: "**", after: "**", placeholder: "굵은 텍스트" },
    shortcut: "Ctrl+B",
  },
  {
    Icon: Italic,
    label: "기울임",
    actionDef: { type: "insertText", before: "*", after: "*", placeholder: "기울인 텍스트" },
    shortcut: "Ctrl+I",
  },
  {
    Icon: Strikethrough,
    label: "취소선",
    actionDef: { type: "insertText", before: "~~", after: "~~", placeholder: "취소선 텍스트" },
  },
  "divider",
  {
    Icon: List,
    label: "목록",
    actionDef: { type: "insertAtLineStart", prefix: "- " },
  },
  {
    Icon: ListOrdered,
    label: "순서 목록",
    actionDef: { type: "insertAtLineStart", prefix: "1. " },
  },
  {
    Icon: Quote,
    label: "인용",
    actionDef: { type: "insertAtLineStart", prefix: "> " },
  },
  "divider",
  {
    Icon: Code,
    label: "인라인 코드",
    actionDef: { type: "insertText", before: "`", after: "`", placeholder: "코드" },
  },
  {
    Icon: FileCode,
    label: "코드 블록",
    actionDef: { type: "insertText", before: "\n```\n", after: "\n```\n", placeholder: "코드를 입력하세요" },
  },
  "divider",
  {
    Icon: Link,
    label: "링크",
    actionDef: { type: "insertText", before: "[", after: "](URL)", placeholder: "링크 텍스트" },
    shortcut: "Ctrl+K",
  },
  {
    Icon: Image,
    label: "이미지",
    actionDef: { type: "insertText", before: "![", after: "](이미지 URL)", placeholder: "이미지 설명" },
  },
  {
    Icon: Youtube,
    label: "유튜브 영상",
    actionDef: { type: "insertText", before: "\nhttps://www.youtube.com/watch?v=", after: "", placeholder: "VIDEO_ID" },
  },
  "divider",
  {
    Icon: Minus,
    label: "구분선",
    actionDef: { type: "insertText", before: "\n---\n", after: "", placeholder: "" },
  },
];

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

  // 툴바 버튼 액션 실행 핸들러
  const handleToolbarAction = useCallback((actionDef: ToolbarActionType) => {
    if (actionDef.type === "insertText") {
      insertText(actionDef.before, actionDef.after, actionDef.placeholder);
    } else {
      insertAtLineStart(actionDef.prefix);
    }
  }, [insertText, insertAtLineStart]);

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
          {TOOLBAR_BUTTONS.map((button, index) => 
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
                onClick={() => handleToolbarAction(button.actionDef)}
                title={button.shortcut ? `${button.label} (${button.shortcut})` : button.label}
                className="p-1.5 h-7 w-7"
              >
                <button.Icon className="w-4 h-4" />
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
