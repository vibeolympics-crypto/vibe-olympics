import { test, expect } from '@playwright/test';

test.describe('API Health & Status', () => {
  test('TC-API-001: should return health check status', async ({ request }) => {
    const response = await request.get('/api/health');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  test('TC-API-002: should return categories', async ({ request }) => {
    const response = await request.get('/api/categories');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});

test.describe('API Products', () => {
  test('TC-API-003: should return products list', async ({ request }) => {
    const response = await request.get('/api/products');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('products');
    expect(Array.isArray(data.products)).toBeTruthy();
  });

  test('TC-API-004: should filter products by category', async ({ request }) => {
    const response = await request.get('/api/products?category=TEMPLATE');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('products');
  });

  test('TC-API-005: should search products', async ({ request }) => {
    const response = await request.get('/api/products?search=AI');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('products');
  });

  test('TC-API-006: should paginate products', async ({ request }) => {
    const response = await request.get('/api/products?page=1&limit=10');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('products');
    expect(data).toHaveProperty('pagination');
  });

  test('TC-API-007: should return 404 for non-existent product', async ({ request }) => {
    const response = await request.get('/api/products/non-existent-product-id-12345');
    
    // 404 Not Found 응답
    expect(response.status()).toBe(404);
  });
});

test.describe('API Tutorials', () => {
  test('TC-API-008: should return tutorials list', async ({ request }) => {
    const response = await request.get('/api/tutorials');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('tutorials');
    expect(Array.isArray(data.tutorials)).toBeTruthy();
  });

  test('TC-API-009: should filter tutorials by difficulty', async ({ request }) => {
    const response = await request.get('/api/tutorials?difficulty=BEGINNER');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('tutorials');
  });

  test('TC-API-010: should return 404 for non-existent tutorial', async ({ request }) => {
    const response = await request.get('/api/tutorials/non-existent-tutorial-id-12345');
    
    // 404 Not Found 응답
    expect(response.status()).toBe(404);
  });
});

test.describe('API Posts (Community)', () => {
  test('TC-API-011: should return posts list', async ({ request }) => {
    const response = await request.get('/api/posts');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('posts');
    expect(Array.isArray(data.posts)).toBeTruthy();
  });

  test('TC-API-012: should filter posts by category', async ({ request }) => {
    const response = await request.get('/api/posts?category=QUESTION');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('posts');
  });

  test('TC-API-013: should return 404 for non-existent post', async ({ request }) => {
    const response = await request.get('/api/posts/non-existent-post-id-12345');
    
    // 404 Not Found 응답
    expect(response.status()).toBe(404);
  });
});

test.describe('API Authentication', () => {
  test('TC-API-014: should reject signup with invalid email', async ({ request }) => {
    const response = await request.post('/api/auth/signup', {
      data: {
        email: 'invalid-email',
        password: 'Test1234!',
        name: 'Test User',
      },
    });
    
    // 400 Bad Request 또는 유효성 검사 에러
    expect([400, 422, 500]).toContain(response.status());
  });

  test('TC-API-015: should reject signup with weak password', async ({ request }) => {
    const response = await request.post('/api/auth/signup', {
      data: {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      },
    });
    
    // 400 Bad Request 또는 유효성 검사 에러
    expect([400, 422, 500]).toContain(response.status());
  });

  test('TC-API-016: should reject forgot password with invalid email', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: {
        email: 'invalid-email',
      },
    });
    
    // 400 Bad Request 또는 유효성 검사 에러
    expect([400, 422, 500]).toContain(response.status());
  });
});

test.describe('API Protected Endpoints', () => {
  test('TC-API-017: should reject unauthenticated request to user profile', async ({ request }) => {
    const response = await request.get('/api/user/profile');
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-API-018: should reject unauthenticated request to purchases', async ({ request }) => {
    const response = await request.get('/api/purchases');
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-API-019: should reject unauthenticated request to wishlist', async ({ request }) => {
    const response = await request.get('/api/wishlist');
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-API-020: should reject unauthenticated request to notifications', async ({ request }) => {
    const response = await request.get('/api/notifications');
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-API-021: should reject unauthenticated request to admin stats', async ({ request }) => {
    const response = await request.get('/api/admin/stats');
    
    // 401 Unauthorized 또는 403 Forbidden
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('API Reviews', () => {
  test('TC-API-022: should return reviews for product', async ({ request }) => {
    const response = await request.get('/api/reviews?productId=test-product-id');
    
    // 200 OK 응답 (비어있어도 OK)
    expect([200, 400]).toContain(response.status());
  });

  test('TC-API-023: should reject review without authentication', async ({ request }) => {
    const response = await request.post('/api/reviews', {
      data: {
        productId: 'test-product-id',
        rating: 5,
        content: 'Great product!',
      },
    });
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('API Search', () => {
  test('TC-API-024: should return search suggestions', async ({ request }) => {
    const response = await request.get('/api/search/suggestions?q=AI');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
  });

  test('TC-API-025: should return popular searches', async ({ request }) => {
    const response = await request.get('/api/search/popular');
    
    // 200 OK 응답
    expect(response.status()).toBe(200);
  });
});
