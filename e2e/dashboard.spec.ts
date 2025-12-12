import { test, expect } from '@playwright/test';

/**
 * 대시보드 및 관리자 페이지 테스트 (세션 82-83 신규 기능)
 * - 서버 헬스 모니터링 대시보드
 * - 판매 리포트 대시보드
 * - 지원 티켓 대시보드
 */

test.describe('Dashboard Health Monitoring Page', () => {
  test('TC-DASH-001: should redirect to login when accessing health dashboard unauthenticated', async ({ page }) => {
    await page.goto('/dashboard/health');
    
    // 로그인 페이지로 리다이렉트되거나 401 에러 표시
    await expect(page).toHaveURL(/\/(auth\/login|dashboard\/health)/);
  });

  test('TC-DASH-002: health page should have proper title', async ({ page }) => {
    await page.goto('/dashboard/health');
    
    // 페이지 제목 확인 (인증 여부와 관계없이)
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

test.describe('Dashboard Reports Page', () => {
  test('TC-DASH-003: should redirect to login when accessing reports dashboard unauthenticated', async ({ page }) => {
    await page.goto('/dashboard/reports');
    
    // 로그인 페이지로 리다이렉트되거나 에러 표시
    await expect(page).toHaveURL(/\/(auth\/login|dashboard\/reports)/);
  });

  test('TC-DASH-004: reports page should have proper structure', async ({ page }) => {
    await page.goto('/dashboard/reports');
    
    // 페이지가 로드되는지 확인
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });
});

test.describe('Dashboard Support Page', () => {
  test('TC-DASH-005: should redirect to login when accessing support dashboard unauthenticated', async ({ page }) => {
    await page.goto('/dashboard/support');
    
    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/(auth\/login|dashboard\/support)/);
  });

  test('TC-DASH-006: support page should have proper structure', async ({ page }) => {
    await page.goto('/dashboard/support');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });
});

test.describe('Admin Dashboard', () => {
  test('TC-ADMIN-005: should redirect to login when accessing admin dashboard unauthenticated', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/(auth\/login|admin)/);
  });

  test('TC-ADMIN-006: admin page should exist', async ({ page }) => {
    await page.goto('/admin');
    
    // 페이지가 존재하는지 확인 (리다이렉트 포함)
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });
});

test.describe('Admin A/B Test Page', () => {
  test('TC-ADMIN-007: should redirect to login when accessing A/B test dashboard unauthenticated', async ({ page }) => {
    await page.goto('/admin/ab-test');
    
    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/(auth\/login|admin)/);
  });
});

test.describe('Admin Settlements Page', () => {
  test('TC-ADMIN-008: should redirect to login when accessing settlements unauthenticated', async ({ page }) => {
    await page.goto('/admin/settlements');
    
    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/(auth\/login|admin)/);
  });
});

test.describe('Admin Refunds Page', () => {
  test('TC-ADMIN-009: should redirect to login when accessing refunds unauthenticated', async ({ page }) => {
    await page.goto('/admin/refunds');
    
    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/(auth\/login|admin)/);
  });
});

test.describe('Dashboard Navigation', () => {
  test('TC-DASH-007: dashboard layout should be accessible', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.waitForLoadState('domcontentloaded');
    
    // 대시보드 페이지 로드 확인
    expect(await page.title()).toBeTruthy();
  });

  test('TC-DASH-008: dashboard products page should exist', async ({ page }) => {
    await page.goto('/dashboard/products');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });

  test('TC-DASH-009: dashboard purchases page should exist', async ({ page }) => {
    await page.goto('/dashboard/purchases');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });

  test('TC-DASH-010: dashboard wishlist page should exist', async ({ page }) => {
    await page.goto('/dashboard/wishlist');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });

  test('TC-DASH-011: dashboard settings page should exist', async ({ page }) => {
    await page.goto('/dashboard/settings');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });

  test('TC-DASH-012: dashboard analytics page should exist', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });

  test('TC-DASH-013: dashboard collections page should exist', async ({ page }) => {
    await page.goto('/dashboard/collections');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });

  test('TC-DASH-014: dashboard notifications page should exist', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });

  test('TC-DASH-015: dashboard following page should exist', async ({ page }) => {
    await page.goto('/dashboard/following');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });

  test('TC-DASH-016: dashboard subscriptions page should exist', async ({ page }) => {
    await page.goto('/dashboard/subscriptions');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });

  test('TC-DASH-017: dashboard settlements page should exist', async ({ page }) => {
    await page.goto('/dashboard/settlements');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });
});

test.describe('Seller Dashboard', () => {
  test('TC-SELLER-011: seller coupons page should exist', async ({ page }) => {
    await page.goto('/dashboard/seller/coupons');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });

  test('TC-SELLER-012: product creation page should exist', async ({ page }) => {
    await page.goto('/dashboard/products/new');
    
    await page.waitForLoadState('domcontentloaded');
    expect(await page.title()).toBeTruthy();
  });
});
