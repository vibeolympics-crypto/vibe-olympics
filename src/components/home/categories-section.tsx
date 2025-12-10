"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  // 디지털 상품 아이콘
  Globe,
  Smartphone,
  Brain,
  Zap,
  Server,
  BarChart3,
  Package,
  // 도서 아이콘
  BookImage,
  BookOpen,
  Baby,
  GraduationCap,
  TrendingUp,
  Headphones,
  // 영상 아이콘
  Clapperboard,
  Film,
  Video,
  Tv,
  MonitorPlay,
  View,
  // 음악 아이콘
  Laptop,
  Moon,
  Music,
  Gamepad2,
  Disc3,
  Piano,
  // 기타
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 콘텐츠 타입별 탭 정의
const contentTabs = [
  { id: "all", name: "전체", icon: Sparkles, color: "var(--primary)" },
  { id: "digital", name: "디지털 상품", icon: Package, color: "#00D4FF" },
  { id: "book", name: "AI 도서", icon: BookOpen, color: "#FF6B6B" },
  { id: "video", name: "AI 영상", icon: Video, color: "#B19CD9" },
  { id: "music", name: "AI 음악", icon: Music, color: "#FF69B4" },
];

// 디지털 상품 카테고리
const digitalCategories = [
  {
    icon: Globe,
    name: "웹 앱",
    slug: "web-app",
    description: "웹 기반 애플리케이션 및 SaaS",
    color: "#00D4FF",
  },
  {
    icon: Smartphone,
    name: "모바일 앱",
    slug: "mobile-app",
    description: "iOS, Android 앱",
    color: "#FF6B35",
  },
  {
    icon: Brain,
    name: "AI/ML 모델",
    slug: "ai-ml",
    description: "AI 및 머신러닝 모델",
    color: "#BD00FF",
  },
  {
    icon: Zap,
    name: "자동화 도구",
    slug: "automation",
    description: "업무 자동화 스크립트",
    color: "#00FF9F",
  },
  {
    icon: Server,
    name: "API/백엔드",
    slug: "api-backend",
    description: "REST API, 서버 솔루션",
    color: "#FFD93D",
  },
  {
    icon: BarChart3,
    name: "데이터 분석",
    slug: "data-analytics",
    description: "데이터 시각화 도구",
    color: "#FF6B6B",
  },
];

// 도서 카테고리
const bookCategories = [
  {
    icon: BookImage,
    name: "만화/웹툰",
    slug: "book-comic",
    description: "AI 생성 만화책, 웹툰",
    color: "#FF6B6B",
  },
  {
    icon: BookOpen,
    name: "전자책",
    slug: "book-ebook",
    description: "AI 작성 전자책, 소설",
    color: "#4ECDC4",
  },
  {
    icon: Baby,
    name: "동화/그림책",
    slug: "book-picture",
    description: "어린이용 동화책",
    color: "#FFE66D",
  },
  {
    icon: GraduationCap,
    name: "교육/학습",
    slug: "book-education",
    description: "학습서, 교재",
    color: "#95E1D3",
  },
  {
    icon: TrendingUp,
    name: "자기계발",
    slug: "book-selfhelp",
    description: "자기계발, 비즈니스",
    color: "#DDA0DD",
  },
  {
    icon: Headphones,
    name: "오디오북",
    slug: "book-audio",
    description: "AI 음성 오디오북",
    color: "#87CEEB",
  },
];

// 영상 카테고리
const videoCategories = [
  {
    icon: Clapperboard,
    name: "애니메이션",
    slug: "video-animation",
    description: "AI 생성 애니메이션",
    color: "#FF85A2",
  },
  {
    icon: Film,
    name: "단편 영화",
    slug: "video-shortfilm",
    description: "AI 단편 영화, MV",
    color: "#B19CD9",
  },
  {
    icon: Video,
    name: "다큐멘터리",
    slug: "video-documentary",
    description: "교육용 다큐멘터리",
    color: "#77DD77",
  },
  {
    icon: Tv,
    name: "웹 시리즈",
    slug: "video-webseries",
    description: "에피소드 시리즈",
    color: "#FFB347",
  },
  {
    icon: MonitorPlay,
    name: "교육 영상",
    slug: "video-tutorial",
    description: "강좌, 튜토리얼",
    color: "#AEC6CF",
  },
  {
    icon: View,
    name: "버추얼",
    slug: "video-virtual",
    description: "VR/360도 영상",
    color: "#FDFD96",
  },
];

// 음악 카테고리
const musicCategories = [
  {
    icon: Laptop,
    name: "작업용 BGM",
    slug: "music-work",
    description: "집중력 향상 음악",
    color: "#00CED1",
  },
  {
    icon: Moon,
    name: "명상/힐링",
    slug: "music-meditation",
    description: "명상, 수면 음악",
    color: "#9370DB",
  },
  {
    icon: Music,
    name: "영상 배경음악",
    slug: "music-bgm",
    description: "유튜브용 BGM",
    color: "#FF6347",
  },
  {
    icon: Gamepad2,
    name: "게임 OST",
    slug: "music-game",
    description: "게임용 사운드트랙",
    color: "#32CD32",
  },
  {
    icon: Disc3,
    name: "팝/일렉트로닉",
    slug: "music-pop",
    description: "팝, EDM 음악",
    color: "#FF69B4",
  },
  {
    icon: Piano,
    name: "클래식/재즈",
    slug: "music-classical",
    description: "클래식, 재즈",
    color: "#DAA520",
  },
];

// 탭별 카테고리 매핑
const getCategoriesByTab = (tabId: string) => {
  switch (tabId) {
    case "digital":
      return digitalCategories;
    case "book":
      return bookCategories;
    case "video":
      return videoCategories;
    case "music":
      return musicCategories;
    case "all":
    default:
      // 전체 탭에서는 각 카테고리에서 대표 2개씩
      return [
        ...digitalCategories.slice(0, 2),
        ...bookCategories.slice(0, 2),
        ...videoCategories.slice(0, 2),
        ...musicCategories.slice(0, 2),
      ];
  }
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function CategoriesSection() {
  const [activeTab, setActiveTab] = useState("all");
  const categories = getCategoriesByTab(activeTab);

  return (
    <section className="py-24 bg-[var(--bg-surface)]">
      <div className="container-app">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            AI로 만드는 모든 것
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[var(--text-tertiary)] max-w-2xl mx-auto"
          >
            디지털 상품부터 도서, 영상, 음악까지 AI로 창작한 다양한 콘텐츠를 만나보세요.
          </motion.p>
        </div>

        {/* Content Type Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {contentTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                activeTab === tab.id
                  ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Categories Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={container}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {categories.map((category) => (
              <motion.div key={category.slug} variants={item}>
                <Link href={`/marketplace?category=${category.slug}`}>
                  <Card
                    variant="default"
                    className="group cursor-pointer h-full hover:border-[var(--primary)] transition-all duration-300"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: `${category.color}20`,
                        }}
                      >
                        <category.icon
                          className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300"
                          style={{ color: category.color }}
                        />
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] mb-1">
                        {category.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--text-tertiary)] line-clamp-2">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* View All Button */}
        <div className="text-center mt-10">
          <Link href="/marketplace">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-full font-medium hover:bg-[var(--primary)] hover:text-white transition-all duration-300"
            >
              전체 상품 보기
              <span className="text-lg">→</span>
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  );
}
