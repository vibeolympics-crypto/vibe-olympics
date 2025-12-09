"use client";

import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { useState } from "react";

interface VideoEmbedProps {
  type: "youtube" | "vimeo";
  videoId: string;
  title?: string;
  className?: string;
}

export function VideoEmbed({ type, videoId, title, className }: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // 썸네일 URL 생성
  const thumbnailUrl =
    type === "youtube"
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : `https://vumbnail.com/${videoId}.jpg`;

  // 임베드 URL 생성
  const embedUrl =
    type === "youtube"
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${videoId}?autoplay=1`;

  // 원본 URL 생성
  const originalUrl =
    type === "youtube"
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://vimeo.com/${videoId}`;

  if (!isLoaded) {
    // 썸네일 모드 (클릭 전)
    return (
      <div className={cn("my-6", className)}>
        <div
          className="relative aspect-video bg-[var(--bg-elevated)] rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => setIsLoaded(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsLoaded(true)}
          aria-label={`${title || "영상"} 재생`}
        >
          {/* 썸네일 이미지 */}
          { }
          <img
            src={thumbnailUrl}
            alt={title || "영상 썸네일"}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // YouTube maxresdefault가 없을 경우 hqdefault로 대체
              if (type === "youtube") {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }
            }}
          />

          {/* 플레이 버튼 오버레이 */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="currentColor" />
            </div>
          </div>

          {/* 플랫폼 배지 */}
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                "px-2 py-1 text-xs font-medium rounded",
                type === "youtube"
                  ? "bg-red-600 text-white"
                  : "bg-blue-500 text-white"
              )}
            >
              {type === "youtube" ? "YouTube" : "Vimeo"}
            </span>
          </div>
        </div>

        {/* 캡션/링크 */}
        <div className="flex items-center justify-between mt-2">
          {title && (
            <p className="text-sm text-[var(--text-tertiary)]">{title}</p>
          )}
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--text-disabled)] hover:text-[var(--primary)]"
          >
            새 탭에서 열기 ↗
          </a>
        </div>
      </div>
    );
  }

  // 로드된 상태 (iframe)
  return (
    <div className={cn("my-6", className)}>
      <div className="relative aspect-video bg-[var(--bg-elevated)] rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title={title || "영상"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
      {title && (
        <p className="text-sm text-[var(--text-tertiary)] mt-2">{title}</p>
      )}
    </div>
  );
}

// URL에서 비디오 정보 추출
export function parseVideoUrl(url: string): { type: "youtube" | "vimeo"; videoId: string } | null {
  // YouTube
  const youtubeMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return { type: "youtube", videoId: youtubeMatch[1] };
  }

  // Vimeo
  const vimeoMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/
  );
  if (vimeoMatch) {
    return { type: "vimeo", videoId: vimeoMatch[1] };
  }

  return null;
}
