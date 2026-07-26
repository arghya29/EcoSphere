/**
 * Emissions calculation engine.
 *
 * Implements the formulas specified in the proposal:
 *   Scope 1 (direct):    CO2e = fuel_amount * fuel_co2_per_unit
 *   Scope 2 (energy):    CO2e = kWh * grid_emission_factor
 *   Scope 3 (indirect):  CO2e = tonne_km * mode_factor
 *
 * All multiplication happens client- or server-side from static,
 * versioned EmissionFactor rows — no external API calls, no paid
 * services, matching the zero-cost constraint in the proposal.
 */

import type { Activity, EmissionFactor } from '@prisma/client';

export type ActivityWithFactor = Activity & { factor: EmissionFactor };

export interface ScopeBreakdown {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

/**
 * Computes emissions in kg CO2e for a single activity record.
 * This is the canonical "amount * factor" calculation; both the
 * upload pipeline and any ad-hoc client recalculation should call
 * this rather than re-deriving the formula inline.
 */
export function calculateActivityEmissions(amount: number, factorValue: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(factorValue)) return 0;
  return amount * factorValue;
}

/**
 * Derives an activity's type from its routing and emission-factor
 * category. A row with a route is FREIGHT; otherwise a category whose
 * name contains "electricity" (in any casing) is ELECTRICITY, and
 * everything else is FUEL.
 *
 * The electricity match is case-insensitive so factor categories like
 * "Grid Electricity" or "ELECTRICITY_grid" are classified correctly —
 * the `category` column is a free-form string, so casing isn't
 * guaranteed. The upload pipeline should call this rather than
 * re-deriving the rule inline.
 */
export function deriveActivityType(
  category: string,
  hasRoute: boolean
): 'FREIGHT' | 'ELECTRICITY' | 'FUEL' {
  if (hasRoute) return 'FREIGHT';
  if (category.toLowerCase().includes('electricity')) return 'ELECTRICITY';
  return 'FUEL';
}

/**
 * Aggregates a list of activities (each already joined with its
 * EmissionFactor) into a Scope 1/2/3 breakdown, in kg CO2e.
 */
export function aggregateByScope(activities: ActivityWithFactor[]): ScopeBreakdown {
  const breakdown: ScopeBreakdown = { scope1: 0, scope2: 0, scope3: 0, total: 0 };

  for (const activity of activities) {
    const emissions =
      activity.emissionsKg ?? calculateActivityEmissions(activity.amount, activity.factor.value);
    switch (activity.factor.scope) {
      case 'SCOPE_1':
        breakdown.scope1 += emissions;
        break;
      case 'SCOPE_2':
        breakdown.scope2 += emissions;
        break;
      case 'SCOPE_3':
        breakdown.scope3 += emissions;
        break;
    }
  }

  breakdown.total = breakdown.scope1 + breakdown.scope2 + breakdown.scope3;
  return breakdown;
}

export interface EntityEmissions {
  id: string;
  name: string;
  emissionsKg: number;
}

/**
 * Groups activities by a related entity (supplier, facility, or
 * route) and sums emissions per entity — used for "top emitters"
 * bar charts and hotspot detection.
 */
export function aggregateByEntity(
  activities: ActivityWithFactor[],
  entityType: 'supplier' | 'facility' | 'route',
  entities: { id: string; name: string }[]
): EntityEmissions[] {
  const nameById = new Map(entities.map((e) => [e.id, e.name]));
  const totals = new Map<string, number>();

  for (const activity of activities) {
    const key =
      entityType === 'supplier'
        ? activity.supplierId
        : entityType === 'facility'
          ? activity.facilityId
          : activity.routeId;
    if (!key) continue;
    const emissions =
      activity.emissionsKg ?? calculateActivityEmissions(activity.amount, activity.factor.value);
    totals.set(key, (totals.get(key) ?? 0) + emissions);
  }

  return Array.from(totals.entries())
    .map(([id, emissionsKg]) => ({ id, name: nameById.get(id) ?? 'Unknown', emissionsKg }))
    .sort((a, b) => b.emissionsKg - a.emissionsKg);
}

/**
 * Emissions over time, bucketed by month, for trend charts.
 */
export function aggregateByMonth(
  activities: ActivityWithFactor[]
): { month: string; emissionsKg: number }[] {
  const totals = new Map<string, number>();
  for (const activity of activities) {
    const d = new Date(activity.dateRecorded);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const emissions =
      activity.emissionsKg ?? calculateActivityEmissions(activity.amount, activity.factor.value);
    totals.set(key, (totals.get(key) ?? 0) + emissions);
  }
  return Array.from(totals.entries())
    .map(([month, emissionsKg]) => ({ month, emissionsKg }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Indicative relative-reduction factors used by the insights engine to
// suggest mode shifts. These mirror typical tonne-km intensity ratios
// (air >> truck > rail > sea) and are intentionally simple/hard-coded,
// matching the "rule-based, no ML" approach in the proposal.
export const MODE_SHIFT_SAVINGS: Record<string, number> = {
  AIR_TO_RAIL: 0.7, // "rail is ~70% lower than air"
  AIR_TO_SEA: 0.5,
  TRUCK_TO_RAIL: 0.4,
};
