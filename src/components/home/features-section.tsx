"use client";

import { motion } from "framer-motion";
import {
  Rocket,
  Users,
  GraduationCap,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Rocket,
    title: "빠른 시작",
    description:
      "복잡한 절차 없이 바로 시작하세요. 회원가입부터 첫 판매까지, 단 몇 분이면 충분합니다.",
    color: "var(--accent-cyan)",
  },
  {
    icon: Users,
    title: "커뮤니티 지원",
    description:
      "전문가와 입문자가 함께하는 커뮤니티. 질문하고, 배우고, 성장하세요.",
    color: "var(--accent-violet)",
  },
  {
    icon: GraduationCap,
    title: "무료 교육",
    description:
      "모든 상품에는 교육 콘텐츠가 포함됩니다. 구매 전 무료로 학습하세요.",
    color: "var(--accent-magenta)",
  },
  {
    icon: TrendingUp,
    title: "수익 창출",
    description:
      "당신의 아이디어를 수익으로 전환하세요. 합리적인 수수료, 빠른 정산.",
    color: "var(--accent-green)",
  },
  {
    icon: Shield,
    title: "안전한 거래",
    description:
      "검증된 결제 시스템과 환불 정책으로 안심하고 거래하세요.",
    color: "var(--accent-amber)",
  },
  {
    icon: Sparkles,
    title: "AI 기반",
    description:
      "VIBE 코딩과 AI 도구를 활용한 혁신적인 솔루션들을 만나보세요.",
    color: "var(--primary)",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-[var(--bg-base)] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      
      {/* Gradient Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[var(--primary)] to-transparent opacity-5 blur-[100px]" />

      <div className="container-app relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-sm font-medium text-[var(--primary)] mb-4"
          >
            WHY VIBE OLYMPICS
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            Vibe Olympics
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[var(--text-tertiary)] max-w-2xl mx-auto"
          >
            Vibe Olympics는 창의적인 솔루션을 통해,
            <br />
            당신의 아이디어를 함께 실현합니다.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="relative p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--bg-border)] transition-all duration-300 hover:border-[var(--primary)] hover:shadow-[var(--shadow-glow)]">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${feature.color} 15%, transparent)`,
                  }}
                >
                  <feature.icon
                    className="w-7 h-7"
                    style={{ color: feature.color }}
                  />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-tertiary)] text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Glow Effect */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${feature.color}10 0%, transparent 70%)`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
