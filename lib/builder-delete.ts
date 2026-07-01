// Shared guard for deleting supply-chain "nodes" (suppliers and facilities)
// from the Supply-Chain Builder.
//
// A Route draws an edge to/from a supplier or facility:
//   - Route.originSupplierId  -> Supplier   (optional FK)
//   - Route.originFacilityId  -> Facility   (optional FK)
//   - Route.destinationId     -> Facility   (REQUIRED FK)
//
// Removing a node that still has edges would either leave a route without an
// origin, or — for a facility used as a route's required destination — be
// rejected by the database's foreign-key constraint outright. Rather than
// silently corrupt the graph or surface a raw DB error, we block the delete
// with a clear, countable message and let the user remove the dependent
// routes first. (Activities that reference the node are historical emission
// records, not graph edges; the delete endpoints detach those separately so
// their emissions are preserved.)
export type DeleteGuardResult = { blocked: false } | { blocked: true; error: string };

export function guardNodeDeletion(
  entity: 'supplier' | 'facility',
  dependentRouteCount: number
): DeleteGuardResult {
  if (dependentRouteCount <= 0) {
    return { blocked: false };
  }

  const routeWord = dependentRouteCount === 1 ? 'route' : 'routes';
  const themWord = dependentRouteCount === 1 ? 'it' : 'them';

  return {
    blocked: true,
    error: `This ${entity} is still used by ${dependentRouteCount} ${routeWord}. Remove ${themWord} first, then delete the ${entity}.`,
  };
}
