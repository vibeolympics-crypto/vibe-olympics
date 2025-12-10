import { defineConfig, devices } from '@playwright/test';

// 프로덕션 테스트 시 환경변수로 URL 설정 가능
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const isProduction = baseURL.includes('render.com') || baseURL.includes('vibeolympics.com');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : isProduction ? 1 : 0,
  workers: process.env.CI ? 1 : isProduction ? 2 : undefined,
  reporter: 'html',
  timeout: isProduction ? 90000 : 60000,  // 프로덕션은 90초, 로컬은 60초
  
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: isProduction ? 90000 : 60000,
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
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  }),
});
