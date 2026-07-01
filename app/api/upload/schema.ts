import { z } from 'zod';

// Cap the number of rows accepted in a single bulk upload. Without an upper
// bound, a large payload is turned into one prisma.$transaction with one
// create() per row, which can exhaust memory and hold DB locks for a long time
// — a denial-of-service vector. Oversized uploads are rejected by validation
// before any database work begins; clients should split large files into
// batches under this limit.
export const MAX_UPLOAD_ROWS = 1000;

export const tooManyRowsMessage = `Too many rows in a single upload (maximum ${MAX_UPLOAD_ROWS}). Split the file into smaller batches.`;

// Accepts already-parsed rows (the client parses CSV/XLSX with
// PapaParse/SheetJS per the spec, then POSTs structured JSON here).
// `kind` tells us which table the rows belong to.
//
// Extracted into its own module (rather than defined inline in route.ts) so
// it can be unit tested without pulling in the route's Prisma/session
// dependencies — see __tests__/unit/upload-schema.test.ts.
export const uploadSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('suppliers'),
    rows: z
      .array(
        z.object({
          name: z.string().min(1),
          location: z.string().optional(),
          category: z.string().optional(),
          latitude: z.coerce.number().optional(),
          longitude: z.coerce.number().optional(),
        })
      )
      .max(MAX_UPLOAD_ROWS, { message: tooManyRowsMessage }),
  }),
  z.object({
    kind: z.literal('facilities'),
    rows: z
      .array(
        z.object({
          name: z.string().min(1),
          type: z.string().optional(),
          location: z.string().optional(),
          latitude: z.coerce.number().optional(),
          longitude: z.coerce.number().optional(),
        })
      )
      .max(MAX_UPLOAD_ROWS, { message: tooManyRowsMessage }),
  }),
  z.object({
    kind: z.literal('activities'),
    rows: z
      .array(
        z.object({
          facility_id: z.string().nullish(),
          route_id: z.string().nullish(),
          supplier_id: z.string().nullish(),
          factor_category: z.string().min(1),
          amount: z.coerce.number().positive(),
          unit: z.string().min(1),
          date: z.coerce.date(),
        })
      )
      .max(MAX_UPLOAD_ROWS, { message: tooManyRowsMessage }),
  }),
]);
