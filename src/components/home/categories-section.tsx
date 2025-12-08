"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Zap,
  BarChart3,
  Heart,
  Code2,
  Puzzle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
  {
    icon: Briefcase,
    name: "비즈니스 모델",
    description: "수익 창출을 위한 검증된 비즈니스 템플릿과 전략",
    color: "var(--primary)",
    count: 120,
  },
  {
    icon: Zap,
    name: "업무 자동화",
    description: "반복 작업을 자동화하는 스마트 도구들",
    color: "var(--accent-cyan)",
    count: 85,
  },
  {
    icon: BarChart3,
    name: "데이터 분석",
    description: "데이터 시각화 및 분석 솔루션",
    color: "var(--accent-violet)",
    count: 64,
  },
  {
    icon: Heart,
    name: "라이프스타일",
    description: "일상을 더 편리하게 만드는 유틸리티",
    color: "var(--accent-magenta)",
    count: 98,
  },
  {
    icon: Code2,
    name: "개발 도구",
    description: "개발 생산성을 높이는 도구 모음",
    color: "var(--accent-green)",
    count: 156,
  },
  {
    icon: Puzzle,
    name: "기타",
    description: "다양한 카테고리의 창의적 솔루션",
    color: "var(--accent-amber)",
    count: 77,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function CategoriesSection() {
  return (
    <section className="py-24 bg-[var(--bg-surface)]">
      <div className="container-app">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            Make to Everything
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[var(--text-tertiary)] max-w-2xl mx-auto"
          >
            비즈니스부터 라이프스타일까지, 당신이 필요한 솔루션을 찾아보세요.
          </motion.p>
        </div>

        {/* Categories Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categories.map((category) => (
            <motion.div key={category.name} variants={item}>
              <Card
                variant="default"
                className="group cursor-pointer h-full"
              >
                <CardContent className="p-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{ 
                      backgroundColor: `color-mix(in srgb, ${category.color} 20%, transparent)`,
                    }}
                  >
                    <category.icon
                      className="w-6 h-6 transition-all duration-300"
                      style={{ color: category.color }}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)] mb-4">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-disabled)]">
                      {category.count}개의 상품
                    </span>
                    <span
                      className="text-sm font-medium transition-colors"
                      style={{ color: category.color }}
                    >
                      둘러보기 →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
