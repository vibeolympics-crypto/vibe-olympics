import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  generateAIDescription,
  generateLocalDescription,
  generateDescriptionVariants,
  suggestImprovements,
  type ProductDescriptionInput,
} from "@/lib/ai-description";

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/description
 * AI 상품 설명 생성
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { action, ...input } = body;
    
    // 입력 유효성 검사
    if (!input.title) {
      return NextResponse.json(
        { error: "상품 제목이 필요합니다." },
        { status: 400 }
      );
    }
    
    const descriptionInput: ProductDescriptionInput = {
      title: input.title,
      category: input.category || "일반",
      productType: input.productType || "DIGITAL_PRODUCT",
      keywords: input.keywords || [],
      existingDescription: input.existingDescription,
      price: input.price,
      targetAudience: input.targetAudience,
      language: input.language || "ko",
    };
    
    switch (action) {
      case "generate": {
        // AI 설명 생성
        const result = await generateAIDescription(descriptionInput);
        
        return NextResponse.json({
          success: true,
          result,
          generatedAt: new Date().toISOString(),
        });
      }
      
      case "generate-local": {
        // 로컬 생성 (AI API 미사용)
        const result = generateLocalDescription(descriptionInput);
        
        return NextResponse.json({
          success: true,
          result,
          generatedAt: new Date().toISOString(),
        });
      }
      
      case "variants": {
        // 여러 버전 생성
        const count = input.count || 3;
        const variants = await generateDescriptionVariants(descriptionInput, count);
        
        return NextResponse.json({
          success: true,
          variants,
          count: variants.length,
          generatedAt: new Date().toISOString(),
        });
      }
      
      case "improve": {
        // 기존 설명 개선 제안
        if (!input.existingDescription) {
          return NextResponse.json(
            { error: "개선할 기존 설명이 필요합니다." },
            { status: 400 }
          );
        }
        
        const suggestions = suggestImprovements(
          input.existingDescription,
          input.language || "ko"
        );
        
        // 개선된 버전도 함께 생성
        const improvedVersion = await generateAIDescription({
          ...descriptionInput,
          existingDescription: input.existingDescription,
        });
        
        return NextResponse.json({
          success: true,
          suggestions,
          improvedVersion,
          generatedAt: new Date().toISOString(),
        });
      }
      
      default:
        return NextResponse.json(
          { error: "유효하지 않은 action입니다. (generate, generate-local, variants, improve)" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("AI description generation error:", error);
    return NextResponse.json(
      { 
        error: "설명 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
