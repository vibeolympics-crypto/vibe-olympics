"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ArrowLeft,
  Eye,
  Clock,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit,
  Trash2,
  User,
  Pin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReactionButtons } from "@/components/ui/reaction-buttons";
import { DiscussionSection } from "@/components/ui/comment-section";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    image: string | null;
    bio: string;
    isSeller: boolean;
  };
}

interface PostDetailContentProps {
  post: Post;
}

const categoryConfig = {
  FREE: { color: "var(--accent-cyan)", label: "자유게시판", icon: MessageCircle },
  QA: { color: "var(--accent-green)", label: "Q&A", icon: MessageCircle },
  FEEDBACK: { color: "var(--accent-violet)", label: "피드백", icon: MessageCircle },
  NOTICE: { color: "var(--accent-amber)", label: "공지사항", icon: Pin },
};

export function PostDetailContent({ post }: PostDetailContentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  const config = categoryConfig[post.category as keyof typeof categoryConfig] || categoryConfig.FREE;
  const isAuthor = session?.user?.id === post.author.id;

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  const isEdited = post.createdAt !== post.updatedAt;

  const handleDelete = async () => {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("삭제 실패");
      }

      router.push("/community");
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      alert("게시글 삭제에 실패했습니다.");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/community/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.slice(0, 100),
          url,
        });
      } catch {
        // 사용자가 취소한 경우
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다!");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-8">
      <div className="container-app max-w-3xl">
        {/* 뒤로가기 */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            커뮤니티로 돌아가기
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* 게시글 카드 */}
          <Card className="mb-8">
            <CardContent className="p-6 md:p-8">
              {/* 헤더 */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Badge
                    style={{
                      backgroundColor: `color-mix(in srgb, ${config.color} 20%, transparent)`,
                      color: config.color,
                      borderColor: `color-mix(in srgb, ${config.color} 30%, transparent)`,
                    }}
                    className="border"
                  >
                    {config.label}
                  </Badge>
                  {post.isPinned && (
                    <Badge variant="warning">
                      📌 고정
                    </Badge>
                  )}
                </div>

                {/* 메뉴 버튼 */}
                {isAuthor && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMenu(!showMenu)}
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>

                    {showMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md py-1 min-w-[120px]">
                          <button
                            onClick={() => {
                              router.push(`/community/${post.id}/edit`);
                              setShowMenu(false);
                            }}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            수정
                          </button>
                          <button
                            onClick={handleDelete}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            삭제
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 제목 */}
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
                {post.title}
              </h1>

              {/* 작성자 정보 */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-[var(--bg-border)]">
                <div className="flex items-center gap-3">
                  {post.author.image ? (
                    <img
                      src={post.author.image}
                      alt={post.author.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-violet)] flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)]">
                        {post.author.name}
                      </span>
                      {post.author.isSeller && (
                        <Badge variant="violet" className="text-xs">
                          판매자
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo}
                      </span>
                      {isEdited && <span>(수정됨)</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.viewCount}
                  </span>
                </div>
              </div>

              {/* 본문 */}
              <div className="prose prose-invert max-w-none mb-8">
                <div className="whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">
                  {post.content}
                </div>
              </div>

              {/* 반응 버튼 */}
              <div className="flex items-center justify-between pt-6 border-t border-[var(--bg-border)]">
                <ReactionButtons
                  targetType="POST"
                  targetId={post.id}
                  enabledReactions={["LIKE", "RECOMMEND", "BOOKMARK"]}
                  showLabels={true}
                  size="md"
                  variant="default"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  공유
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 댓글 섹션 */}
          <Card>
            <CardContent className="p-6 md:p-8">
              <DiscussionSection postId={post.id} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
