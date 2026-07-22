'use client';

import * as React from 'react';
import { OrgSwitcher } from '@/components/OrgSwitcher';

export function Navbar() {
  return (
    <div className="flex items-center gap-2">
      <OrgSwitcher />
    </div>
  );
}
