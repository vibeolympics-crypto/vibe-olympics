"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Save,
  Send,
  DollarSign,
  Tag,
  Package,
  FileCode,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { cn, formatPrice } from "@/lib/utils";

// 카테고리 목록
const categories = [
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
];

// 라이선스 옵션
const licenseOptions = [
  { id: "personal", name: "개인용", description: "개인 프로젝트에만 사용 가능" },
  { id: "commercial", name: "상업용", description: "상업적 프로젝트에 사용 가능" },
  { id: "extended", name: "확장", description: "재판매 및 SaaS 서비스에 사용 가능" },
];

// Form validation schema
const productSchema = z.object({
  title: z.string().min(5, "제목은 최소 5자 이상이어야 합니다").max(100, "제목은 100자 이하여야 합니다"),
  description: z.string().min(50, "설명은 최소 50자 이상이어야 합니다").max(5000, "설명은 5000자 이하여야 합니다"),
  shortDescription: z.string().min(10, "간단한 설명은 최소 10자 이상이어야 합니다").max(200, "간단한 설명은 200자 이하여야 합니다"),
  category: z.string().min(1, "카테고리를 선택해주세요"),
  price: z.number().min(0, "가격은 0 이상이어야 합니다"),
  isFree: z.boolean(),
  tags: z.array(z.string()).min(1, "최소 1개의 태그를 입력해주세요"),
  license: z.string().min(1, "라이선스를 선택해주세요"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFile {
  id: string;
  name: string;
  url: string;
  size: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  pricingType: string;
  category: { id: string; name: string; slug: string };
  categoryId: string;
  images: string[];
  tags: string[];
  features: string[];
  techStack: string[];
  licenseType: string;
  status: string;
  files: ProductFile[];
}

interface EditProductContentProps {
  product: Product;
}

export function EditProductContent({ product }: EditProductContentProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ name: string; url: string; path: string }[]>(
    product.images.map((url, i) => ({ name: `image-${i}`, url, path: url }))
  );
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; path: string }[]>(
    product.files.map((f) => ({ name: f.name, url: f.url, path: f.url }))
  );
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product.title,
      description: product.description,
      shortDescription: product.shortDescription,
      category: product.category.slug,
      price: product.price,
      isFree: product.pricingType === "FREE",
      tags: product.tags,
      license: product.licenseType,
    },
  });

  const isFree = watch("isFree");
  const tags = watch("tags");
  const selectedCategory = watch("category");

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 10) {
      setValue("tags", [...tags, tagInput.trim()], { shouldDirty: true });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue("tags", tags.filter((tag) => tag !== tagToRemove), { shouldDirty: true });
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

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const productData = {
        ...data,
        images: uploadedImages.map((img) => img.url),
        files: uploadedFiles.map((file) => ({
          name: file.name,
          url: file.url,
        })),
      };

      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "상품 수정에 실패했습니다");
      }

      toast.success("상품이 수정되었습니다! ✨", {
        description: "변경사항이 저장되었습니다.",
        action: {
          label: "상품 보기",
          onClick: () => router.push(`/marketplace/${product.id}`),
        },
      });
      
      router.push("/dashboard/products");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error instanceof Error ? error.message : "상품 수정에 실패했습니다", {
        description: "입력 내용을 확인하고 다시 시도해주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">상품 수정</h1>
          <p className="text-[var(--text-tertiary)] mt-1">{product.title}</p>
        </div>
        <Badge variant={product.status === "PUBLISHED" ? "success" : "warning"}>
          {product.status === "PUBLISHED" ? "판매중" : "임시저장"}
        </Badge>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <Card variant="glass">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Package className="w-5 h-5 text-[var(--primary)]" />
                  기본 정보
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      상품명 *
                    </label>
                    <Input
                      {...register("title")}
                      placeholder="예: AI 기반 웹 분석 대시보드"
                      error={errors.title?.message}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      간단한 설명 *
                    </label>
                    <Textarea
                      {...register("shortDescription")}
                      placeholder="상품을 한 문장으로 설명해주세요"
                      rows={2}
                    />
                    {errors.shortDescription && (
                      <p className="text-sm text-[var(--semantic-error)] mt-1">{errors.shortDescription.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      카테고리 *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setValue("category", cat.id, { shouldDirty: true })}
                          className={cn(
                            "p-3 rounded-lg border text-center transition-all",
                            selectedCategory === cat.id
                              ? "border-[var(--primary)] bg-[var(--primary)]/10"
                              : "border-[var(--bg-border)] hover:border-[var(--primary)]/50"
                          )}
                        >
                          <span className="text-2xl mb-1 block">{cat.icon}</span>
                          <span className="text-xs text-[var(--text-secondary)]">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                    {errors.category && (
                      <p className="text-sm text-[var(--semantic-error)] mt-1">{errors.category.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 상세 설명 */}
            <Card variant="glass">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[var(--primary)]" />
                  상세 설명
                </h2>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    상품 설명 * (마크다운 지원)
                  </label>
                  <Textarea
                    {...register("description")}
                    placeholder="상품의 특징, 사용 방법, 포함된 기능 등을 자세히 설명해주세요..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                  {errors.description && (
                    <p className="text-sm text-[var(--semantic-error)] mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    태그 * (최대 10개)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="태그 입력 후 Enter 또는 추가 버튼"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      추가
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-[var(--semantic-error)]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {errors.tags && (
                    <p className="text-sm text-[var(--semantic-error)] mt-1">{errors.tags.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 이미지 및 파일 */}
            <Card variant="glass">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[var(--primary)]" />
                  이미지 및 파일
                </h2>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    상품 이미지 (최대 5장)
                  </label>
                  
                  {/* 기존 이미지 */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                      {uploadedImages.map((img, idx) => (
                        <div key={img.path} className="relative group aspect-video rounded-lg overflow-hidden border border-[var(--bg-border)]">
                          <Image src={img.url} alt={`상품 이미지 ${idx + 1}`} fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => handleImageDelete(img.path)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-[var(--semantic-error)] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {uploadedImages.length < 5 && (
                    <FileUpload
                      type="image"
                      productId={product.id}
                      accept="image/*"
                      onUpload={handleImageUpload}
                      maxSize={5}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    판매 파일
                  </label>
                  
                  {/* 기존 파일 */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.path}
                          className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)]"
                        >
                          <div className="flex items-center gap-3">
                            <FileCode className="w-5 h-5 text-[var(--primary)]" />
                            <span className="text-sm text-[var(--text-primary)]">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFileDelete(file.path)}
                            className="p-1 hover:text-[var(--semantic-error)] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <FileUpload
                    type="product"
                    productId={product.id}
                    accept=".zip,.rar,.7z,.tar,.gz"
                    onUpload={handleFileUpload}
                    maxSize={100}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* 가격 설정 */}
            <Card variant="glass">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[var(--primary)]" />
                  가격 설정
                </h2>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)]">
                  <input
                    type="checkbox"
                    id="isFree"
                    {...register("isFree")}
                    className="w-5 h-5 rounded border-[var(--bg-border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <label htmlFor="isFree" className="text-sm text-[var(--text-secondary)]">
                    무료로 배포하기
                  </label>
                </div>

                {!isFree && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      판매 가격 (원)
                    </label>
                    <Input
                      type="number"
                      {...register("price", { valueAsNumber: true })}
                      placeholder="0"
                      min={0}
                      step={1000}
                    />
                    {errors.price && (
                      <p className="text-sm text-[var(--semantic-error)] mt-1">{errors.price.message}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 라이선스 */}
            <Card variant="glass">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[var(--primary)]" />
                  라이선스
                </h2>

                <div className="space-y-3">
                  {licenseOptions.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        watch("license") === option.id
                          ? "border-[var(--primary)] bg-[var(--primary)]/10"
                          : "border-[var(--bg-border)] hover:border-[var(--primary)]/50"
                      )}
                    >
                      <input
                        type="radio"
                        {...register("license")}
                        value={option.id}
                        className="mt-1"
                      />
                      <div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{option.name}</span>
                        <p className="text-xs text-[var(--text-tertiary)]">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 저장 버튼 */}
            <div className="space-y-3">
              <Button
                type="submit"
                variant="neon"
                size="lg"
                className="w-full gap-2"
                disabled={isSubmitting || !isDirty}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    변경사항 저장
                  </>
                )}
              </Button>
              <Link href="/dashboard/products" className="block">
                <Button type="button" variant="outline" size="lg" className="w-full">
                  취소
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
