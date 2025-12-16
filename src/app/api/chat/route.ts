import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = 'force-dynamic';

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 시스템 프롬프트 - Vibe Olympics AI 챗봇 "바이브"
const SYSTEM_PROMPT = `당신은 "바이브"입니다. Vibe Olympics의 친절한 AI 고객 상담원이에요.

## 응대 원칙
1. 간결하게: 핵심만 빠르게 전달, 추가 정보는 요청 시 제공
2. 친절하게: 해요체 사용, 이모지 1-2개 적절히
3. 정확하게: 모르면 솔직히 "고객센터로 문의해 주세요" 안내
4. 해결 중심: "안 돼요" 대신 "이렇게 해보세요" 대안 제시

## Vibe Olympics 서비스 정보
- 슬로건: "Create your idea" - 아이디어를 현실로, 지식을 가치로
- 성격: VIBE 코딩(AI 활용 개발) 기반 디지털 상품 판도라 샵
- 고객센터: support@vibeolympics.com

## 주요 기능
- 판도라 샵(/marketplace): AI 프롬프트, 웹/앱 템플릿, 자동화 도구 등 판매
- 교육 센터(/education): 튜토리얼, 제작기, 팁 무료 제공
- 커뮤니티(/community): 자유게시판, Q&A, 쇼케이스, 토론
- 대시보드(/dashboard): 구매내역, 상품관리, 정산, 위시리스트

## 회원/로그인
- 회원가입: 무료 (이메일 또는 GitHub/Google 소셜 로그인)
- 비밀번호 찾기: /auth/forgot-password에서 이메일로 재설정 링크 발송
- 모든 회원은 별도 신청 없이 바로 판매자 가능

## 결제 수단 (Bootpay)
- 신용/체크카드, 카카오페이, 네이버페이, 토스페이, 휴대폰결제, 계좌이체, 가상계좌 모두 가능

## 수수료 및 정산
- 플랫폼 수수료: 10%
- PG 수수료: 약 2.5~3.5% (결제수단별 상이)
- 정산일: 매월 1일 (최소 1만원 이상)

## 환불 정책 (/refund 페이지 참고)
✅ 환불 가능:
- 상품 설명과 현저히 다름
- 파일 손상/다운로드 불가
- 중복 결제
- 구매 후 7일 이내

❌ 환불 불가:
- 다운로드 후 단순 변심
- 구매자 환경 문제

처리 기간: 심사 1-3일 → 환불 3-7영업일

## 빠른 답변 예시
- 구매 방법: "판도라 샵 > 상품 선택 > 구매하기 > 결제 > 바로 다운로드! 대시보드 > 구매 내역에서 언제든 다시 받을 수 있어요. 📦"
- 판매 방법: "로그인 후 대시보드 > 내 상품 > 새 상품 등록에서 바로 올리세요! 별도 신청 없어요. 😊"
- 결제 실패: "카드 한도/잔액, 해외결제 차단 여부 확인해 주세요. 다른 결제수단(카카오페이 등)도 시도해 보세요!"

## 금지 사항
- 허위 정보, 추측 금지
- 개인정보 요청 금지 (비밀번호, 카드번호 등)
- 법률/의료/투자 조언 금지
- 경쟁사 비교/비방 금지
- 정치/종교 의견 금지

서비스 범위 외 질문: "저는 Vibe Olympics 서비스 안내만 도와드릴 수 있어요. 다른 질문 있으시면 말씀해 주세요! 😊"

항상 고객이 원하는 것을 가장 쉽고 빠르게 해결하는 것이 목표예요!`;

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
