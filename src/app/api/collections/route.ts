import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { generateSlug } from "@/lib/seo-utils";

// 컬렉션 생성 스키마
const createCollectionSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(100),
  description: z.string().optional(),
  thumbnail: z.string().url().optional().or(z.literal("")),
  type: z.enum(["SERIES", "BUNDLE", "PLAYLIST", "CURATED"]).default("BUNDLE"),
  productType: z.enum(["DIGITAL_PRODUCT", "BOOK", "VIDEO_SERIES", "MUSIC_ALBUM"]).optional(),
  bundlePrice: z.number().min(0).optional(),
  discountRate: z.number().min(0).max(100).optional(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  items: z.array(z.object({
    productId: z.string(),
    order: z.number().optional(),
    itemDiscountRate: z.number().min(0).max(100).optional(),
    isRequired: z.boolean().default(true),
  })).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.array(z.string()).optional(),
});

// 컬렉션 수정 스키마
const updateCollectionSchema = createCollectionSchema.partial();

// 컬렉션 타입별 한글 이름
const COLLECTION_TYPE_LABELS: Record<string, string> = {
  SERIES: "시리즈",
  BUNDLE: "번들",
  PLAYLIST: "플레이리스트",
  CURATED: "큐레이션",
};

// NOTE: Prisma 스키마에 Collection 모델이 추가되었으나,
// prisma generate 실행 후 이 파일의 전체 기능이 활성화됩니다.
// 현재는 Prisma 클라이언트 재생성 전이므로 임시 응답을 반환합니다.

// GET: 컬렉션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    
    // 임시: Prisma generate 전에는 빈 응답
    // TODO: prisma generate 후 실제 구현 활성화
    
    if (slug) {
      return NextResponse.json(
        { error: "컬렉션을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      collections: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      message: "Prisma generate 실행 후 컬렉션 기능이 활성화됩니다.",
    });
  } catch (error) {
    console.error("Collections GET error:", error);
    return NextResponse.json(
      { error: "컬렉션 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 컬렉션 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = createCollectionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "입력 데이터가 유효하지 않습니다", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    
    // 임시: slug 생성 테스트
    const slug = generateSlug(data.title);

    // TODO: prisma generate 후 실제 DB 저장 구현
    return NextResponse.json({
      id: "temp-" + Date.now(),
      ...data,
      slug,
      sellerId: session.user.id,
      viewCount: 0,
      salesCount: 0,
      createdAt: new Date().toISOString(),
      message: "Prisma generate 실행 후 실제 저장됩니다.",
    }, { status: 201 });
  } catch (error) {
    console.error("Collections POST error:", error);
    return NextResponse.json(
      { error: "컬렉션 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 컬렉션 수정
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "컬렉션 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const validationResult = updateCollectionSchema.safeParse(updateData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "입력 데이터가 유효하지 않습니다", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // TODO: prisma generate 후 실제 DB 업데이트 구현
    return NextResponse.json({
      id,
      ...validationResult.data,
      updatedAt: new Date().toISOString(),
      message: "Prisma generate 실행 후 실제 업데이트됩니다.",
    });
  } catch (error) {
    console.error("Collections PATCH error:", error);
    return NextResponse.json(
      { error: "컬렉션 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 컬렉션 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "컬렉션 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // TODO: prisma generate 후 실제 DB 삭제 구현
    return NextResponse.json({ 
      success: true,
      message: "Prisma generate 실행 후 실제 삭제됩니다.",
    });
  } catch (error) {
    console.error("Collections DELETE error:", error);
    return NextResponse.json(
      { error: "컬렉션 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// Export labels and schema for use elsewhere
export { COLLECTION_TYPE_LABELS, createCollectionSchema };
