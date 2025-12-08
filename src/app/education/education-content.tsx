"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Video,
  FileText,
  Link as LinkIcon,
  Clock,
  Eye,
  Heart,
  Play,
  GraduationCap,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTutorials, useFeaturedTutorials, useCreateTutorial, useToggleTutorialLike } from "@/hooks/use-api";
import type { Tutorial } from "@/lib/api";
import { useSession } from "next-auth/react";

const contentTypes = [
  { id: "all", name: "전체", icon: BookOpen },
  { id: "tutorial", name: "튜토리얼", icon: FileText },
  { id: "making", name: "제작기", icon: Video },
  { id: "tips", name: "팁 & 트릭", icon: GraduationCap },
  { id: "external", name: "외부 자료", icon: LinkIcon },
];

export function EducationContent() {
  const { data: session } = useSession();
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // 검색어 디바운싱
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // 간단한 디바운싱
    setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 300);
  };

  // 튜토리얼 데이터 조회
  const { data: tutorialsData, isLoading } = useTutorials({
    type: selectedType === "all" ? undefined : selectedType,
    search: debouncedSearch || undefined,
  });

  // 추천 튜토리얼 조회
  const { data: featuredData } = useFeaturedTutorials();

  const tutorials = tutorialsData?.tutorials || [];
  const featuredTutorials = featuredData?.tutorials || [];

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-base)] border-b border-[var(--bg-border)]">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 mb-6">
              <GraduationCap className="w-4 h-4 text-[var(--accent-green)]" />
              <span className="text-sm text-[var(--accent-green)] font-medium">
                모든 교육 콘텐츠 무료 제공
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              교육 센터
            </h1>
            <p className="text-[var(--text-tertiary)] mb-8">
              VIBE 코딩과 AI 도구 활용법을 배워보세요.
              <br />
              창작자들이 직접 공유하는 노하우와 경험담이 가득합니다.
            </p>

            {/* Search Bar */}
            <div className="flex gap-3 max-w-lg">
              <Input
                placeholder="배우고 싶은 주제를 검색하세요..."
                icon={<Search className="w-5 h-5" />}
                value={searchQuery}
                onChange={handleSearchChange}
                className="flex-1"
              />
              {session?.user && (
                <Button onClick={() => setIsWriteModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  콘텐츠 작성
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container-app py-8">
        {/* Featured Section */}
        {selectedType === "all" && !debouncedSearch && featuredTutorials.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
              🔥 인기 콘텐츠
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredTutorials.map((tutorial, index) => (
                <motion.div
                  key={tutorial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ContentCard content={tutorial} featured />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Content Type Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {contentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedType === type.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              )}
            >
              <type.icon className="w-4 h-4" />
              {type.name}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : tutorials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial, index) => (
              <motion.div
                key={tutorial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ContentCard content={tutorial} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
              <Search className="w-8 h-8 text-[var(--text-disabled)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              {debouncedSearch ? "검색 결과가 없습니다" : "콘텐츠가 없습니다"}
            </h3>
            <p className="text-[var(--text-tertiary)]">
              {debouncedSearch 
                ? "다른 키워드로 검색하거나 필터를 변경해보세요."
                : "첫 번째 콘텐츠를 작성해 주세요!"}
            </p>
            {session?.user && !debouncedSearch && (
              <Button className="mt-4" onClick={() => setIsWriteModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                콘텐츠 작성하기
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Write Modal */}
      {isWriteModalOpen && (
        <WriteModal onClose={() => setIsWriteModalOpen(false)} />
      )}
    </div>
  );
}

interface ContentCardProps {
  content: Tutorial;
  featured?: boolean;
}

function ContentCard({ content, featured }: ContentCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const toggleLike = useToggleTutorialLike();

  const typeConfig = {
    tutorial: { color: "var(--accent-cyan)", label: "튜토리얼" },
    making: { color: "var(--accent-violet)", label: "제작기" },
    tips: { color: "var(--accent-green)", label: "팁" },
    external: { color: "var(--accent-amber)", label: "외부 자료" },
  };

  const config = typeConfig[content.type as keyof typeof typeConfig] || typeConfig.tutorial;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) return;
    toggleLike.mutate(content.id);
  };

  const handleClick = () => {
    // 외부 링크인 경우 새 탭에서 열기
    if (content.type === "external" && content.externalUrl) {
      window.open(content.externalUrl, "_blank");
    } else {
      // 내부 콘텐츠는 상세 페이지로 이동
      router.push(`/education/${content.id}`);
    }
  };

  return (
    <Card 
      className={cn("group cursor-pointer h-full", featured && "border-[var(--primary)]")}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="aspect-video rounded-t-xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-surface)] flex items-center justify-center relative overflow-hidden">
          {content.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={content.thumbnail} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Play className="w-12 h-12 text-[var(--text-disabled)] group-hover:text-[var(--primary)] transition-colors" />
          )}
          
          {/* Type Badge */}
          <div className="absolute top-3 left-3">
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
          </div>

          {/* Duration */}
          {content.duration && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-white text-xs">
              <Clock className="w-3 h-3" />
              {content.duration}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
            {content.title}
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] line-clamp-2 mb-4">
            {content.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {content.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--bg-border)]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-violet)] flex items-center justify-center overflow-hidden">
                {content.author.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={content.author.avatar} 
                    alt={content.author.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs font-medium">
                    {content.author.name[0]}
                  </span>
                )}
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">
                {content.author.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-disabled)]">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {content.viewCount.toLocaleString()}
              </span>
              <button 
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-1 transition-colors",
                  content.isLiked && "text-[var(--accent-rose)]"
                )}
              >
                <Heart className={cn("w-3 h-3", content.isLiked && "fill-current")} />
                {content.likeCount}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 글쓰기 모달 컴포넌트
function WriteModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("tutorial");
  const [duration, setDuration] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [tags, setTags] = useState("");

  const createTutorial = useCreateTutorial();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !content.trim()) {
      alert("필수 항목을 입력해주세요.");
      return;
    }

    try {
      await createTutorial.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        type,
        duration: duration || undefined,
        externalUrl: externalUrl || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      onClose();
    } catch {
      alert("콘텐츠 작성에 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--bg-surface)] rounded-2xl shadow-xl"
      >
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-[var(--bg-border)] bg-[var(--bg-surface)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            교육 콘텐츠 작성
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-tertiary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 유형 선택 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              콘텐츠 유형
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "tutorial", label: "튜토리얼" },
                { id: "making", label: "제작기" },
                { id: "tips", label: "팁 & 트릭" },
                { id: "external", label: "외부 자료" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    type === t.id
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              제목 *
            </label>
            <Input
              placeholder="콘텐츠 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              간단한 설명 *
            </label>
            <Textarea
              placeholder="콘텐츠에 대한 간단한 설명을 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              required
            />
          </div>

          {/* 본문 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              본문 내용 * (마크다운 지원)
            </label>
            <Textarea
              placeholder="본문 내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              required
            />
          </div>

          {/* 소요 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                소요 시간 (분)
              </label>
              <Input
                type="number"
                placeholder="예: 30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            {/* 외부 링크 (외부 자료 유형인 경우) */}
            {type === "external" && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  외부 링크
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              태그 (쉼표로 구분)
            </label>
            <Input
              placeholder="예: AI, 프롬프트, 자동화"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={createTutorial.isPending}>
              {createTutorial.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  작성 중...
                </>
              ) : (
                "작성하기"
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
