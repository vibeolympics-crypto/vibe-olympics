'use client';

import { useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
    document.cookie = `${name}=${value};path=/;max-age=${maxAge}`;
  }
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = useCallback((newLocale: string) => {
    // 쿠키에 로케일 저장
    setCookie('NEXT_LOCALE', newLocale, 31536000);
    
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
        disabled={isPending}
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
            disabled={isPending}
          >
            {localeNames[locale]}
          </button>
        ))}
      </div>
    </div>
  );
}
