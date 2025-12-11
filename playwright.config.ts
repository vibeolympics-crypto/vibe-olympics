import { defineConfig, devices } from '@playwright/test';

// 프로덕션 테스트 시 환경변수로 URL 설정 가능
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const isProduction = baseURL.includes('render.com') || baseURL.includes('vibeolympics.com');
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : isProduction ? 1 : 0,
  workers: isCI ? 1 : isProduction ? 2 : undefined,
  reporter: isCI ? 'github' : 'html',
  timeout: isCI ? 120000 : isProduction ? 90000 : 60000,  // CI는 120초
  expect: {
    timeout: isCI ? 15000 : 10000,  // expect 타임아웃
  },
  
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: isCI ? 60000 : isProduction ? 45000 : 30000,
    actionTimeout: isCI ? 30000 : 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 필요 시 다른 브라우저 추가
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // 개발 서버 자동 시작 (로컬 테스트 시에만)
  ...(isProduction ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !isCI,
      timeout: 180 * 1000,  // 서버 시작 타임아웃 3분
    },
  }),
});
