/**
 * 마크다운 파일 읽기 유틸리티
 * docs/legal/ 폴더의 .md 파일을 읽어서 반환
 */

import fs from "fs";
import path from "path";

export type LegalDocType = "terms" | "refund" | "privacy";

const DOC_FILES: Record<LegalDocType, string> = {
  terms: "TERMS.md",
  refund: "REFUND_POLICY.md",
  privacy: "PRIVACY_POLICY.md",
};

/**
 * 법률 문서 마크다운 파일 읽기
 * @param docType 문서 타입 (terms, refund, privacy)
 * @returns 마크다운 문자열
 */
export function getLegalDocument(docType: LegalDocType): string {
  const fileName = DOC_FILES[docType];
  const filePath = path.join(process.cwd(), "docs", "legal", fileName);

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error(`Failed to read legal document: ${fileName}`, error);
    return `# 문서를 불러올 수 없습니다\n\n해당 문서를 찾을 수 없습니다.`;
  }
}

/**
 * 마크다운에서 메타데이터 추출
 * @param content 마크다운 문자열
 * @returns 제목과 최종 수정일
 */
export function extractMetadata(content: string): {
  title: string;
  lastModified: string | null;
} {
  const lines = content.split("\n");
  let title = "";
  let lastModified: string | null = null;

  for (const line of lines) {
    // # 으로 시작하는 첫 번째 제목 추출
    if (line.startsWith("# ") && !title) {
      title = line.replace("# ", "").trim();
    }
    // **최종 수정일: 패턴 추출
    if (line.includes("최종 수정일:")) {
      const match = line.match(/최종 수정일[:\s]+(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)/);
      if (match) {
        lastModified = match[1];
      }
    }
    // 두 가지 모두 찾으면 종료
    if (title && lastModified) break;
  }

  return { title, lastModified };
}
