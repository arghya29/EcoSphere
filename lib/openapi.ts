import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  supplierSchema,
  suppliersPayloadSchema,
  facilitySchema,
  facilitiesPayloadSchema,
  routeSchema,
  routesPayloadSchema,
  activitySchema,
  activitiesPayloadSchema,
  signupSchema,
  loginSchema,
} from './validations';
import { uploadSchema } from '../app/api/upload/schema';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Register Zod schemas with OpenAPI metadata
const Supplier = registry.register('Supplier', supplierSchema);
const SuppliersPayload = registry.register('SuppliersPayload', suppliersPayloadSchema);
const Facility = registry.register('Facility', facilitySchema);
const FacilitiesPayload = registry.register('FacilitiesPayload', facilitiesPayloadSchema);
const Route = registry.register('Route', routeSchema);
const RoutesPayload = registry.register('RoutesPayload', routesPayloadSchema);
const Activity = registry.register('Activity', activitySchema);
const ActivitiesPayload = registry.register('ActivitiesPayload', activitiesPayloadSchema);
const Signup = registry.register('Signup', signupSchema);
const Login = registry.register('Login', loginSchema);
const Upload = registry.register('Upload', uploadSchema);

// Security Schema Component registration
registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'next-auth.session-token',
  description: 'NextAuth session cookie',
});

// Paths registration
registry.registerPath({
  method: 'post',
  path: '/api/signup',
  summary: 'User Signup',
  description: 'Create a new user and organization context',
  request: {
    body: {
      content: {
        'application/json': {
          schema: Signup,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User successfully created',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              id: z.string(),
              email: z.string(),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Validation or validation conflict error',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/upload',
  summary: 'Bulk CSV JSON Upload',
  description: 'Bulk upload suppliers, facilities, or activities',
  request: {
    headers: z.object({
      'idempotency-key': z.string().optional().openapi({ description: 'Optional unique key to ensure request idempotency' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: Upload,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Records successfully created',
    },
    400: {
      description: 'Validation or missing referenced entity error',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/suppliers',
  summary: 'List Suppliers',
  description: 'Get all suppliers belonging to the current organization',
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: 'Successfully retrieved suppliers list',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/suppliers',
  summary: 'Create Suppliers',
  description: 'Add new suppliers to the current organization',
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: SuppliersPayload,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Suppliers successfully created',
    },
    400: {
      description: 'Invalid input payload',
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/suppliers/{id}',
  summary: 'Delete Supplier',
  description: 'Remove a supplier from the organization. Will block if supplier is still referenced by any routes.',
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'The unique supplier ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Supplier successfully deleted',
    },
    404: {
      description: 'Supplier not found',
    },
    409: {
      description: 'Deletion blocked by dependent entities',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/facilities',
  summary: 'List Facilities',
  description: 'Get all facilities belonging to the current organization',
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: 'Successfully retrieved facilities list',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/facilities',
  summary: 'Create Facilities',
  description: 'Add new facilities to the current organization',
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: FacilitiesPayload,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Facilities successfully created',
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/facilities/{id}',
  summary: 'Delete Facility',
  description: 'Remove a facility from the organization. Will block if referenced by routes.',
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'The unique facility ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Facility successfully deleted',
    },
    404: {
      description: 'Facility not found',
    },
    409: {
      description: 'Deletion blocked by dependent routes',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/routes',
  summary: 'List Routes',
  description: 'Get all routes belonging to the current organization',
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: 'Successfully retrieved routes list',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/routes',
  summary: 'Create Routes',
  description: 'Add new routes connecting facilities and suppliers',
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RoutesPayload,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Routes successfully created',
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/routes/{id}',
  summary: 'Delete Route',
  description: 'Remove a route from the organization',
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'The unique route ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Route successfully deleted',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/activities',
  summary: 'List Activities',
  description: 'Get paginated activity emission entries with optional filtering and sorting',
  security: [{ cookieAuth: [] }],
  request: {
    query: z.object({
      limit: z.coerce.number().optional().openapi({ description: 'Number of records to fetch (max 100, default 10)' }),
      page: z.coerce.number().optional().openapi({ description: 'Page number for pagination' }),
      offset: z.coerce.number().optional().openapi({ description: 'Offset for skip-based pagination' }),
      type: z.string().optional().openapi({ description: 'Filter by activity type (FUEL, ELECTRICITY, FREIGHT, OTHER, ALL)' }),
      startDate: z.string().optional().openapi({ description: 'Filter records starting from date (YYYY-MM-DD)' }),
      endDate: z.string().optional().openapi({ description: 'Filter records up to date (YYYY-MM-DD)' }),
      sortBy: z.string().optional().openapi({ description: 'Sort by field (dateRecorded, emissionsKg, amount, type)' }),
      sortOrder: z.enum(['asc', 'desc']).optional().openapi({ description: 'Sort direction' }),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved paginated activities list',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/activities',
  summary: 'Create Activities',
  description: 'Manually add new activity logs to record carbon emissions',
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: ActivitiesPayload,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Activities successfully created',
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/activities',
  summary: 'Bulk Delete Activities',
  description: 'Delete multiple activities in bulk using their IDs',
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            ids: z.array(z.string()).min(1).openapi({ description: 'Array of activity IDs to delete' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Activities successfully deleted',
    },
  },
});

export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'EcoSphere API Documentation',
      version: '1.0.0',
      description: 'API contract and endpoints for the EcoSphere Supply-Chain Carbon Intelligence Platform.',
    },
    servers: [
      {
        url: '/',
        description: 'Current environment',
      },
    ],
  });
}
