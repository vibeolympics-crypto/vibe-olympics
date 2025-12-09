/**
 * Cloudinary 파일 스토리지 라이브러리
 * 이미지/동영상 업로드, 변환, 최적화 처리
 */

import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// 업로드 옵션 타입
export interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  };
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  tags?: string[];
}

// 업로드 결과 타입
export interface UploadResult {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  error?: string;
}

/**
 * Base64 또는 URL에서 이미지 업로드
 */
export async function uploadImage(
  file: string, // base64 또는 URL
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const uploadOptions: Record<string, unknown> = {
      folder: options.folder || 'vibe-olympics',
      resource_type: options.resourceType || 'auto',
      tags: options.tags || [],
    };

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    if (options.transformation) {
      uploadOptions.transformation = [
        {
          width: options.transformation.width,
          height: options.transformation.height,
          crop: options.transformation.crop || 'fill',
          quality: options.transformation.quality || 'auto',
          fetch_format: options.transformation.format || 'auto',
        },
      ];
    }

    const result: UploadApiResponse = await cloudinary.uploader.upload(file, uploadOptions);

    return {
      success: true,
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error) {
    const uploadError = error as UploadApiErrorResponse;
    console.error('Cloudinary upload error:', uploadError);
    return {
      success: false,
      error: uploadError.message || '이미지 업로드에 실패했습니다.',
    };
  }
}

/**
 * 상품 썸네일 업로드 (최적화된 설정)
 */
export async function uploadProductThumbnail(
  file: string,
  productId: string
): Promise<UploadResult> {
  return uploadImage(file, {
    folder: 'vibe-olympics/products/thumbnails',
    publicId: `product-${productId}-${Date.now()}`,
    transformation: {
      width: 800,
      height: 600,
      crop: 'fill',
      quality: 'auto',
      format: 'webp',
    },
    tags: ['product', 'thumbnail'],
  });
}

/**
 * 상품 갤러리 이미지 업로드
 */
export async function uploadProductGallery(
  file: string,
  productId: string,
  index: number
): Promise<UploadResult> {
  return uploadImage(file, {
    folder: 'vibe-olympics/products/gallery',
    publicId: `product-${productId}-gallery-${index}-${Date.now()}`,
    transformation: {
      width: 1200,
      height: 900,
      crop: 'fit',
      quality: 'auto',
      format: 'webp',
    },
    tags: ['product', 'gallery'],
  });
}

/**
 * 프로필 이미지 업로드 (정사각형 크롭)
 */
export async function uploadProfileImage(
  file: string,
  userId: string
): Promise<UploadResult> {
  return uploadImage(file, {
    folder: 'vibe-olympics/profiles',
    publicId: `profile-${userId}`,
    transformation: {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto',
      format: 'webp',
    },
    tags: ['profile', 'avatar'],
  });
}

/**
 * 커뮤니티 게시글 이미지 업로드
 */
export async function uploadPostImage(
  file: string,
  postId: string
): Promise<UploadResult> {
  return uploadImage(file, {
    folder: 'vibe-olympics/posts',
    publicId: `post-${postId}-${Date.now()}`,
    transformation: {
      width: 1200,
      height: 800,
      crop: 'fit',
      quality: 'auto',
      format: 'webp',
    },
    tags: ['post', 'community'],
  });
}

/**
 * 튜토리얼 썸네일 업로드
 */
export async function uploadTutorialThumbnail(
  file: string,
  tutorialId: string
): Promise<UploadResult> {
  return uploadImage(file, {
    folder: 'vibe-olympics/tutorials',
    publicId: `tutorial-${tutorialId}-${Date.now()}`,
    transformation: {
      width: 1280,
      height: 720,
      crop: 'fill',
      quality: 'auto',
      format: 'webp',
    },
    tags: ['tutorial', 'education'],
  });
}

/**
 * 이미지 삭제
 */
export async function deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: '이미지 삭제에 실패했습니다.',
    };
  }
}

/**
 * Cloudinary URL 생성 (변환 적용)
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop || 'fill',
        quality: options.quality || 'auto',
        fetch_format: options.format || 'auto',
      },
    ],
    secure: true,
  });
}

/**
 * 서명된 업로드 URL 생성 (클라이언트 직접 업로드용)
 */
export function generateSignedUploadUrl(
  folder: string = 'vibe-olympics',
  tags: string[] = []
): { signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string } {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const paramsToSign = {
    timestamp,
    folder,
    tags: tags.join(','),
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}
