import { NextResponse } from 'next/server';

export type ApiErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'CONFLICT' | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  success: false;
  error: string;
  code?: ApiErrorCode;
  details?: Record<string, string[]>;
}

export function apiError(
  error: string,
  status: number,
  code?: ApiErrorCode,
  details?: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    { success: false, error, code, ...(details ? { details } : {}) } satisfies ApiErrorBody,
    { status }
  );
}

export function handleApiError(err: unknown, context: string): NextResponse {
  console.error(`[API Error] ${context}:`, err instanceof Error ? err.message : err);

  if (err instanceof SyntaxError) {
    return apiError('Invalid JSON payload', 400, 'VALIDATION_ERROR');
  }

  if (err instanceof Error && err.message.includes('Unique constraint')) {
    return apiError('A record with the same unique value already exists', 409, 'CONFLICT');
  }

  if (err instanceof Error && err.message.includes('Foreign key constraint')) {
    return apiError('Referenced entity not found', 400, 'VALIDATION_ERROR');
  }

  return apiError('An internal error occurred', 500, 'INTERNAL_ERROR');
}

export function validatePaginationParams(
  limit: number,
  offset: number
): { valid: boolean; error?: NextResponse } {
  if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
    return { valid: false, error: apiError('Limit must be between 1 and 100', 400, 'VALIDATION_ERROR') };
  }
  if (!Number.isFinite(offset) || offset < 0) {
    return { valid: false, error: apiError('Offset must be a non-negative integer', 400, 'VALIDATION_ERROR') };
  }
  return { valid: true };
}
