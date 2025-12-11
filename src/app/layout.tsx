import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider, QueryProvider, NotificationProvider, GoogleAnalytics } from "@/components/providers";
import { WebVitals } from "@/components/providers/web-vitals";
import { AIChatbot } from "@/components/ui/ai-chatbot";
import { CompareProvider } from "@/hooks/use-compare";
import { CompareBar } from "@/components/marketplace/compare-components";
import { OfflineBanner, InstallPrompt } from "@/components/pwa";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vibe Olympics - Create your idea",
    template: "%s | Vibe Olympics",
  },
  description:
    "VIBE 코딩 기반 지적 상품 마켓플레이스. 아이디어를 현실로, 지식을 가치로 만들어보세요.",
  keywords: [
    "VIBE 코딩",
    "AI 코딩",
    "노코드",
    "디지털 상품",
    "마켓플레이스",
    "교육",
    "커뮤니티",
    "Claude",
    "ChatGPT",
    "Cursor",
    "Windsurf",
    "업무 자동화",
    "비즈니스 모델",
    "데이터 분석",
    "프롬프트 엔지니어링",
    "사이드 프로젝트",
    "부업",
    "프리랜서",
  ],
  authors: [{ name: "Vibe Olympics" }],
  creator: "Vibe Olympics",
  publisher: "Vibe Olympics",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://vibeolympics.com"),
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
      "en-US": "/",
    },
    types: {
      "application/rss+xml": "/api/feed/rss",
      "application/atom+xml": "/api/feed/atom",
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: "en_US",
    url: "https://vibeolympics.com",
    siteName: "Vibe Olympics",
    title: "Vibe Olympics - Create your idea",
    description:
      "VIBE 코딩 기반 지적 상품 마켓플레이스. 아이디어를 현실로, 지식을 가치로 만들어보세요.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Olympics - Create your idea",
    description:
      "VIBE 코딩 기반 지적 상품 마켓플레이스. 아이디어를 현실로, 지식을 가치로 만들어보세요.",
    creator: "@vibeolympics",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      "naver-site-verification": process.env.NAVER_SITE_VERIFICATION || "",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[var(--bg-base)] text-[var(--text-primary)]`}
      >
        <GoogleAnalytics />
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <AuthProvider>
              <NotificationProvider>
                <CompareProvider>
                  <WebVitals />
                  <Toaster 
                    position="top-center"
                    toastOptions={{
                      style: {
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)',
                      },
                    }}
                    richColors
                    closeButton
                  />
                  <Header />
                  <main id="main-content" className="min-h-screen pt-16" role="main">{children}</main>
                  <Footer />
                  <AIChatbot />
                  <CompareBar />
                  <OfflineBanner />
                  <InstallPrompt />
                </CompareProvider>
              </NotificationProvider>
            </AuthProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
