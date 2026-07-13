import { middleware, rateLimitMap } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock NextRequest and NextResponse
jest.mock('next/server', () => {
  class MockNextResponse {
    status: number;
    headers: {
      map: Map<string, string>;
      set: (key: string, val: string) => void;
      get: (key: string) => string | undefined;
    };
    body: string;

    constructor(body: string = '', init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status ?? 200;
      const map = new Map();
      if (init?.headers) {
        for (const [k, v] of Object.entries(init.headers)) {
          map.set(k.toLowerCase(), v);
        }
      }
      this.headers = {
        map,
        set: (key: string, val: string) => map.set(key.toLowerCase(), val),
        get: (key: string) => map.get(key.toLowerCase()),
      };
    }

    static next() {
      return new MockNextResponse('');
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: jest.fn(),
  };
});

function mockRequest(pathname: string, ip: string = '127.0.0.1'): NextRequest {
  return {
    nextUrl: {
      pathname,
    },
    headers: {
      get: jest.fn(() => null),
    },
    ip,
  } as unknown as NextRequest;
}

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    rateLimitMap.clear();
    jest.clearAllMocks();
  });

  it('skips non-auth/non-upload endpoints', () => {
    const req = mockRequest('/api/dashboard');
    const res = middleware(req) as any;
    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Limit')).toBeUndefined();
  });

  it('sets correct rate limit headers for first request', () => {
    const req = mockRequest('/api/upload');
    const res = middleware(req) as any;
    
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('4');
    expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
  });

  it('allows requests up to the limit and returns 429 when exceeded', () => {
    const req = mockRequest('/api/upload', '1.1.1.1');

    // 5 requests allowed
    for (let i = 0; i < 5; i++) {
      const res = middleware(req) as any;
      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Remaining')).toBe(String(4 - i));
    }

    // 6th request should fail
    const res429 = middleware(req) as any;
    expect(res429.status).toBe(429);
    expect(res429.headers.get('Retry-After')).toBe('60');
  });

  it('supports separate limits per IP', () => {
    const req1 = mockRequest('/api/upload', '1.1.1.1');
    const req2 = mockRequest('/api/upload', '2.2.2.2');

    // Consume all limits for IP 1
    for (let i = 0; i < 5; i++) {
      middleware(req1);
    }
    const res1 = middleware(req1) as any;
    expect(res1.status).toBe(429);

    // IP 2 should still be allowed
    const res2 = middleware(req2) as any;
    expect(res2.status).toBe(200);
    expect(res2.headers.get('X-RateLimit-Remaining')).toBe('4');
  });
});
