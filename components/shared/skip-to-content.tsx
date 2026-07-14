'use client';

import * as React from 'react';

interface SkipLinkProps {
  mainId?: string;
  navId?: string;
}

export function SkipToContent({ mainId = 'main-content', navId }: SkipLinkProps) {
  const handleNavClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const el = document.getElementById(navId ?? '');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [navId]
  );

  const handleMainClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const el = document.getElementById(mainId);
      if (el) {
        el.setAttribute('tabindex', '-1');
        el.focus();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [mainId]
  );

  return (
    <nav aria-label="Skip links" className="sr-only focus-within:not-sr-only">
      {navId && (
        <a
          href={`#${navId}`}
          onClick={handleNavClick}
          className="focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:items-center focus:gap-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to navigation
        </a>
      )}
      <a
        href={`#${mainId}`}
        onClick={handleMainClick}
        className="focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:items-center focus:gap-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
    </nav>
  );
}
