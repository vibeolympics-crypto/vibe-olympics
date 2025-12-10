"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  // 비즈니스/업무 아이콘
  Globe,
  Server,
  BarChart3,
  Zap,
  FileSpreadsheet,
  PieChart,
  // 개발 도구 아이콘
  Smartphone,
  Brain,
  Chrome,
  Palette,
  Code2,
  Database,
  // 라이프스타일 아이콘
  Gamepad2,
  Heart,
  Dumbbell,
  Utensils,
  Car,
  Home,
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
  Disc3,
  Piano,
  TreePine,
  BadgeCheck,
  // 기타
  Sparkles,
  Package,
  ChevronDown,
  Search,
  TrendingUp as Trending,
  Clock,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ==========================================
// 디지털 상품 서브카테고리 (3그룹)
// ==========================================

// 비즈니스/업무 카테고리
const businessCategories = [
  { icon: Globe, name: "웹 앱", slug: "web-app", description: "웹 기반 SaaS", color: "#00D4FF" },
  { icon: Server, name: "API/백엔드", slug: "api-backend", description: "서버 솔루션", color: "#FFD93D" },
  { icon: BarChart3, name: "데이터 분석", slug: "data-analytics", description: "시각화 도구", color: "#FF6B6B" },
  { icon: Zap, name: "업무 자동화", slug: "automation", description: "자동화 스크립트", color: "#00FF9F" },
  { icon: FileSpreadsheet, name: "문서/템플릿", slug: "templates", description: "비즈니스 템플릿", color: "#9370DB" },
  { icon: PieChart, name: "마케팅 도구", slug: "marketing", description: "마케팅 자동화", color: "#FF85A2" },
];

// 개발 도구 카테고리
const devToolCategories = [
  { icon: Smartphone, name: "모바일 앱", slug: "mobile-app", description: "iOS/Android", color: "#FF6B35" },
  { icon: Brain, name: "AI/ML 모델", slug: "ai-ml", description: "머신러닝 모델", color: "#BD00FF" },
  { icon: Chrome, name: "브라우저 확장", slug: "chrome-extension", description: "확장 프로그램", color: "#4285F4" },
  { icon: Palette, name: "디자인 도구", slug: "design-tools", description: "UI/UX 도구", color: "#FF85A2" },
  { icon: Code2, name: "코드 스니펫", slug: "code-snippets", description: "재사용 코드", color: "#00CED1" },
  { icon: Database, name: "데이터베이스", slug: "database-tools", description: "DB 관리 도구", color: "#32CD32" },
];

// 라이프스타일 카테고리
const lifestyleCategories = [
  { icon: Gamepad2, name: "게임", slug: "games", description: "게임 콘텐츠", color: "#9B59B6" },
  { icon: Heart, name: "건강/웰빙", slug: "health", description: "건강 관리", color: "#FF6B6B" },
  { icon: Dumbbell, name: "피트니스", slug: "fitness", description: "운동 도구", color: "#00FF9F" },
  { icon: Utensils, name: "요리/레시피", slug: "cooking", description: "레시피 앱", color: "#FFB347" },
  { icon: Car, name: "여행/모빌리티", slug: "travel", description: "여행 도구", color: "#87CEEB" },
  { icon: Home, name: "홈/인테리어", slug: "home", description: "홈 관리", color: "#DDA0DD" },
];

// 도서 카테고리
const bookCategories = [
  { icon: BookImage, name: "만화/웹툰", slug: "book-comic", description: "AI 만화책", color: "#FF6B6B" },
  { icon: BookOpen, name: "전자책", slug: "book-ebook", description: "AI 전자책", color: "#4ECDC4" },
  { icon: Baby, name: "동화/그림책", slug: "book-picture", description: "어린이 동화", color: "#FFE66D" },
  { icon: GraduationCap, name: "교육/학습", slug: "book-education", description: "학습서", color: "#95E1D3" },
  { icon: TrendingUp, name: "자기계발", slug: "book-selfhelp", description: "자기계발서", color: "#DDA0DD" },
  { icon: Headphones, name: "오디오북", slug: "book-audio", description: "AI 오디오북", color: "#87CEEB" },
];

// 영상 카테고리
const videoCategories = [
  { icon: Clapperboard, name: "애니메이션", slug: "video-animation", description: "AI 애니메이션", color: "#FF85A2" },
  { icon: Film, name: "단편 영화", slug: "video-shortfilm", description: "AI 단편영화", color: "#B19CD9" },
  { icon: Video, name: "다큐멘터리", slug: "video-documentary", description: "다큐멘터리", color: "#77DD77" },
  { icon: Tv, name: "웹 시리즈", slug: "video-webseries", description: "에피소드", color: "#FFB347" },
  { icon: MonitorPlay, name: "교육 영상", slug: "video-tutorial", description: "튜토리얼", color: "#AEC6CF" },
  { icon: View, name: "VR/360", slug: "video-virtual", description: "VR 콘텐츠", color: "#FDFD96" },
];

// 음악 카테고리
const musicCategories = [
  { icon: Laptop, name: "작업용 BGM", slug: "music-work", description: "집중 음악", color: "#00CED1" },
  { icon: Moon, name: "명상/힐링", slug: "music-meditation", description: "힐링 음악", color: "#9370DB" },
  { icon: Music, name: "영상 배경음악", slug: "music-bgm", description: "유튜브 BGM", color: "#FF6347" },
  { icon: Gamepad2, name: "게임 OST", slug: "music-game", description: "게임 음악", color: "#32CD32" },
  { icon: Disc3, name: "팝/EDM", slug: "music-pop", description: "팝/일렉", color: "#FF69B4" },
  { icon: Piano, name: "클래식/재즈", slug: "music-classical", description: "클래식", color: "#DAA520" },
  { icon: TreePine, name: "앰비언트", slug: "music-ambient", description: "자연 소리", color: "#228B22" },
  { icon: BadgeCheck, name: "로열티프리", slug: "music-royaltyfree", description: "상업 이용", color: "#4169E1" },
];

// 메인 탭 정의 (드롭다운 포함)
const mainTabs = [
  { 
    id: "all", 
    name: "전체", 
    icon: Sparkles, 
    color: "var(--primary)",
    hasDropdown: false,
  },
  { 
    id: "digital", 
    name: "디지털 상품", 
    icon: Package, 
    color: "#00D4FF",
    hasDropdown: true,
    subGroups: [
      { id: "business", name: "비즈니스/업무", icon: BarChart3, categories: businessCategories },
      { id: "devtool", name: "개발 도구", icon: Code2, categories: devToolCategories },
      { id: "lifestyle", name: "라이프스타일", icon: Heart, categories: lifestyleCategories },
    ],
  },
  { 
    id: "book", 
    name: "AI 도서", 
    icon: BookOpen, 
    color: "#FF6B6B",
    hasDropdown: false,
    categories: bookCategories,
  },
  { 
    id: "video", 
    name: "AI 영상", 
    icon: Video, 
    color: "#B19CD9",
    hasDropdown: false,
    categories: videoCategories,
  },
  { 
    id: "music", 
    name: "AI 음악", 
    icon: Music, 
    color: "#FF69B4",
    hasDropdown: false,
    categories: musicCategories,
  },
];

// 빠른 필터 옵션
const quickFilters = [
  { id: "trending", name: "인기 급상승", icon: Trending, color: "#FF6B6B" },
  { id: "new", name: "신규 등록", icon: Clock, color: "#00D4FF" },
  { id: "top-rated", name: "평점 높은순", icon: Star, color: "#FFD93D" },
  { id: "ai-generated", name: "AI 생성", icon: Sparkles, color: "#BD00FF" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export function CategoriesSection() {
  const [activeTab, setActiveTab] = useState("all");
  const [activeSubGroup, setActiveSubGroup] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setHoveredTab(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 현재 탭에 따른 카테고리 가져오기
  const getDisplayCategories = () => {
    if (activeTab === "all") {
      return [
        ...businessCategories.slice(0, 2),
        ...devToolCategories.slice(0, 2),
        ...bookCategories.slice(0, 2),
        ...videoCategories.slice(0, 2),
        ...musicCategories.slice(0, 2),
      ];
    }
    
    const tab = mainTabs.find(t => t.id === activeTab);
    if (!tab) return [];
    
    if (tab.hasDropdown && tab.subGroups) {
      if (activeSubGroup) {
        const subGroup = tab.subGroups.find(sg => sg.id === activeSubGroup);
        return subGroup?.categories || [];
      }
      // 모든 서브그룹 카테고리 합치기
      return tab.subGroups.flatMap(sg => sg.categories.slice(0, 2));
    }
    
    return tab.categories || [];
  };

  // 검색 필터링
  const filteredCategories = getDisplayCategories().filter(cat =>
    searchQuery === "" || cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="py-20 bg-[var(--bg-surface)]">
      <div className="container-app">
        {/* Header */}
        <div className="text-center mb-10">
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
            className="text-[var(--text-tertiary)] max-w-2xl mx-auto mb-6"
          >
            디지털 상품부터 도서, 영상, 음악까지 AI로 창작한 다양한 콘텐츠를 만나보세요.
          </motion.p>

          {/* 검색 바 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-md mx-auto relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-disabled)]" />
            <input
              type="text"
              placeholder="카테고리 또는 상품 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </motion.div>
        </div>

        {/* 빠른 필터 */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {quickFilters.map((filter) => (
            <Link
              key={filter.id}
              href={`/marketplace?filter=${filter.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <filter.icon className="w-3.5 h-3.5" style={{ color: filter.color }} />
              {filter.name}
            </Link>
          ))}
        </div>

        {/* 메인 탭 (드롭다운 포함) */}
        <div ref={dropdownRef} className="flex flex-wrap justify-center gap-2 mb-8 relative">
          {mainTabs.map((tab) => (
            <div
              key={tab.id}
              className="relative"
              onMouseEnter={() => tab.hasDropdown && setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <button
                onClick={() => {
                  setActiveTab(tab.id);
                  setActiveSubGroup(null);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
                {tab.hasDropdown && <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
              </button>

              {/* 드롭다운 메가메뉴 */}
              <AnimatePresence>
                {tab.hasDropdown && hoveredTab === tab.id && tab.subGroups && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl shadow-2xl p-4 z-50"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      {tab.subGroups.map((subGroup) => (
                        <div key={subGroup.id}>
                          <button
                            onClick={() => {
                              setActiveTab(tab.id);
                              setActiveSubGroup(subGroup.id);
                              setHoveredTab(null);
                            }}
                            className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3 hover:text-[var(--primary)] transition-colors"
                          >
                            <subGroup.icon className="w-4 h-4" />
                            {subGroup.name}
                          </button>
                          <div className="space-y-1">
                            {subGroup.categories.map((cat) => (
                              <Link
                                key={cat.slug}
                                href={`/marketplace?category=${cat.slug}`}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                                onClick={() => setHoveredTab(null)}
                              >
                                <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                                {cat.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* 서브그룹 탭 (디지털 상품 선택 시) */}
        {activeTab === "digital" && (
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setActiveSubGroup(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                activeSubGroup === null
                  ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                  : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"
              )}
            >
              전체
            </button>
            {mainTabs.find(t => t.id === "digital")?.subGroups?.map((sg) => (
              <button
                key={sg.id}
                onClick={() => setActiveSubGroup(sg.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  activeSubGroup === sg.id
                    ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                    : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"
                )}
              >
                <sg.icon className="w-3.5 h-3.5" />
                {sg.name}
              </button>
            ))}
          </div>
        )}

        {/* 카테고리 그리드 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${activeSubGroup}`}
            variants={container}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
          >
            {filteredCategories.map((category) => (
              <motion.div key={category.slug} variants={item}>
                <Link href={`/marketplace?category=${category.slug}`}>
                  <Card
                    variant="default"
                    className="group cursor-pointer h-full hover:border-[var(--primary)] transition-all duration-300"
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <category.icon
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          style={{ color: category.color }}
                        />
                      </div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">
                        {category.name}
                      </h3>
                      <p className="text-xs text-[var(--text-tertiary)] line-clamp-1">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* 전체 보기 버튼 */}
        <div className="text-center mt-8">
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
