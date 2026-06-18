export interface DashboardSummary {
  total: number;
  scope1: number;
  scope2: number;
  scope3: number;
  topSuppliers: { id: string; name: string; emissionsKg: number }[];
  topFacilities: { id: string; name: string; emissionsKg: number }[];
  monthlyTrend: { month: string; emissionsKg: number }[];
  activityCount: number;
  supplierCount: number;
  facilityCount: number;
}

export interface SupplierRecord {
  id: string;
  name: string;
  location: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface FacilityRecord {
  id: string;
  name: string;
  type: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface RouteRecord {
  id: string;
  originSupplierId: string | null;
  originFacilityId: string | null;
  destinationId: string;
  mode: 'TRUCK' | 'RAIL' | 'AIR' | 'SEA' | 'OTHER';
  distanceKm: number;
  originSupplier?: SupplierRecord | null;
  originFacility?: FacilityRecord | null;
  destination?: FacilityRecord;
}

export interface InsightRecord {
  id: string;
  kind: 'hotspot' | 'recommendation' | 'anomaly' | 'breakdown';
  text: string;
  detail?: string;
}

export interface ActivityRecord {
  id: string;
  type: 'FUEL' | 'ELECTRICITY' | 'FREIGHT' | 'OTHER';
  amount: number;
  unit: string;
  emissionsKg: number;
  dateRecorded: string;
  factor: { category: string; scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3'; unit: string };
  supplier?: SupplierRecord | null;
  facility?: FacilityRecord | null;
  route?: RouteRecord | null;
}
