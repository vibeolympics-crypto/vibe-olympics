/**
 * AI 이미지 분석 API
 * 상품 이미지 자동 태깅, 색상 분석, 품질 검사
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  analyzeImage,
  analyzeImages,
  extractAutoTags,
  ImageAnalysisResult,
} from '@/lib/image-analysis';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 로그인 필수
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, imageUrl, imageUrls } = body;

    switch (action) {
      case 'analyze': {
        if (!imageUrl) {
          return NextResponse.json(
            { error: 'imageUrl이 필요합니다.' },
            { status: 400 }
          );
        }

        const result = await analyzeImage(imageUrl);
        const autoTags = extractAutoTags(result);

        return NextResponse.json({
          success: true,
          data: {
            ...result,
            autoTags,
          },
        });
      }

      case 'batch': {
        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
          return NextResponse.json(
            { error: 'imageUrls 배열이 필요합니다.' },
            { status: 400 }
          );
        }

        if (imageUrls.length > 10) {
          return NextResponse.json(
            { error: '한 번에 최대 10개의 이미지만 분석할 수 있습니다.' },
            { status: 400 }
          );
        }

        const batchResult = await analyzeImages(imageUrls);

        return NextResponse.json({
          success: true,
          data: batchResult,
        });
      }

      case 'tags': {
        if (!imageUrl) {
          return NextResponse.json(
            { error: 'imageUrl이 필요합니다.' },
            { status: 400 }
          );
        }

        const result = await analyzeImage(imageUrl);
        const autoTags = extractAutoTags(result);

        return NextResponse.json({
          success: true,
          data: {
            tags: result.tags,
            autoTags,
            suggestedCategories: result.tags
              .filter(t => t.category === 'subject')
              .map(t => t.localized || t.name),
          },
        });
      }

      case 'colors': {
        if (!imageUrl) {
          return NextResponse.json(
            { error: 'imageUrl이 필요합니다.' },
            { status: 400 }
          );
        }

        const result = await analyzeImage(imageUrl);

        return NextResponse.json({
          success: true,
          data: {
            colors: result.colors,
            metadata: result.metadata,
          },
        });
      }

      case 'quality': {
        if (!imageUrl) {
          return NextResponse.json(
            { error: 'imageUrl이 필요합니다.' },
            { status: 400 }
          );
        }

        const result = await analyzeImage(imageUrl);

        return NextResponse.json({
          success: true,
          data: {
            quality: result.quality,
            composition: result.composition,
            suggestions: result.suggestions,
            metadata: result.metadata,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: '유효하지 않은 action입니다. (analyze, batch, tags, colors, quality)' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: '이미지 분석에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 데모 분석 결과
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const demoType = searchParams.get('demo') || 'single';

    // 데모용 이미지 URL
    const demoUrls = [
      'https://example.com/demo-image-1.jpg',
      'https://example.com/demo-image-2.jpg',
      'https://example.com/demo-image-3.jpg',
    ];

    if (demoType === 'batch') {
      const batchResult = await analyzeImages(demoUrls);
      return NextResponse.json({
        success: true,
        data: batchResult,
        demo: true,
      });
    }

    const result = await analyzeImage(demoUrls[0]);
    const autoTags = extractAutoTags(result);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        autoTags,
      },
      demo: true,
    });
  } catch (error) {
    console.error('Demo image analysis error:', error);
    return NextResponse.json(
      { error: '데모 분석에 실패했습니다.' },
      { status: 500 }
    );
  }
}
