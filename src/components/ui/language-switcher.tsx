'use client';

import { useTransition, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];

const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
};

interface LanguageSwitcherProps {
  currentLocale: string;
}

// 쿠키 설정 유틸리티 함수 (컴포넌트 외부에 정의)
function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
  }
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = useCallback((newLocale: string) => {
    if (newLocale === currentLocale) return;
    
    // 쿠키에 로케일 저장
    setCookie('NEXT_LOCALE', newLocale, 31536000);
    
    startTransition(() => {
      // 현재 경로를 유지하면서 페이지 새로고침
      // router.refresh()만으로는 서버 컴포넌트의 로케일이 변경되지 않을 수 있음
      // window.location.reload()를 사용하여 전체 페이지 새로고침
      window.location.reload();
    });
  }, [currentLocale]);

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
        disabled={isPending}
        aria-label="언어 선택"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm">{localeNames[currentLocale as Locale]}</span>
      </button>
      
      <div className="absolute right-0 top-full mt-1 py-1 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-elevated)] transition-colors ${
              currentLocale === locale
                ? 'text-[var(--primary)] font-medium'
                : 'text-[var(--text-secondary)]'
            }`}
            disabled={isPending || currentLocale === locale}
          >
            {localeNames[locale]}
          </button>
        ))}
      </div>
    </div>
  );
}
