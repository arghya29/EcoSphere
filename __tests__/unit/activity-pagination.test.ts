import { getPageNumber, hasNextPage, isValidDate } from '@/lib/utils/pagination';

describe('Activity Pagination Calculations', () => {
  it('correctly maps limit and offset parameters', () => {
    const limit = 10;
    const offset = 20;
    const page = getPageNumber(offset, limit);
    expect(page).toBe(3);
  });

  it('determines if next page is available', () => {
    const total = 25;
    const limit = 10;
    const offset = 20;
    const hasNext = hasNextPage(offset, limit, total);
    expect(hasNext).toBe(false);
  });

  it('verifies filter query boundary cases', () => {
    const startDate = '2025-01-01';
    const endDate = '2025-12-31';
    const isStartValid = isValidDate(startDate);
    const isEndValid = isValidDate(endDate);
    expect(isStartValid && isEndValid).toBe(true);
  });
});

