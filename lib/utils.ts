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
