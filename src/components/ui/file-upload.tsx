"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileIcon, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUploadFile, useDeleteFile } from "@/hooks/use-api";

interface FileUploadProps {
  type: "image" | "product" | "avatar";
  productId?: string;
  onUpload?: (file: { name: string; url: string; path: string }) => void;
  onDelete?: (path: string) => void;
  accept?: string;
  maxSize?: number; // MB
  multiple?: boolean;
  className?: string;
  label?: string;
  hint?: string;
}

export function FileUpload({
  type,
  productId,
  onUpload,
  onDelete,
  accept,
  maxSize = type === "product" ? 100 : type === "avatar" ? 2 : 5,
  multiple = false,
  className,
  label = "파일 업로드",
  hint,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; url: string; path: string }[]
  >([]);

  const uploadMutation = useUploadFile();
  const deleteMutation = useDeleteFile();

  const defaultAccept = {
    image: "image/jpeg,image/png,image/webp,image/gif",
    product: ".zip,.rar,.7z,.pdf,.txt,.json",
    avatar: "image/jpeg,image/png,image/webp",
  }[type];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    const filesToUpload = multiple ? files : files.slice(0, 1);

    for (const file of filesToUpload) {
      // 파일 크기 검증
      if (file.size > maxSize * 1024 * 1024) {
        alert(`${file.name}: 파일 크기가 ${maxSize}MB를 초과합니다`);
        continue;
      }

      try {
        const result = await uploadMutation.mutateAsync({
          file,
          type,
          productId,
        });

        const uploadedFile = {
          name: result.file.name,
          url: result.file.url,
          path: result.file.path,
        };

        setUploadedFiles((prev) =>
          multiple ? [...prev, uploadedFile] : [uploadedFile]
        );

        onUpload?.(uploadedFile);
      } catch (error) {
        console.error("Upload failed:", error);
        alert(`${file.name}: 업로드에 실패했습니다`);
      }
    }
  }, [multiple, maxSize, uploadMutation, type, productId, onUpload]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      await handleFiles(files);
    },
    [handleFiles]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
    // Reset input
    e.target.value = "";
  };

  const handleRemoveFile = async (path: string, index: number) => {
    try {
      const bucket = {
        image: "product-images",
        product: "product-files",
        avatar: "user-avatars",
      }[type];

      await deleteMutation.mutateAsync({ bucket, path });

      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
      onDelete?.(path);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("파일 삭제에 실패했습니다");
    }
  };

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-colors",
          isDragging
            ? "border-[var(--primary)] bg-[var(--primary)]/5"
            : "border-[var(--bg-border)] hover:border-[var(--primary)]/50",
          isLoading && "pointer-events-none opacity-50"
        )}
      >
        <input
          type="file"
          accept={accept || defaultAccept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
            ) : type === "image" || type === "avatar" ? (
              <ImageIcon className="w-6 h-6 text-[var(--primary)]" />
            ) : (
              <Upload className="w-6 h-6 text-[var(--primary)]" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {label}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {hint || `드래그 앤 드롭 또는 클릭하여 업로드 (최대 ${maxSize}MB)`}
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={file.path}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)]"
            >
              {type === "image" || type === "avatar" ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                  <FileIcon className="w-6 h-6 text-[var(--primary)]" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {file.name}
                </p>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  미리보기
                </a>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFile(file.path, index)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
