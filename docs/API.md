# API Reference

All API routes are scoped to the authenticated user's organization. Responses follow a consistent format:

```json
{
  "success": true,
  "data": { /* ... */ },
  "error": "Error message if success is false"
}
```

## Authentication

### `POST /api/auth/[...nextauth]`

NextAuth.js catch-all handler. Handles sign-in, sign-out, and session retrieval.

### `POST /api/signup`

Create a new user account and organization.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "User Name"
}
```

**Response:** `{ success: true, data: { user: {...}, organization: {...} } }`

## Suppliers

### `GET /api/suppliers`

List all suppliers for the current organization.

**Response:** `{ success: true, data: SupplierRecord[] }`

### `POST /api/suppliers`

Batch-create suppliers.

**Request Body:**
```json
{
  "suppliers": [
    { "name": "Supplier A", "location": "New York", "category": "Raw Materials" }
  ]
}
```

### `DELETE /api/suppliers/[id]`

Delete a supplier by ID.

## Facilities

### `GET /api/facilities`

List all facilities for the current organization.

### `POST /api/facilities`

Batch-create facilities.

**Request Body:**
```json
{
  "facilities": [
    { "name": "Warehouse 1", "type": "Storage", "location": "Chicago" }
  ]
}
```

### `DELETE /api/facilities/[id]`

Delete a facility by ID.

## Routes

### `GET /api/routes`

List all transport routes.

### `POST /api/routes`

Batch-create routes.

**Request Body:**
```json
{
  "routes": [
    {
      "originSupplierId": "uuid",
      "destinationId": "uuid",
      "mode": "TRUCK",
      "distanceKm": 150
    }
  ]
}
```

**Mode options:** `TRUCK`, `RAIL`, `AIR`, `SEA`, `OTHER`

### `DELETE /api/routes/[id]`

Delete a route by ID.

## Activities

### `GET /api/activities`

List all activity records.

### `POST /api/activities`

Batch-create activity records with automatic emissions calculation.

**Request Body:**
```json
{
  "activities": [
    {
      "facilityId": "uuid",
      "factorCategory": "diesel",
      "amount": 5000,
      "unit": "L",
      "date": "2024-01-15"
    }
  ]
}
```

## Upload

### `POST /api/upload`

Bulk import suppliers, facilities, or activity data from CSV/Excel content.

**Request Body:**
```json
{
  "kind": "suppliers | facilities | activities",
  "rows": [ /* parsed rows */ ]
}
```

## Dashboard

### `GET /api/dashboard`

Get the organization's carbon footprint summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 125000,
    "scope1": 45000,
    "scope2": 30000,
    "scope3": 50000,
    "topSuppliers": [{ "id": "uuid", "name": "Supplier A", "emissionsKg": 35000 }],
    "topFacilities": [{ "id": "uuid", "name": "Facility B", "emissionsKg": 28000 }],
    "monthlyTrend": [{ "month": "2024-01", "emissionsKg": 10000 }],
    "activityCount": 42,
    "supplierCount": 5,
    "facilityCount": 3
  }
}
```

## Insights

### `GET /api/insights`

Run the rule-based insight engine and return observations.

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "id": "uuid",
        "kind": "hotspot | recommendation | anomaly | breakdown",
        "text": "Supplier A accounts for 45% of total emissions",
        "detail": "Consider diversifying suppliers to reduce concentration risk."
      }
    ]
  }
}
```

## Reports

### `GET /api/reports`

List report generation history.

### `POST /api/reports`

Record a report generation event.

**Request Body:**
```json
{
  "format": "PDF | CSV | JSON"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

| Status | Meaning |
|---|---|
| 200 | Success |
| 400 | Validation error (invalid input) |
| 401 | Not authenticated |
| 404 | Organization not found or entity not found |
| 500 | Internal server error |

Error responses include a user-friendly message in the `error` field.
