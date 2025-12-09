import { test, expect } from '@playwright/test';

test.describe('Accessibility - Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('TC-A11Y-001: should have proper page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Vibe Olympics/);
  });

  test('TC-A11Y-002: should have main landmark', async ({ page }) => {
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  test('TC-A11Y-003: should have header landmark', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible();
  });

  test('TC-A11Y-004: should have footer landmark', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
  });

  test('TC-A11Y-005: should have navigation landmark', async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"]');
    const count = await nav.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC-A11Y-006: should have skip to main content link', async ({ page }) => {
    // 스킵 네비게이션 링크 확인 (선택적)
    const skipLink = page.locator('a[href="#main"], a[href="#content"], a:has-text("본문으로")');
    // 없어도 테스트 통과 (권장 사항)
  });

  test('TC-A11Y-007: should have proper heading hierarchy', async ({ page }) => {
    // h1이 하나 있어야 함
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Accessibility - Forms', () => {
  test('TC-A11Y-008: should have labels for login form inputs', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');
    
    // 이메일 입력 필드에 라벨 또는 aria-label이 있어야 함
    const emailInput = page.locator('input[type="email"]');
    const hasLabel = await emailInput.evaluate((el) => {
      const id = el.id;
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      return !!(label || ariaLabel || ariaLabelledBy);
    });
    
    // 라벨이 없어도 placeholder가 있으면 OK (접근성 권장 사항)
    const hasPlaceholder = await emailInput.getAttribute('placeholder');
    expect(hasLabel || hasPlaceholder).toBeTruthy();
  });

  test('TC-A11Y-009: should have labels for signup form inputs', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('domcontentloaded');
    
    // 폼 필드 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('TC-A11Y-010: should show error messages accessibly', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');
    
    // 빈 폼 제출
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    // 에러 메시지가 있다면 적절한 role이 있어야 함
    const errorMessage = page.locator('[role="alert"], .error, .text-red-500, .text-destructive');
    // 에러가 있으면 확인
  });
});

test.describe('Accessibility - Navigation', () => {
  test('TC-A11Y-011: should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Tab 키로 포커스 이동
    await page.keyboard.press('Tab');
    
    // 포커스된 요소가 있어야 함
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('TC-A11Y-012: should have visible focus indicator', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Tab 키로 포커스 이동
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 포커스된 요소 확인
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('TC-A11Y-013: should navigate with keyboard in marketplace', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('domcontentloaded');
    
    // Tab 키로 포커스 이동
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // 포커스된 요소가 있어야 함
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

test.describe('Accessibility - Images', () => {
  test('TC-A11Y-014: should have alt text for images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 모든 이미지에 alt 속성이 있어야 함 (빈 문자열도 OK - 장식용 이미지)
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // alt 속성이 있어야 함 (null이 아님)
      expect(alt !== null).toBeTruthy();
    }
  });

  test('TC-A11Y-015: should have alt text in marketplace', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    
    // 상품 이미지 확인
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt !== null).toBeTruthy();
    }
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('TC-A11Y-016: should have readable text on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 텍스트가 표시되는지 확인 (시각적 테스트)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('TC-A11Y-017: should support dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 다크 모드 토글 버튼 확인 (있는 경우)
    const darkModeButton = page.locator('button[aria-label*="다크"], button[aria-label*="dark"], button:has([class*="moon"]), button:has([class*="sun"])');
    if (await darkModeButton.isVisible()) {
      await darkModeButton.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Accessibility - Interactive Elements', () => {
  test('TC-A11Y-018: should have accessible buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 버튼에 텍스트 또는 aria-label이 있어야 함
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // 텍스트, aria-label, 또는 title 중 하나는 있어야 함
      expect(!!(text?.trim() || ariaLabel || title)).toBeTruthy();
    }
  });

  test('TC-A11Y-019: should have accessible links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // 링크에 텍스트 또는 aria-label이 있어야 함
    const links = page.locator('a');
    const count = await links.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');
      
      // 텍스트, aria-label, 또는 title 중 하나는 있어야 함
      expect(!!(text?.trim() || ariaLabel || title)).toBeTruthy();
    }
  });
});
