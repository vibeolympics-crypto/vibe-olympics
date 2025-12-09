'use client';

/**
 * 이미지 업로드 컴포넌트
 * 드래그앤드롭 + 클릭 업로드 + 미리보기 지원
 */

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null, publicId?: string) => void;
  type?: 'product-thumbnail' | 'product-gallery' | 'profile' | 'post' | 'tutorial' | 'general';
  entityId?: string;
  index?: number;
  disabled?: boolean;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  maxSize?: number; // MB
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  type = 'general',
  entityId,
  index = 0,
  disabled = false,
  className,
  aspectRatio = 'auto',
  maxSize = 10,
  placeholder = '이미지를 업로드하세요',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[4/3]',
    auto: 'aspect-auto min-h-[200px]',
  };

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);

      // 파일 크기 검증
      if (file.size > maxSize * 1024 * 1024) {
        setError(`파일 크기는 ${maxSize}MB를 초과할 수 없습니다.`);
        return;
      }

      // MIME 타입 검증
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setError('지원하지 않는 파일 형식입니다.');
        return;
      }

      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 업로드
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (entityId) formData.append('entityId', entityId);
        formData.append('index', index.toString());

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '업로드에 실패했습니다.');
        }

        onChange(data.url, data.publicId);
        setPreview(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [type, entityId, index, maxSize, onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors cursor-pointer overflow-hidden',
          aspectRatioClasses[aspectRatio],
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500'
        )}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full h-full">
            <Image
              src={preview}
              alt="업로드된 이미지"
              fill
              className="object-cover"
              unoptimized={preview.startsWith('data:')}
            />
            {!disabled && !isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                aria-label="이미지 삭제"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            {isUploading ? (
              <>
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500">업로드 중...</p>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400 mb-3"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">{placeholder}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  드래그하거나 클릭하여 업로드 (최대 {maxSize}MB)
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/**
 * 다중 이미지 업로드 컴포넌트 (갤러리용)
 */
interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  type?: 'product-gallery' | 'post';
  entityId?: string;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export function MultiImageUpload({
  values = [],
  onChange,
  type = 'product-gallery',
  entityId,
  maxImages = 5,
  disabled = false,
  className,
}: MultiImageUploadProps) {
  const handleImageChange = (index: number, url: string | null) => {
    const newValues = [...values];
    if (url === null) {
      // 삭제
      newValues.splice(index, 1);
    } else {
      // 추가/수정
      newValues[index] = url;
    }
    onChange(newValues);
  };

  const handleAddImage = (url: string | null) => {
    if (url && values.length < maxImages) {
      onChange([...values, url]);
    }
  };

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4', className)}>
      {values.map((url, index) => (
        <ImageUpload
          key={index}
          value={url}
          onChange={(newUrl) => handleImageChange(index, newUrl)}
          type={type}
          entityId={entityId}
          index={index}
          disabled={disabled}
          aspectRatio="square"
        />
      ))}
      {values.length < maxImages && !disabled && (
        <ImageUpload
          onChange={handleAddImage}
          type={type}
          entityId={entityId}
          index={values.length}
          disabled={disabled}
          aspectRatio="square"
          placeholder="추가"
        />
      )}
    </div>
  );
}
