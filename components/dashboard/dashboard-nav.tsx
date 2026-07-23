'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import {
  LayoutDashboard,
  Upload,
  Network,
  BarChart3,
  Lightbulb,
  FileDown,
  Settings,
  Ship,
  Menu,
  X,
  LogOut,
  User,
  ChevronsUpDown,
  Target,
  Sliders,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { OrgSwitcher } from '@/components/OrgSwitcher';
import { LanguageSwitcher } from '@/components/nav/LanguageSwitcher';

export function DashboardNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const locale = useLocale();
  const t = useTranslations('DashboardNav');

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm p-3 md:hidden">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-2 font-display text-base font-semibold"
        >
          <Ship className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm">EcoSphere</span>
        </Link>
        <div className="flex items-center gap-2">
          {!mobileOpen && (
            <div className="w-40">
              <OrgSwitcher />
            </div>
          )}
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? t('closeNav') : t('openNav')}
            className="rounded-md p-2 hover:bg-muted focus-ring"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile Primary"
          className="fixed inset-x-0 bottom-0 top-[var(--mobile-nav-height)] z-30 overflow-y-auto border-b border-border bg-card md:hidden"
        >
          <div className="flex flex-col min-h-full">
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto border-t border-border p-3 flex flex-col gap-2">
              <div className="w-full">
                <OrgSwitcher />
              </div>
              <div className="flex items-center gap-1 w-full">
                <ThemeToggle />
                <div className="flex-1">
                  <AccountMenu userName={userName} onNavigate={() => setMobileOpen(false)} />
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5 font-display text-base font-semibold">
          <Ship className="h-5 w-5" aria-hidden="true" />
          EcoSphere
        </div>
        <nav aria-label="Desktop Primary" className="flex-1 py-3">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="border-t border-border p-3 flex flex-col gap-2">
          <div className="w-full">
            <OrgSwitcher />
          </div>
          <div className="flex items-center gap-1 w-full">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="flex-1">
              <AccountMenu userName={userName} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const t = useTranslations('DashboardNav');
  const locale = useLocale();

  const NAV_ITEMS = [
    { href: `/${locale}/dashboard`, label: t('dashboard'), icon: LayoutDashboard },
    { href: `/${locale}/upload`, label: t('uploadData'), icon: Upload },
    { href: `/${locale}/builder`, label: t('builder'), icon: Network },
    { href: `/${locale}/analysis`, label: t('emissions'), icon: BarChart3 },
    { href: `/${locale}/targets`, label: t('targets'), icon: Target },
    { href: `/${locale}/settings/factors`, label: t('emissionFactors'), icon: Sliders },
    { href: `/${locale}/insights`, label: t('insights'), icon: Lightbulb },
    { href: `/${locale}/reports`, label: t('reports'), icon: FileDown },
  ];

  return (
    <ul className="flex flex-col gap-0.5 px-2" role="list">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <li key={item.href} role="listitem">
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'A';
}

function AccountMenu({ userName, onNavigate }: { userName: string; onNavigate?: () => void }) {
  const t = useTranslations('DashboardNav');
  const locale = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={userName ? `${userName} ${t('accountMenu')}` : t('accountMenu')}
        className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            aria-hidden="true"
          >
            {getInitial(userName)}
          </span>
          <span className="truncate" title={userName}>
            {userName}
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="truncate" title={userName}>
          {userName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/${locale}/profile`}
            onClick={onNavigate}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" aria-hidden="true" />
            {t('profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`/${locale}/settings`}
            onClick={onNavigate}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            {t('settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            signOut({ callbackUrl: `/${locale}` });
          }}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
