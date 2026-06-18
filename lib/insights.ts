/**
 * Rule-based insight generation — deterministic, no ML/LLM, per spec.
 * Takes already-computed aggregates and produces human-readable
 * hotspot and recommendation strings.
 */

import type { ScopeBreakdown, EntityEmissions } from './emissions';
import { MODE_SHIFT_SAVINGS } from './emissions';

export interface Insight {
  id: string;
  kind: 'hotspot' | 'recommendation' | 'anomaly' | 'breakdown';
  text: string;
  detail?: string;
}

interface RouteEmissionInfo extends EntityEmissions {
  mode: 'TRUCK' | 'RAIL' | 'AIR' | 'SEA' | 'OTHER';
}

export function generateInsights(params: {
  scopes: ScopeBreakdown;
  topSuppliers: EntityEmissions[];
  topFacilities: EntityEmissions[];
  routes: RouteEmissionInfo[];
}): Insight[] {
  const { scopes, topSuppliers, topFacilities, routes } = params;
  const insights: Insight[] = [];

  if (scopes.total <= 0) {
    return insights;
  }

  // Rule 1: top emitter concentration (supplier)
  const topSupplier = topSuppliers[0];
  if (topSupplier && topSupplier.emissionsKg / scopes.total > 0.3) {
    const pct = Math.round((topSupplier.emissionsKg / scopes.total) * 100);
    insights.push({
      id: `top-supplier-${topSupplier.id}`,
      kind: 'hotspot',
      text: `${topSupplier.name} accounts for ${pct}% of your total emissions.`,
      detail: 'Consider engaging this supplier on energy efficiency or sourcing alternatives.',
    });
  }

  // Rule 1b: top emitter concentration (facility)
  const topFacility = topFacilities[0];
  if (topFacility && topFacility.emissionsKg / scopes.total > 0.3) {
    const pct = Math.round((topFacility.emissionsKg / scopes.total) * 100);
    insights.push({
      id: `top-facility-${topFacility.id}`,
      kind: 'hotspot',
      text: `${topFacility.name} accounts for ${pct}% of your total emissions.`,
      detail: 'This facility is a strong candidate for an on-site energy audit.',
    });
  }

  // Rule 2: transport mode — flag high-carbon air freight
  const totalRouteEmissions = routes.reduce((sum, r) => sum + r.emissionsKg, 0);
  const airRoutes = routes.filter((r) => r.mode === 'AIR');
  const airEmissions = airRoutes.reduce((sum, r) => sum + r.emissionsKg, 0);
  if (totalRouteEmissions > 0 && airEmissions / totalRouteEmissions > 0.5) {
    const pct = Math.round((airEmissions / scopes.total) * 100);
    const railSaving = Math.round(MODE_SHIFT_SAVINGS.AIR_TO_RAIL * 100);
    const seaSaving = Math.round(MODE_SHIFT_SAVINGS.AIR_TO_SEA * 100);
    insights.push({
      id: 'air-freight-share',
      kind: 'recommendation',
      text: `Air freight contributes ${pct}% of your Scope 3 emissions.`,
      detail: `Consider rail (–${railSaving}%) or sea (–${seaSaving}%) where transit time allows.`,
    });
  } else if (airRoutes.length > 0) {
    for (const route of airRoutes.slice(0, 3)) {
      if (route.emissionsKg / scopes.total > 0.15) {
        const pct = Math.round((route.emissionsKg / scopes.total) * 100);
        insights.push({
          id: `route-${route.id}`,
          kind: 'recommendation',
          text: `Air freight on ${route.name} causes ${pct}% of your total emissions.`,
          detail: `Switching to rail could reduce this route's footprint by roughly ${Math.round(MODE_SHIFT_SAVINGS.AIR_TO_RAIL * 100)}%.`,
        });
      }
    }
  }

  // Rule 3: Scope 2 share — purchased electricity
  if (scopes.scope2 / scopes.total > 0.3) {
    const pct = Math.round((scopes.scope2 / scopes.total) * 100);
    insights.push({
      id: 'scope2-share',
      kind: 'breakdown',
      text: `Purchased electricity (Scope 2) makes up ${pct}% of your emissions.`,
      detail: 'Exploring renewable energy procurement or a green tariff could meaningfully cut this.',
    });
  }

  // Rule 4: anomaly — a facility far above its peers. We compare the
  // top facility against the average of the OTHER facilities (not
  // including itself) — comparing it to a group average that already
  // contains it mathematically caps how far past the threshold it can
  // ever read, which made this rule nearly unreachable in concentrated
  // footprints (exactly the case it's meant to catch).
  if (topFacilities.length > 1) {
    const [outlier, ...rest] = topFacilities;
    const restAvg = rest.reduce((sum, f) => sum + f.emissionsKg, 0) / rest.length;
    if (restAvg > 0 && outlier.emissionsKg > restAvg * 3) {
      insights.push({
        id: `anomaly-${outlier.id}`,
        kind: 'anomaly',
        text: `${outlier.name} emits over 3x the average of your other facilities.`,
        detail: 'Worth checking for data entry errors, or genuine inefficiency worth investigating.',
      });
    }
  }

  return insights;
}
