"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// 광고 슬롯 타입 정의
export type AdSlotType = 
  | "banner-top"      // 상단 배너 (728x90)
  | "banner-bottom"   // 하단 배너 (728x90)
  | "sidebar"         // 사이드바 (300x250)
  | "in-feed"         // 피드 내 (300x250)
  | "in-article"      // 기사 내 (300x250 or responsive)
  | "sticky-bottom"   // 모바일 하단 고정 (320x50)
  | "interstitial";   // 전면 광고

export type AdProvider = "adsense" | "custom" | "placeholder";

interface AdSlotProps {
  type: AdSlotType;
  provider?: AdProvider;
  // Google AdSense 설정
  adClient?: string;
  adSlot?: string;
  adFormat?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  // 커스텀 배너 설정
  customContent?: React.ReactNode;
  customImageUrl?: string;
  customLinkUrl?: string;
  // 스타일링
  className?: string;
  // 개발 모드에서 플레이스홀더 표시
  showPlaceholder?: boolean;
}

// 광고 슬롯별 기본 크기
const slotDimensions: Record<AdSlotType, { width: number; height: number; mobileHeight?: number }> = {
  "banner-top": { width: 728, height: 90, mobileHeight: 50 },
  "banner-bottom": { width: 728, height: 90, mobileHeight: 50 },
  "sidebar": { width: 300, height: 250 },
  "in-feed": { width: 300, height: 250 },
  "in-article": { width: 300, height: 250 },
  "sticky-bottom": { width: 320, height: 50 },
  "interstitial": { width: 300, height: 250 },
};

// 광고 슬롯 라벨
const slotLabels: Record<AdSlotType, string> = {
  "banner-top": "상단 배너",
  "banner-bottom": "하단 배너",
  "sidebar": "사이드바 광고",
  "in-feed": "피드 광고",
  "in-article": "본문 광고",
  "sticky-bottom": "하단 고정 배너",
  "interstitial": "전면 광고",
};

export function AdSlot({
  type,
  provider = "placeholder",
  adClient,
  adSlot,
  adFormat = "auto",
  customContent,
  customImageUrl,
  customLinkUrl,
  className,
  showPlaceholder = process.env.NODE_ENV === "development",
}: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const dimensions = slotDimensions[type];

  // Google AdSense 스크립트 로드
  useEffect(() => {
    if (provider === "adsense" && adClient && adSlot) {
      // AdSense 광고 초기화
      try {
        // @ts-expect-error - AdSense global
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setIsLoaded(true);
      } catch (error) {
        console.error("AdSense 로드 실패:", error);
      }
    }
  }, [provider, adClient, adSlot]);

  // 플레이스홀더 렌더링 (개발 모드)
  if (showPlaceholder || provider === "placeholder") {
    return (
      <div
        ref={adRef}
        className={cn(
          "flex items-center justify-center bg-[var(--bg-subtle)] border border-dashed border-[var(--border-default)] rounded-lg text-[var(--text-tertiary)] text-sm",
          type === "sticky-bottom" && "fixed bottom-0 left-0 right-0 z-40",
          className
        )}
        style={{
          minWidth: type === "sticky-bottom" ? "100%" : dimensions.width,
          minHeight: dimensions.height,
          maxWidth: "100%",
        }}
        role="complementary"
        aria-label={`광고 영역: ${slotLabels[type]}`}
      >
        <div className="text-center p-4">
          <div className="text-xs text-[var(--text-muted)] mb-1">광고 영역</div>
          <div className="font-medium">{slotLabels[type]}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {dimensions.width} × {dimensions.height}
          </div>
        </div>
      </div>
    );
  }

  // Google AdSense 렌더링
  if (provider === "adsense" && adClient && adSlot) {
    return (
      <div
        ref={adRef}
        className={cn(
          "ad-container",
          type === "sticky-bottom" && "fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-base)]",
          className
        )}
        role="complementary"
        aria-label={`광고: ${slotLabels[type]}`}
      >
        <ins
          className="adsbygoogle"
          style={{
            display: "block",
            width: type === "sticky-bottom" ? "100%" : dimensions.width,
            height: dimensions.height,
          }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={type === "banner-top" || type === "banner-bottom" ? "true" : "false"}
        />
      </div>
    );
  }

  // 커스텀 배너 렌더링
  if (provider === "custom") {
    if (customContent) {
      return (
        <div
          ref={adRef}
          className={cn(
            "ad-container",
            type === "sticky-bottom" && "fixed bottom-0 left-0 right-0 z-40",
            className
          )}
          role="complementary"
          aria-label={`광고: ${slotLabels[type]}`}
        >
          {customContent}
        </div>
      );
    }

    if (customImageUrl) {
      const imageElement = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={customImageUrl}
          alt="광고 배너"
          className="w-full h-auto object-cover"
          style={{
            maxWidth: dimensions.width,
            maxHeight: dimensions.height,
          }}
        />
      );

      return (
        <div
          ref={adRef}
          className={cn(
            "ad-container",
            type === "sticky-bottom" && "fixed bottom-0 left-0 right-0 z-40",
            className
          )}
          role="complementary"
          aria-label={`광고: ${slotLabels[type]}`}
        >
          {customLinkUrl ? (
            <a
              href={customLinkUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block"
            >
              {imageElement}
            </a>
          ) : (
            imageElement
          )}
        </div>
      );
    }
  }

  // 기본 빈 상태
  return null;
}

// 광고 슬롯 래퍼 - 여백 및 레이블 포함
export function AdSlotWrapper({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("ad-wrapper my-6", className)}>
      {label && (
        <div className="text-xs text-[var(--text-muted)] text-center mb-2">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

// 하단 고정 광고 닫기 버튼 포함 버전
export function StickyBottomAd({
  onClose,
  ...props
}: Omit<AdSlotProps, "type"> & { onClose?: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-base)] border-t border-[var(--border-default)] shadow-lg">
      <div className="relative max-w-screen-lg mx-auto">
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="absolute -top-8 right-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-t-lg px-3 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="광고 닫기"
          >
            ✕ 닫기
          </button>
        )}
        <AdSlot type="sticky-bottom" {...props} />
      </div>
    </div>
  );
}
