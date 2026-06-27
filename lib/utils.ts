import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKg(kg: number): string {
  if (Math.abs(kg) >= 1000) {
    return `${(kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} t CO\u2082e`;
  }
  return `${kg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO\u2082e`;
}

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
