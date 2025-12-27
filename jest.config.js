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
  ],
  // 커버리지 임계값 (점진적 향상 목표: 50% → 70% → 80%)
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
    // 핵심 유틸리티는 더 높은 커버리지 요구
    './src/lib/utils.ts': {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    './src/lib/validation.ts': {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
