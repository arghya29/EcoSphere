'use client';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { SupplierRecord, FacilityRecord, RouteRecord } from '@/types/api';

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
  entity: T,
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

export function MapView({
  suppliers,
  facilities,
  routes,
}: {
  suppliers: SupplierRecord[];
  facilities: FacilityRecord[];
  routes: RouteRecord[];
}) {
  const supplierById = new Map(suppliers.map((s) => [s.id, s]));
  const facilityById = new Map(facilities.map((f) => [f.id, f]));

  const allPoints: [number, number][] = [
    ...suppliers.filter(hasCoords).map((s) => [s.latitude, s.longitude] as [number, number]),
    ...facilities.filter(hasCoords).map((f) => [f.latitude, f.longitude] as [number, number]),
  ];

  if (allPoints.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        Add latitude/longitude to your suppliers and facilities to see them on the map.
      </div>
    );
  }

  const center = allPoints[0];

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-md border border-border" tabIndex={0} aria-label="Map of supplier and facility locations">
      <MapContainer center={center} zoom={3} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={allPoints} />

        {suppliers
          .filter(hasCoords)
          .map((s) => (
            <Marker key={s.id} position={[s.latitude, s.longitude]} icon={supplierIcon}>
              <Popup>
                <strong>{s.name}</strong>
                <br />
                {s.location}
                {s.category && (
                  <>
                    <br />
                    {s.category}
                  </>
                )}
              </Popup>
            </Marker>
          ))}

        {facilities
          .filter(hasCoords)
          .map((f) => (
            <Marker key={f.id} position={[f.latitude, f.longitude]} icon={supplierIcon}>
              <Popup>
                <strong>{f.name}</strong>
                <br />
                {f.type}
                <br />
                {f.location}
              </Popup>
            </Marker>
          ))}

        {routes.map((r) => {
          const origin = r.originSupplierId ? supplierById.get(r.originSupplierId) : facilityById.get(r.originFacilityId ?? '');
          const destination = facilityById.get(r.destinationId);
          if (!origin || !destination || !hasCoords(origin) || !hasCoords(destination)) return null;
          return (
            <Polyline
              key={r.id}
              positions={[
                [origin.latitude, origin.longitude],
                [destination.latitude, destination.longitude],
              ]}
              pathOptions={{ color: MODE_COLOR[r.mode], weight: 2, dashArray: r.mode === 'AIR' ? '6 6' : undefined }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
