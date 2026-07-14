'use client';

import * as React from 'react';

export function FocusReset() {
  React.useEffect(() => {
    const handler = () => {
      const main = document.getElementById('main');
      if (main && document.activeElement?.tagName === 'A') {
        const link = document.activeElement as HTMLAnchorElement;
        if (link.getAttribute('href') === '#main') {
          main.focus();
        }
      }
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return null;
}
