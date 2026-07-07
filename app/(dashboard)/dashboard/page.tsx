'use client';

import React from 'react';
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
import type { DashboardSummary, SupplierRecord, FacilityRecord, RouteRecord, ActivityRecord } from '@/types/api';
import { Upload, AlertCircle, TrendingUp, PieChart as PieIcon, Download, Loader2 } from 'lucide-react';
import { ScopeBreakdown } from '@/components/charts/scope-breakdown';
import { EmissionsChart } from '@/components/charts/emissions-chart';
import { exportActivitiesAsCsv } from '@/lib/utils/exportCsv';


export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary, error: summaryError } = useApi<DashboardSummary>('/api/dashboard');
  const { data: suppliers } = useApi<SupplierRecord[]>('/api/suppliers');
  const { data: facilities } = useApi<FacilityRecord[]>('/api/facilities');
  const { data: routes } = useApi<RouteRecord[]>('/api/routes');
  const { data: activities } = useApi<ActivityRecord[]>('/api/activities');

  const [isExporting, setIsExporting] = React.useState(false);

  const hasData = (suppliers?.length ?? 0) > 0 || (facilities?.length ?? 0) > 0;

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
          <DashboardStats total={summary.total} scope1={summary.scope1} scope2={summary.scope2} scope3={summary.scope3} />

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
