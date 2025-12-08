import { cn, formatPrice, formatDate, truncateText, slugify } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className merge)', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('merges tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid');
    });
  });

  describe('formatPrice', () => {
    it('formats Korean won correctly', () => {
      expect(formatPrice(10000)).toBe('₩10,000');
      expect(formatPrice(1500000)).toBe('₩1,500,000');
    });

    it('handles zero', () => {
      expect(formatPrice(0)).toBe('₩0');
    });

    it('handles decimal values', () => {
      // Intl.NumberFormat rounds decimals
      expect(formatPrice(10000.5)).toMatch(/₩10,00[01]/);
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-12-07');
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('12');
    });

    it('handles string dates', () => {
      const formatted = formatDate('2024-12-07');
      expect(formatted).toBeTruthy();
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that needs to be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long ...');
    });

    it('returns original text if within limit', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    it('handles exact length', () => {
      const text = '12345';
      expect(truncateText(text, 5)).toBe('12345');
    });
  });

  describe('slugify', () => {
    it('generates slug from text', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('handles Korean characters', () => {
      const slug = slugify('AI 챗봇 템플릿');
      expect(slug).not.toContain(' ');
      expect(slug.toLowerCase()).toBe(slug);
    });

    it('removes special characters', () => {
      expect(slugify('Hello! World?')).toBe('hello-world');
    });

    it('handles multiple spaces and dashes', () => {
      expect(slugify('hello   world')).toBe('hello-world');
    });

    it('removes leading and trailing dashes', () => {
      expect(slugify('-hello-world-')).toBe('hello-world');
    });
  });
});
