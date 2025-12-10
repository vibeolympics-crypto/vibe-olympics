"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  BookOpen,
  Film,
  Music2,
  Package,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface PreviewContent {
  type: "SAMPLE_PAGES" | "TRAILER" | "AUDIO_PREVIEW" | "DEMO" | "SCREENSHOTS";
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  pageCount?: number;
  title?: string;
  description?: string;
}

interface PreviewData {
  product: {
    id: string;
    title: string;
    slug: string;
    productType: string;
    thumbnail: string | null;
  };
  previews: PreviewContent[];
  hasPreview: boolean;
  previewCount: number;
}

// 타입별 아이콘
const PREVIEW_TYPE_ICONS: Record<string, React.ElementType> = {
  SAMPLE_PAGES: BookOpen,
  TRAILER: Film,
  AUDIO_PREVIEW: Music2,
  DEMO: Package,
  SCREENSHOTS: ImageIcon,
};

// 시간 포맷
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// 미리보기 버튼 컴포넌트
export function PreviewButton({
  productId,
  productSlug,
  productType,
  className,
}: {
  productId?: string;
  productSlug?: string;
  productType: string;
  className?: string;
}) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const loadPreview = async () => {
    if (previewData) return;
    
    setLoading(true);
    try {
      const params = productId 
        ? `productId=${productId}` 
        : `slug=${productSlug}`;
      const res = await fetch(`/api/preview?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setPreviewData(data);
      }
    } catch (error) {
      console.error("Failed to load preview:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    loadPreview();
  };

  const TypeIcon = {
    BOOK: BookOpen,
    VIDEO_SERIES: Film,
    MUSIC_ALBUM: Music2,
    DIGITAL_PRODUCT: Eye,
  }[productType] || Eye;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={className}
          onClick={handleOpen}
        >
          <TypeIcon className="w-4 h-4 mr-2" />
          미리보기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {previewData?.product.title || "상품"} 미리보기
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : previewData?.hasPreview ? (
          <PreviewViewer data={previewData} />
        ) : (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">미리보기가 제공되지 않습니다</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// 미리보기 뷰어 컴포넌트
function PreviewViewer({ data }: { data: PreviewData }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePreview = data.previews[activeIndex];

  if (!activePreview) return null;

  return (
    <div className="space-y-4">
      {/* 메인 미리보기 영역 */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {activePreview.type === "TRAILER" ? (
          <VideoPlayer preview={activePreview} />
        ) : activePreview.type === "AUDIO_PREVIEW" ? (
          <AudioPlayer preview={activePreview} thumbnail={data.product.thumbnail} />
        ) : activePreview.type === "SAMPLE_PAGES" ? (
          <SamplePagesViewer preview={activePreview} />
        ) : activePreview.type === "SCREENSHOTS" ? (
          <ImageGallery images={data.product.thumbnail ? [data.product.thumbnail] : []} />
        ) : (
          <DemoViewer preview={activePreview} />
        )}
      </div>

      {/* 미리보기 목록 */}
      {data.previews.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {data.previews.map((preview, idx) => {
            const Icon = PREVIEW_TYPE_ICONS[preview.type] || Eye;
            return (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "flex-shrink-0 p-3 rounded-lg border transition-all",
                  activeIndex === idx
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Icon className="w-5 h-5 mb-1" />
                <p className="text-xs font-medium line-clamp-1">
                  {preview.title || `미리보기 ${idx + 1}`}
                </p>
                {preview.duration && (
                  <p className="text-xs text-muted-foreground">
                    {formatTime(preview.duration)}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 비디오 플레이어
function VideoPlayer({ preview }: { preview: PreviewContent }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setMuted(value[0] === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!fullscreen) {
        videoRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      setFullscreen(!fullscreen);
    }
  };

  // YouTube/Vimeo 임베드 체크
  const isEmbed = preview.url.includes("youtube") || preview.url.includes("vimeo");
  
  if (isEmbed) {
    const embedUrl = preview.url.includes("youtube")
      ? preview.url.replace("watch?v=", "embed/")
      : preview.url;
    
    return (
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div className="relative w-full h-full group">
      <video
        ref={videoRef}
        src={preview.url}
        poster={preview.thumbnailUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
        className="w-full h-full object-contain"
      />

      {/* 컨트롤 오버레이 */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30"
          onClick={togglePlay}
        >
          {playing ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white fill-white" />
          )}
        </Button>
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 프로그레스 바 */}
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="mb-2"
        />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white" onClick={togglePlay}>
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <span className="text-white text-xs">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <Button variant="ghost" size="icon" className="text-white" onClick={toggleMute}>
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <div className="w-24">
            <Slider
              value={[muted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
            />
          </div>

          <Button variant="ghost" size="icon" className="text-white" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// 오디오 플레이어
function AudioPlayer({ 
  preview, 
  thumbnail 
}: { 
  preview: PreviewContent; 
  thumbnail: string | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(preview.duration || 30);

  const togglePlay = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/20 to-purple-500/20">
      <audio
        ref={audioRef}
        src={preview.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />

      {/* 앨범 아트 */}
      <div className="relative w-48 h-48 rounded-lg overflow-hidden shadow-xl mb-6">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={preview.title || "앨범 아트"}
            fill
            className={cn(
              "object-cover transition-transform duration-[3000ms]",
              playing && "animate-spin-slow"
            )}
          />
        ) : (
          <div className="w-full h-full bg-primary/20 flex items-center justify-center">
            <Music2 className="w-16 h-16 text-primary" />
          </div>
        )}
      </div>

      {/* 트랙 정보 */}
      <h4 className="text-lg font-medium text-white mb-1">{preview.title}</h4>
      {preview.description && (
        <p className="text-sm text-white/70 mb-4">{preview.description}</p>
      )}

      {/* 컨트롤 */}
      <div className="w-full max-w-md space-y-4">
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={handleSeek}
        />

        <div className="flex items-center justify-center gap-4">
          <span className="text-white/70 text-sm w-12 text-right">
            {formatTime(currentTime)}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30"
            onClick={togglePlay}
          >
            {playing ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            )}
          </Button>

          <span className="text-white/70 text-sm w-12">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

// 샘플 페이지 뷰어 (도서)
function SamplePagesViewer({ preview }: { preview: PreviewContent }) {
  const [currentPage, setCurrentPage] = useState(0);
  
  // PDF인 경우
  if (preview.url.endsWith(".pdf")) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground mb-4">PDF 미리보기</p>
        <a 
          href={preview.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold h-10 px-4 py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] hover:shadow-[0_0_20px_var(--glow-primary)]"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          새 탭에서 열기
        </a>
      </div>
    );
  }

  // 이미지 페이지들
  return (
    <div className="w-full h-full relative bg-gray-100 flex items-center justify-center">
      <Image
        src={preview.url}
        alt={`${preview.title} - 페이지 ${currentPage + 1}`}
        fill
        className="object-contain"
      />

      {/* 페이지 네비게이션 */}
      {preview.pageCount && preview.pageCount > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80"
            disabled={currentPage === (preview.pageCount || 1) - 1}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-full text-white text-sm">
            {currentPage + 1} / {preview.pageCount}
          </div>
        </>
      )}
    </div>
  );
}

// 이미지 갤러리
function ImageGallery({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Image
        src={images[currentIndex]}
        alt={`이미지 ${currentIndex + 1}`}
        fill
        className="object-contain"
      />

      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(i => i - 1)}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
            disabled={currentIndex === images.length - 1}
            onClick={() => setCurrentIndex(i => i + 1)}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  idx === currentIndex ? "bg-white" : "bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// 데모 뷰어
function DemoViewer({ preview }: { preview: PreviewContent }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
      <Package className="w-16 h-16 text-primary mb-4" />
      <h4 className="text-lg font-medium mb-2">{preview.title}</h4>
      {preview.description && (
        <p className="text-muted-foreground mb-6">{preview.description}</p>
      )}
      
      <div className="flex gap-4">
        <a 
          href={preview.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold h-10 px-4 py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] hover:shadow-[0_0_20px_var(--glow-primary)]"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          데모 체험하기
        </a>
        {preview.url.startsWith("http") && !preview.url.includes("://localhost") && (
          <a 
            href={preview.url} 
            download
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold h-10 px-4 py-2 border border-[var(--bg-border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] hover:border-[var(--primary)]"
          >
            <Download className="w-4 h-4 mr-2" />
            다운로드
          </a>
        )}
      </div>
    </div>
  );
}

// 컴팩트 미리보기 카드 (상품 카드용)
export function PreviewBadge({
  productType,
  hasPreview,
}: {
  productType: string;
  hasPreview?: boolean;
}) {
  if (!hasPreview) return null;

  const labels: Record<string, string> = {
    BOOK: "샘플",
    VIDEO_SERIES: "트레일러",
    MUSIC_ALBUM: "미리듣기",
    DIGITAL_PRODUCT: "데모",
  };

  const Icon = {
    BOOK: BookOpen,
    VIDEO_SERIES: Film,
    MUSIC_ALBUM: Music2,
    DIGITAL_PRODUCT: Eye,
  }[productType] || Eye;

  return (
    <Badge variant="secondary" className="text-xs">
      <Icon className="w-3 h-3 mr-1" />
      {labels[productType] || "미리보기"}
    </Badge>
  );
}
