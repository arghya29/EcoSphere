'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserCheck } from 'lucide-react';

import { Member } from '@/types/member';

export function MemberList({
  members,
  onDelete,
  onUpdateRole,
  isPending = false,
}: {
  members: Member[];
  onDelete: (userId: string) => void;
  onUpdateRole: (email: string, role: Member['role']) => void;
  isPending?: boolean;
}) {
  const roleColors = {
    OWNER: 'bg-scope1 text-white border-transparent',
    ADMIN: 'bg-scope2 text-white border-transparent',
    MEMBER: 'bg-scope3 text-white border-transparent',
    VIEWER: 'bg-secondary text-secondary-foreground border-transparent',
  };

  return (
    <div className="space-y-3">
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm bg-card transition-shadow">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{m.user.name || m.user.email.split('@')[0]}</span>
              <Badge className={roleColors[m.role]}>{m.role}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{m.user.email}</p>
          </div>

          <div className="flex items-center gap-2">
            {m.role !== 'OWNER' && (
              <>
                <select
                  value={m.role}
                  disabled={isPending}
                  onChange={(e) => onUpdateRole(m.user.email, e.target.value as Member['role'])}
                  className="rounded border bg-background px-2 py-1.5 text-xs font-medium disabled:opacity-50"
                  aria-label={`Change role for ${m.user.email}`}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isPending}
                  onClick={() => onDelete(m.userId)}
                  className="text-destructive hover:bg-destructive/10"
                  aria-label={`Remove team member ${m.user.email}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

