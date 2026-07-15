'use client';

import * as React from 'react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Pagination } from '@/components/ui/Pagination';
import { 
  PlusCircle, 
  Trash2, 
  UploadCloud, 
  LogIn, 
  UserPlus, 
  FileText, 
  Calendar,
  User,
  Shield,
  Activity,
  AlertCircle
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';

interface AuditLogEntry {
  id: string;
  actor: string;
  actorName: string;
  action: 'CREATE' | 'DELETE' | 'UPLOAD' | 'LOGIN' | 'SIGNUP';
  entity: string;
  entityId: string | null;
  orgId: string;
  timestamp: string;
  metadata: any;
}

interface ApiResponsePaginated {
  data: AuditLogEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AuditSettingsPage() {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error } = useApi<ApiResponsePaginated>(
    `/api/org/audit?page=${page}&limit=${limit}`
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <PlusCircle className="h-5 w-5 text-emerald-500" />;
      case 'DELETE':
        return <Trash2 className="h-5 w-5 text-rose-500" />;
      case 'UPLOAD':
        return <UploadCloud className="h-5 w-5 text-blue-500" />;
      case 'LOGIN':
        return <LogIn className="h-5 w-5 text-violet-500" />;
      case 'SIGNUP':
        return <UserPlus className="h-5 w-5 text-amber-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20';
      case 'UPLOAD':
        return 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20';
      case 'LOGIN':
        return 'bg-violet-500/10 text-violet-500 dark:bg-violet-500/20';
      case 'SIGNUP':
        return 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Trace all critical actions performed across your organization.</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Timeline
          </CardTitle>
          <CardDescription>A chronological audit trail of all changes made to your supply-chain data.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-rose-500 bg-rose-500/5 rounded-lg border border-rose-500/20">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-rose-500" />
              <p className="font-medium">Failed to load audit logs</p>
              <p className="text-sm text-rose-400 mt-1">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground">No audit logs found</p>
              <p className="text-sm text-muted-foreground mt-1">Activities will appear here once critical actions are performed.</p>
            </div>
          ) : (
            <div className="relative border-l border-border ml-3 pl-6 space-y-6">
              {logs.map((log) => {
                const date = new Date(log.timestamp);
                const formattedDate = mounted ? date.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }) : '';
                const formattedTime = mounted ? date.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                }) : '';

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline marker icon wrapper */}
                    <div className="absolute -left-[38px] top-1 bg-background border border-border rounded-full p-1.5 shadow-sm group-hover:scale-110 transition-transform">
                      {getActionIcon(log.action)}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="font-medium text-foreground text-sm">
                            {log.entity}
                          </span>
                          {log.entityId && (
                            <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              ID: {log.entityId}
                            </span>
                          )}
                        </div>

                        {log.metadata && typeof log.metadata === 'object' && (
                          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-border/50 mt-1 max-w-xl">
                            {log.action === 'UPLOAD' && log.metadata.rowCount !== undefined && (
                              <p>Uploaded <span className="font-semibold text-foreground">{log.metadata.rowCount}</span> record(s) successfully.</p>
                            )}
                            {Object.entries(log.metadata).map(([key, val]) => {
                              if (key === 'rowCount') return null;
                              return (
                                <p key={key} className="truncate">
                                  <span className="capitalize">{key}</span>: <span className="font-medium text-foreground">{String(val)}</span>
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span>{log.actorName}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:mt-0.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formattedDate} · {formattedTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pagination.total > 0 && (
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              limit={limit}
              total={pagination.total}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
