import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 미리보기 콘텐츠 타입
interface PreviewContent {
  type: "SAMPLE_PAGES" | "TRAILER" | "AUDIO_PREVIEW" | "DEMO" | "SCREENSHOTS";
  url: string;
  thumbnailUrl?: string;
  duration?: number; // 초 단위 (영상/음악)
  pageCount?: number; // 샘플 페이지 수 (도서)
  title?: string;
  description?: string;
}

// GET: 상품 미리보기 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const slug = searchParams.get("slug");

    if (!productId && !slug) {
      return NextResponse.json(
        { error: "상품 ID 또는 slug가 필요합니다" },
        { status: 400 }
      );
    }

    // 상품 조회
    const product = await prisma.product.findUnique({
      where: productId ? { id: productId } : { slug: slug! },
      include: {
        bookMeta: true,
        videoSeriesMeta: true,
        musicAlbumMeta: true,
        files: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (!product.isPublished) {
      return NextResponse.json(
        { error: "비공개 상품입니다" },
        { status: 403 }
      );
    }

    // 미리보기 파일 필터링
    const previewFiles = product.files.filter(f => 
      f.url.includes("preview") || f.url.includes("sample") || f.url.includes("demo")
    );

    // 미리보기 콘텐츠 구성
    const previews: PreviewContent[] = [];

    switch (product.productType) {
      case "BOOK":
        // 도서: 샘플 페이지, PDF 미리보기
        if (product.bookMeta) {
          const bookMeta = product.bookMeta as unknown as Record<string, unknown>;
          
          // 샘플 페이지 이미지
          if (bookMeta.samplePages && Array.isArray(bookMeta.samplePages)) {
            previews.push({
              type: "SAMPLE_PAGES",
              url: bookMeta.samplePages[0] as string,
              thumbnailUrl: product.thumbnail || undefined,
              pageCount: (bookMeta.samplePages as string[]).length,
              title: "샘플 페이지",
              description: `${(bookMeta.samplePages as string[]).length}페이지 미리보기`,
            });
          }
          
          // PDF 미리보기 파일
          const pdfPreview = previewFiles.find(f => f.url.includes(".pdf"));
          if (pdfPreview) {
            previews.push({
              type: "SAMPLE_PAGES",
              url: pdfPreview.url,
              title: "PDF 샘플",
              description: "PDF 형식 미리보기",
            });
          }
        }
        break;

      case "VIDEO_SERIES":
        // 영상: 트레일러, 미리보기 클립
        if (product.previewUrl) {
          previews.push({
            type: "TRAILER",
            url: product.previewUrl,
            thumbnailUrl: product.thumbnail || undefined,
            title: "트레일러",
            description: "영상 미리보기",
          });
        }

        if (product.videoSeriesMeta) {
          const videoMeta = product.videoSeriesMeta as unknown as Record<string, unknown>;
          
          // 트레일러 URL
          if (videoMeta.trailerUrl) {
            previews.push({
              type: "TRAILER",
              url: videoMeta.trailerUrl as string,
              thumbnailUrl: product.thumbnail || undefined,
              duration: videoMeta.trailerDuration as number || 60,
              title: "공식 트레일러",
              description: `${Math.floor((videoMeta.trailerDuration as number || 60) / 60)}분 ${(videoMeta.trailerDuration as number || 60) % 60}초`,
            });
          }
          
          // 미리보기 클립들
          if (videoMeta.previewClips && Array.isArray(videoMeta.previewClips)) {
            (videoMeta.previewClips as Array<{ url: string; title: string; duration: number }>).forEach((clip, idx) => {
              previews.push({
                type: "TRAILER",
                url: clip.url,
                duration: clip.duration,
                title: clip.title || `미리보기 ${idx + 1}`,
              });
            });
          }
        }
        break;

      case "MUSIC_ALBUM":
        // 음악: 30초 미리듣기, 트랙 프리뷰
        if (product.previewUrl) {
          previews.push({
            type: "AUDIO_PREVIEW",
            url: product.previewUrl,
            thumbnailUrl: product.thumbnail || undefined,
            duration: 30,
            title: "대표곡 미리듣기",
            description: "30초 미리듣기",
          });
        }

        if (product.musicAlbumMeta) {
          const musicMeta = product.musicAlbumMeta as unknown as Record<string, unknown>;
          
          // 트랙별 프리뷰
          if (musicMeta.trackPreviews && Array.isArray(musicMeta.trackPreviews)) {
            (musicMeta.trackPreviews as Array<{ url: string; title: string; duration: number }>).forEach((track, idx) => {
              previews.push({
                type: "AUDIO_PREVIEW",
                url: track.url,
                duration: track.duration || 30,
                title: track.title || `Track ${idx + 1}`,
                description: `${track.duration || 30}초 미리듣기`,
              });
            });
          }
          
          // 앨범 전체 미리듣기
          if (musicMeta.albumPreviewUrl) {
            previews.push({
              type: "AUDIO_PREVIEW",
              url: musicMeta.albumPreviewUrl as string,
              thumbnailUrl: product.thumbnail || undefined,
              duration: musicMeta.albumPreviewDuration as number || 120,
              title: "앨범 미리듣기",
              description: "하이라이트 믹스",
            });
          }
        }
        break;

      case "DIGITAL_PRODUCT":
      default:
        // 디지털 상품: 데모, 스크린샷
        if (product.previewUrl) {
          previews.push({
            type: "DEMO",
            url: product.previewUrl,
            thumbnailUrl: product.thumbnail || undefined,
            title: "라이브 데모",
            description: "상품 데모 체험",
          });
        }

        // 스크린샷 이미지들
        if (product.images && product.images.length > 0) {
          previews.push({
            type: "SCREENSHOTS",
            url: product.images[0],
            thumbnailUrl: product.images[0],
            title: "스크린샷",
            description: `${product.images.length}개의 이미지`,
          });
        }

        // 미리보기 파일
        const demoFile = previewFiles.find(f => f.url.includes("demo") || f.url.includes("preview"));
        if (demoFile) {
          previews.push({
            type: "DEMO",
            url: demoFile.url,
            title: "데모 파일",
            description: "다운로드 가능한 데모",
          });
        }
        break;
    }

    // 공통: 이미지 갤러리
    if (product.images && product.images.length > 0 && product.productType !== "DIGITAL_PRODUCT") {
      previews.push({
        type: "SCREENSHOTS",
        url: product.images[0],
        thumbnailUrl: product.images[0],
        title: "이미지 갤러리",
        description: `${product.images.length}개의 이미지`,
      });
    }

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        productType: product.productType,
        thumbnail: product.thumbnail,
      },
      previews,
      hasPreview: previews.length > 0,
      previewCount: previews.length,
    });
  } catch (error) {
    console.error("Preview GET error:", error);
    return NextResponse.json(
      { error: "미리보기 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
