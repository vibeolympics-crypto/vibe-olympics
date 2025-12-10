import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

// GET: 컬렉션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const type = searchParams.get("type");
    const productType = searchParams.get("productType");
    const sellerId = searchParams.get("sellerId");
    const isPublished = searchParams.get("isPublished");
    const isFeatured = searchParams.get("isFeatured");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 단일 컬렉션 조회 (slug)
    if (slug) {
      const collection = await prisma.collection.findUnique({
        where: { slug },
        include: {
          seller: {
            select: { id: true, name: true, image: true },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  thumbnail: true,
                  productType: true,
                  averageRating: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      });

      if (!collection) {
        return NextResponse.json(
          { error: "컬렉션을 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      // 조회수 증가
      await prisma.collection.update({
        where: { id: collection.id },
        data: { viewCount: { increment: 1 } },
      });

      // 번들 할인 가격 계산
      const originalTotal = collection.items.reduce(
        (sum, item) => sum + Number(item.product.price || 0),
        0
      );
      const bundlePriceNum = collection.bundlePrice ? Number(collection.bundlePrice) : null;
      const bundleDiscount = bundlePriceNum
        ? originalTotal - bundlePriceNum
        : collection.discountRate
        ? originalTotal * (collection.discountRate / 100)
        : 0;
      const finalPrice = bundlePriceNum || originalTotal - bundleDiscount;

      return NextResponse.json({
        ...collection,
        originalTotal,
        bundleDiscount,
        finalPrice,
        savings: bundleDiscount > 0 ? Math.round((bundleDiscount / originalTotal) * 100) : 0,
      });
    }

    // 필터 조건 구성
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (productType) where.productType = productType;
    if (sellerId) where.sellerId = sellerId;
    if (isPublished === "true") where.isPublished = true;
    if (isPublished === "false") where.isPublished = false;
    if (isFeatured === "true") where.isFeatured = true;

    // 정렬 조건
    const orderBy: Record<string, string> = {};
    if (sortBy === "salesCount") orderBy.salesCount = sortOrder;
    else if (sortBy === "viewCount") orderBy.viewCount = sortOrder;
    else if (sortBy === "title") orderBy.title = sortOrder;
    else orderBy.createdAt = sortOrder;

    // 컬렉션 목록 조회
    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        include: {
          seller: {
            select: { id: true, name: true, image: true },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  thumbnail: true,
                  productType: true,
                },
              },
            },
            orderBy: { order: "asc" },
            take: 4, // 미리보기용 최대 4개
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.collection.count({ where }),
    ]);

    // 각 컬렉션의 번들 가격 정보 추가
    const collectionsWithPricing = await Promise.all(
      collections.map(async (collection) => {
        // 전체 아이템의 가격 합계 조회
        const allItems = await prisma.collectionItem.findMany({
          where: { collectionId: collection.id },
          include: {
            product: { select: { price: true } },
          },
        });

        const originalTotal = allItems.reduce(
          (sum, item) => sum + Number(item.product.price || 0),
          0
        );
        const bundlePriceNum = collection.bundlePrice ? Number(collection.bundlePrice) : null;
        const finalPrice = bundlePriceNum || 
          (collection.discountRate 
            ? originalTotal * (1 - collection.discountRate / 100)
            : originalTotal);

        return {
          ...collection,
          itemCount: collection._count.items,
          originalTotal,
          finalPrice: Math.round(finalPrice),
          savings: originalTotal > 0 
            ? Math.round(((originalTotal - finalPrice) / originalTotal) * 100)
            : 0,
        };
      })
    );

    return NextResponse.json({
      collections: collectionsWithPricing,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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

    const { items, ...data } = validationResult.data;
    
    // 고유 slug 생성
    let slug = generateSlug(data.title);
    const existingSlug = await prisma.collection.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 컬렉션 생성
    const collection = await prisma.collection.create({
      data: {
        ...data,
        slug,
        sellerId: session.user.id,
        thumbnail: data.thumbnail || null,
        metaKeywords: data.metaKeywords || [],
        items: items ? {
          create: items.map((item, index) => ({
            productId: item.productId,
            order: item.order ?? index,
            itemDiscountRate: item.itemDiscountRate,
            isRequired: item.isRequired ?? true,
          })),
        } : undefined,
      },
      include: {
        seller: {
          select: { id: true, name: true, image: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                thumbnail: true,
                productType: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(collection, { status: 201 });
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
    const { id, items, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "컬렉션 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 기존 컬렉션 확인
    const existing = await prisma.collection.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "컬렉션을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (existing.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다" },
        { status: 403 }
      );
    }

    const validationResult = updateCollectionSchema.safeParse(updateData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "입력 데이터가 유효하지 않습니다", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // 아이템 업데이트가 있으면 기존 아이템 삭제 후 재생성
    if (items) {
      await prisma.collectionItem.deleteMany({
        where: { collectionId: id },
      });
    }

    // 컬렉션 업데이트
    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...validationResult.data,
        thumbnail: validationResult.data.thumbnail || null,
        metaKeywords: validationResult.data.metaKeywords || undefined,
        items: items ? {
          create: items.map((item: { productId: string; order?: number; itemDiscountRate?: number; isRequired?: boolean }, index: number) => ({
            productId: item.productId,
            order: item.order ?? index,
            itemDiscountRate: item.itemDiscountRate,
            isRequired: item.isRequired ?? true,
          })),
        } : undefined,
      },
      include: {
        seller: {
          select: { id: true, name: true, image: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                thumbnail: true,
                productType: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(collection);
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

    // 기존 컬렉션 확인
    const existing = await prisma.collection.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "컬렉션을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (existing.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 컬렉션 아이템 먼저 삭제
    await prisma.collectionItem.deleteMany({
      where: { collectionId: id },
    });

    // 컬렉션 삭제
    await prisma.collection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Collections DELETE error:", error);
    return NextResponse.json(
      { error: "컬렉션 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
