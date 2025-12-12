import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { recordProductCreated } from "@/lib/realtime-events";

export const dynamic = 'force-dynamic';

// 도서 메타데이터 스키마
const bookMetaSchema = z.object({
  bookType: z.enum(["EBOOK", "COMIC", "PICTURE_BOOK", "PRINT_BOOK", "AUDIO_BOOK"]).optional(),
  author: z.string().optional(),
  publisher: z.string().optional(),
  isbn: z.string().optional(),
  pageCount: z.number().nullable().optional(),
  chapters: z.number().nullable().optional(),
  language: z.string().optional(),
  format: z.array(z.string()).optional(),
  ageRating: z.string().optional(),
  seriesName: z.string().optional(),
  seriesOrder: z.number().nullable().optional(),
}).optional();

// 영상 메타데이터 스키마
const videoMetaSchema = z.object({
  videoType: z.enum(["MOVIE", "ANIMATION", "DOCUMENTARY", "SHORT_FILM", "SERIES"]).optional(),
  director: z.string().optional(),
  cast: z.array(z.string()).optional(),
  duration: z.number().nullable().optional(),
  episodes: z.number().nullable().optional(),
  seasons: z.number().nullable().optional(),
  resolution: z.string().optional(),
  audioFormat: z.string().optional(),
  subtitles: z.array(z.string()).optional(),
  ageRating: z.string().optional(),
  genre: z.array(z.string()).optional(),
  trailerUrl: z.string().optional(),
  seriesName: z.string().optional(),
  seriesOrder: z.number().nullable().optional(),
}).optional();

// 음악 메타데이터 스키마
const musicMetaSchema = z.object({
  artist: z.string().optional(),
  albumType: z.string().optional(),
  genre: z.enum(["POP", "ROCK", "HIPHOP", "RNB", "ELECTRONIC", "CLASSICAL", "JAZZ", "AMBIENT", "SOUNDTRACK", "WORLD", "OTHER"]).optional(),
  subGenre: z.string().optional(),
  mood: z.array(z.string()).optional(),
  trackCount: z.number().nullable().optional(),
  totalDuration: z.number().nullable().optional(),
  format: z.array(z.string()).optional(),
  bitrate: z.string().optional(),
  sampleRate: z.string().optional(),
  theme: z.string().optional(),
  hasLyrics: z.boolean().optional(),
  isInstrumental: z.boolean().optional(),
}).optional();

// 상품 생성 스키마
const createProductSchema = z.object({
  // 상품 타입
  productType: z.enum(["DIGITAL_PRODUCT", "BOOK", "VIDEO_SERIES", "MUSIC_ALBUM"]).optional(),
  title: z.string().min(5, "제목은 5자 이상이어야 합니다").max(100),
  shortDescription: z.string().min(10).max(200),
  description: z.string().min(50, "설명은 50자 이상이어야 합니다"),
  // categoryId 또는 category(slug) 모두 지원
  categoryId: z.string().cuid().optional(),
  category: z.string().optional(),
  // pricingType 또는 isFree 모두 지원
  pricingType: z.enum(["FREE", "PAID"]).optional(),
  isFree: z.boolean().optional(),
  price: z.number().min(0).optional(),
  originalPrice: z.number().min(0).optional(),
  // licenseType 또는 license 모두 지원
  licenseType: z.enum(["PERSONAL", "COMMERCIAL", "EXTENDED"]).optional(),
  license: z.string().optional(),
  thumbnail: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  // 파일 업로드 데이터
  files: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional(),
  tags: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW"]).optional(),
  isDraft: z.boolean().optional(),
  // 튜토리얼 연결 (DRAFT이 아닌 경우 필수)
  tutorials: z.array(z.object({
    tutorialId: z.string(),
    type: z.enum(["TUTORIAL", "MAKING", "TIPS"]).optional(),
  })).optional(),
  // AI 생성 정보
  isAiGenerated: z.boolean().optional(),
  aiTool: z.string().nullable().optional(),
  aiPrompt: z.string().nullable().optional(),
  // SEO 관련 필드
  slug: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  // 상품 타입별 메타데이터
  bookMeta: bookMetaSchema,
  videoMeta: videoMetaSchema,
  musicMeta: musicMetaSchema,
});

// 상품 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    
    // 페이지네이션 파라미터 유효성 검사
    const page = parseInt(pageParam || "1");
    const limit = parseInt(limitParam || "12");
    
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "Invalid page parameter. Page must be a positive integer." },
        { status: 400 }
      );
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit parameter. Limit must be between 1 and 100." },
        { status: 400 }
      );
    }
    
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "latest";
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const pricingType = searchParams.get("pricingType");
    const sellerId = searchParams.get("sellerId");
    const isFree = searchParams.get("isFree");
    
    // 필터 조건
    const where: Record<string, unknown> = {};

    // sellerId가 없을 때만 공개 상품만 조회 (일반 마켓플레이스)
    // sellerId가 있으면 내 상품 관리 페이지이므로 모든 상태 조회
    if (!sellerId) {
      where.status = "PUBLISHED";
      where.isPublished = true;
    }

    if (category) {
      // category가 CUID 형태인지 slug 형태인지 판단
      if (category.length === 25 && category.startsWith('c')) {
        where.categoryId = category;
      } else {
        where.category = { slug: category };
      }
    }

    if (pricingType) {
      where.pricingType = pricingType;
    }

    // isFree 파라미터 처리
    if (isFree === "true") {
      where.pricingType = "FREE";
    } else if (isFree === "false") {
      where.pricingType = "PAID";
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    // 정렬
    let orderBy: Record<string, string> = { createdAt: "desc" };
    
    // sortBy 파라미터 우선 처리 (새로운 방식)
    if (sortBy) {
      const order = sortOrder === "asc" ? "asc" : "desc";
      switch (sortBy) {
        case "createdAt":
          orderBy = { createdAt: order };
          break;
        case "downloadCount":
          orderBy = { downloadCount: order };
          break;
        case "price":
          orderBy = { price: order };
          break;
        case "rating":
          orderBy = { averageRating: order };
          break;
        case "salesCount":
          orderBy = { salesCount: order };
          break;
        default:
          orderBy = { createdAt: order };
      }
    } else {
      // 기존 sort 파라미터 처리 (하위 호환성)
      switch (sort) {
        case "popular":
          orderBy = { salesCount: "desc" };
          break;
        case "rating":
          orderBy = { averageRating: "desc" };
          break;
        case "price-low":
          orderBy = { price: "asc" };
          break;
        case "price-high":
          orderBy = { price: "desc" };
          break;
      }
    }

    // 상품 조회
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          seller: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: { reviews: true, wishlists: true },
          },
          bookMeta: true,
          videoSeriesMeta: true,
          musicAlbumMeta: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    // 프론트엔드 호환성을 위해 필드 매핑
    const mappedProducts = products.map(product => ({
      ...product,
      thumbnailUrl: product.thumbnail,
      rating: product.averageRating,
    }));

    return NextResponse.json({
      products: mappedProducts,
      pagination: {
        page,
        limit,
        total,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { error: "상품 목록을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 상품 생성 (POST)
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 유효성 검사
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 카테고리 ID 결정 (categoryId가 없으면 category slug로 조회)
    let categoryId = data.categoryId;
    if (!categoryId && data.category) {
      const category = await prisma.category.findUnique({
        where: { slug: data.category },
      });
      if (!category) {
        return NextResponse.json(
          { error: "유효하지 않은 카테고리입니다" },
          { status: 400 }
        );
      }
      categoryId = category.id;
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "카테고리를 선택해주세요" },
        { status: 400 }
      );
    }

    // pricingType 결정 (isFree로부터)
    const pricingType = data.pricingType || (data.isFree ? "FREE" : "PAID");

    // licenseType 결정 (license로부터)
    const licenseTypeMap: Record<string, "PERSONAL" | "COMMERCIAL" | "EXTENDED"> = {
      personal: "PERSONAL",
      commercial: "COMMERCIAL",
      extended: "EXTENDED",
    };
    const licenseType = data.licenseType || licenseTypeMap[data.license || "personal"] || "PERSONAL";

    // status 결정 (isDraft로부터)
    const status = data.status || (data.isDraft ? "DRAFT" : "PENDING_REVIEW");

    // 튜토리얼 필수 검증 (임시저장이 아닌 경우)
    const isDraft = status === "DRAFT";
    if (!isDraft && (!data.tutorials || data.tutorials.length === 0)) {
      return NextResponse.json(
        { error: "상품 등록을 위해서는 최소 1개의 튜토리얼을 연결해야 합니다" },
        { status: 400 }
      );
    }

    // 연결할 튜토리얼 검증 (존재 여부 및 본인 작성 여부)
    if (data.tutorials && data.tutorials.length > 0) {
      const tutorialIds = data.tutorials.map(t => t.tutorialId);
      const existingTutorials = await prisma.tutorial.findMany({
        where: {
          id: { in: tutorialIds },
          authorId: session.user.id,
        },
        select: { id: true },
      });

      if (existingTutorials.length !== tutorialIds.length) {
        return NextResponse.json(
          { error: "유효하지 않은 튜토리얼이 포함되어 있습니다. 본인이 작성한 튜토리얼만 연결할 수 있습니다." },
          { status: 400 }
        );
      }
    }

    // slug 생성 (클라이언트에서 제공하거나 자동 생성)
    const slug = data.slug || await generateUniqueSlug(data.title);

    // 상품 타입 결정
    const productType = data.productType || "DIGITAL_PRODUCT";

    // 상품 생성
    const product = await prisma.product.create({
      data: {
        title: data.title,
        shortDescription: data.shortDescription,
        description: data.description,
        categoryId,
        pricingType,
        licenseType,
        slug,
        productType,
        sellerId: session.user.id,
        price: pricingType === "FREE" ? 0 : (data.price || 0),
        originalPrice: data.originalPrice,
        thumbnail: data.thumbnail || (data.images?.[0] || null),
        images: data.images || [],
        tags: data.tags || [],
        features: data.features || [],
        techStack: data.techStack || [],
        status,
        // AI 생성 정보
        isAiGenerated: data.isAiGenerated || false,
        aiTool: data.aiTool || null,
        aiPrompt: data.aiPrompt || null,
        // 파일 생성 (있는 경우)
        files: data.files?.length ? {
          create: data.files.map((file) => ({
            name: file.name,
            url: file.url,
            size: 0, // 업로드 시 크기를 알 수 없으므로 기본값
            type: "application/octet-stream", // 기본 MIME 타입
          })),
        } : undefined,
        // 튜토리얼 연결 (있는 경우)
        tutorials: data.tutorials?.length ? {
          create: data.tutorials.map((tutorial, index) => ({
            tutorialId: tutorial.tutorialId,
            type: tutorial.type || "TUTORIAL",
            sortOrder: index,
          })),
        } : undefined,
        // 도서 메타데이터 (있는 경우)
        bookMeta: productType === "BOOK" && data.bookMeta ? {
          create: {
            bookType: data.bookMeta.bookType || "EBOOK",
            author: data.bookMeta.author || null,
            publisher: data.bookMeta.publisher || null,
            isbn: data.bookMeta.isbn || null,
            pageCount: data.bookMeta.pageCount || null,
            chapters: data.bookMeta.chapters || null,
            language: data.bookMeta.language || "ko",
            format: data.bookMeta.format || [],
            ageRating: data.bookMeta.ageRating || null,
            seriesName: data.bookMeta.seriesName || null,
            seriesOrder: data.bookMeta.seriesOrder || null,
          },
        } : undefined,
        // 영상 메타데이터 (있는 경우)
        videoSeriesMeta: productType === "VIDEO_SERIES" && data.videoMeta ? {
          create: {
            videoType: data.videoMeta.videoType || "MOVIE",
            director: data.videoMeta.director || null,
            cast: data.videoMeta.cast || [],
            duration: data.videoMeta.duration || null,
            episodes: data.videoMeta.episodes || null,
            seasons: data.videoMeta.seasons || null,
            resolution: data.videoMeta.resolution || null,
            audioFormat: data.videoMeta.audioFormat || null,
            subtitles: data.videoMeta.subtitles || [],
            ageRating: data.videoMeta.ageRating || null,
            genre: data.videoMeta.genre || [],
            trailerUrl: data.videoMeta.trailerUrl || null,
            seriesName: data.videoMeta.seriesName || null,
            seriesOrder: data.videoMeta.seriesOrder || null,
          },
        } : undefined,
        // 음악 메타데이터 (있는 경우)
        musicAlbumMeta: productType === "MUSIC_ALBUM" && data.musicMeta ? {
          create: {
            artist: data.musicMeta.artist || null,
            albumType: data.musicMeta.albumType || null,
            genre: data.musicMeta.genre || "OTHER",
            subGenre: data.musicMeta.subGenre || null,
            mood: data.musicMeta.mood || [],
            trackCount: data.musicMeta.trackCount || null,
            totalDuration: data.musicMeta.totalDuration || null,
            format: data.musicMeta.format || [],
            bitrate: data.musicMeta.bitrate || null,
            sampleRate: data.musicMeta.sampleRate || null,
            theme: data.musicMeta.theme || null,
            hasLyrics: data.musicMeta.hasLyrics || false,
            isInstrumental: data.musicMeta.isInstrumental || false,
            previewTracks: [],
          },
        } : undefined,
      },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true, image: true },
        },
        files: true,
        tutorials: {
          include: {
            tutorial: {
              select: {
                id: true,
                title: true,
                type: true,
                thumbnail: true,
              },
            },
          },
        },
        bookMeta: true,
        videoSeriesMeta: true,
        musicAlbumMeta: true,
      },
    });

    // 실시간 이벤트 기록 (임시저장이 아닌 경우, 관리자 대시보드용)
    if (status !== "DRAFT") {
      recordProductCreated(
        session.user.id,
        session.user.name || "판매자",
        product.id,
        product.title
      );
    }

    return NextResponse.json(
      { message: "상품이 생성되었습니다", product },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json(
      { error: "상품 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 고유 slug 생성 함수
async function generateUniqueSlug(title: string): Promise<string> {
  // 한글을 영문으로 변환하거나 제거하고 슬러그 생성
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);

  // 고유성 확인
  let slug = baseSlug;
  let counter = 1;
  
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
