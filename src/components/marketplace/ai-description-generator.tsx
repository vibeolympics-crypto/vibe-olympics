"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  FileText,
  Tag,
  Target,
  Lightbulb,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AIDescriptionResult {
  title: string;
  shortDescription: string;
  longDescription: string;
  seoDescription: string;
  features: string[];
  tags: string[];
  marketingTitle: string;
  callToAction: string;
  targetAudience: string;
  confidence: number;
}

interface AIDescriptionGeneratorProps {
  productTitle?: string;
  productCategory?: string;
  productType?: string;
  existingDescription?: string;
  onApply?: (description: string) => void;
  onApplyAll?: (result: AIDescriptionResult) => void;
  className?: string;
}

export function AIDescriptionGenerator({
  productTitle = "",
  productCategory = "",
  productType = "DIGITAL_PRODUCT",
  existingDescription = "",
  onApply,
  onApplyAll,
  className,
}: AIDescriptionGeneratorProps) {
  const [title, setTitle] = useState(productTitle);
  const [category, setCategory] = useState(productCategory);
  const [keywords, setKeywords] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIDescriptionResult | null>(null);
  const [variants, setVariants] = useState<AIDescriptionResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "variants" | "improve">("generate");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateDescription = async () => {
    if (!title.trim()) {
      setError("상품 제목을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          title: title.trim(),
          category: category.trim() || "일반",
          productType,
          keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
          existingDescription,
          language: "ko",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "생성 실패");
      }

      setResult(data.result);
      setVariants([]);
      setSuggestions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "설명 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateVariants = async () => {
    if (!title.trim()) {
      setError("상품 제목을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "variants",
          title: title.trim(),
          category: category.trim() || "일반",
          productType,
          keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
          count: 3,
          language: "ko",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "생성 실패");
      }

      setVariants(data.variants);
      setResult(null);
      setSuggestions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "변형 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const improveDescription = async () => {
    if (!existingDescription?.trim()) {
      setError("개선할 기존 설명이 필요합니다.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "improve",
          title: title.trim() || "상품",
          category: category.trim() || "일반",
          productType,
          existingDescription,
          language: "ko",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "개선 실패");
      }

      setSuggestions(data.suggestions);
      setResult(data.improvedVersion);
      setVariants([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "개선 분석에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAction = () => {
    switch (activeTab) {
      case "generate":
        generateDescription();
        break;
      case "variants":
        generateVariants();
        break;
      case "improve":
        improveDescription();
        break;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI 상품 설명 생성기
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={activeTab === "generate" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("generate")}
              className="flex-1"
            >
              <Wand2 className="w-4 h-4 mr-1.5" />
              생성
            </Button>
            <Button
              variant={activeTab === "variants" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("variants")}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              변형
            </Button>
            <Button
              variant={activeTab === "improve" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("improve")}
              className="flex-1"
            >
              <Lightbulb className="w-4 h-4 mr-1.5" />
              개선
            </Button>
          </div>

          {/* Input Fields */}
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                상품 제목 <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 프리미엄 일러스트 팩"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  카테고리
                </label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="예: 디자인 에셋"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  키워드 (쉼표 구분)
                </label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="예: 일러스트, 벡터, 아이콘"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <Button
            onClick={handleAction}
            disabled={isLoading}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {activeTab === "generate" && "AI 설명 생성"}
                {activeTab === "variants" && "3개 변형 생성"}
                {activeTab === "improve" && "개선 제안 받기"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Suggestions (Improve Tab) */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                개선 제안
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <ResultCard
            result={result}
            copied={copied}
            onCopy={copyToClipboard}
            onApply={onApply}
            onApplyAll={onApplyAll}
          />
        </motion.div>
      )}

      {/* Variants */}
      {variants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="font-semibold flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            생성된 변형 ({variants.length}개)
          </h3>
          {variants.map((variant, index) => (
            <ResultCard
              key={index}
              result={variant}
              copied={copied}
              onCopy={copyToClipboard}
              onApply={onApply}
              onApplyAll={onApplyAll}
              variant={index + 1}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

interface ResultCardProps {
  result: AIDescriptionResult;
  copied: string | null;
  onCopy: (text: string, id: string) => void;
  onApply?: (description: string) => void;
  onApplyAll?: (result: AIDescriptionResult) => void;
  variant?: number;
}

function ResultCard({
  result,
  copied,
  onCopy,
  onApply,
  onApplyAll,
  variant,
}: ResultCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {variant ? `변형 ${variant}` : "생성 결과"}
            <span className="text-xs text-muted-foreground">
              (신뢰도: {(result.confidence * 100).toFixed(0)}%)
            </span>
          </CardTitle>
          {onApplyAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyAll(result)}
            >
              전체 적용
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Marketing Title */}
        <Section
          title="마케팅 제목"
          content={result.marketingTitle}
          id={`marketing-${variant || 0}`}
          copied={copied}
          onCopy={onCopy}
        />

        {/* Short Description */}
        <Section
          title="짧은 설명"
          content={result.shortDescription}
          id={`short-${variant || 0}`}
          copied={copied}
          onCopy={onCopy}
        />

        {/* Long Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium">상세 설명</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => onCopy(result.longDescription, `long-${variant || 0}`)}
              >
                {copied === `long-${variant || 0}` ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
              {onApply && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => onApply(result.longDescription)}
                >
                  적용
                </Button>
              )}
            </div>
          </div>
          <Textarea
            value={result.longDescription}
            readOnly
            rows={8}
            className="text-sm resize-none"
          />
        </div>

        {/* SEO Description */}
        <Section
          title="SEO 설명"
          content={result.seoDescription}
          id={`seo-${variant || 0}`}
          copied={copied}
          onCopy={onCopy}
        />

        {/* Features */}
        <div>
          <span className="text-sm font-medium block mb-1.5">주요 특징</span>
          <ul className="space-y-1">
            {result.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <ChevronRight className="w-3.5 h-3.5 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Tags */}
        <div>
          <span className="text-sm font-medium flex items-center gap-1 mb-1.5">
            <Tag className="w-3.5 h-3.5" />
            태그
          </span>
          <div className="flex flex-wrap gap-1.5">
            {result.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Target Audience */}
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <Target className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <span className="text-sm font-medium block">타겟 고객</span>
            <span className="text-sm text-muted-foreground">{result.targetAudience}</span>
          </div>
        </div>

        {/* CTA */}
        <Section
          title="행동 유도 문구"
          content={result.callToAction}
          id={`cta-${variant || 0}`}
          copied={copied}
          onCopy={onCopy}
        />
      </CardContent>
    </Card>
  );
}

interface SectionProps {
  title: string;
  content: string;
  id: string;
  copied: string | null;
  onCopy: (text: string, id: string) => void;
}

function Section({ title, content, id, copied, onCopy }: SectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{title}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => onCopy(content, id)}
        >
          {copied === id ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      <p className="text-sm p-3 bg-muted rounded-lg">{content}</p>
    </div>
  );
}
