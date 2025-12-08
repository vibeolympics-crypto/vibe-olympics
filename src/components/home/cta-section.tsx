"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "무료 회원가입",
  "합리적인 수수료",
  "빠른 정산",
  "전문가 지원",
];

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--accent-violet)] to-[var(--accent-magenta)]" />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 bg-grid opacity-10" />
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-[200px] opacity-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-[200px] opacity-10" />

      <div className="container-app relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
          >
            지금 시작하세요
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto"
          >
            당신의 아이디어가 누군가에게는 꼭 필요한 솔루션입니다.
          </motion.p>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-10"
          >
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-sm text-white">{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/signup">
              <Button
                size="xl"
                className="bg-white text-[var(--primary)] hover:bg-white/90 hover:shadow-lg group"
              >
                무료로 시작하기
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/guide">
              <Button
                size="xl"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                판매자 가이드 보기
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
