/**
 * 파일 삭제 API
 * DELETE /api/upload/delete - 이미지 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteImage } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json({ error: 'publicId가 필요합니다.' }, { status: 400 });
    }

    // 본인이 업로드한 이미지인지 확인 (publicId에 userId가 포함되어 있거나 태그로 확인)
    // 보안을 위해 추가 검증 로직 구현 가능
    
    const result = await deleteImage(publicId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: '파일 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
