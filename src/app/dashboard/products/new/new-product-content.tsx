"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  X,
  FileText,
  Eye,
  Save,
  Send,
  DollarSign,
  Tag,
  Package,
  FileCode,
  Sparkles,
  BookOpen,
  Plus,
  Check,
  ExternalLink,
  Book,
  Film,
  Music,
  Code,
  Search,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { cn } from "@/lib/utils";
import { generateSeoData, generateSlug } from "@/lib/seo-utils";
import { ProductType } from "@/types";
import {
  BookMetaForm,
  BookMetaFormData,
  VideoSeriesMetaForm,
  VideoSeriesMetaFormData,
  MusicAlbumMetaForm,
  MusicAlbumMetaFormData,
  AiGeneratedForm,
  AiGeneratedFormData,
} from "@/components/marketplace/product-meta-forms";

// 상품 타입 옵션
const productTypeOptions: { id: ProductType; name: string; icon: React.ReactNode; description: string }[] = [
  { 
    id: "DIGITAL_PRODUCT", 
    name: "디지털 상품", 
    icon: <Code className="w-6 h-6" />,
    description: "소스코드, 템플릿, 플러그인 등"
  },
  { 
    id: "BOOK", 
    name: "도서/전자책", 
    icon: <Book className="w-6 h-6" />,
    description: "전자책, 만화, 오디오북 등"
  },
  { 
    id: "VIDEO_SERIES", 
    name: "영상 시리즈", 
    icon: <Film className="w-6 h-6" />,
    description: "영화, 애니메이션, 다큐 등"
  },
  { 
    id: "MUSIC_ALBUM", 
    name: "음악 앨범", 
    icon: <Music className="w-6 h-6" />,
    description: "음원, 앨범, BGM 등"
  },
];

// 상품 타입별 카테고리 (실제로는 API에서 불러옴)
const categoriesByType: Record<ProductType, { id: string; name: string; icon: string }[]> = {
  DIGITAL_PRODUCT: [
    { id: "web-app", name: "웹 애플리케이션", icon: "🌐" },
    { id: "mobile-app", name: "모바일 앱", icon: "📱" },
    { id: "automation", name: "업무 자동화", icon: "⚡" },
    { id: "data", name: "데이터 분석", icon: "📊" },
    { id: "ai-ml", name: "AI/ML", icon: "🤖" },
    { id: "design", name: "디자인", icon: "🎨" },
    { id: "devtool", name: "개발 도구", icon: "🛠️" },
    { id: "business", name: "비즈니스", icon: "💼" },
    { id: "education", name: "교육", icon: "📚" },
    { id: "other", name: "기타", icon: "📦" },
  ],
  BOOK: [
    { id: "book-fiction", name: "소설/문학", icon: "📖" },
    { id: "book-nonfiction", name: "비소설/교양", icon: "📚" },
    { id: "book-tech", name: "기술/IT", icon: "💻" },
    { id: "book-comic", name: "만화/웹툰", icon: "🎨" },
    { id: "book-children", name: "아동/청소년", icon: "🧒" },
    { id: "book-audio", name: "오디오북", icon: "🎧" },
  ],
  VIDEO_SERIES: [
    { id: "video-movie", name: "영화", icon: "🎬" },
    { id: "video-animation", name: "애니메이션", icon: "🎨" },
    { id: "video-documentary", name: "다큐멘터리", icon: "📹" },
    { id: "video-short", name: "단편영상", icon: "🎥" },
    { id: "video-series", name: "시리즈물", icon: "📺" },
    { id: "video-educational", name: "교육 영상", icon: "🎓" },
  ],
  MUSIC_ALBUM: [
    { id: "music-pop", name: "팝/K-Pop", icon: "🎤" },
    { id: "music-electronic", name: "일렉트로닉", icon: "🎹" },
    { id: "music-ambient", name: "앰비언트/힐링", icon: "🌿" },
    { id: "music-classical", name: "클래식/재즈", icon: "🎻" },
    { id: "music-hiphop", name: "힙합/R&B", icon: "🎧" },
    { id: "music-bgm", name: "BGM/효과음", icon: "🔊" },
    { id: "music-soundtrack", name: "사운드트랙", icon: "🎼" },
    { id: "music-world", name: "월드뮤직", icon: "🌍" },
  ],
};

// 기본 카테고리 목록 (하위 호환성)
const categories = categoriesByType.DIGITAL_PRODUCT;

// 라이선스 옵션
const licenseOptions = [
  {
    id: "personal",
    name: "개인용",
    description: "개인 프로젝트에만 사용 가능",
    price: 1,
  },
  {
    id: "commercial",
    name: "상업용",
    description: "상업적 프로젝트에 사용 가능",
    price: 1.5,
  },
  {
    id: "extended",
    name: "확장",
    description: "재판매 및 SaaS 서비스에 사용 가능",
    price: 3,
  },
];

// 튜토리얼 연결 유형
const tutorialTypes = [
  { id: "TUTORIAL", name: "사용 방법", description: "상품 사용법 안내" },
  { id: "MAKING", name: "제작 과정", description: "개발/제작 과정 공유" },
  { id: "TIPS", name: "활용 팁", description: "고급 활용 팁 & 트릭" },
];

// 튜토리얼 타입
interface Tutorial {
  id: string;
  title: string;
  type: string;
  thumbnail: string | null;
  description: string;
  createdAt: string;
}

// 선택된 튜토리얼 타입
interface SelectedTutorial {
  tutorialId: string;
  type: "TUTORIAL" | "MAKING" | "TIPS";
}

// Form validation schema
const productSchema = z.object({
  productType: z.enum(["DIGITAL_PRODUCT", "BOOK", "VIDEO_SERIES", "MUSIC_ALBUM"]),
  title: z
    .string()
    .min(5, "제목은 최소 5자 이상이어야 합니다")
    .max(100, "제목은 100자 이하여야 합니다"),
  description: z
    .string()
    .min(50, "설명은 최소 50자 이상이어야 합니다")
    .max(5000, "설명은 5000자 이하여야 합니다"),
  shortDescription: z
    .string()
    .min(10, "간단한 설명은 최소 10자 이상이어야 합니다")
    .max(200, "간단한 설명은 200자 이하여야 합니다"),
  category: z.string().min(1, "카테고리를 선택해주세요"),
  price: z.number().min(0, "가격은 0 이상이어야 합니다"),
  isFree: z.boolean(),
  tags: z.array(z.string()).min(1, "최소 1개의 태그를 입력해주세요"),
  license: z.string().min(1, "라이선스를 선택해주세요"),
});

type ProductFormData = z.infer<typeof productSchema>;

export function NewProductContent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<
    { name: string; url: string; path: string }[]
  >([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; url: string; path: string }[]
  >([]);
  const [tagInput, setTagInput] = useState("");
  
  // 튜토리얼 관련 상태
  const [myTutorials, setMyTutorials] = useState<Tutorial[]>([]);
  const [selectedTutorials, setSelectedTutorials] = useState<SelectedTutorial[]>([]);
  const [isLoadingTutorials, setIsLoadingTutorials] = useState(false);
  
  // 메타데이터 상태 (상품 타입별)
  const [bookMeta, setBookMeta] = useState<Partial<BookMetaFormData>>({
    language: "ko",
    format: [],
  });
  const [videoMeta, setVideoMeta] = useState<Partial<VideoSeriesMetaFormData>>({
    genre: [],
    subtitles: [],
    cast: [],
    resolution: "FHD",
    audioFormat: "STEREO",
  });
  const [musicMeta, setMusicMeta] = useState<Partial<MusicAlbumMetaFormData>>({
    genre: "OTHER",
    format: [],
    mood: [],
    albumType: "FULL",
  });
  
  // AI 생성 정보 상태
  const [aiGeneratedData, setAiGeneratedData] = useState<Partial<AiGeneratedFormData>>({
    isAiGenerated: false,
    aiTool: "",
    aiPrompt: "",
  });
  
  // SEO 미리보기 상태
  const [seoPreview, setSeoPreview] = useState<{
    slug: string;
    metaDescription: string;
    keywords: string[];
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productType: "DIGITAL_PRODUCT",
      title: "",
      description: "",
      shortDescription: "",
      category: "",
      price: 0,
      isFree: false,
      tags: [],
      license: "personal",
    },
  });

  const watchedValues = watch();
  const isFree = watch("isFree");
  const tags = watch("tags");
  const selectedCategory = watch("category");
  const selectedProductType = watch("productType");
  
  // 상품 타입에 따른 카테고리 목록
  const currentCategories = useMemo(() => {
    return categoriesByType[selectedProductType] || categoriesByType.DIGITAL_PRODUCT;
  }, [selectedProductType]);
  
  // 상품 타입 변경 시 카테고리 초기화
  useEffect(() => {
    setValue("category", "");
  }, [selectedProductType, setValue]);
  
  // SEO 미리보기 자동 업데이트
  useEffect(() => {
    if (watchedValues.title && watchedValues.shortDescription) {
      const seoData = generateSeoData({
        title: watchedValues.title,
        shortDescription: watchedValues.shortDescription,
        description: watchedValues.description,
        productType: watchedValues.productType as ProductType,
        price: watchedValues.price,
        tags: watchedValues.tags,
        category: watchedValues.category,
        isAiGenerated: aiGeneratedData.isAiGenerated,
        aiTool: aiGeneratedData.aiTool || null,
      });
      setSeoPreview({
        slug: seoData.slug,
        metaDescription: seoData.metaDescription,
        keywords: seoData.keywords,
      });
    }
  }, [watchedValues.title, watchedValues.shortDescription, watchedValues.description, watchedValues.productType, watchedValues.price, watchedValues.tags, watchedValues.category, aiGeneratedData]);

  // 내 튜토리얼 목록 불러오기
  useEffect(() => {
    const fetchMyTutorials = async () => {
      setIsLoadingTutorials(true);
      try {
        const response = await fetch("/api/tutorials?myOnly=true&limit=100");
        if (response.ok) {
          const data = await response.json();
          setMyTutorials(data.tutorials || []);
        }
      } catch (error) {
        console.error("Failed to fetch tutorials:", error);
      } finally {
        setIsLoadingTutorials(false);
      }
    };
    fetchMyTutorials();
  }, []);

  // 튜토리얼 선택/해제
  const handleTutorialSelect = (tutorialId: string) => {
    const isSelected = selectedTutorials.some(t => t.tutorialId === tutorialId);
    if (isSelected) {
      setSelectedTutorials(prev => prev.filter(t => t.tutorialId !== tutorialId));
    } else {
      setSelectedTutorials(prev => [...prev, { tutorialId, type: "TUTORIAL" }]);
    }
  };

  // 튜토리얼 연결 유형 변경
  const handleTutorialTypeChange = (tutorialId: string, type: "TUTORIAL" | "MAKING" | "TIPS") => {
    setSelectedTutorials(prev => 
      prev.map(t => t.tutorialId === tutorialId ? { ...t, type } : t)
    );
  };

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 10) {
      setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleImageUpload = (file: { name: string; url: string; path: string }) => {
    if (uploadedImages.length < 5) {
      setUploadedImages((prev) => [...prev, file]);
    }
  };

  const handleImageDelete = (path: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.path !== path));
  };

  const handleFileUpload = (file: { name: string; url: string; path: string }) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  const handleFileDelete = (path: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.path !== path));
  };

  const onSubmit = async (data: ProductFormData, isDraft: boolean = false) => {
    // 튜토리얼 필수 검증 (임시저장이 아닌 경우)
    if (!isDraft && selectedTutorials.length === 0) {
      toast.error("튜토리얼을 연결해주세요", {
        description: "상품 등록을 위해서는 최소 1개의 튜토리얼이 필요합니다.",
      });
      setStep(7); // 튜토리얼 단계로 이동
      return;
    }
    
    // 상품 타입별 메타데이터 검증
    if (!isDraft) {
      if (data.productType === "BOOK" && !bookMeta.bookType) {
        toast.error("도서 정보를 입력해주세요", {
          description: "도서 타입은 필수 항목입니다.",
        });
        setStep(3);
        return;
      }
      if (data.productType === "VIDEO_SERIES" && !videoMeta.videoType) {
        toast.error("영상 정보를 입력해주세요", {
          description: "영상 타입은 필수 항목입니다.",
        });
        setStep(3);
        return;
      }
      if (data.productType === "MUSIC_ALBUM" && !musicMeta.artist) {
        toast.error("음악 정보를 입력해주세요", {
          description: "아티스트명은 필수 항목입니다.",
        });
        setStep(3);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // SEO 데이터 생성
      const seoData = generateSeoData({
        title: data.title,
        shortDescription: data.shortDescription,
        description: data.description,
        productType: data.productType as ProductType,
        price: data.price,
        tags: data.tags,
        category: data.category,
        isAiGenerated: aiGeneratedData.isAiGenerated,
        aiTool: aiGeneratedData.aiTool || null,
        bookMeta: data.productType === "BOOK" ? {
          author: bookMeta.author || null,
          publisher: bookMeta.publisher || null,
          isbn: bookMeta.isbn || null,
          pageCount: bookMeta.pageCount || null,
          language: bookMeta.language || "ko",
          bookType: bookMeta.bookType,
        } : undefined,
        videoMeta: data.productType === "VIDEO_SERIES" ? {
          director: videoMeta.director || null,
          duration: videoMeta.duration || null,
          episodes: videoMeta.episodes || null,
          videoType: videoMeta.videoType,
          trailerUrl: videoMeta.trailerUrl || null,
          genre: videoMeta.genre || [],
        } : undefined,
        musicMeta: data.productType === "MUSIC_ALBUM" ? {
          artist: musicMeta.artist || null,
          trackCount: musicMeta.trackCount || null,
          totalDuration: musicMeta.totalDuration || null,
          genre: musicMeta.genre,
          albumType: musicMeta.albumType || null,
        } : undefined,
      });

      const productData = {
        ...data,
        isDraft,
        images: uploadedImages.map((img) => img.url),
        files: uploadedFiles.map((file) => ({
          name: file.name,
          url: file.url,
        })),
        tutorials: selectedTutorials,
        // SEO 데이터
        slug: seoData.slug,
        metaDescription: seoData.metaDescription,
        keywords: seoData.keywords,
        // AI 생성 정보
        isAiGenerated: aiGeneratedData.isAiGenerated,
        aiTool: aiGeneratedData.isAiGenerated ? aiGeneratedData.aiTool : null,
        aiPrompt: aiGeneratedData.isAiGenerated ? aiGeneratedData.aiPrompt : null,
        // 메타데이터 (상품 타입별)
        bookMeta: data.productType === "BOOK" ? bookMeta : undefined,
        videoMeta: data.productType === "VIDEO_SERIES" ? videoMeta : undefined,
        musicMeta: data.productType === "MUSIC_ALBUM" ? musicMeta : undefined,
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "상품 등록에 실패했습니다");
      }

      const result = await response.json();
      
      if (isDraft) {
        toast.success('임시저장되었습니다', {
          description: '언제든지 이어서 작성할 수 있습니다.',
        });
      } else {
        toast.success('상품이 등록되었습니다! 🎉', {
          description: 'SEO 최적화가 자동 적용되었습니다.',
          action: {
            label: '상품 보기',
            onClick: () => router.push(`/marketplace/${result.id}`),
          },
        });
      }
      
      router.push("/dashboard/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error instanceof Error ? error.message : "상품 등록에 실패했습니다", {
        description: '입력 내용을 확인하고 다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 총 스텝 수 계산 (상품 타입에 따라 메타데이터 스텝 추가)
  const totalSteps = selectedProductType === "DIGITAL_PRODUCT" ? 6 : 7;
  
  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  
  // 스텝 정의
  const getSteps = () => {
    const baseSteps = [
      { num: 1, label: "상품 타입" },
      { num: 2, label: "기본 정보" },
    ];
    
    if (selectedProductType !== "DIGITAL_PRODUCT") {
      baseSteps.push({ num: 3, label: "메타 정보" });
    }
    
    const nextNum = selectedProductType !== "DIGITAL_PRODUCT" ? 4 : 3;
    baseSteps.push(
      { num: nextNum, label: "상세 설명" },
      { num: nextNum + 1, label: "파일 업로드" },
      { num: nextNum + 2, label: "가격 설정" },
      { num: nextNum + 3, label: "튜토리얼" },
    );
    
    return baseSteps;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            새 상품 등록
          </h1>
          <p className="text-[var(--text-tertiary)] mt-1">
            디지털 상품을 등록하고 판매를 시작하세요
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto pb-2">
          {getSteps().map((s, i, arr) => (
            <div key={s.num} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors",
                    step >= s.num
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"
                  )}
                >
                  {s.num}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs mt-2 hidden sm:block text-center whitespace-nowrap",
                    step >= s.num
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)]"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div
                  className={cn(
                    "w-8 sm:w-12 h-0.5 mx-1 sm:mx-2",
                    step > s.num
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--bg-border)]"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
        {/* Step 1: Product Type Selection */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card variant="glass" className="max-w-3xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-violet)]/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-[var(--accent-violet)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      상품 타입 선택
                    </h2>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      등록하려는 상품의 종류를 선택해주세요
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {productTypeOptions.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setValue("productType", type.id)}
                      className={cn(
                        "p-6 rounded-xl border-2 text-left transition-all",
                        selectedProductType === type.id
                          ? "border-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-[var(--bg-border)] hover:border-[var(--primary)]/50"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                        selectedProductType === type.id
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"
                      )}>
                        {type.icon}
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                        {type.name}
                      </h3>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        {type.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* 타입 변경 시 카테고리 안내 */}
                <div className="mt-6 p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)]">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-[var(--accent-cyan)] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-[var(--text-primary)] mb-1">
                        상품 타입 안내
                      </h4>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        {selectedProductType === "DIGITAL_PRODUCT" && "소스코드, 템플릿, 플러그인, 디자인 에셋 등 디지털 제품을 등록합니다."}
                        {selectedProductType === "BOOK" && "전자책, 만화, 오디오북 등 도서 콘텐츠를 등록합니다. 저자, ISBN 등 도서 정보를 입력할 수 있습니다."}
                        {selectedProductType === "VIDEO_SERIES" && "영화, 애니메이션, 다큐멘터리 등 영상 콘텐츠를 등록합니다. 에피소드, 재생시간 등을 입력할 수 있습니다."}
                        {selectedProductType === "MUSIC_ALBUM" && "음악 앨범, 싱글, BGM 등 음원을 등록합니다. 아티스트, 트랙 정보 등을 입력할 수 있습니다."}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card variant="glass" className="max-w-3xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      기본 정보
                    </h2>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      상품의 기본적인 정보를 입력해주세요
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      상품명 *
                    </label>
                    <Input
                      {...register("title")}
                      placeholder="예: AI 기반 스마트 할일 관리 앱"
                      error={errors.title?.message}
                    />
                    {/* SEO Slug 미리보기 */}
                    {seoPreview?.slug && (
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        URL: /marketplace/{seoPreview.slug}
                      </p>
                    )}
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      간단한 설명 *
                    </label>
                    <Input
                      {...register("shortDescription")}
                      placeholder="상품을 한 줄로 설명해주세요"
                      error={errors.shortDescription?.message}
                    />
                  </div>

                  {/* Category - 상품 타입별 */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      카테고리 *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {currentCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setValue("category", cat.id)}
                          className={cn(
                            "p-3 rounded-lg border text-center transition-all",
                            selectedCategory === cat.id
                              ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-primary)]"
                              : "border-[var(--bg-border)] hover:border-[var(--primary)]/50 text-[var(--text-tertiary)]"
                          )}
                        >
                          <span className="text-xl mb-1 block">{cat.icon}</span>
                          <span className="text-xs">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                    {errors.category && (
                      <p className="text-sm text-[var(--semantic-error)] mt-1">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      태그 * (최대 10개)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="태그 입력 후 Enter"
                        icon={<Tag className="w-4 h-4" />}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTag}
                      >
                        추가
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 p-0.5 hover:bg-[var(--bg-border)] rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    {errors.tags && (
                      <p className="text-sm text-[var(--semantic-error)] mt-1">
                        {errors.tags.message}
                      </p>
                    )}
                  </div>
                  
                  {/* AI Generated Info Section */}
                  <div className="pt-4 border-t border-[var(--bg-border)]">
                    <AiGeneratedForm
                      data={aiGeneratedData}
                      onChange={setAiGeneratedData}
                    />
                  </div>
                  
                  {/* SEO Preview */}
                  {seoPreview && (
                    <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)]">
                      <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        SEO 미리보기
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-[var(--accent-cyan)]">
                          {process.env.NEXT_PUBLIC_BASE_URL || 'https://vibe-olympics.onrender.com'}/marketplace/{seoPreview.slug}
                        </p>
                        <p className="text-[var(--text-primary)] font-medium">
                          {watchedValues.title || '제목'}
                        </p>
                        <p className="text-sm text-[var(--text-tertiary)]">
                          {seoPreview.metaDescription}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {seoPreview.keywords.slice(0, 5).map((kw, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-[var(--bg-border)] text-[var(--text-tertiary)]">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Meta Info (for non-digital products) */}
        {step === 3 && selectedProductType !== "DIGITAL_PRODUCT" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card variant="glass" className="max-w-3xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-cyan)]/10 flex items-center justify-center">
                    {selectedProductType === "BOOK" && <Book className="w-5 h-5 text-[var(--accent-cyan)]" />}
                    {selectedProductType === "VIDEO_SERIES" && <Film className="w-5 h-5 text-[var(--accent-cyan)]" />}
                    {selectedProductType === "MUSIC_ALBUM" && <Music className="w-5 h-5 text-[var(--accent-cyan)]" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      {selectedProductType === "BOOK" && "도서 정보"}
                      {selectedProductType === "VIDEO_SERIES" && "영상 정보"}
                      {selectedProductType === "MUSIC_ALBUM" && "음악 정보"}
                    </h2>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      {selectedProductType === "BOOK" && "도서에 대한 상세 정보를 입력해주세요"}
                      {selectedProductType === "VIDEO_SERIES" && "영상에 대한 상세 정보를 입력해주세요"}
                      {selectedProductType === "MUSIC_ALBUM" && "음악에 대한 상세 정보를 입력해주세요"}
                    </p>
                  </div>
                </div>

                {selectedProductType === "BOOK" && (
                  <BookMetaForm data={bookMeta} onChange={setBookMeta} />
                )}
                {selectedProductType === "VIDEO_SERIES" && (
                  <VideoSeriesMetaForm data={videoMeta} onChange={setVideoMeta} />
                )}
                {selectedProductType === "MUSIC_ALBUM" && (
                  <MusicAlbumMetaForm data={musicMeta} onChange={setMusicMeta} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3 or 4: Description */}
        {((step === 3 && selectedProductType === "DIGITAL_PRODUCT") || 
          (step === 4 && selectedProductType !== "DIGITAL_PRODUCT")) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card variant="glass" className="max-w-3xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-cyan)]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[var(--accent-cyan)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      상세 설명
                    </h2>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      상품에 대한 자세한 설명을 작성해주세요
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      상세 설명 * (Markdown 지원)
                    </label>
                    <MarkdownEditor
                      value={watchedValues.description || ""}
                      onChange={(value) => setValue("description", value, { shouldValidate: true })}
                      placeholder={`상품에 대한 자세한 설명을 작성해주세요.

## 주요 기능
- 기능 1
- 기능 2

## 기술 스택
- Next.js
- TypeScript

## 포함된 파일
- 소스 코드
- 문서`}
                      minHeight="400px"
                      maxHeight="600px"
                    />
                    {errors.description && (
                      <p className="text-sm text-[var(--semantic-error)] mt-1">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Tips */}
                  <div className="p-4 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-[var(--text-primary)] mb-1">
                          좋은 설명 작성 팁
                        </h4>
                        <ul className="text-sm text-[var(--text-tertiary)] space-y-1">
                          <li>• 주요 기능과 특징을 명확히 설명하세요</li>
                          <li>• 사용된 기술 스택을 나열하세요</li>
                          <li>• 포함된 파일 목록을 작성하세요</li>
                          <li>• 설치 및 사용 방법을 안내하세요</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4 or 5: File Upload */}
        {((step === 4 && selectedProductType === "DIGITAL_PRODUCT") || 
          (step === 5 && selectedProductType !== "DIGITAL_PRODUCT")) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card variant="glass" className="max-w-3xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-violet)]/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-[var(--accent-violet)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      파일 업로드
                    </h2>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      상품 이미지와 판매 파일을 업로드해주세요
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                      상품 이미지 (최대 5개)
                    </label>
                    
                    {/* Uploaded Images Preview */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
                        {uploadedImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="aspect-video rounded-lg relative group overflow-hidden"
                          >
                            <img
                              src={img.url}
                              alt={img.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleImageDelete(img.path)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--semantic-error)] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {uploadedImages.length < 5 && (
                      <FileUpload
                        type="image"
                        onUpload={handleImageUpload}
                        onDelete={handleImageDelete}
                        multiple
                        maxSize={5}
                        label="상품 이미지 업로드"
                        hint="JPG, PNG, WebP 파일 (최대 5MB)"
                      />
                    )}
                  </div>

                  {/* Files */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                      판매 파일 *
                    </label>
                    
                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {uploadedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)]"
                          >
                            <div className="flex items-center gap-3">
                              <FileCode className="w-5 h-5 text-[var(--primary)]" />
                              <div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                  {file.name}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleFileDelete(file.path)}
                              className="p-1 text-[var(--text-tertiary)] hover:text-[var(--semantic-error)]"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <FileUpload
                      type="product"
                      onUpload={handleFileUpload}
                      onDelete={handleFileDelete}
                      multiple
                      maxSize={100}
                      label="판매 파일 업로드"
                      hint="ZIP, RAR, PDF 등 (최대 100MB)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5 or 6: Pricing */}
        {((step === 5 && selectedProductType === "DIGITAL_PRODUCT") || 
          (step === 6 && selectedProductType !== "DIGITAL_PRODUCT")) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card variant="glass" className="max-w-3xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-green)]/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[var(--accent-green)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      가격 설정
                    </h2>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      상품 가격과 라이선스를 설정해주세요
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Free Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)]">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        무료 상품으로 등록
                      </p>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        무료로 배포하여 인지도를 높이세요
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFree}
                        onChange={(e) => {
                          setValue("isFree", e.target.checked);
                          if (e.target.checked) setValue("price", 0);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[var(--bg-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                    </label>
                  </div>

                  {/* Price Input */}
                  {!isFree && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        판매 가격 (KRW) *
                      </label>
                      <Input
                        type="number"
                        {...register("price", { valueAsNumber: true })}
                        placeholder="0"
                        icon={<span className="text-sm">₩</span>}
                        error={errors.price?.message}
                      />
                      <p className="text-xs text-[var(--text-tertiary)] mt-2">
                        수수료 10%가 차감된 후 정산됩니다
                      </p>
                    </div>
                  )}

                  {/* License */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                      라이선스 *
                    </label>
                    <div className="space-y-3">
                      {licenseOptions.map((license) => (
                        <label
                          key={license.id}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all",
                            watchedValues.license === license.id
                              ? "border-[var(--primary)] bg-[var(--primary)]/5"
                              : "border-[var(--bg-border)] hover:border-[var(--primary)]/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              {...register("license")}
                              value={license.id}
                              className="w-4 h-4 text-[var(--primary)]"
                            />
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">
                                {license.name}
                              </p>
                              <p className="text-sm text-[var(--text-tertiary)]">
                                {license.description}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)]">
                    <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      미리보기
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-tertiary)]">
                          판매 가격
                        </p>
                        <p className="text-2xl font-bold text-[var(--text-primary)]">
                          {isFree
                            ? "무료"
                            : `₩${(watchedValues.price || 0).toLocaleString()}`}
                        </p>
                      </div>
                      {!isFree && (
                        <div className="text-right">
                          <p className="text-sm text-[var(--text-tertiary)]">
                            예상 수익 (수수료 10% 제외)
                          </p>
                          <p className="text-lg font-semibold text-[var(--accent-green)]">
                            ₩
                            {Math.floor(
                              (watchedValues.price || 0) * 0.9
                            ).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 6 or 7: Tutorial Connection */}
        {((step === 6 && selectedProductType === "DIGITAL_PRODUCT") || 
          (step === 7 && selectedProductType !== "DIGITAL_PRODUCT")) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card variant="glass" className="max-w-3xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-cyan)]/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[var(--accent-cyan)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      튜토리얼 연결
                    </h2>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      상품과 관련된 튜토리얼을 연결해주세요 (최소 1개 필수)
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 중요 안내 */}
                  <div className="p-4 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-[var(--text-primary)] mb-1">
                          왜 튜토리얼이 필요한가요?
                        </h4>
                        <ul className="text-sm text-[var(--text-tertiary)] space-y-1">
                          <li>• 구매자가 상품을 더 잘 이해하고 활용할 수 있습니다</li>
                          <li>• 구매 전환율과 만족도가 높아집니다</li>
                          <li>• 리뷰와 평점 향상에 도움이 됩니다</li>
                          <li>• 환불 요청이 감소합니다</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 선택된 튜토리얼 */}
                  {selectedTutorials.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                        선택된 튜토리얼 ({selectedTutorials.length}개)
                      </label>
                      <div className="space-y-3">
                        {selectedTutorials.map((selected) => {
                          const tutorial = myTutorials.find(t => t.id === selected.tutorialId);
                          if (!tutorial) return null;
                          return (
                            <div
                              key={selected.tutorialId}
                              className="flex items-center justify-between p-4 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-10 rounded bg-[var(--bg-elevated)] overflow-hidden flex-shrink-0">
                                  {tutorial.thumbnail ? (
                                    <img
                                      src={tutorial.thumbnail}
                                      alt={tutorial.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <BookOpen className="w-4 h-4 text-[var(--text-tertiary)]" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-[var(--text-primary)] text-sm">
                                    {tutorial.title}
                                  </p>
                                  <select
                                    value={selected.type}
                                    onChange={(e) => handleTutorialTypeChange(
                                      selected.tutorialId,
                                      e.target.value as "TUTORIAL" | "MAKING" | "TIPS"
                                    )}
                                    className="mt-1 text-xs bg-transparent border border-[var(--bg-border)] rounded px-2 py-1 text-[var(--text-tertiary)]"
                                  >
                                    {tutorialTypes.map((type) => (
                                      <option key={type.id} value={type.id}>
                                        {type.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleTutorialSelect(selected.tutorialId)}
                                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--semantic-error)]"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 내 튜토리얼 목록 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        내 튜토리얼에서 선택
                      </label>
                      <Link href="/education" target="_blank">
                        <Button type="button" variant="ghost" size="sm" className="gap-1 text-xs">
                          <Plus className="w-3 h-3" />
                          새 튜토리얼 작성
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>

                    {isLoadingTutorials ? (
                      <div className="text-center py-8 text-[var(--text-tertiary)]">
                        튜토리얼 목록을 불러오는 중...
                      </div>
                    ) : myTutorials.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
                        <p className="text-[var(--text-tertiary)] mb-4">
                          아직 작성한 튜토리얼이 없습니다
                        </p>
                        <Link href="/education" target="_blank">
                          <Button type="button" variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" />
                            튜토리얼 작성하기
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {myTutorials.map((tutorial) => {
                          const isSelected = selectedTutorials.some(
                            t => t.tutorialId === tutorial.id
                          );
                          return (
                            <button
                              key={tutorial.id}
                              type="button"
                              onClick={() => handleTutorialSelect(tutorial.id)}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                                isSelected
                                  ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                  : "border-[var(--bg-border)] hover:border-[var(--primary)]/50"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                isSelected
                                  ? "border-[var(--primary)] bg-[var(--primary)]"
                                  : "border-[var(--bg-border)]"
                              )}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="w-16 h-10 rounded bg-[var(--bg-elevated)] overflow-hidden flex-shrink-0">
                                {tutorial.thumbnail ? (
                                  <img
                                    src={tutorial.thumbnail}
                                    alt={tutorial.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-[var(--text-tertiary)]" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                                  {tutorial.title}
                                </p>
                                <p className="text-xs text-[var(--text-tertiary)] truncate">
                                  {tutorial.description}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {tutorial.type === "tutorial" ? "튜토리얼" :
                                 tutorial.type === "making" ? "제작기" :
                                 tutorial.type === "tips" ? "팁" : "외부 자료"}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 검증 메시지 */}
                  {selectedTutorials.length === 0 && (
                    <p className="text-sm text-[var(--semantic-error)]">
                      ⚠️ 최소 1개의 튜토리얼을 선택해주세요
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between max-w-3xl mx-auto mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            이전
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              임시 저장
            </Button>

            {step < totalSteps ? (
              <Button type="button" variant="neon" onClick={nextStep}>
                다음
              </Button>
            ) : (
              <Button
                type="submit"
                variant="neon"
                isLoading={isSubmitting}
                disabled={selectedTutorials.length === 0}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                상품 등록
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
