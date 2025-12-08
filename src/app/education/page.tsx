import { Metadata } from "next";
import { EducationContent } from "./education-content";

export const metadata: Metadata = {
  title: "교육 센터 - 무료 AI 코딩 학습",
  description: "VIBE 코딩과 AI 도구를 활용한 무료 교육 콘텐츠를 학습하세요. 튜토리얼, 제작기, 팁을 통해 창작자로 성장하세요.",
  keywords: [
    "AI 코딩 교육",
    "VIBE 코딩 튜토리얼",
    "무료 코딩 강의",
    "Claude 사용법",
    "ChatGPT 활용법",
    "Cursor 튜토리얼",
    "프롬프트 엔지니어링 학습",
    "노코드 개발 강좌",
  ],
  openGraph: {
    title: "교육 센터 - Vibe Olympics",
    description: "VIBE 코딩과 AI 도구를 활용한 무료 교육 콘텐츠를 학습하세요.",
    url: "https://vibeolympics.com/education",
  },
};

export default function EducationPage() {
  return <EducationContent />;
}
