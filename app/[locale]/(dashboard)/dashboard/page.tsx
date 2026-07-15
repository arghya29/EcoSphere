'use client';

import * as React from 'react';
import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { SupplyChainGraph } from '@/components/graph/supply-chain-graph';
import { MapViewClient } from '@/components/map/map-view-client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/Pagination';
import { formatKg } from '@/lib/utils';
import type { DashboardSummary, SupplierRecord, FacilityRecord, RouteRecord, ActivityRecord } from '@/types/api';
import { Upload, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Database, RefreshCw, TrendingUp, PieChart as PieIcon, Download, Loader2 } from 'lucide-react';
import { ScopeBreakdown } from '@/components/charts/scope-breakdown';
import { EmissionsChart } from '@/components/charts/emissions-chart';
import { exportActivitiesAsCsv } from '@/lib/utils/exportCsv';
import { computeMonthlyChange, computeTrend } from '@/lib/utils/analytics';
import { useLocale } from 'next-intl';

function SortHeader({
  field,
  label,
  sortBy,
  sortOrder,
  onSort,
}: {
  field: string;
  label: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}) {
  const isSorted = sortBy === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
    >
      {label}
      {isSorted ? (
        sortOrder === 'asc' ? (
          <ArrowUp className="h-3 w-3 text-primary" />
        ) : (
          <ArrowDown className="h-3 w-3 text-primary" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 text-muted-foreground opacity-50" />
      )}
    </button>
  );
}

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary, error: summaryError } = useApi<DashboardSummary>('/api/dashboard');
  const { data: suppliers } = useApi<SupplierRecord[]>('/api/suppliers');
  const { data: facilities } = useApi<FacilityRecord[]>('/api/facilities');
  const { data: routes } = useApi<RouteRecord[]>('/api/routes');
  const locale = useLocale();

  const [isExporting, setIsExporting] = React.useState(false);

  // Pagination, Filtering and Sorting States
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [sortBy, setSortBy] = React.useState('dateRecorded');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  const activitiesUrl = `/api/activities?page=${page}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
  
  const { 
    data: activitiesResponse, 
    isLoading: loadingActivities, 
    error: activitiesError,
    refetch: refetchActivities 
  } = useApi<{
    activities: ActivityRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>(activitiesUrl);

  const hasData = (suppliers?.length ?? 0) > 0 || (facilities?.length ?? 0) > 0;
  const activities = activitiesResponse?.activities ?? [];
  const pagination = activitiesResponse?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getSourceNode = (activity: ActivityRecord) => {
    if (activity.supplier) return `Supplier: ${activity.supplier.name}`;
    if (activity.facility) return `Facility: ${activity.facility.name}`;
    if (activity.route) {
      const origin = activity.route.originSupplier?.name ?? activity.route.originFacility?.name ?? 'Unknown';
      const dest = activity.route.destination?.name ?? 'Unknown';
      return `Route: ${origin} → ${dest}`;
    }
    return 'General';
  };

  const handleExport = () => {
    if (!activities?.length) return;
    setIsExporting(true);
    // Minimal delay gives the browser time to render the loading spinner
    // before the synchronous CSV generation + download fires.
    setTimeout(() => {
      exportActivitiesAsCsv(activities);
      setIsExporting(false);
    }, 150);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-semibold">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Your organization&apos;s carbon footprint at a glance.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            id="export-csv-btn"
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || !activities?.length}
            aria-label="Export emissions data as CSV"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{isExporting ? 'Exporting\u2026' : 'Export CSV'}</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/upload">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Upload data</span>
              <span className="sm:hidden">Upload</span>
            </Link>
          </Button>
        </div>
      </div>

      {summaryError ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-4 text-destructive" role="alert">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm">{summaryError}</p>
          </CardContent>
        </Card>
      ) : loadingSummary ? (
        <SkeletonStats />
      ) : summary ? (
        <>
          <DashboardStats
            total={summary.total}
            scope1={summary.scope1}
            scope2={summary.scope2}
            scope3={summary.scope3}
            trends={{
              total: computeMonthlyChange(summary.monthlyTrend),
              scope1: summary.previousScope1 !== null
                ? computeTrend(summary.previousScope1, summary.scope1)
                : undefined,
              scope2: summary.previousScope2 !== null
                ? computeTrend(summary.previousScope2, summary.scope2)
                : undefined,
              scope3: summary.previousScope3 !== null
                ? computeTrend(summary.previousScope3, summary.scope3)
                : undefined,
            }}
          />

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Emissions Historical Trend
                </CardTitle>
                <CardDescription>Monthly aggregated footprint.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmissionsChart data={summary.monthlyTrend.map((m) => ({ month: m.month, emissions: m.emissionsKg }))} />
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieIcon className="h-5 w-5 text-primary" />
                  Scope Share
                </CardTitle>
                <CardDescription>Scope breakdown comparison.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScopeBreakdown scope1={summary.scope1} scope2={summary.scope2} scope3={summary.scope3} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {!hasData ? (
        <EmptyState
          icon={Upload}
          title="No supply chain data yet"
          description="Upload a CSV or Excel file with your suppliers, facilities, and routes to see your network and emissions here."
          actionLabel="Upload your first file"
          actionHref="/upload"
        />
      ) : (
        <>
          <Tabs defaultValue="graph">
            <TabsList>
              <TabsTrigger value="graph">Network graph</TabsTrigger>
              <TabsTrigger value="map">Map view</TabsTrigger>
            </TabsList>
            <TabsContent value="graph">
              <SupplyChainGraph suppliers={suppliers ?? []} facilities={facilities ?? []} routes={routes ?? []} />
            </TabsContent>
            <TabsContent value="map">
              <MapViewClient suppliers={suppliers ?? []} facilities={facilities ?? []} routes={routes ?? []} />
            </TabsContent>
          </Tabs>

          {/* Activities Table Card with Date Range Filters & Server-Side Pagination */}
          <Card className="w-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Activities</CardTitle>
                <CardDescription>View, filter, and sort your organization&apos;s activity records.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="start-date-input" className="sr-only">Start Date</Label>
                    <Input
                      id="start-date-input"
                      type="date"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                      className="h-8 text-xs py-1"
                      aria-label="Start date filter"
                    />
                  </div>
                  <span className="text-muted-foreground text-xs">to</span>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="end-date-input" className="sr-only">End Date</Label>
                    <Input
                      id="end-date-input"
                      type="date"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                      className="h-8 text-xs py-1"
                      aria-label="End date filter"
                    />
                  </div>
                </div>
                {(startDate || endDate) && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-8 px-2 text-xs">
                    Clear filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {activitiesError ? (
                <div className="flex items-center gap-2 text-destructive py-4" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{activitiesError}</p>
                </div>
              ) : loadingActivities ? (
                <div className="space-y-3 py-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted/30 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <Database className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No activity records found</p>
                  <p className="text-xs">Try adjusting your filters or upload new datasets.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                          <th scope="col" className="pb-3 pl-2"><SortHeader field="dateRecorded" label="Date" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></th>
                          <th scope="col" className="pb-3"><SortHeader field="type" label="Activity Type" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></th>
                          <th scope="col" className="pb-3">Scope</th>
                          <th scope="col" className="pb-3">Node / Source</th>
                          <th scope="col" className="pb-3 text-right"><SortHeader field="amount" label="Amount" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></th>
                          <th scope="col" className="pb-3 pr-2 text-right"><SortHeader field="emissionsKg" label="Emissions" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.map((a) => (
                          <tr key={a.id} className="border-b border-border hover:bg-muted/20 last:border-0 transition-colors">
                            <td className="py-3 pl-2 font-mono-data text-xs whitespace-nowrap">
                              {new Date(a.dateRecorded).toLocaleDateString(locale, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="py-3 font-medium capitalize text-xs">{a.type.toLowerCase()}</td>
                            <td className="py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                a.factor.scope === 'SCOPE_1' ? 'bg-scope1/10 text-scope1' :
                                a.factor.scope === 'SCOPE_2' ? 'bg-scope2/10 text-scope2' :
                                'bg-scope3/10 text-scope3'
                              }`}>
                                {a.factor.scope.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 text-xs max-w-[200px] truncate" title={getSourceNode(a)}>
                              {getSourceNode(a)}
                            </td>
                            <td className="py-3 font-mono-data text-xs text-right whitespace-nowrap">
                              {a.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {a.unit}
                            </td>
                            <td className="py-3 pr-2 font-mono-data text-xs text-right font-semibold text-foreground whitespace-nowrap">
                              {formatKg(a.emissionsKg)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    limit={pagination.limit}
                    total={pagination.total}
                    onPageChange={setPage}
                    onLimitChange={(l) => { setLimit(l); setPage(1); }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
