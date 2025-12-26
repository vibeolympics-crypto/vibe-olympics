/**
 * @fileoverview 파일 업로드 보안 시스템
 * MIME 타입 검증, Magic Byte 검증, 크기 제한
 *
 * 대응 위협: S4.3 (무제한 파일 업로드)
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityLogger } from './index';

// ============================================
// 1. 파일 타입 정의
// ============================================
export type FileCategory = 'image' | 'document' | 'video' | 'audio' | 'archive' | 'code';

interface AllowedFileType {
  mimeTypes: string[];
  extensions: string[];
  magicBytes?: number[][]; // 파일 시그니처
  maxSize: number; // bytes
}

// 파일 카테고리별 허용 타입
export const fileTypeConfigs: Record<FileCategory, AllowedFileType> = {
  image: {
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    magicBytes: [
      [0xFF, 0xD8, 0xFF], // JPEG
      [0x89, 0x50, 0x4E, 0x47], // PNG
      [0x47, 0x49, 0x46, 0x38], // GIF
      [0x52, 0x49, 0x46, 0x46], // WebP (RIFF)
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  document: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/markdown',
    ],
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.md'],
    magicBytes: [
      [0x25, 0x50, 0x44, 0x46], // PDF
      [0xD0, 0xCF, 0x11, 0xE0], // MS Office (old)
      [0x50, 0x4B, 0x03, 0x04], // OOXML (ZIP-based)
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  video: {
    mimeTypes: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
    ],
    extensions: ['.mp4', '.webm', '.ogv', '.mov'],
    magicBytes: [
      [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // MP4 ftyp
      [0x1A, 0x45, 0xDF, 0xA3], // WebM (EBML)
    ],
    maxSize: 500 * 1024 * 1024, // 500MB
  },
  audio: {
    mimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
    ],
    extensions: ['.mp3', '.wav', '.ogg', '.flac', '.aac'],
    magicBytes: [
      [0x49, 0x44, 0x33], // MP3 (ID3)
      [0xFF, 0xFB], // MP3 (sync)
      [0x52, 0x49, 0x46, 0x46], // WAV (RIFF)
      [0x4F, 0x67, 0x67, 0x53], // OGG
      [0x66, 0x4C, 0x61, 0x43], // FLAC
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  archive: {
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip',
    ],
    extensions: ['.zip', '.rar', '.7z', '.gz', '.tar.gz'],
    magicBytes: [
      [0x50, 0x4B, 0x03, 0x04], // ZIP
      [0x52, 0x61, 0x72, 0x21], // RAR
      [0x37, 0x7A, 0xBC, 0xAF], // 7z
      [0x1F, 0x8B], // GZIP
    ],
    maxSize: 200 * 1024 * 1024, // 200MB
  },
  code: {
    mimeTypes: [
      'text/javascript',
      'text/typescript',
      'text/x-python',
      'text/html',
      'text/css',
      'application/json',
      'text/plain',
    ],
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.json', '.txt'],
    // 코드 파일은 magic bytes 검증하지 않음 (텍스트 기반)
    maxSize: 5 * 1024 * 1024, // 5MB
  },
};

// ============================================
// 2. 파일 검증 함수
// ============================================
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    detectedMime?: string;
    detectedExtension?: string;
    fileSize?: number;
    category?: FileCategory;
  };
}

export const fileValidator = {
  /**
   * 확장자 검증
   */
  validateExtension: (filename: string, allowedCategories: FileCategory[]): FileValidationResult => {
    const ext = '.' + filename.split('.').pop()?.toLowerCase();

    for (const category of allowedCategories) {
      const config = fileTypeConfigs[category];
      if (config.extensions.includes(ext)) {
        return {
          valid: true,
          details: { detectedExtension: ext, category },
        };
      }
    }

    return {
      valid: false,
      error: `허용되지 않는 파일 확장자입니다: ${ext}`,
      details: { detectedExtension: ext },
    };
  },

  /**
   * MIME 타입 검증
   */
  validateMimeType: (mimeType: string, allowedCategories: FileCategory[]): FileValidationResult => {
    for (const category of allowedCategories) {
      const config = fileTypeConfigs[category];
      if (config.mimeTypes.includes(mimeType)) {
        return {
          valid: true,
          details: { detectedMime: mimeType, category },
        };
      }
    }

    return {
      valid: false,
      error: `허용되지 않는 파일 형식입니다: ${mimeType}`,
      details: { detectedMime: mimeType },
    };
  },

  /**
   * Magic Bytes (파일 시그니처) 검증
   */
  validateMagicBytes: async (
    file: File | Buffer,
    allowedCategories: FileCategory[]
  ): Promise<FileValidationResult> => {
    let bytes: number[];

    if (file instanceof File) {
      const buffer = await file.slice(0, 16).arrayBuffer();
      bytes = Array.from(new Uint8Array(buffer));
    } else {
      bytes = Array.from(file.slice(0, 16));
    }

    for (const category of allowedCategories) {
      const config = fileTypeConfigs[category];

      // magic bytes가 정의되지 않은 카테고리는 스킵 (코드 파일 등)
      if (!config.magicBytes) {
        continue;
      }

      for (const signature of config.magicBytes) {
        if (signature.every((byte, index) => bytes[index] === byte)) {
          return {
            valid: true,
            details: { category },
          };
        }
      }
    }

    // Magic bytes가 없는 카테고리만 허용된 경우 (텍스트 파일)
    const hasNonMagicCategory = allowedCategories.some(
      cat => !fileTypeConfigs[cat].magicBytes
    );

    if (hasNonMagicCategory) {
      return { valid: true };
    }

    return {
      valid: false,
      error: '파일 내용이 확장자와 일치하지 않습니다.',
    };
  },

  /**
   * 파일 크기 검증
   */
  validateSize: (
    fileSize: number,
    allowedCategories: FileCategory[],
    customMaxSize?: number
  ): FileValidationResult => {
    // 가장 큰 허용 크기 선택
    const maxSize = customMaxSize || Math.max(
      ...allowedCategories.map(cat => fileTypeConfigs[cat].maxSize)
    );

    if (fileSize > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      return {
        valid: false,
        error: `파일 크기가 너무 큽니다. 최대 ${maxMB}MB까지 허용됩니다.`,
        details: { fileSize },
      };
    }

    return {
      valid: true,
      details: { fileSize },
    };
  },

  /**
   * 통합 파일 검증
   */
  validateFile: async (
    file: File,
    allowedCategories: FileCategory[],
    options?: { skipMagicBytes?: boolean; maxSize?: number }
  ): Promise<FileValidationResult> => {
    // 1. 확장자 검증
    const extResult = fileValidator.validateExtension(file.name, allowedCategories);
    if (!extResult.valid) return extResult;

    // 2. MIME 타입 검증
    const mimeResult = fileValidator.validateMimeType(file.type, allowedCategories);
    if (!mimeResult.valid) return mimeResult;

    // 3. 크기 검증
    const sizeResult = fileValidator.validateSize(file.size, allowedCategories, options?.maxSize);
    if (!sizeResult.valid) return sizeResult;

    // 4. Magic Bytes 검증 (선택적)
    if (!options?.skipMagicBytes) {
      const magicResult = await fileValidator.validateMagicBytes(file, allowedCategories);
      if (!magicResult.valid) return magicResult;
    }

    return {
      valid: true,
      details: {
        detectedMime: file.type,
        detectedExtension: '.' + file.name.split('.').pop()?.toLowerCase(),
        fileSize: file.size,
        category: extResult.details?.category,
      },
    };
  },
};

// ============================================
// 3. 파일명 정화
// ============================================
export const filenameSanitizer = {
  /**
   * 안전한 파일명 생성
   */
  sanitize: (filename: string): string => {
    // 경로 구분자 제거
    let safe = filename.replace(/[\/\\]/g, '');

    // 위험한 문자 제거
    safe = safe.replace(/[<>:"|?*\x00-\x1f]/g, '');

    // 공백을 언더스코어로
    safe = safe.replace(/\s+/g, '_');

    // 연속된 점 방지 (디렉토리 트래버설)
    safe = safe.replace(/\.{2,}/g, '.');

    // 숨김 파일 방지
    if (safe.startsWith('.')) {
      safe = '_' + safe;
    }

    // 길이 제한
    if (safe.length > 255) {
      const ext = safe.split('.').pop() || '';
      safe = safe.substring(0, 250 - ext.length) + '.' + ext;
    }

    return safe || 'unnamed_file';
  },

  /**
   * 고유한 파일명 생성
   */
  generateUnique: (originalName: string): string => {
    const sanitized = filenameSanitizer.sanitize(originalName);
    const ext = sanitized.split('.').pop() || '';
    const nameWithoutExt = sanitized.substring(0, sanitized.length - ext.length - 1);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    return `${nameWithoutExt}_${timestamp}_${random}.${ext}`;
  },
};

// ============================================
// 4. 업로드 미들웨어
// ============================================
export interface UploadSecurityOptions {
  allowedCategories: FileCategory[];
  maxFileSize?: number;
  maxFiles?: number;
  skipMagicBytes?: boolean;
}

export async function withUploadSecurity(
  request: NextRequest,
  handler: (req: NextRequest, validatedFiles: File[]) => Promise<NextResponse>,
  options: UploadSecurityOptions
): Promise<NextResponse> {
  const { allowedCategories, maxFileSize, maxFiles = 10, skipMagicBytes = false } = options;
  const context = securityLogger.extractContext(request);

  try {
    const formData = await request.formData();
    const files: File[] = [];

    // FormData에서 파일 추출
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    // 파일 수 제한
    if (files.length > maxFiles) {
      return new NextResponse(
        JSON.stringify({ error: `한 번에 최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 각 파일 검증
    const validatedFiles: File[] = [];

    for (const file of files) {
      const result = await fileValidator.validateFile(file, allowedCategories, {
        skipMagicBytes,
        maxSize: maxFileSize,
      });

      if (!result.valid) {
        securityLogger.log({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'medium',
          ...context,
          details: {
            reason: 'Invalid file upload',
            filename: file.name,
            error: result.error,
            ...result.details,
          },
        });

        return new NextResponse(
          JSON.stringify({
            error: result.error,
            filename: file.name,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      validatedFiles.push(file);
    }

    return handler(request, validatedFiles);
  } catch (error) {
    securityLogger.log({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'high',
      ...context,
      details: {
        reason: 'File upload processing error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return new NextResponse(
      JSON.stringify({ error: '파일 처리 중 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================
// 5. 바이러스 스캔 인터페이스 (확장용)
// ============================================
export interface VirusScanResult {
  clean: boolean;
  threatName?: string;
  scanTime: number;
}

export const virusScanner = {
  /**
   * 외부 바이러스 스캔 서비스 연동 (ClamAV, VirusTotal 등)
   * TODO: 실제 바이러스 스캔 서비스 연동 필요
   */
  scan: async (_file: File): Promise<VirusScanResult> => {
    // 플레이스홀더 - 실제 구현 시 ClamAV 또는 VirusTotal API 연동
    console.warn('[VirusScanner] Placeholder - implement actual virus scanning');
    return {
      clean: true,
      scanTime: 0,
    };
  },
};

export default {
  fileValidator,
  filenameSanitizer,
  fileTypeConfigs,
  withUploadSecurity,
  virusScanner,
};
