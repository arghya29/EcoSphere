'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { SupplierRecord, FacilityRecord, RouteRecord } from '@/types/api';
import { toPng, toSvg } from 'html-to-image';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Leaflet's default marker icons reference image files via relative
// paths that don't resolve correctly under Next.js bundling, so we
// rebuild the default icon from the package's own asset URLs.
const supplierIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MODE_COLOR: Record<string, string> = {
  TRUCK: '#1e3a5f',
  RAIL: '#2f6f4f',
  AIR: '#b3261e',
  SEA: '#b8860b',
  OTHER: '#6b7280',
};

type WithCoords<T> = T & { latitude: number; longitude: number };

// A coordinate value of 0 is valid (the equator / the prime meridian), so test
// for a finite number rather than truthiness. A `latitude && longitude` check
// treats 0 as "missing" and would silently drop those entities from the map.
function hasCoords<T extends { latitude: number | null; longitude: number | null }>(
  entity: T
): entity is WithCoords<T> {
  return Number.isFinite(entity.latitude) && Number.isFinite(entity.longitude);
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points, { padding: [30, 30] });
    }
  }, [map, points]);
  return null;
}

import { MapToolbar } from './map-toolbar';
import { MapLegend } from './map-legend';

export function MapView({
  suppliers,
  facilities,
  routes,
}: {
  suppliers: SupplierRecord[];
  facilities: FacilityRecord[];
  routes: RouteRecord[];
}) {
  const [showSuppliers, setShowSuppliers] = React.useState(true);
  const [showFacilities, setShowFacilities] = React.useState(true);
  const [selectedMode, setSelectedMode] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const mapRef = React.useRef<HTMLDivElement>(null);

  const supplierById = new Map(suppliers.map((s) => [s.id, s]));
  const facilityById = new Map(facilities.map((f) => [f.id, f]));

  const query = searchQuery.toLowerCase().trim();

  const filteredSuppliers = suppliers.filter(
    (s) => showSuppliers && hasCoords(s) && (query === '' || s.name.toLowerCase().includes(query))
  );

  const filteredFacilities = facilities.filter(
    (f) => showFacilities && hasCoords(f) && (query === '' || f.name.toLowerCase().includes(query))
  );

  const filteredRoutes = routes.filter((r) => {
    if (selectedMode !== 'ALL' && r.mode !== selectedMode) return false;
    const origin = r.originSupplierId
      ? supplierById.get(r.originSupplierId)
      : facilityById.get(r.originFacilityId ?? '');
    const destination = facilityById.get(r.destinationId);
    if (!origin || !destination || !hasCoords(origin) || !hasCoords(destination)) return false;
    return true;
  });

  const allPoints: [number, number][] = [
    ...filteredSuppliers.map((s) => [s.latitude, s.longitude] as [number, number]),
    ...filteredFacilities.map((f) => [f.latitude, f.longitude] as [number, number]),
  ];

  const handleDownload = React.useCallback((format: 'png' | 'svg') => {
    if (!mapRef.current) return;

    const filter = (node: HTMLElement) => {
      const excludeClasses = ['leaflet-control-container', 'export-controls'];
      if (node.classList && typeof node.classList.contains === 'function') {
        return !excludeClasses.some((className) => node.classList.contains(className));
      }
      return true;
    };

    const isDark = document.documentElement.classList.contains('dark');
    const options = {
      filter,
      backgroundColor: isDark ? '#09090b' : '#ffffff',
    };

    const exporter = format === 'png' ? toPng : toSvg;
    exporter(mapRef.current, options)
      .then((dataUrl) => {
        const a = document.createElement('a');
        a.setAttribute('download', `supply-chain-map.${format}`);
        a.setAttribute('href', dataUrl);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
      .catch((err) => console.error('Error exporting image:', err));
  }, []);

  if (suppliers.length === 0 && facilities.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        Add latitude/longitude to your suppliers and facilities to see them on the map.
      </div>
    );
  }

  const center = allPoints[0] || [0, 0];

  return (
    <div className="flex flex-col relative">
      <MapToolbar
        showSuppliers={showSuppliers}
        setShowSuppliers={setShowSuppliers}
        showFacilities={showFacilities}
        setShowFacilities={setShowFacilities}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <div
        ref={mapRef}
        className="h-[420px] w-full overflow-hidden rounded-md border border-border relative"
        tabIndex={0}
        aria-label="Map of supplier and facility locations"
      >
        <MapContainer
          center={center}
          zoom={3}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {allPoints.length > 0 && <FitBounds points={allPoints} />}

          {filteredSuppliers.map((s) => (
            <Marker key={s.id} position={[s.latitude!, s.longitude!]} icon={supplierIcon}>
              <Popup>
                <strong>{s.name}</strong>
                <br />
                {s.location}
                {s.category && (
                  <>
                    <br />
                    Category: {s.category}
                  </>
                )}
              </Popup>
            </Marker>
          ))}

          {filteredFacilities.map((f) => (
            <Marker key={f.id} position={[f.latitude!, f.longitude!]} icon={supplierIcon}>
              <Popup>
                <strong>{f.name}</strong>
                <br />
                Type: {f.type}
                <br />
                {f.location}
              </Popup>
            </Marker>
          ))}

          {filteredRoutes.map((r) => {
            const origin = r.originSupplierId
              ? supplierById.get(r.originSupplierId)
              : facilityById.get(r.originFacilityId ?? '');
            const destination = facilityById.get(r.destinationId);
            if (!origin || !destination || !hasCoords(origin) || !hasCoords(destination))
              return null;
            return (
              <Polyline
                key={r.id}
                positions={[
                  [origin.latitude, origin.longitude],
                  [destination.latitude, destination.longitude],
                ]}
                pathOptions={{
                  color: MODE_COLOR[r.mode],
                  weight: 3,
                  dashArray: r.mode === 'AIR' ? '6 6' : undefined,
                }}
              >
                <Popup>
                  <strong>Route Mode: {r.mode}</strong>
                  <br />
                  Distance: {r.distanceKm} km
                </Popup>
              </Polyline>
            );
          })}
        </MapContainer>

        {/* Overlay the Export button */}
        <div className="export-controls absolute top-4 right-4 z-[1000]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-background/80 backdrop-blur-sm"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload('png')}>
                Download PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('svg')}>
                Download SVG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <MapLegend />
    </div>
  );
}
