"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { MessageCircle, Send, CornerDownRight, MoreHorizontal, Trash2, Edit, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LikeButton } from "@/components/ui/reaction-buttons";

// 타입 정의
type TargetType = "PRODUCT" | "TUTORIAL" | "POST" | "COMMENT";

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: Author;
  user?: Author;
  parentId: string | null;
  replies?: Comment[];
  replyCount?: number;
  _count?: {
    replies: number;
  };
}

interface CommentSectionProps {
  targetType: TargetType;
  targetId: string;
  title?: string;
  placeholder?: string;
  allowReplies?: boolean;
  maxDepth?: number;
  className?: string;
}

// 댓글 입력 폼
interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  isReply?: boolean;
  initialValue?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}

function CommentForm({
  onSubmit,
  placeholder = "댓글을 작성해주세요...",
  isReply = false,
  initialValue = "",
  onCancel,
  autoFocus = false,
}: CommentFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } catch (error) {
      console.error("댓글 작성 오류:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn("flex gap-3", isReply && "ml-12")}>
      {/* 아바타 */}
      <div className="flex-shrink-0">
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "사용자"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* 입력 폼 */}
      <div className="flex-1 space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={session?.user ? placeholder : "로그인 후 댓글을 작성할 수 있습니다."}
          disabled={!session?.user || isSubmitting}
          autoFocus={autoFocus}
          className="min-h-[80px] resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Ctrl + Enter로 빠르게 작성
          </p>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                취소
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting || !session?.user}
            >
              <Send className="w-4 h-4 mr-1" />
              {isSubmitting ? "작성 중..." : isReply ? "답글 달기" : "댓글 작성"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 단일 댓글 아이템
interface CommentItemProps {
  comment: Comment;
  targetType: TargetType;
  targetId: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  allowReplies: boolean;
  depth?: number;
  maxDepth?: number;
}

function CommentItem({
  comment,
  targetType,
  targetId,
  onReply,
  onDelete,
  onEdit,
  allowReplies,
  depth = 0,
  maxDepth = 3,
}: CommentItemProps) {
  const { data: session } = useSession();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // author 또는 user 필드 사용 (API 호환성)
  const commentAuthor = comment.author || comment.user;
  const isAuthor = session?.user?.id === commentAuthor?.id;
  const canReply = allowReplies && depth < maxDepth;

  const handleReplySubmit = async (content: string) => {
    await onReply(comment.id, content);
    setShowReplyForm(false);
  };

  const handleEditSubmit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  const isEdited = comment.createdAt !== comment.updatedAt;

  return (
    <div className={cn("group", depth > 0 && "ml-12 pt-4")}>
      {/* 대댓글 표시 아이콘 */}
      {depth > 0 && (
        <div className="absolute -ml-8 mt-3">
          <CornerDownRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      <div className="flex gap-3">
        {/* 아바타 */}
        <div className="flex-shrink-0">
          {commentAuthor?.image ? (
            <img
              src={commentAuthor.image}
              alt={commentAuthor.name || "사용자"}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* 댓글 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {commentAuthor?.name || "익명"}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {isEdited && (
              <span className="text-xs text-muted-foreground">(수정됨)</span>
            )}
          </div>

          {isEditing ? (
            <CommentForm
              onSubmit={handleEditSubmit}
              initialValue={comment.content}
              onCancel={() => setIsEditing(false)}
              autoFocus
            />
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap break-words">
                {comment.content}
              </p>

              {/* 액션 버튼들 */}
              <div className="flex items-center gap-2 mt-2">
                <LikeButton
                  targetType="COMMENT"
                  targetId={comment.id}
                  size="sm"
                />

                {canReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1" />
                    답글
                  </Button>
                )}

                {isAuthor && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMenu(!showMenu)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>

                    {showMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md py-1 min-w-[100px]">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setShowMenu(false);
                            }}
                            className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted flex items-center gap-2"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            수정
                          </button>
                          <button
                            onClick={() => {
                              onDelete(comment.id);
                              setShowMenu(false);
                            }}
                            className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            삭제
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 답글 입력 폼 */}
      {showReplyForm && (
        <div className="mt-4">
          <CommentForm
            onSubmit={handleReplySubmit}
            placeholder="답글을 작성해주세요..."
            isReply
            onCancel={() => setShowReplyForm(false)}
            autoFocus
          />
        </div>
      )}

      {/* 대댓글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="relative">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              targetType={targetType}
              targetId={targetId}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              allowReplies={allowReplies}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 메인 댓글 섹션 컴포넌트
export function CommentSection({
  targetType,
  targetId,
  title = "댓글",
  placeholder = "댓글을 작성해주세요...",
  allowReplies = true,
  maxDepth = 3,
  className,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 댓글 목록 조회
  const fetchComments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        targetType,
        targetId,
      });
      
      const response = await fetch(`/api/unified-comments?${params}`);
      
      if (!response.ok) {
        throw new Error("댓글을 불러오는데 실패했습니다.");
      }
      
      const data = await response.json();
      // API 응답 형식 변환 (user -> author로 통일)
      const transformedComments = (data.comments || []).map((comment: Comment) => ({
        ...comment,
        author: comment.user || comment.author,
        replies: comment.replies?.map((reply: Comment) => ({
          ...reply,
          author: reply.user || reply.author,
        })),
      }));
      setComments(transformedComments);
      setError(null);
    } catch (err) {
      console.error("댓글 조회 오류:", err);
      setError("댓글을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 댓글 작성
  const handleSubmit = async (content: string) => {
    const response = await fetch("/api/unified-comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetType,
        targetId,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error("댓글 작성에 실패했습니다.");
    }

    await fetchComments();
  };

  // 답글 작성
  const handleReply = async (parentId: string, content: string) => {
    const response = await fetch("/api/unified-comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetType,
        targetId,
        content,
        parentId,
      }),
    });

    if (!response.ok) {
      throw new Error("답글 작성에 실패했습니다.");
    }

    await fetchComments();
  };

  // 댓글 삭제
  const handleDelete = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    const response = await fetch(`/api/unified-comments/${commentId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("댓글 삭제에 실패했습니다.");
    }

    await fetchComments();
  };

  // 댓글 수정
  const handleEdit = async (commentId: string, content: string) => {
    const response = await fetch(`/api/unified-comments/${commentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error("댓글 수정에 실패했습니다.");
    }

    await fetchComments();
  };

  // 총 댓글 수 계산 (대댓글 포함)
  const totalComments = comments.reduce((acc, comment) => {
    const replyCount = comment.replies?.length || comment.replyCount || comment._count?.replies || 0;
    return acc + 1 + replyCount;
  }, 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        <h3 className="text-lg font-semibold">
          {title}
          {totalComments > 0 && (
            <span className="text-muted-foreground font-normal ml-2">
              ({totalComments})
            </span>
          )}
        </h3>
      </div>

      {/* 댓글 입력 폼 */}
      <CommentForm onSubmit={handleSubmit} placeholder={placeholder} />

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchComments} className="mt-2">
              다시 시도
            </Button>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>아직 댓글이 없습니다.</p>
            <p className="text-sm">첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              targetType={targetType}
              targetId={targetId}
              onReply={handleReply}
              onDelete={handleDelete}
              onEdit={handleEdit}
              allowReplies={allowReplies}
              maxDepth={maxDepth}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Q&A 섹션 (상품용 래퍼)
interface QASectionProps {
  productId: string;
  className?: string;
}

export function QASection({ productId, className }: QASectionProps) {
  return (
    <CommentSection
      targetType="PRODUCT"
      targetId={productId}
      title="Q&A"
      placeholder="이 상품에 대해 궁금한 점을 질문해주세요..."
      allowReplies={true}
      maxDepth={2}
      className={className}
    />
  );
}

// 토론 섹션 (커뮤니티용 래퍼)
interface DiscussionSectionProps {
  postId: string;
  className?: string;
}

export function DiscussionSection({ postId, className }: DiscussionSectionProps) {
  return (
    <CommentSection
      targetType="POST"
      targetId={postId}
      title="댓글"
      placeholder="의견을 남겨주세요..."
      allowReplies={true}
      maxDepth={3}
      className={className}
    />
  );
}

// 튜토리얼 댓글 섹션
interface TutorialCommentSectionProps {
  tutorialId: string;
  className?: string;
}

export function TutorialCommentSection({ tutorialId, className }: TutorialCommentSectionProps) {
  return (
    <CommentSection
      targetType="TUTORIAL"
      targetId={tutorialId}
      title="댓글"
      placeholder="이 튜토리얼에 대한 의견을 남겨주세요..."
      allowReplies={true}
      maxDepth={2}
      className={className}
    />
  );
}
