'use client';

import dynamic from 'next/dynamic';
import type { SupplierRecord, FacilityRecord, RouteRecord } from '@/types/api';

const MapView = dynamic(() => import('./map-view').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function MapViewClient(props: {
  suppliers: SupplierRecord[];
  facilities: FacilityRecord[];
  routes: RouteRecord[];
}) {
  return <MapView {...props} />;
}
