import { generateOpenApiSpec } from '@/lib/openapi';

describe('OpenAPI Specification Generator', () => {
  it('generates a valid OpenAPI 3.0.0 document structure', () => {
    const spec = generateOpenApiSpec();

    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info).toBeDefined();
    expect(spec.info.title).toBe('EcoSphere API Documentation');
    expect(spec.paths).toBeDefined();
  });

  it('contains all core registered routes', () => {
    const spec = generateOpenApiSpec();
    const paths = Object.keys(spec.paths);

    expect(paths).toContain('/api/signup');
    expect(paths).toContain('/api/upload');
    expect(paths).toContain('/api/suppliers');
    expect(paths).toContain('/api/facilities');
    expect(paths).toContain('/api/routes');
    expect(paths).toContain('/api/activities');
  });

  it('declares the cookieAuth security schema component', () => {
    const spec = generateOpenApiSpec();
    expect(spec.components?.securitySchemes?.cookieAuth).toBeDefined();
    expect((spec.components?.securitySchemes?.cookieAuth as any)?.type).toBe('apiKey');
  });
});
