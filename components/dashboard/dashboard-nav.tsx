'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload Data', icon: Upload },
  { href: '/builder', label: 'Supply-Chain Builder', icon: Network },
  { href: '/analysis', label: 'Emissions', icon: BarChart3 },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
  { href: '/reports', label: 'Reports', icon: FileDown },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border p-4 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-display text-base font-semibold">
          <Ship className="h-5 w-5" aria-hidden="true" />
          EcoSphere
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="rounded-md p-2 hover:bg-muted"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav id="mobile-nav" aria-label="Primary" className="border-b border-border bg-card md:hidden">
          <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-sm text-muted-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5 font-display text-base font-semibold">
          <Ship className="h-5 w-5" aria-hidden="true" />
          EcoSphere
        </div>
        <nav aria-label="Primary" className="flex-1 py-3">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="border-t border-border p-4">
          <p className="truncate text-xs text-muted-foreground" title={userName}>
            {userName}
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="mt-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-0.5 px-2">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
