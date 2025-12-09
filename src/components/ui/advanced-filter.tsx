"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  DollarSign,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FilterState {
  priceRange: [number, number];
  rating: number;
  pricingType: "all" | "free" | "paid";
  licenses: string[];
  sortBy: string;
  tags: string[];
}

interface AdvancedFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableTags?: string[];
  onReset: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const licenseOptions = [
  { id: "PERSONAL", name: "개인용" },
  { id: "COMMERCIAL", name: "상업용" },
  { id: "EXTENDED", name: "확장 라이선스" },
];

const ratingOptions = [5, 4, 3, 2, 1];

const priceRanges = [
  { label: "전체", value: [0, 1000000] as [number, number] },
  { label: "무료", value: [0, 0] as [number, number] },
  { label: "~₩10,000", value: [1, 10000] as [number, number] },
  { label: "₩10,000~₩50,000", value: [10000, 50000] as [number, number] },
  { label: "₩50,000~₩100,000", value: [50000, 100000] as [number, number] },
  { label: "₩100,000+", value: [100000, 1000000] as [number, number] },
];

export function AdvancedFilter({
  filters,
  onChange,
  availableTags = [],
  onReset,
  isOpen,
  onToggle,
}: AdvancedFilterProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "price",
    "rating",
    "license",
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleLicense = (license: string) => {
    const newLicenses = filters.licenses.includes(license)
      ? filters.licenses.filter((l) => l !== license)
      : [...filters.licenses, license];
    updateFilter("licenses", newLicenses);
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    updateFilter("tags", newTags);
  };

  const activeFilterCount =
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 1000000 ? 1 : 0) +
    (filters.rating > 0 ? 1 : 0) +
    (filters.pricingType !== "all" ? 1 : 0) +
    filters.licenses.length +
    filters.tags.length;

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <Button
        variant={isOpen ? "default" : "outline"}
        onClick={onToggle}
        className="gap-2"
      >
        <Filter className="w-4 h-4" />
        필터
        {activeFilterCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-80 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--bg-border)]">
              <h3 className="font-semibold text-[var(--text-primary)]">
                고급 필터
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="text-xs gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  초기화
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {/* Price Range */}
              <div className="space-y-2">
                <button
                  onClick={() => toggleSection("price")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    가격대
                  </span>
                  {expandedSections.includes("price") ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedSections.includes("price") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {priceRanges.map((range) => {
                          const isSelected =
                            filters.priceRange[0] === range.value[0] &&
                            filters.priceRange[1] === range.value[1];
                          return (
                            <button
                              key={range.label}
                              onClick={() =>
                                updateFilter("priceRange", range.value)
                              }
                              className={cn(
                                "px-3 py-2 rounded-lg text-sm transition-colors",
                                isSelected
                                  ? "bg-[var(--primary)] text-white"
                                  : "bg-[var(--bg-base)] text-[var(--text-secondary)] hover:bg-[var(--bg-border)]"
                              )}
                            >
                              {range.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <button
                  onClick={() => toggleSection("rating")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    평점
                  </span>
                  {expandedSections.includes("rating") ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedSections.includes("rating") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1 pt-2">
                        <button
                          onClick={() => updateFilter("rating", 0)}
                          className={cn(
                            "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                            filters.rating === 0
                              ? "bg-[var(--primary)] text-white"
                              : "hover:bg-[var(--bg-border)]"
                          )}
                        >
                          전체
                        </button>
                        {ratingOptions.map((rating) => (
                          <button
                            key={rating}
                            onClick={() => updateFilter("rating", rating)}
                            className={cn(
                              "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                              filters.rating === rating
                                ? "bg-[var(--primary)] text-white"
                                : "hover:bg-[var(--bg-border)]"
                            )}
                          >
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "w-3 h-3",
                                    i < rating
                                      ? "text-[var(--accent-yellow)] fill-current"
                                      : "text-[var(--text-tertiary)]"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-[var(--text-secondary)]">
                              {rating}점 이상
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* License */}
              <div className="space-y-2">
                <button
                  onClick={() => toggleSection("license")}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-[var(--text-primary)]">
                    라이선스
                  </span>
                  {expandedSections.includes("license") ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedSections.includes("license") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1 pt-2">
                        {licenseOptions.map((option) => {
                          const isSelected = filters.licenses.includes(
                            option.id
                          );
                          return (
                            <button
                              key={option.id}
                              onClick={() => toggleLicense(option.id)}
                              className={cn(
                                "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                                isSelected
                                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                  : "hover:bg-[var(--bg-border)]"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center",
                                  isSelected
                                    ? "bg-[var(--primary)] border-[var(--primary)]"
                                    : "border-[var(--bg-border)]"
                                )}
                              >
                                {isSelected && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              {option.name}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tags */}
              {availableTags.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleSection("tags")}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="font-medium text-[var(--text-primary)]">
                      태그
                    </span>
                    {expandedSections.includes("tags") ? (
                      <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedSections.includes("tags") && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2 pt-2">
                          {availableTags.slice(0, 15).map((tag) => {
                            const isSelected = filters.tags.includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-xs transition-colors",
                                  isSelected
                                    ? "bg-[var(--primary)] text-white"
                                    : "bg-[var(--bg-base)] text-[var(--text-secondary)] hover:bg-[var(--bg-border)]"
                                )}
                              >
                                #{tag}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--bg-border)] bg-[var(--bg-base)]">
              <Button onClick={onToggle} className="w-full">
                필터 적용
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Active Filter Tags Display
interface ActiveFiltersProps {
  filters: FilterState;
  onRemove: (key: keyof FilterState, value?: string) => void;
  onReset: () => void;
}

export function ActiveFilters({ filters, onRemove, onReset }: ActiveFiltersProps) {
  const activeFilters: { key: keyof FilterState; label: string; value?: string }[] = [];

  if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 1000000) {
    const range = priceRanges.find(
      (r) =>
        r.value[0] === filters.priceRange[0] &&
        r.value[1] === filters.priceRange[1]
    );
    activeFilters.push({
      key: "priceRange",
      label: `가격: ${range?.label || "커스텀"}`,
    });
  }

  if (filters.rating > 0) {
    activeFilters.push({ key: "rating", label: `${filters.rating}점 이상` });
  }

  if (filters.pricingType !== "all") {
    activeFilters.push({
      key: "pricingType",
      label: filters.pricingType === "free" ? "무료" : "유료",
    });
  }

  filters.licenses.forEach((license) => {
    const option = licenseOptions.find((o) => o.id === license);
    activeFilters.push({
      key: "licenses",
      label: option?.name || license,
      value: license,
    });
  });

  filters.tags.forEach((tag) => {
    activeFilters.push({ key: "tags", label: `#${tag}`, value: tag });
  });

  if (activeFilters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-sm text-[var(--text-tertiary)]">활성 필터:</span>
      {activeFilters.map((filter, index) => (
        <Badge
          key={`${filter.key}-${filter.value || index}`}
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-[var(--bg-border)]"
          onClick={() => onRemove(filter.key, filter.value)}
        >
          {filter.label}
          <X className="w-3 h-3" />
        </Badge>
      ))}
      <button
        onClick={onReset}
        className="text-sm text-[var(--primary)] hover:underline"
      >
        모두 초기화
      </button>
    </motion.div>
  );
}
