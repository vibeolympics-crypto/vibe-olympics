import { Metadata } from "next";
import { CommunityContent } from "./community-content";

export const metadata: Metadata = {
  title: "커뮤니티 - 창작자 소통 공간",
  description: "VIBE 코딩 창작자들과 소통하세요. 자유게시판, Q&A, 피드백 등 다양한 주제로 의견을 나눌 수 있습니다.",
  keywords: [
    "VIBE 코딩 커뮤니티",
    "AI 개발자 커뮤니티",
    "창작자 소통",
    "프롬프트 공유",
    "노코드 Q&A",
    "AI 프로젝트 피드백",
  ],
  openGraph: {
    title: "커뮤니티 - Vibe Olympics",
    description: "VIBE 코딩 창작자들과 소통하세요.",
    url: "https://vibeolympics.com/community",
  },
};

export default function CommunityPage() {
  return <CommunityContent />;
}
