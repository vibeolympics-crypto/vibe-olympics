import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = 'force-dynamic';

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 Vibe Olympics 마켓플레이스의 친절한 AI 어시스턴트입니다.

## Vibe Olympics 소개
Vibe Olympics는 VIBE 코딩(AI 활용 개발)으로 만든 디지털 상품을 거래하는 마켓플레이스입니다.

## 주요 기능
1. **마켓플레이스**: 웹앱, 모바일앱, 자동화 도구, AI/ML 프로젝트 등 판매
2. **교육 센터**: 튜토리얼, 제작기, 팁 & 트릭 공유
3. **커뮤니티**: 개발자 커뮤니티, Q&A, 피드백
4. **판매자 대시보드**: 상품 관리, 매출 분석, 정산

## 응답 가이드라인
- 한국어로 친근하게 대화하세요
- 질문에 정확하고 유용한 정보를 제공하세요
- 상품 구매, 판매, 사용법에 대한 안내를 잘 해주세요
- 기술적인 질문도 친절하게 설명해주세요
- 모르는 것은 솔직하게 모른다고 말하세요

## 자주 묻는 질문
- 수수료: 플랫폼 수수료 10% + PG 수수료 3.5%
- 정산: 매월 말일 기준, 익월 15일 정산
- 라이선스: 개인용, 상업용, 확장 라이선스 제공
- 환불: 구매 후 7일 이내, 미사용 시 전액 환불 가능`;

export async function POST(request: NextRequest) {
  try {
    // API 키 확인
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { 
          message: "현재 AI 서비스가 준비 중입니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 200 }
      );
    }

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "메시지가 필요합니다" },
        { status: 400 }
      );
    }

    // Anthropic API 호출
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // 빠른 응답을 위해 Haiku 모델 사용
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    // 응답 텍스트 추출
    const textContent = response.content.find((block) => block.type === "text");
    const messageText = textContent && "text" in textContent ? textContent.text : "응답을 생성하지 못했습니다.";

    return NextResponse.json({
      message: messageText,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    
    // 개발 환경에서 에러 상세 정보 출력
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Chat API error details:", errorMessage);
    
    // API 키 오류 또는 기타 오류 처리
    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { 
          message: "AI 서비스 설정이 필요합니다. 관리자에게 문의해주세요.",
        },
        { status: 200 }
      );
    }
    
    // 크레딧 부족 에러 처리
    if (errorMessage.includes("credit") || errorMessage.includes("balance")) {
      return NextResponse.json(
        { 
          message: "AI 서비스 크레딧이 부족합니다. 관리자에게 문의해주세요.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        message: "죄송합니다, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        // 개발 환경에서만 에러 상세 정보 포함
        ...(process.env.NODE_ENV === "development" && { error: errorMessage }),
      },
      { status: 200 }
    );
  }
}
