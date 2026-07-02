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
  User,
  ChevronsUpDown,
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

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload Data', icon: Upload },
  { href: '/builder', label: 'Supply-Chain Builder', icon: Network },
  { href: '/analysis', label: 'Emissions', icon: BarChart3 },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
  { href: '/reports', label: 'Reports', icon: FileDown },
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
          <div className="border-t border-border p-3 flex items-center gap-2">
            <ThemeToggle />
            <div className="flex-1">
              <AccountMenu userName={userName} onNavigate={() => setMobileOpen(false)} />
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
        <nav aria-label="Primary" className="flex-1 py-3">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="border-t border-border p-3 flex items-center gap-1">
          <ThemeToggle />
          <div className="flex-1">
            <AccountMenu userName={userName} />
          </div>
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

function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'A';
}

function AccountMenu({ userName, onNavigate }: { userName: string; onNavigate?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={userName ? `${userName} account menu` : 'Account menu'}
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
          <Link href="/profile" onClick={onNavigate} className="flex items-center gap-2">
            <User className="h-4 w-4" aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" onClick={onNavigate} className="flex items-center gap-2">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            signOut({ callbackUrl: '/' });
          }}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
