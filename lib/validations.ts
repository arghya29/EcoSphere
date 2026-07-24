import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
  category: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

export const suppliersPayloadSchema = z.object({
  suppliers: z.array(supplierSchema).min(1),
});

export const facilitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().optional(),
  location: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

export const facilitiesPayloadSchema = z.object({
  facilities: z.array(facilitySchema).min(1),
});

export const routeSchema = z.object({
  originSupplierId: z.string().optional(),
  originFacilityId: z.string().optional(),
  destinationId: z.string().min(1, 'Destination facility is required'),
  mode: z.enum(['TRUCK', 'RAIL', 'AIR', 'SEA', 'OTHER']).default('TRUCK'),
  distanceKm: z.coerce.number().positive('Distance must be greater than 0'),
});

export const routesPayloadSchema = z.object({
  routes: z.array(routeSchema).min(1),
});

export const activitySchema = z.object({
  type: z.enum(['FUEL', 'ELECTRICITY', 'FREIGHT', 'OTHER']),
  supplierId: z.string().optional(),
  facilityId: z.string().optional(),
  routeId: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  unit: z.string().min(1),
  factorCategory: z.string().min(1, 'Emission factor category is required'),
  dateRecorded: z.coerce.date(),
});

export const activitiesPayloadSchema = z.object({
  activities: z.array(activitySchema).min(1),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  organizationName: z.string().min(1, 'Organization name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
export type FacilityInput = z.infer<typeof facilitySchema>;
export type RouteInput = z.infer<typeof routeSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
