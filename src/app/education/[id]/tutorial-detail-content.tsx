"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ArrowLeft,
  Eye,
  Clock,
  Calendar,
  Share2,
  ExternalLink,
  User,
  Video,
  FileText,
  Lightbulb,
  LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownRenderer, extractHeadings } from "@/components/ui/markdown-renderer";
import { TableOfContents, CompactTableOfContents } from "@/components/ui/table-of-contents";
import { ReactionButtons } from "@/components/ui/reaction-buttons";
import { TutorialCommentSection } from "@/components/ui/comment-section";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  content: string;
  type: string;
  thumbnail: string | null;
  externalUrl: string | null;
  duration: number | null;
  tags: string[];
  viewCount: number;
  likeCount: number;
  isFeatured: boolean;
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

interface TutorialDetailContentProps {
  tutorial: Tutorial;
}

const typeConfig = {
  tutorial: { 
    color: "var(--accent-cyan)", 
    label: "튜토리얼", 
    icon: FileText,
    description: "단계별 학습 가이드",
  },
  making: { 
    color: "var(--accent-violet)", 
    label: "제작기", 
    icon: Video,
    description: "프로젝트 제작 과정",
  },
  tips: { 
    color: "var(--accent-green)", 
    label: "팁 & 트릭", 
    icon: Lightbulb,
    description: "유용한 팁과 노하우",
  },
  external: { 
    color: "var(--accent-amber)", 
    label: "외부 자료", 
    icon: LinkIcon,
    description: "추천 외부 콘텐츠",
  },
};

export function TutorialDetailContent({ tutorial }: TutorialDetailContentProps) {
  const config = typeConfig[tutorial.type as keyof typeof typeConfig] || typeConfig.tutorial;
  const TypeIcon = config.icon;
  
  const headings = extractHeadings(tutorial.content);

  const timeAgo = formatDistanceToNow(new Date(tutorial.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  const isEdited = tutorial.createdAt !== tutorial.updatedAt;

  const handleShare = async () => {
    const url = `${window.location.origin}/education/${tutorial.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: tutorial.title,
          text: tutorial.description,
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
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* 히어로 섹션 */}
      <section className="relative py-12 bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-base)] border-b border-[var(--bg-border)]">
        {/* 썸네일 배경 (블러) */}
        {tutorial.thumbnail && (
          <div 
            className="absolute inset-0 opacity-10 blur-3xl"
            style={{
              backgroundImage: `url(${tutorial.thumbnail})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        
        <div className="container-app relative">
          {/* 뒤로가기 */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              href="/education"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              교육 센터로 돌아가기
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            {/* 배지 */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge
                style={{
                  backgroundColor: `color-mix(in srgb, ${config.color} 20%, transparent)`,
                  color: config.color,
                  borderColor: `color-mix(in srgb, ${config.color} 30%, transparent)`,
                }}
                className="border"
              >
                <TypeIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              {tutorial.isFeatured && (
                <Badge variant="warning">⭐ 추천</Badge>
              )}
              {tutorial.duration && (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {tutorial.duration}
                </Badge>
              )}
            </div>

            {/* 제목 */}
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              {tutorial.title}
            </h1>

            {/* 설명 */}
            <p className="text-lg text-[var(--text-tertiary)] mb-6">
              {tutorial.description}
            </p>

            {/* 태그 */}
            <div className="flex flex-wrap gap-2 mb-6">
              {tutorial.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* 작성자 & 메타 정보 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                {tutorial.author.image ? (
                  <img
                    src={tutorial.author.image}
                    alt={tutorial.author.name}
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
                      {tutorial.author.name}
                    </span>
                    {tutorial.author.isSeller && (
                      <Badge variant="violet" className="text-xs">
                        판매자
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {timeAgo}
                    </span>
                    {isEdited && <span>(수정됨)</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {tutorial.viewCount.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <div className="container-app py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 콘텐츠 영역 */}
          <main className="flex-1 min-w-0">
            {/* 모바일 목차 */}
            {headings.length > 0 && (
              <div className="lg:hidden mb-6">
                <CompactTableOfContents headings={headings} />
              </div>
            )}

            {/* 외부 링크 알림 */}
            {tutorial.type === "external" && tutorial.externalUrl && (
              <Card className="mb-6 border-[var(--accent-amber)]/50 bg-[var(--accent-amber)]/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-[var(--accent-amber)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        외부 콘텐츠입니다
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        클릭하면 새 탭에서 원본 페이지가 열립니다
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(tutorial.externalUrl!, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    원본 보기
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 마크다운 콘텐츠 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6 md:p-8">
                  <MarkdownRenderer content={tutorial.content} />
                </CardContent>
              </Card>
            </motion.div>

            {/* 반응 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <ReactionButtons
                    targetType="TUTORIAL"
                    targetId={tutorial.id}
                    enabledReactions={["LIKE", "RECOMMEND", "HELPFUL", "BOOKMARK"]}
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
                </CardContent>
              </Card>
            </motion.div>

            {/* 댓글 섹션 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Card>
                <CardContent className="p-6 md:p-8">
                  <TutorialCommentSection tutorialId={tutorial.id} />
                </CardContent>
              </Card>
            </motion.div>
          </main>

          {/* 사이드바 */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* 목차 */}
              {headings.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <TableOfContents headings={headings} />
                  </CardContent>
                </Card>
              )}

              {/* 작성자 정보 */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    작성자
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    {tutorial.author.image ? (
                      <img
                        src={tutorial.author.image}
                        alt={tutorial.author.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-violet)] flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">
                        {tutorial.author.name}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        @{tutorial.author.username}
                      </div>
                    </div>
                  </div>
                  {tutorial.author.bio && (
                    <p className="text-sm text-[var(--text-tertiary)] line-clamp-3">
                      {tutorial.author.bio}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 관련 태그 */}
              {tutorial.tags.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                      태그
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tutorial.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/education?tag=${encodeURIComponent(tag)}`}
                          className="text-xs px-2 py-1 bg-[var(--bg-elevated)] text-[var(--text-tertiary)] rounded hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
