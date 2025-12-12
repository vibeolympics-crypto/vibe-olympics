/**
 * Cloudinary 이미지 업로드 API
 * POST /api/upload/cloudinary - 이미지 업로드 (Cloudinary)
 * GET /api/upload/cloudinary - 클라이언트 직접 업로드용 서명 생성
 * 
 * 기존 /api/upload는 Supabase Storage 사용
 * 이 API는 이미지 최적화가 필요한 경우 사용 (썸네일, 프로필 등)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  uploadImage,
  uploadProductThumbnail,
  uploadProductGallery,
  uploadProfileImage,
  uploadPostImage,
  uploadTutorialThumbnail,
  generateSignedUploadUrl,
} from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 허용된 MIME 타입
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // product-thumbnail, product-gallery, profile, post, tutorial, general
    const entityId = formData.get('entityId') as string | null;
    const index = formData.get('index') as string | null;

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 });
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // MIME 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WebP, SVG만 가능)' },
        { status: 400 }
      );
    }

    // 파일을 base64로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    let result;

    // 업로드 타입에 따른 처리
    switch (type) {
      case 'product-thumbnail':
        if (!entityId) {
          return NextResponse.json({ error: 'entityId가 필요합니다.' }, { status: 400 });
        }
        result = await uploadProductThumbnail(base64, entityId);
        break;

      case 'product-gallery':
        if (!entityId) {
          return NextResponse.json({ error: 'entityId가 필요합니다.' }, { status: 400 });
        }
        result = await uploadProductGallery(base64, entityId, parseInt(index || '0'));
        break;

      case 'profile':
        result = await uploadProfileImage(base64, session.user.id);
        break;

      case 'post':
        result = await uploadPostImage(base64, entityId || 'temp');
        break;

      case 'tutorial':
        if (!entityId) {
          return NextResponse.json({ error: 'entityId가 필요합니다.' }, { status: 400 });
        }
        result = await uploadTutorialThumbnail(base64, entityId);
        break;

      default:
        // 일반 업로드
        result = await uploadImage(base64, {
          folder: 'vibe-olympics/uploads',
          tags: ['user-upload', session.user.id],
        });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: result.secureUrl,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 클라이언트 직접 업로드용 서명 생성
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'vibe-olympics/uploads';
    const tags = searchParams.get('tags')?.split(',') || [];

    const signatureData = generateSignedUploadUrl(folder, [...tags, session.user.id]);

    return NextResponse.json(signatureData);
  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json(
      { error: '서명 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
