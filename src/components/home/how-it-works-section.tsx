"use client";

import { motion } from "framer-motion";
import {
  Upload,
  GraduationCap,
  DollarSign,
  Repeat,
} from "lucide-react";

const steps = [
  {
    step: 1,
    icon: Upload,
    title: "상품 등록",
    description: "당신의 아이디어나 솔루션을 업로드하세요. 설명, 가격, 데모를 함께 등록합니다.",
    color: "var(--accent-cyan)",
  },
  {
    step: 2,
    icon: GraduationCap,
    title: "교육 콘텐츠 제작",
    description: "상품과 함께 교육 콘텐츠를 작성합니다. 튜토리얼, 제작기, 팁을 공유하세요.",
    color: "var(--accent-violet)",
  },
  {
    step: 3,
    icon: DollarSign,
    title: "판매 & 수익",
    description: "검토 후 마켓플레이스에 공개됩니다. 판매가 발생하면 수익이 정산됩니다.",
    color: "var(--accent-magenta)",
  },
  {
    step: 4,
    icon: Repeat,
    title: "성장 & 반복",
    description: "피드백을 반영하고 개선하세요. 더 많은 상품으로 포트폴리오를 확장하세요.",
    color: "var(--accent-green)",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-[var(--bg-surface)]">
      <div className="container-app">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-sm font-medium text-[var(--primary)] mb-4"
          >
            HOW IT WORKS
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            어떻게 시작하나요?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[var(--text-tertiary)] max-w-2xl mx-auto"
          >
            간단한 절차로 창작자가 되어보세요.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-violet)] to-[var(--accent-green)] -translate-y-1/2 mx-24" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="text-center">
                  {/* Step Number with Icon */}
                  <div className="relative inline-flex mb-6">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center bg-[var(--bg-base)] border-2 relative z-10"
                      style={{ borderColor: step.color }}
                    >
                      <step.icon
                        className="w-8 h-8"
                        style={{ color: step.color }}
                      />
                    </div>
                    {/* Step Number Badge */}
                    <div
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white z-20"
                      style={{ backgroundColor: step.color }}
                    >
                      {step.step}
                    </div>
                    {/* Glow Effect */}
                    <div
                      className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                      style={{ backgroundColor: step.color }}
                    />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
