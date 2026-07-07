export function getPageNumber(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1;
}

export function hasNextPage(offset: number, limit: number, total: number): boolean {
  return offset + limit < total;
}

export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  return !isNaN(Date.parse(dateStr));
}
