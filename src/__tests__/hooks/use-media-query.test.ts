import { renderHook } from '@testing-library/react';
import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/use-media-query';

// Mock matchMedia
const createMatchMedia = (matches: boolean) => {
  return (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
};

describe('useMediaQuery Hook', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns false initially when media query does not match', () => {
    window.matchMedia = createMatchMedia(false) as typeof window.matchMedia;
    
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    
    expect(result.current).toBe(false);
  });

  it('returns true when media query matches', () => {
    window.matchMedia = createMatchMedia(true) as typeof window.matchMedia;
    
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    
    // After useEffect runs
    expect(result.current).toBe(true);
  });
});

describe('useIsMobile Hook', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns true on mobile viewport', () => {
    window.matchMedia = createMatchMedia(true) as typeof window.matchMedia;
    
    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(true);
  });

  it('returns false on non-mobile viewport', () => {
    window.matchMedia = createMatchMedia(false) as typeof window.matchMedia;
    
    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);
  });
});

describe('useIsTablet Hook', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns true on tablet viewport', () => {
    window.matchMedia = createMatchMedia(true) as typeof window.matchMedia;
    
    const { result } = renderHook(() => useIsTablet());
    
    expect(result.current).toBe(true);
  });
});

describe('useIsDesktop Hook', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns true on desktop viewport', () => {
    window.matchMedia = createMatchMedia(true) as typeof window.matchMedia;
    
    const { result } = renderHook(() => useIsDesktop());
    
    expect(result.current).toBe(true);
  });
});
