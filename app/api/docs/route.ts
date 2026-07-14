import { NextResponse } from 'next/server';
import { generateOpenApiSpec } from '@/lib/openapi';

export async function GET() {
  try {
    const spec = generateOpenApiSpec();
    return NextResponse.json(spec);
  } catch (error) {
    console.error('Failed to generate OpenAPI spec:', error);
    return NextResponse.json({ error: 'Failed to generate spec' }, { status: 500 });
  }
}
