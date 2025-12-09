"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Megaphone,
  Eye,
  Heart,
  MessageCircle,
  Clock,
  Plus,
  X,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  usePosts,
  useCreatePost,
  useTogglePostLike,
} from "@/hooks/use-api";

const categories = [
  { id: "all", name: "전체", icon: MessageSquare, color: "var(--primary)" },
  { id: "FREE", name: "자유게시판", icon: MessageSquare, color: "var(--accent-cyan)" },
  { id: "QA", name: "Q&A", icon: HelpCircle, color: "var(--accent-green)" },
  { id: "FEEDBACK", name: "피드백", icon: Lightbulb, color: "var(--accent-violet)" },
  { id: "NOTICE", name: "공지사항", icon: Megaphone, color: "var(--accent-amber)" },
];

// API 응답 게시글 타입
interface CommunityPost {
  id: string;
  category: string;
  title: string;
  content: string;
  viewCount: number;
  likeCount: number;
  commentCount?: number;
  isPinned: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    isSeller: boolean;
  };
  _count?: {
    comments: number;
  };
  isLiked?: boolean;
}

export function CommunityContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  
  // API 연동
  const { data: postsData, isLoading, refetch } = usePosts({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: debouncedSearch || undefined,
  });
  const _createPost = useCreatePost(); // 향후 게시물 작성 기능에 사용 (미사용 경고 방지)
  const toggleLike = useTogglePostLike();

  // 검색 디바운스
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const timer = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timer);
  };

  const posts = (postsData?.posts || []) as CommunityPost[];
  const pinnedPosts = posts.filter((p) => p.isPinned);
  const regularPosts = posts.filter((p) => !p.isPinned);

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
      router.push("/auth/login");
      return;
    }
    
    await toggleLike.mutateAsync(postId);
  };

  const handleWriteClick = () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setIsWriteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Hero Section */}
      <section className="py-16 bg-[var(--bg-surface)] border-b border-[var(--bg-border)]">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
          >
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
                커뮤니티
              </h1>
              <p className="text-[var(--text-tertiary)]">
                창작자들과 소통하고, 궁금한 것을 질문하고, 피드백을 나눠보세요.
              </p>
            </div>
            <Button variant="neon" size="lg" className="gap-2" onClick={handleWriteClick}>
              <Plus className="w-5 h-5" />
              글쓰기
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="container-app py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <Input
                placeholder="게시글 검색..."
                icon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />

              {/* Categories */}
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                      selectedCategory === category.id
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <category.icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{category.name}</span>
                  </button>
                ))}
              </nav>

              {/* Stats */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    커뮤니티 현황
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">총 게시글</span>
                      <span className="text-[var(--text-primary)] font-medium">
                        {postsData?.pagination?.total || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              </div>
            ) : (
              <>
                {/* Pinned Posts */}
                {pinnedPosts.length > 0 && (
                  <div className="mb-6">
                    {pinnedPosts.map((post) => (
                      <PostCard key={post.id} post={post} pinned onLike={handleLike} />
                    ))}
                  </div>
                )}

                {/* Regular Posts */}
                {regularPosts.length > 0 ? (
                  <div className="space-y-4">
                    {regularPosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <PostCard post={post} onLike={handleLike} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-[var(--text-disabled)]" />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                      게시글이 없습니다
                    </h3>
                    <p className="text-[var(--text-tertiary)] mb-4">
                      첫 번째 글을 작성해보세요!
                    </p>
                    <Button variant="outline" onClick={handleWriteClick}>
                      글쓰기
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Write Modal */}
      <WritePostModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onSuccess={() => {
          setIsWriteModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

interface PostCardProps {
  post: CommunityPost;
  pinned?: boolean;
  onLike?: (postId: string, e: React.MouseEvent) => void;
}

function PostCard({ post, pinned, onLike }: PostCardProps) {
  const router = useRouter();
  const categoryConfig = {
    FREE: { color: "var(--accent-cyan)", label: "자유" },
    QA: { color: "var(--accent-green)", label: "Q&A" },
    FEEDBACK: { color: "var(--accent-violet)", label: "피드백" },
    NOTICE: { color: "var(--accent-amber)", label: "공지" },
  };

  const config = categoryConfig[post.category as keyof typeof categoryConfig] || categoryConfig.FREE;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  const handleCardClick = () => {
    router.push(`/community/${post.id}`);
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:border-[var(--primary)]",
        pinned && "border-[var(--accent-amber)]/50 bg-[var(--accent-amber)]/5"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Author Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-violet)] flex items-center justify-center flex-shrink-0">
            {post.author.image ? (
              <img
                src={post.author.image}
                alt={post.author.name || "User"}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-medium">
                {post.author.name?.[0] || "U"}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                style={{
                  backgroundColor: `color-mix(in srgb, ${config.color} 20%, transparent)`,
                  color: config.color,
                  borderColor: `color-mix(in srgb, ${config.color} 30%, transparent)`,
                }}
                className="border text-xs"
              >
                {config.label}
              </Badge>
              {pinned && (
                <Badge variant="warning" className="text-xs">
                  📌 고정
                </Badge>
              )}
              {post.author.isSeller && (
                <Badge variant="violet" className="text-xs">
                  판매자
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-1">
              {post.title}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] line-clamp-2 mb-3">
              {post.content}
            </p>

            <div className="flex items-center gap-4 text-xs text-[var(--text-disabled)]">
              <span>{post.author.name || "익명"}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(post.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {post.viewCount}
              </span>
              <button
                onClick={(e) => onLike?.(post.id, e)}
                className={cn(
                  "flex items-center gap-1 transition-colors hover:text-[var(--accent-pink)]",
                  post.isLiked && "text-[var(--accent-pink)]"
                )}
              >
                <Heart className={cn("w-3 h-3", post.isLiked && "fill-current")} />
                {post.likeCount}
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {post.commentCount || post._count?.comments || 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// WritePostModal 컴포넌트
interface WritePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function WritePostModal({ isOpen, onClose, onSuccess }: WritePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("FREE");
  const createPost = useCreatePost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) return;
    
    try {
      await createPost.mutateAsync({ title, content, category });
      setTitle("");
      setContent("");
      setCategory("FREE");
      onSuccess();
    } catch (error) {
      console.error("게시글 작성 실패:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[var(--bg-surface)] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              글쓰기
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Select */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                카테고리
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.filter(c => c.id !== "all").map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
                      category === cat.id
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                제목
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                내용
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={8}
                required
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button
                type="submit"
                variant="neon"
                disabled={createPost.isPending || !title.trim() || !content.trim()}
                className="gap-2"
              >
                {createPost.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                게시하기
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
