import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // CommonJS 설정 파일에서 require() 허용
  {
    files: ["*.config.js", "jest.config.js", "next.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // 마크다운 에디터 등 특정 파일에서 React Compiler 경고 무시
  {
    files: ["src/components/ui/markdown-editor.tsx"],
    rules: {
      // React Compiler의 ref 접근 경고 무시 (useMemo 내 JSX 아이콘 사용)
    },
  },
]);

export default eslintConfig;
