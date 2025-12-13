/**
 * AI 가격 추천 API
 * 시장 분석 기반 최적 가격 제안
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generatePriceRecommendation,
  generateBulkPriceRecommendations,
  analyzePriceHistory,
  analyzeCompetitorPrices,
  type ProductInfo,
  type PricingConfig,
} from '@/lib/pricing-recommendation';

export const dynamic = 'force-dynamic';

// POST: 가격 추천 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 관리자 또는 판매자만 접근 가능
    const userRole = session?.user?.role ?? '';
    if (!session?.user || !['ADMIN', 'SELLER'].includes(userRole)) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, product, products, config, priceHistory, competitorPrices } = body as {
      action: 'single' | 'bulk' | 'history' | 'competitors';
      product?: ProductInfo;
      products?: ProductInfo[];
      config?: PricingConfig;
      priceHistory?: { price: number; sales: number; date: Date }[];
      competitorPrices?: number[];
    };

    switch (action) {
      case 'single': {
        if (!product) {
          return NextResponse.json(
            { error: '상품 정보가 필요합니다.' },
            { status: 400 }
          );
        }
        const recommendation = generatePriceRecommendation(product, config);
        return NextResponse.json({
          success: true,
          data: recommendation,
        });
      }

      case 'bulk': {
        if (!products || products.length === 0) {
          return NextResponse.json(
            { error: '상품 목록이 필요합니다.' },
            { status: 400 }
          );
        }
        const recommendations = generateBulkPriceRecommendations(products, config);
        return NextResponse.json({
          success: true,
          data: recommendations,
          count: recommendations.length,
        });
      }

      case 'history': {
        if (!priceHistory || priceHistory.length === 0) {
          return NextResponse.json(
            { error: '가격 히스토리가 필요합니다.' },
            { status: 400 }
          );
        }
        const analysis = analyzePriceHistory(priceHistory);
        return NextResponse.json({
          success: true,
          data: analysis,
        });
      }

      case 'competitors': {
        if (!competitorPrices || competitorPrices.length === 0) {
          return NextResponse.json(
            { error: '경쟁사 가격 정보가 필요합니다.' },
            { status: 400 }
          );
        }
        const analysis = analyzeCompetitorPrices(competitorPrices);
        return NextResponse.json({
          success: true,
          data: analysis,
        });
      }

      default:
        return NextResponse.json(
          { error: '지원하지 않는 작업입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Price recommendation error:', error);
    return NextResponse.json(
      { error: '가격 추천 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 데모 가격 추천
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId') || 'demo-product';
    const productName = searchParams.get('productName') || '샘플 디지털 아트워크';
    const category = searchParams.get('category') || 'artwork';
    const currentPrice = searchParams.get('currentPrice');

    const demoProduct: ProductInfo = {
      id: productId,
      name: productName,
      category,
      currentPrice: currentPrice ? parseInt(currentPrice) : 50000,
      quality: 'high',
      targetAudience: 'mid-range',
      uniqueFeatures: ['고해상도', '상업적 사용 가능', '원본 파일 포함'],
    };

    const recommendation = generatePriceRecommendation(demoProduct, {
      competitiveStrategy: 'balanced',
      considerSeasonality: true,
      considerTrend: true,
    });

    return NextResponse.json({
      success: true,
      data: recommendation,
      isDemo: true,
    });
  } catch (error) {
    console.error('Demo price recommendation error:', error);
    return NextResponse.json(
      { error: '데모 가격 추천 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
