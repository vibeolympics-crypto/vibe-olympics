import { test, expect } from '@playwright/test';

test.describe('Performance - Page Load', () => {
  test('TC-PERF-001: should load home page within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('TC-PERF-002: should load marketplace within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('TC-PERF-003: should load education within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/education');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('TC-PERF-004: should load community within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/community');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('TC-PERF-005: should load login page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Performance - API Response', () => {
  test('TC-PERF-006: should respond health check within 1 second', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/health');
    
    const responseTime = Date.now() - startTime;
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(1000);
  });

  test('TC-PERF-007: should respond products list within 3 seconds', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/products');
    
    const responseTime = Date.now() - startTime;
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3000);
  });

  test('TC-PERF-008: should respond tutorials list within 3 seconds', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/tutorials');
    
    const responseTime = Date.now() - startTime;
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3000);
  });

  test('TC-PERF-009: should respond posts list within 3 seconds', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/posts');
    
    const responseTime = Date.now() - startTime;
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3000);
  });

  test('TC-PERF-010: should respond categories within 1 second', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/categories');
    
    const responseTime = Date.now() - startTime;
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(1000);
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
    
    // 평균 네비게이션 시간이 3초 이내여야 함
    const avgNavTime = (navTime1 + navTime2 + navTime3) / 3;
    expect(avgNavTime).toBeLessThan(3000);
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
    
    // 뒤로 가기가 2초 이내여야 함
    expect(backTime).toBeLessThan(2000);
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
      
      // 검색이 3초 이내여야 함
      expect(searchTime).toBeLessThan(3000);
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
      
      // 필터링이 2초 이내여야 함
      expect(filterTime).toBeLessThan(2000);
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
    
    // 리로드가 3초 이내여야 함
    expect(reloadTime).toBeLessThan(3000);
  });
});
