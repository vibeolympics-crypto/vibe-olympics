/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

// Mock auth module first
jest.mock('@/lib/auth', () => ({
  authOptions: {
    providers: [],
    callbacks: {},
  },
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn().mockResolvedValue(null),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return products list with pagination', async () => {
      const mockProducts = [
        {
          id: '1',
          title: 'Test Product',
          slug: 'test-product',
          shortDescription: 'Test description',
          price: 10000,
          pricingType: 'PAID',
          thumbnail: null,
          viewCount: 100,
          salesCount: 10,
          averageRating: 4.5,
          reviewCount: 5,
          createdAt: new Date(),
          category: { id: '1', name: 'Web App', slug: 'web-app' },
          seller: { id: '1', name: 'Test Seller', image: null },
        },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      // Import after mocks
      const { GET } = await import('@/app/api/products/route');
      
      const request = new NextRequest('http://localhost:3001/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toBeDefined();
      expect(data.pagination).toBeDefined();
    });

    it('should filter products by category', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      const { GET } = await import('@/app/api/products/route');
      
      const request = new NextRequest('http://localhost:3001/api/products?category=web-app');
      const response = await GET(request);
      const _data = await response.json(); // 응답 소비용

      expect(response.status).toBe(200);
      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it('should search products by query', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      const { GET } = await import('@/app/api/products/route');
      
      const request = new NextRequest('http://localhost:3001/api/products?search=chatbot');
      const response = await GET(request);
      const _data = await response.json(); // 응답 소비용

      expect(response.status).toBe(200);
    });
  });
});

describe('Categories API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: '1', name: '웹 앱', slug: 'web-app', _count: { products: 5 } },
        { id: '2', name: '모바일 앱', slug: 'mobile-app', _count: { products: 3 } },
      ];

      (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const { GET } = await import('@/app/api/categories/route');
      
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toBeDefined();
      expect(Array.isArray(data.categories)).toBe(true);
    });
  });
});
