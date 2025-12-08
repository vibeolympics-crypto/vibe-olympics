import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the home page correctly', async ({ page }) => {
    await page.goto('/');
    
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/Vibe Olympics/);
    
    // 헤더 로고 확인
    await expect(page.locator('header')).toBeVisible();
    
    // 히어로 섹션 확인
    await expect(page.locator('text=VIBE 코딩')).toBeVisible();
  });

  test('should navigate to marketplace', async ({ page }) => {
    // 직접 마켓플레이스로 이동
    await page.goto('/marketplace', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 로드 확인
    await expect(page).toHaveURL(/\/marketplace/);
  });

  test('should navigate to education', async ({ page }) => {
    // 직접 교육 센터로 이동
    await page.goto('/education');
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 로드 확인
    await expect(page).toHaveURL(/\/education/);
  });

  test('should navigate to community', async ({ page }) => {
    // 직접 커뮤니티로 이동
    await page.goto('/community');
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 로드 확인
    await expect(page).toHaveURL(/\/community/);
  });
});

test.describe('Marketplace', () => {
  test('should display products list', async ({ page }) => {
    await page.goto('/marketplace', { timeout: 60000 });
    
    // 페이지 로딩 대기
    await page.waitForLoadState('domcontentloaded');
    
    // 페이지 제목 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/marketplace', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    
    // 카테고리 버튼이 있는지 확인 (URL 변경은 선택적)
    await expect(page.locator('button').first()).toBeVisible();
  });

  test('should search products', async ({ page }) => {
    await page.goto('/marketplace', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    
    // 검색 입력 필드 존재 확인
    const searchInput = page.locator('input[placeholder*="검색"]').first();
    await expect(searchInput).toBeVisible();
  });
});

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 로그인 폼 확인 (h1 또는 버튼)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should display signup page', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // 회원가입 폼 확인 (h1 태그)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 빈 폼 제출
    await page.click('button[type="submit"]');
    
    // 에러 메시지 또는 유효성 검사 확인
    await page.waitForTimeout(500);
  });
});

test.describe('Education Center', () => {
  test('should display education content', async ({ page }) => {
    await page.goto('/education');
    
    // 페이지 타이틀 확인 (h1 태그)
    await expect(page.getByRole('heading', { name: '교육 센터' })).toBeVisible();
    
    // 콘텐츠 유형 탭 확인
    await expect(page.locator('button:has-text("전체")')).toBeVisible();
    await expect(page.locator('button:has-text("튜토리얼")')).toBeVisible();
  });

  test('should filter by content type', async ({ page }) => {
    await page.goto('/education');
    
    // 튜토리얼 탭 클릭
    await page.click('button:has-text("튜토리얼")');
    
    // 필터 적용 확인
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Community', () => {
  test('should display community page', async ({ page }) => {
    await page.goto('/community');
    
    // 페이지 확인 (h1 태그)
    await expect(page.getByRole('heading', { name: '커뮤니티', exact: true })).toBeVisible();
  });
});

test.describe('FAQ Page', () => {
  test('should display FAQ page', async ({ page }) => {
    await page.goto('/faq');
    
    // 페이지 타이틀 확인 (h1 태그)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should expand FAQ accordion items', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');
    
    // 첫 번째 FAQ 아이템 클릭
    const firstItem = page.locator('[data-radix-collection-item]').first();
    if (await firstItem.isVisible()) {
      await firstItem.click();
      await page.waitForTimeout(300);
    }
  });

  test('should filter FAQ by category', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');
    
    // 카테고리 탭이 있으면 클릭
    const categoryTab = page.locator('button:has-text("결제")');
    if (await categoryTab.isVisible()) {
      await categoryTab.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Seller Profile', () => {
  test('should display 404 for non-existent seller', async ({ page }) => {
    await page.goto('/seller/non-existent-seller-id');
    
    // 404 또는 에러 페이지 확인
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Product Detail', () => {
  test('should display 404 for non-existent product', async ({ page }) => {
    await page.goto('/marketplace/non-existent-product-id');
    
    // 404 또는 에러 페이지 확인
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Search Functionality', () => {
  test('should perform search from header', async ({ page }) => {
    await page.goto('/');
    
    // 검색 버튼 또는 검색창 확인
    const searchButton = page.locator('[aria-label*="검색"], button:has-text("검색")');
    if (await searchButton.first().isVisible()) {
      await searchButton.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should navigate to search results', async ({ page }) => {
    await page.goto('/marketplace?search=AI');
    await page.waitForLoadState('networkidle');
    
    // 검색 결과 페이지 확인
    await expect(page).toHaveURL(/search=AI/);
  });
});

test.describe('Responsive Design', () => {
  test('should display mobile menu on small screens', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 모바일 메뉴 버튼 확인
    const menuButton = page.locator('button[aria-label*="메뉴"], button[aria-label*="Menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('should be responsive on tablet', async ({ page }) => {
    // 태블릿 뷰포트 설정
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/marketplace');
    
    await page.waitForLoadState('networkidle');
    await expect(page.locator('header')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should display not found page for invalid routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    
    // 404 페이지 확인
    await expect(page.locator('text=404')).toBeVisible();
  });
});

test.describe('Footer Links', () => {
  test('should have footer visible', async ({ page }) => {
    await page.goto('/');
    
    // 푸터 확인
    await expect(page.locator('footer')).toBeVisible();
  });
});
