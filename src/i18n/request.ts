import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['ko', 'en'] as const;
export const defaultLocale = 'ko' as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  // 1. 쿠키에서 로케일 확인
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return {
      locale: cookieLocale,
      messages: (await import(`../../messages/${cookieLocale}.json`)).default,
    };
  }

  // 2. Accept-Language 헤더에서 로케일 확인
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  
  if (acceptLanguage) {
    const browserLocale = acceptLanguage.split(',')[0].split('-')[0];
    if (locales.includes(browserLocale as Locale)) {
      return {
        locale: browserLocale,
        messages: (await import(`../../messages/${browserLocale}.json`)).default,
      };
    }
  }

  // 3. 기본 로케일 사용
  return {
    locale: defaultLocale,
    messages: (await import(`../../messages/${defaultLocale}.json`)).default,
  };
});
