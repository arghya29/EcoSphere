import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';

interface RateLimitData {
  count: number;
  resetTime: number;
}

// In-memory store for rate limits
export const rateLimitMap = new Map<string, RateLimitData>();

const LIMITS: Record<string, { limit: number; windowMs: number }> = {
  '/api/auth/login': { limit: 10, windowMs: 60 * 1000 },
  '/api/auth/signup': { limit: 10, windowMs: 60 * 1000 },
  '/api/signup': { limit: 10, windowMs: 60 * 1000 },
  '/api/upload': { limit: 5, windowMs: 60 * 1000 },
};

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',');
    return ips[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return req.ip || '127.0.0.1';
}

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
});

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Rate Limiting for API routes
  const rule = LIMITS[pathname];
  if (rule) {
    const ip = getClientIp(req);
    const key = `${ip}:${pathname}`;
    const now = Date.now();

    // Clean up expired entries to prevent memory leak
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) {
        rateLimitMap.delete(k);
      }
    }

    let record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + rule.windowMs,
      };
      rateLimitMap.set(key, record);
    } else {
      record.count += 1;
      rateLimitMap.set(key, record);
    }

    const remaining = Math.max(0, rule.limit - record.count);
    const resetSeconds = Math.max(0, Math.ceil((record.resetTime - now) / 1000));
    const resetTimestampSeconds = Math.ceil(record.resetTime / 1000);

    const headers = {
      'X-RateLimit-Limit': String(rule.limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetTimestampSeconds),
    };

    if (record.count > rule.limit) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(resetSeconds),
            ...headers,
          },
        }
      );
    }

    const response = NextResponse.next();
    for (const [hKey, hValue] of Object.entries(headers)) {
      response.headers.set(hKey, hValue);
    }
    return response;
  }

  // 2. Next-Intl Middleware for UI routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
};
