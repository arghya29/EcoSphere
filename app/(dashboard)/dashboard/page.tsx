'use client';

import Link from 'next/link';
import { useApi } from '@/hooks/use-api';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { SupplyChainGraph } from '@/components/graph/supply-chain-graph';
import { MapViewClient } from '@/components/map/map-view-client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { DashboardSummary, SupplierRecord, FacilityRecord, RouteRecord } from '@/types/api';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Upload } from 'lucide-react';

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useApi<DashboardSummary>('/api/dashboard');
  const { data: suppliers } = useApi<SupplierRecord[]>('/api/suppliers');
  const { data: facilities } = useApi<FacilityRecord[]>('/api/facilities');
  const { data: routes } = useApi<RouteRecord[]>('/api/routes');

  const hasData = (suppliers?.length ?? 0) > 0 || (facilities?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-semibold">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Your organization&apos;s carbon footprint at a glance.</p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/upload">
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Upload data</span>
            <span className="sm:hidden">Upload</span>
          </Link>
        </Button>
      </div>

      {loadingSummary ? (
        <SkeletonStats />
      ) : summary ? (
        <DashboardStats total={summary.total} scope1={summary.scope1} scope2={summary.scope2} scope3={summary.scope3} />
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
