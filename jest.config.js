const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Next.js 앱의 경로
  dir: './',
});

// Jest 커스텀 설정
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(@auth/prisma-adapter|@auth/core|isomorphic-dompurify|dompurify)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/not-found.tsx',
    // Trust & Safety 시스템 - 테스트 작성 예정
    '!src/lib/trust-safety.ts',
    '!src/lib/markdown.ts',
    '!src/app/api/reports/**/*',
    '!src/app/api/disputes/**/*',
    '!src/app/api/appeals/**/*',
    '!src/app/api/user/trust/**/*',
    '!src/app/api/admin/reports/**/*',
    '!src/app/api/admin/disputes/**/*',
    '!src/app/api/admin/sanctions/**/*',
    '!src/app/api/admin/appeals/**/*',
    // 마크다운 렌더링 컴포넌트
    '!src/components/ui/markdown-content.tsx',
  ],
  // 커버리지 임계값 (현재: 기본값, 목표: 점진적 향상 5% → 10% → 30%)
  // TODO: 테스트 커버리지 개선 후 임계값 상향 조정
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
