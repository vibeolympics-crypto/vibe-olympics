import { test, expect } from '@playwright/test';

/**
 * 환경별 성능 임계값 설정
 * - CI/Production: 엄격한 기준 (빠른 응답 기대)
 * - Local/Development: 완화된 기준 (Cold start, 외부 DB 연결 고려)
 */
const isCI = process.env.CI === 'true';
const isProduction = process.env.NODE_ENV === 'production';

// 환경별 임계값 (ms)
const THRESHOLDS = {
  pageLoad: {
    standard: isCI || isProduction ? 5000 : 30000,  // 페이지 로드
    fast: isCI || isProduction ? 3000 : 30000,      // 빠른 페이지 (로그인 등)
  },
  api: {
    fast: isCI || isProduction ? 1000 : 20000,      // 빠른 API (health, categories)
    standard: isCI || isProduction ? 3000 : 20000,  // 일반 API
  },
  navigation: {
    average: isCI || isProduction ? 3000 : 30000,   // 평균 네비게이션
    back: isCI || isProduction ? 2000 : 30000,      // 뒤로 가기
  },
  search: {
    query: isCI || isProduction ? 3000 : 15000,     // 검색 (Render 콜드스타트 고려)
    filter: isCI || isProduction ? 2000 : 12000,    // 필터
  },
  reload: isCI || isProduction ? 3000 : 30000,      // 페이지 리로드
};

test.describe('Performance - Page Load', () => {
  test('TC-PERF-001: should load home page within threshold', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    console.log(`Home page load time: ${loadTime}ms (threshold: ${THRESHOLDS.pageLoad.standard}ms)`);
    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoad.standard);
  });

  test('TC-PERF-002: should load marketplace within threshold', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    console.log(`Marketplace load time: ${loadTime}ms (threshold: ${THRESHOLDS.pageLoad.standard}ms)`);
    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoad.standard);
  });

  test('TC-PERF-003: should load education within threshold', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/education');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    console.log(`Education load time: ${loadTime}ms (threshold: ${THRESHOLDS.pageLoad.standard}ms)`);
    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoad.standard);
  });

  test('TC-PERF-004: should load community within threshold', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/community');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    console.log(`Community load time: ${loadTime}ms (threshold: ${THRESHOLDS.pageLoad.standard}ms)`);
    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoad.standard);
  });

  test('TC-PERF-005: should load login page within threshold', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    console.log(`Login page load time: ${loadTime}ms (threshold: ${THRESHOLDS.pageLoad.fast}ms)`);
    expect(loadTime).toBeLessThan(THRESHOLDS.pageLoad.fast);
  });
});

test.describe('Performance - API Response', () => {
  test('TC-PERF-006: should respond health check within threshold', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/health');
    
    const responseTime = Date.now() - startTime;
    console.log(`Health API response time: ${responseTime}ms (threshold: ${THRESHOLDS.api.fast}ms)`);
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(THRESHOLDS.api.fast);
  });

  test('TC-PERF-007: should respond products list within threshold', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/products');
    
    const responseTime = Date.now() - startTime;
    console.log(`Products API response time: ${responseTime}ms (threshold: ${THRESHOLDS.api.standard}ms)`);
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(THRESHOLDS.api.standard);
  });

  test('TC-PERF-008: should respond tutorials list within threshold', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/tutorials');
    
    const responseTime = Date.now() - startTime;
    console.log(`Tutorials API response time: ${responseTime}ms (threshold: ${THRESHOLDS.api.standard}ms)`);
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(THRESHOLDS.api.standard);
  });

  test('TC-PERF-009: should respond posts list within threshold', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/posts');
    
    const responseTime = Date.now() - startTime;
    console.log(`Posts API response time: ${responseTime}ms (threshold: ${THRESHOLDS.api.standard}ms)`);
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(THRESHOLDS.api.standard);
  });

  test('TC-PERF-010: should respond categories within threshold', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/categories');
    
    const responseTime = Date.now() - startTime;
    console.log(`Categories API response time: ${responseTime}ms (threshold: ${THRESHOLDS.api.fast}ms)`);
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(THRESHOLDS.api.fast);
  });
});

test.describe('Performance - Navigation', () => {
  test('TC-PERF-011: should navigate between pages quickly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 마켓플레이스로 이동
    const startTime1 = Date.now();
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    const navTime1 = Date.now() - startTime1;
    
    // 교육 센터로 이동
    const startTime2 = Date.now();
    await page.goto('/education');
    await page.waitForLoadState('domcontentloaded');
    const navTime2 = Date.now() - startTime2;
    
    // 커뮤니티로 이동
    const startTime3 = Date.now();
    await page.goto('/community');
    await page.waitForLoadState('domcontentloaded');
    const navTime3 = Date.now() - startTime3;
    
    // 평균 네비게이션 시간 체크
    const avgNavTime = (navTime1 + navTime2 + navTime3) / 3;
    console.log(`Average navigation time: ${avgNavTime.toFixed(0)}ms (threshold: ${THRESHOLDS.navigation.average}ms)`);
    expect(avgNavTime).toBeLessThan(THRESHOLDS.navigation.average);
  });

  test('TC-PERF-012: should handle back navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // 뒤로 가기
    const startTime = Date.now();
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    const backTime = Date.now() - startTime;
    
    console.log(`Back navigation time: ${backTime}ms (threshold: ${THRESHOLDS.navigation.back}ms)`);
    expect(backTime).toBeLessThan(THRESHOLDS.navigation.back);
  });
});

test.describe('Performance - Search', () => {
  test('TC-PERF-013: should search products quickly', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // 검색어 입력
    const searchInput = page.locator('input[placeholder*="검색"]');
    if (await searchInput.isVisible()) {
      const startTime = Date.now();
      await searchInput.fill('AI');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
      const searchTime = Date.now() - startTime;
      
      console.log(`Search time: ${searchTime}ms (threshold: ${THRESHOLDS.search.query}ms)`);
      expect(searchTime).toBeLessThan(THRESHOLDS.search.query);
    }
  });

  test('TC-PERF-014: should filter products quickly', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // 카테고리 필터 클릭
    const categoryButton = page.locator('button:has-text("템플릿")');
    if (await categoryButton.isVisible()) {
      const startTime = Date.now();
      await categoryButton.click();
      await page.waitForLoadState('networkidle');
      const filterTime = Date.now() - startTime;
      
      console.log(`Filter time: ${filterTime}ms (threshold: ${THRESHOLDS.search.filter}ms)`);
      expect(filterTime).toBeLessThan(THRESHOLDS.search.filter);
    }
  });
});

test.describe('Performance - Resource Loading', () => {
  test('TC-PERF-015: should not have too many requests on home page', async ({ page }) => {
    let requestCount = 0;
    
    page.on('request', () => {
      requestCount++;
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log(`Total requests on home page: ${requestCount}`);
    // 초기 로드 시 요청이 100개 미만이어야 함
    expect(requestCount).toBeLessThan(100);
  });

  test('TC-PERF-016: should cache static assets', async ({ page }) => {
    // 첫 번째 방문
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 두 번째 방문 (캐시 사용)
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const reloadTime = Date.now() - startTime;
    
    console.log(`Reload time: ${reloadTime}ms (threshold: ${THRESHOLDS.reload}ms)`);
    expect(reloadTime).toBeLessThan(THRESHOLDS.reload);
  });
});
