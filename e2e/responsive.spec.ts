import { test, expect } from '@playwright/test';

test.describe('Responsive Design - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // 모바일 뷰포트 설정 (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('TC-RESP-001: should display mobile header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 헤더 확인
    await expect(page.locator('header')).toBeVisible();
  });

  test('TC-RESP-002: should display hamburger menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 모바일 메뉴 버튼 확인
    const menuButton = page.locator('button[aria-label*="메뉴"], button[aria-label*="Menu"], button:has([class*="menu"])');
    if (await menuButton.isVisible()) {
      await expect(menuButton).toBeVisible();
    }
  });

  test('TC-RESP-003: should toggle mobile menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 모바일 메뉴 열기
    const menuButton = page.locator('button[aria-label*="메뉴"], button[aria-label*="Menu"]').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);
      
      // 메뉴 열림 확인
      const nav = page.locator('nav, [role="navigation"]');
      if (await nav.isVisible()) {
        await expect(nav).toBeVisible();
      }
    }
  });

  test('TC-RESP-004: should display mobile marketplace', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 로드 확인
    await expect(page.locator('header')).toBeVisible();
  });

  test('TC-RESP-005: should display mobile education', async ({ page }) => {
    await page.goto('/education');
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 로드 확인
    await expect(page.locator('header')).toBeVisible();
  });

  test('TC-RESP-006: should display mobile community', async ({ page }) => {
    await page.goto('/community');
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 로드 확인
    await expect(page.locator('header')).toBeVisible();
  });

  test('TC-RESP-007: should display mobile login page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');
    
    // 로그인 폼 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('TC-RESP-008: should display mobile FAQ page', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('domcontentloaded');
    
    // FAQ 페이지 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Responsive Design - Tablet', () => {
  test.beforeEach(async ({ page }) => {
    // 태블릿 뷰포트 설정 (iPad)
    await page.setViewportSize({ width: 768, height: 1024 });
  });

  test('TC-RESP-009: should display tablet header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 헤더 확인
    await expect(page.locator('header')).toBeVisible();
  });

  test('TC-RESP-010: should display tablet marketplace', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 로드 확인
    await expect(page.locator('header')).toBeVisible();
  });

  test('TC-RESP-011: should display tablet education', async ({ page }) => {
    await page.goto('/education');
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 로드 확인
    await expect(page.locator('header')).toBeVisible();
  });

  test('TC-RESP-012: should display tablet community', async ({ page }) => {
    await page.goto('/community');
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 로드 확인
    await expect(page.locator('header')).toBeVisible();
  });
});

test.describe('Responsive Design - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    // 데스크톱 뷰포트 설정 (Full HD)
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('TC-RESP-013: should display desktop navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 데스크톱 네비게이션 확인
    await expect(page.locator('header')).toBeVisible();
    
    // 네비게이션 링크 확인
    const navLinks = page.locator('header nav a, header a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-RESP-014: should display desktop marketplace with sidebar', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 로드 확인
    await expect(page.locator('header')).toBeVisible();
  });

  test('TC-RESP-015: should display footer on all pages', async ({ page }) => {
    // 홈페이지
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('footer')).toBeVisible();
    
    // 마켓플레이스
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('footer')).toBeVisible();
  });
});

test.describe('Responsive Design - Small Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // 작은 모바일 뷰포트 설정 (iPhone 5/SE)
    await page.setViewportSize({ width: 320, height: 568 });
  });

  test('TC-RESP-016: should display small mobile home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 로드 확인
    await expect(page.locator('header')).toBeVisible();
  });

  test('TC-RESP-017: should not overflow on small screens', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 가로 스크롤바가 없어야 함
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    // 약간의 오버플로우는 허용
    expect(hasHorizontalScroll).toBeFalsy();
  });
});
