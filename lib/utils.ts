import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Exported alias for class merging utility
export const mergeClasses = cn;

/**
 * Formats carbon emission kilograms into localized kg or metric tons.
 */
export function formatKg(kg: number): string {
  if (Math.abs(kg) >= 1000) {
    return `${(kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} t CO\u2082e`;
  }
  return `${kg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO\u2082e`;
}

/**
 * Formats a decimal ratio into a localized percentage string.
 */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Returns the subset of `referencedIds` that are not present in `ownedIds`.
 * Used to enforce organization ownership when a request references entity IDs
 * (facilities, routes, suppliers): callers resolve the IDs they own with a
 * scoped query, then pass both sets here to find any IDs that don't belong to
 * the caller. An empty result means every referenced ID is authorized.
 */
export function findUnauthorizedIds(referencedIds: string[], ownedIds: string[]): string[] {
  const owned = new Set(ownedIds);
  return referencedIds.filter((id) => !owned.has(id));
}

/**
 * Normalizes an optional foreign-key string: trims it, and treats an empty or
 * whitespace-only value as "not provided" by returning undefined. This keeps a
 * blank `""` from slipping past an ownership check (which would skip falsy IDs)
 * only to fail later as an invalid foreign key at write time.
 */
export function normalizeOptionalId(id: string | undefined | null): string | undefined {
  if (id == null) return undefined;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
