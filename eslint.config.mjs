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
  // 전역 규칙 설정
  {
    rules: {
      // 외부 URL 이미지 및 동적 이미지에는 <img> 사용이 적합
      // Next.js Image 컴포넌트는 외부 도메인 설정이 필요하고
      // 동적 크기 이미지에 제한이 있음
      "@next/next/no-img-element": "off",
      // _ 접두사가 있는 변수는 의도적으로 미사용된 것으로 간주
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // React Compiler 관련 규칙 비활성화 (실험적 기능)
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",

      // === 코드 품질 규칙 ===
      // 엄격한 동등 비교 (== 대신 ===)
      "eqeqeq": ["error", "always", { null: "ignore" }],
      // const 선호 (재할당 없는 변수)
      "prefer-const": "warn",
      // console.log 경고 (error, warn 제외)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // 중첩 삼항 연산자 금지
      "no-nested-ternary": "warn",
      // Promise reject는 Error 객체만
      "prefer-promise-reject-errors": "warn",
      // 불필요한 return await 제거
      "no-return-await": "warn",

      // === TypeScript 추가 규칙 ===
      // any 타입 경고 (점진적 전환)
      "@typescript-eslint/no-explicit-any": "warn",
      // 빈 함수 허용 (콜백 등에서 필요)
      "@typescript-eslint/no-empty-function": "off",
      // non-null assertion (!) 경고
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },
]);

export default eslintConfig;
