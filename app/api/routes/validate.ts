import { normalizeOptionalId } from '@/lib/utils';
import type { RouteInput } from '@/lib/validations';

export type NormalizeRoutesResult =
  { ok: true; routes: RouteInput[] } | { ok: false; error: string };

// Normalizes each route's foreign keys (blank/whitespace optional origin IDs ->
// undefined; required destinationId trimmed) and validates required-field
// presence *after* normalization — not before.
//
// Zod's z.string().min(1) only rejects a truly empty string, so a
// whitespace-only destinationId (e.g. "   ") passes schema validation but
// becomes "" once trimmed here. Without this explicit post-trim check, that ""
// would be silently filtered out of the ownership-check ID list (it's falsy,
// so Boolean("") === false excludes it from the lookup) and then reach Prisma
// as an invalid foreign key on the actual create call — an unhandled DB
// constraint error instead of a clean 400. Regression for a CodeRabbit review
// finding on PR #26 (activities/routes org-ownership fix).
//
// This function is the single place normalization happens, so the route
// handler can never accidentally skip the check by reordering code around it.
export function normalizeAndValidateRoutes(rawRoutes: RouteInput[]): NormalizeRoutesResult {
  const routes = rawRoutes.map((r) => ({
    ...r,
    originSupplierId: normalizeOptionalId(r.originSupplierId),
    originFacilityId: normalizeOptionalId(r.originFacilityId),
    destinationId: r.destinationId.trim(),
  }));

  for (const r of routes) {
    if (!r.destinationId) {
      return { ok: false, error: 'Each route needs a destinationId.' };
    }
    if (!r.originSupplierId && !r.originFacilityId) {
      return { ok: false, error: 'Each route needs an originSupplierId or originFacilityId.' };
    }
  }

  return { ok: true, routes };
}
