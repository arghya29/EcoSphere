'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { ChevronsUpDown, Check, Building, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/ToastProvider';
import { useApi } from '@/hooks/use-api';

interface Organization {
  id: string;
  name: string;
}

export function OrgSwitcher() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const { data: response, isLoading: isLoadingOrgs } = useApi<Organization[]>('/api/organizations');
  const organizations = response ?? [];

  const activeOrgId = session?.activeOrgId;
  const activeOrgName = session?.activeOrgName ?? 'Select Organization';

  const [isSwitching, setIsSwitching] = React.useState(false);

  const handleSwitch = async (orgId: string) => {
    if (orgId === activeOrgId || isSwitching) return;
    setIsSwitching(true);

    try {
      const res = await fetch('/api/auth/switch-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        toast.error('Could not switch organization', json.error ?? 'Please try again.');
        setIsSwitching(false);
        return;
      }

      toast.success('Switched organization', `Now viewing ${json.session.activeOrgName}`);
      await update({ activeOrgId: orgId });
      window.location.reload();
    } catch {
      toast.error('Could not switch organization', 'Something went wrong. Please try again.');
      setIsSwitching(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isSwitching}
        className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 w-full"
      >
        <span className="flex min-w-0 items-center gap-2">
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Building className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="truncate max-w-[150px]">{activeOrgName}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoadingOrgs ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : organizations.length === 0 ? (
          <div className="p-2 text-xs text-muted-foreground text-center">No organizations found.</div>
        ) : (
          organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => handleSwitch(org.id)}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                {org.name}
              </span>
              {org.id === activeOrgId && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
