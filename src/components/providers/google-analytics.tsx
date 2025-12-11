"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

// GA4 Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Google Analytics 이벤트 타입
export interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// 페이지 뷰 이벤트
export function pageview(url: string) {
  if (typeof window !== "undefined" && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

// 커스텀 이벤트
export function event({ action, category, label, value }: GAEvent) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// 이커머스 이벤트 타입
export interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
}

// 이커머스: 상품 조회
export function viewItem(item: EcommerceItem) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "view_item", {
      currency: "KRW",
      value: item.price || 0,
      items: [item],
    });
  }
}

// 이커머스: 장바구니 추가
export function addToCart(item: EcommerceItem) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "add_to_cart", {
      currency: "KRW",
      value: item.price || 0,
      items: [item],
    });
  }
}

// 이커머스: 구매 완료
interface PurchaseParams {
  transactionId: string;
  value: number;
  currency?: string;
  items: EcommerceItem[];
}

export function purchase({ transactionId, value, currency = "KRW", items }: PurchaseParams) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "purchase", {
      transaction_id: transactionId,
      currency: currency,
      value: value,
      items: items,
    });
  }
}

// 이커머스: 위시리스트 추가
export function addToWishlist(item: EcommerceItem) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "add_to_wishlist", {
      currency: "KRW",
      value: item.price || 0,
      items: [item],
    });
  }
}

// 사용자 행동 이벤트
export function trackSignUp(method: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "sign_up", {
      method: method,
    });
  }
}

export function trackLogin(method: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "login", {
      method: method,
    });
  }
}

export function trackSearch(searchTerm: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "search", {
      search_term: searchTerm,
    });
  }
}

export function trackShare(contentType: string, itemId: string, method?: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "share", {
      content_type: contentType,
      item_id: itemId,
      ...(method && { method }),
    });
  }
}

// 페이지 뷰 추적 컴포넌트
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      pageview(url);
    }
  }, [pathname, searchParams]);

  return null;
}

// Google Analytics 스크립트 컴포넌트
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 스크립트 */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              cookie_flags: 'SameSite=None;Secure',
            });
          `,
        }}
      />
      {/* 페이지 뷰 추적 */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}

// TypeScript 전역 타입 확장
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}
