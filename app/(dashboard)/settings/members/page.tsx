'use client';

import * as React from 'react';
import { useApi } from '@/hooks/use-api';
import { useMutation } from '@/hooks/use-mutation';
import { MemberList } from '@/components/settings/member-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/ToastProvider';
import { AlertCircle, UserPlus, Users } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Member } from '@/types/member';

export default function TeamSettingsPage() {
  const { data: members, isLoading, error, refetch } = useApi<Member[]>('/api/org/members');
  const { toast } = useToast();

  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<Member['role']>('MEMBER');

  const { mutate: updateMember, isLoading: isSaving } = useMutation({
    url: '/api/org/members',
    method: 'POST',
    onSuccess: () => {
      toast.success('Team Updated', 'Member successfully processed.');
      setEmail('');
      refetch();
    },
    onError: (err) => {
      toast.error('Failed to process member', err || 'Something went wrong.');
    },
  });

  const { mutate: deleteMember, isLoading: isDeleting } = useMutation({
    url: '/api/org/members',
    method: 'DELETE',
    onSuccess: () => {
      toast.success('Member Removed', 'Team member removed from workspace.');
      refetch();
    },
    onError: (err) => {
      toast.error('Error', err || 'Failed to remove member.');
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    updateMember({ email, role });
  };

  const handleUpdateRole = (email: string, targetRole: Member['role']) => {
    updateMember({ email, role: targetRole });
  };

  const handleDelete = (userId: string) => {
    if (confirm('Are you sure you want to remove this member from the organization?')) {
      deleteMember({ userId });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold">Team Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage organization members, invite new teammates, and control access permissions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Invite Teammate
            </CardTitle>
            <CardDescription>Add new members to your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Workspace Role</Label>
                <Select
                  value={role}
                  onValueChange={(val) => setRole(val as Member['role'])}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">ADMIN (Full access)</SelectItem>
                    <SelectItem value="MEMBER">MEMBER (Read/Write)</SelectItem>
                    <SelectItem value="VIEWER">VIEWER (Read-only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isSaving || isDeleting} className="w-full">
                {isSaving ? 'Processing...' : 'Add Member'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Active Team Members
          </h2>
          {error ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-4 text-destructive" role="alert">
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="text-sm">{error}</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : !members || members.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No members found in organization.
            </div>
          ) : (
            <MemberList
              members={members}
              onDelete={handleDelete}
              onUpdateRole={handleUpdateRole}
              isPending={isSaving || isDeleting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
