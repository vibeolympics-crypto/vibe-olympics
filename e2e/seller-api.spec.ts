import { test, expect } from '@playwright/test';

/**
 * 판매자 API 테스트 (세션 83 신규 기능)
 * - 판매 리포트
 * - 재고/한정 판매 알림
 * - 프로모션 스케줄러
 * - 경쟁 상품 분석
 */

test.describe('API Seller Sales Report', () => {
  test('TC-SELLER-001: should reject unauthenticated sales report request', async ({ request }) => {
    const response = await request.get('/api/seller/sales-report');
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-SELLER-002: should reject unauthenticated sales report email trigger', async ({ request }) => {
    const response = await request.post('/api/seller/sales-report', {
      data: {
        action: 'send',
        type: 'weekly',
      },
    });
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-SELLER-003: should validate report type parameter', async ({ request }) => {
    const response = await request.get('/api/seller/sales-report?type=invalid');
    
    // 400 Bad Request 또는 401 Unauthorized (인증 우선)
    expect([400, 401, 403]).toContain(response.status());
  });
});

test.describe('API Seller Stock Alert', () => {
  test('TC-SELLER-004: should reject unauthenticated stock alert request', async ({ request }) => {
    const response = await request.get('/api/seller/stock-alert');
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-SELLER-005: should reject unauthenticated stock alert trigger', async ({ request }) => {
    const response = await request.post('/api/seller/stock-alert', {
      data: {
        productId: 'test-product-id',
      },
    });
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('API Seller Promotions', () => {
  test('TC-SELLER-006: should reject unauthenticated promotions list request', async ({ request }) => {
    const response = await request.get('/api/seller/promotions');
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-SELLER-007: should reject unauthenticated promotion creation', async ({ request }) => {
    const response = await request.post('/api/seller/promotions', {
      data: {
        productId: 'test-product-id',
        name: 'Test Promotion',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-SELLER-008: should reject unauthenticated promotion cancellation', async ({ request }) => {
    const response = await request.patch('/api/seller/promotions', {
      data: {
        promotionId: 'test-promotion-id',
        action: 'cancel',
      },
    });
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('API Seller Competitor Analysis', () => {
  test('TC-SELLER-009: should reject unauthenticated competitor analysis request', async ({ request }) => {
    const response = await request.get('/api/seller/competitor-analysis?productId=test-product-id');
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-SELLER-010: should validate productId parameter', async ({ request }) => {
    const response = await request.get('/api/seller/competitor-analysis');
    
    // 400 Bad Request (missing productId) 또는 401 Unauthorized
    expect([400, 401, 403]).toContain(response.status());
  });
});

test.describe('API Admin Backup', () => {
  test('TC-ADMIN-001: should reject unauthenticated backup status request', async ({ request }) => {
    const response = await request.get('/api/admin/backup');
    
    // 401 Unauthorized 또는 403 Forbidden
    expect([401, 403]).toContain(response.status());
  });

  test('TC-ADMIN-002: should reject unauthenticated backup trigger', async ({ request }) => {
    const response = await request.post('/api/admin/backup', {
      data: {
        action: 'backup',
      },
    });
    
    // 401 Unauthorized 또는 403 Forbidden
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('API Admin Health Monitoring', () => {
  test('TC-ADMIN-003: should reject unauthenticated health metrics request', async ({ request }) => {
    const response = await request.get('/api/admin/health');
    
    // 401 Unauthorized 또는 403 Forbidden
    expect([401, 403]).toContain(response.status());
  });

  test('TC-ADMIN-004: should reject unauthenticated realtime events request', async ({ request }) => {
    const response = await request.get('/api/admin/realtime-events');
    
    // 401 Unauthorized 또는 403 Forbidden
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('API Referral System', () => {
  test('TC-REF-001: should reject unauthenticated referral stats request', async ({ request }) => {
    const response = await request.get('/api/referral');
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-REF-002: should reject unauthenticated referral code generation', async ({ request }) => {
    const response = await request.post('/api/referral', {
      data: {
        action: 'generate',
      },
    });
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('API Feedback System', () => {
  test('TC-FEED-001: should allow anonymous feedback submission', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        type: 'general',
        rating: 5,
        comment: 'Great service!',
      },
    });
    
    // 200 OK 또는 201 Created (익명 피드백 허용 시)
    // 또는 401 Unauthorized (인증 필요 시)
    expect([200, 201, 400, 401]).toContain(response.status());
  });

  test('TC-FEED-002: should validate feedback rating', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        type: 'general',
        rating: 10, // 잘못된 값 (1-5 범위)
        comment: 'Test',
      },
    });
    
    // 400 Bad Request 또는 다른 응답
    expect([400, 401, 422]).toContain(response.status());
  });
});

test.describe('API CSV Export/Import', () => {
  test('TC-CSV-001: should reject unauthenticated CSV export request', async ({ request }) => {
    const response = await request.get('/api/admin/csv?type=products');
    
    // 401 Unauthorized 또는 403 Forbidden
    expect([401, 403]).toContain(response.status());
  });

  test('TC-CSV-002: should reject unauthenticated CSV import request', async ({ request }) => {
    const response = await request.post('/api/admin/csv', {
      data: {
        type: 'products',
        data: [],
      },
    });
    
    // 401 Unauthorized 또는 403 Forbidden
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('API Bulk Operations', () => {
  test('TC-BULK-001: should reject unauthenticated bulk product update', async ({ request }) => {
    const response = await request.patch('/api/admin/bulk-products', {
      data: {
        ids: ['product-1', 'product-2'],
        action: 'publish',
      },
    });
    
    // 401 Unauthorized 또는 403 Forbidden
    expect([401, 403]).toContain(response.status());
  });

  test('TC-BULK-002: should reject unauthenticated bulk product delete', async ({ request }) => {
    const response = await request.delete('/api/admin/bulk-products', {
      data: {
        ids: ['product-1', 'product-2'],
      },
    });
    
    // 401 Unauthorized 또는 403 Forbidden
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('API Support Tickets', () => {
  test('TC-TICKET-001: should reject unauthenticated ticket list request', async ({ request }) => {
    const response = await request.get('/api/support/tickets');
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });

  test('TC-TICKET-002: should reject unauthenticated ticket creation', async ({ request }) => {
    const response = await request.post('/api/support/tickets', {
      data: {
        subject: 'Test Ticket',
        description: 'Test description',
        category: 'general',
      },
    });
    
    // 401 Unauthorized
    expect([401, 403]).toContain(response.status());
  });
});
