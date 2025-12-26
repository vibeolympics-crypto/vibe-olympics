import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createServerSupabaseClient,
  STORAGE_BUCKETS,
  FILE_SIZE_LIMITS,
  ALLOWED_FILE_TYPES,
  getPublicUrl,
} from "@/lib/supabase";
import { withSecurity, securityLogger } from "@/lib/security";
import { fileValidator, filenameSanitizer } from "@/lib/security/upload";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return withSecurity(
    request,
    async (req) => {
      try {
        // 인증 확인
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: "로그인이 필요합니다" },
            { status: 401 }
          );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const type = formData.get("type") as string | null;
        const productId = formData.get("productId") as string | null;

        if (!file) {
          return NextResponse.json(
            { error: "파일이 필요합니다" },
            { status: 400 }
          );
        }

        if (!type || !["image", "product", "avatar"].includes(type)) {
          return NextResponse.json(
            { error: "유효한 파일 타입이 필요합니다 (image, product, avatar)" },
            { status: 400 }
          );
        }

        // 파일 타입별 설정
        const config = {
          image: {
            bucket: STORAGE_BUCKETS.PRODUCT_IMAGES,
            maxSize: FILE_SIZE_LIMITS.IMAGE,
            allowedTypes: ALLOWED_FILE_TYPES.IMAGE,
            folder: productId ? `products/${productId}` : `temp/${session.user.id}`,
            securityCategory: 'image' as const,
          },
          product: {
            bucket: STORAGE_BUCKETS.PRODUCT_FILES,
            maxSize: FILE_SIZE_LIMITS.PRODUCT_FILE,
            allowedTypes: ALLOWED_FILE_TYPES.PRODUCT_FILE,
            folder: productId ? `products/${productId}` : `temp/${session.user.id}`,
            securityCategory: 'archive' as const,
          },
          avatar: {
            bucket: STORAGE_BUCKETS.USER_AVATARS,
            maxSize: FILE_SIZE_LIMITS.AVATAR,
            allowedTypes: ALLOWED_FILE_TYPES.AVATAR,
            folder: `users/${session.user.id}`,
            securityCategory: 'image' as const,
          },
        }[type as "image" | "product" | "avatar"];

        // 파일 크기 검증
        if (file.size > config.maxSize) {
          const maxSizeMB = config.maxSize / (1024 * 1024);
          return NextResponse.json(
            { error: `파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다` },
            { status: 400 }
          );
        }

        // 파일 타입 검증
        if (!config.allowedTypes.includes(file.type as never)) {
          return NextResponse.json(
            { error: `허용되지 않는 파일 형식입니다. 허용: ${config.allowedTypes.join(", ")}` },
            { status: 400 }
          );
        }

        // Magic Bytes 검증 (파일 내용과 확장자 일치 여부)
        const magicResult = await fileValidator.validateMagicBytes(
          file,
          [config.securityCategory]
        );

        if (!magicResult.valid) {
          securityLogger.log({
            type: 'SUSPICIOUS_ACTIVITY',
            severity: 'high',
            userId: session.user.id,
            details: {
              reason: 'File magic bytes mismatch',
              filename: file.name,
              declaredType: file.type,
              uploadType: type,
            },
          });

          return NextResponse.json(
            { error: "파일 내용이 확장자와 일치하지 않습니다." },
            { status: 400 }
          );
        }

        // 파일명 정화 및 고유 이름 생성
        const sanitizedName = filenameSanitizer.generateUnique(file.name);
        const filePath = `${config.folder}/${sanitizedName}`;

        // ArrayBuffer로 변환
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Supabase Storage에 업로드
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase.storage
          .from(config.bucket)
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          console.error("Supabase upload error:", error);
          return NextResponse.json(
            { error: "파일 업로드에 실패했습니다" },
            { status: 500 }
          );
        }

        // 공개 URL 생성
        const publicUrl = getPublicUrl(config.bucket, data.path);

        return NextResponse.json({
          success: true,
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            path: data.path,
            url: publicUrl,
          },
        });
      } catch (error) {
        console.error("Upload API error:", error);
        return NextResponse.json(
          { error: "파일 업로드 중 오류가 발생했습니다" },
          { status: 500 }
        );
      }
    },
    { rateLimit: 'upload' } // 업로드용 Rate Limit (1분 10회)
  );
}

// 파일 삭제
export async function DELETE(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: "로그인이 필요합니다" },
            { status: 401 }
          );
        }

        const { searchParams } = new URL(request.url);
        const bucket = searchParams.get("bucket");
        const path = searchParams.get("path");

        if (!bucket || !path) {
          return NextResponse.json(
            { error: "bucket과 path가 필요합니다" },
            { status: 400 }
          );
        }

        // 권한 확인: 자신의 파일만 삭제 가능
        if (!path.includes(session.user.id)) {
          securityLogger.log({
            type: 'IDOR_ATTEMPT',
            severity: 'high',
            userId: session.user.id,
            details: {
              reason: 'Attempted to delete another users file',
              bucket,
              path,
            },
          });

          return NextResponse.json(
            { error: "삭제 권한이 없습니다" },
            { status: 403 }
          );
        }

        const supabase = createServerSupabaseClient();
        const { error } = await supabase.storage.from(bucket).remove([path]);

        if (error) {
          console.error("Supabase delete error:", error);
          return NextResponse.json(
            { error: "파일 삭제에 실패했습니다" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "파일이 삭제되었습니다",
        });
      } catch (error) {
        console.error("Delete API error:", error);
        return NextResponse.json(
          { error: "파일 삭제 중 오류가 발생했습니다" },
          { status: 500 }
        );
      }
    },
    { rateLimit: 'api' }
  );
}
