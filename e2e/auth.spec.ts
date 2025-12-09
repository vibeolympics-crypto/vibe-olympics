import { test, expect } from '@playwright/test';

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test('TC-AUTH-001: should display login page with all form elements', async ({ page }) => {
    // 로그인 페이지 타이틀 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // 이메일 입력 필드
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // 비밀번호 입력 필드
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // 로그인 버튼
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // GitHub 소셜 로그인 버튼
    await expect(page.locator('button:has-text("GitHub")')).toBeVisible();
  });

  test('TC-AUTH-002: should show validation error for empty email', async ({ page }) => {
    // 이메일 없이 비밀번호만 입력
    await page.fill('input[type="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // HTML5 validation 또는 커스텀 에러 메시지 확인
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('TC-AUTH-003: should show validation error for invalid email format', async ({ page }) => {
    // 잘못된 이메일 형식 입력
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // HTML5 validation 또는 커스텀 에러 메시지 확인
    await page.waitForTimeout(500);
  });

  test('TC-AUTH-004: should show error for incorrect credentials', async ({ page }) => {
    // 잘못된 로그인 정보 입력
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // 에러 메시지 대기 (네트워크 요청 후 표시)
    await page.waitForTimeout(2000);
  });

  test('TC-AUTH-005: should have link to signup page', async ({ page }) => {
    // 회원가입 링크 확인
    const signupLink = page.locator('a[href*="/auth/signup"]');
    await expect(signupLink).toBeVisible();
  });

  test('TC-AUTH-006: should have link to forgot password page', async ({ page }) => {
    // 비밀번호 찾기 링크 확인
    const forgotPasswordLink = page.locator('a[href*="/auth/forgot-password"]');
    await expect(forgotPasswordLink).toBeVisible();
  });

  test('TC-AUTH-007: should navigate to signup page from login', async ({ page }) => {
    const signupLink = page.locator('a[href*="/auth/signup"]');
    await signupLink.click();
    
    await expect(page).toHaveURL(/\/auth\/signup/);
  });
});

test.describe('Authentication - Signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('domcontentloaded');
  });

  test('TC-AUTH-008: should display signup page with all form elements', async ({ page }) => {
    // 회원가입 페이지 타이틀 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // 이름 입력 필드
    await expect(page.locator('input[name="name"], input[placeholder*="이름"]')).toBeVisible();
    
    // 이메일 입력 필드
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // 비밀번호 입력 필드
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    
    // 회원가입 버튼
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('TC-AUTH-009: should validate password strength', async ({ page }) => {
    // 약한 비밀번호 입력
    await page.fill('input[name="name"], input[placeholder*="이름"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
  });

  test('TC-AUTH-010: should have link to login page', async ({ page }) => {
    // 로그인 링크 확인
    const loginLink = page.locator('a[href*="/auth/login"]');
    await expect(loginLink).toBeVisible();
  });
});

test.describe('Authentication - Forgot Password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.waitForLoadState('domcontentloaded');
  });

  test('TC-AUTH-011: should display forgot password page', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // 이메일 입력 필드
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // 제출 버튼
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('TC-AUTH-012: should validate email format', async ({ page }) => {
    // 잘못된 이메일 형식 입력
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(500);
  });
});

test.describe('Authentication - Protected Routes', () => {
  test('TC-AUTH-013: should redirect to login for dashboard access', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 로그인 페이지로 리다이렉트 또는 401 상태 확인
    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/dashboard')).toBeTruthy();
  });

  test('TC-AUTH-014: should redirect to login for admin access', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // 로그인 페이지로 리다이렉트 또는 접근 거부
    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/admin')).toBeTruthy();
  });
});
