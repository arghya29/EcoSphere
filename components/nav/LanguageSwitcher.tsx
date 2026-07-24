'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) return;

    // Replace the current locale in the pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    const newPath = `/${newLocale}${pathWithoutLocale === '' ? '' : pathWithoutLocale}`;

    router.replace(newPath);
    // Refresh to apply language change server-side
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
        aria-label={t('label')}
      >
        <Globe className="h-5 w-5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchLanguage('en')}
          className={locale === 'en' ? 'font-bold bg-muted' : ''}
        >
          {t('en')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLanguage('es')}
          className={locale === 'es' ? 'font-bold bg-muted' : ''}
        >
          {t('es')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
