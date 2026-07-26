import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locales.includes(locale as Locale) ? locale : defaultLocale;
  const messages = (await import(`./${resolvedLocale}.json`)).default;

  return {
    messages,
    locale: resolvedLocale as string,
  };
});
