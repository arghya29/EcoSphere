import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  try {
    const messages = (await import(`../messages/${locale}.json`)).default;
    return {
      locale: locale as string,
      messages
    };
  } catch (error) {
    notFound();
  }
});
