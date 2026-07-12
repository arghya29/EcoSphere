# EcoSphere API Specification

All API requests must include standard session authentication headers (NextAuth) and are scoped to the caller's active organization.

## Endpoints

### 1. `GET /api/dashboard`
Returns the footprint summary and historical trend metrics for the organization.
- **Response Format**:
  ```json
  {
    "success": true,
    "data": {
      "total": 125000,
      "scope1": 25000,
      "scope2": 40000,
      "scope3": 60000,
      "monthlyTrend": [
        { "month": "2025-01", "emissionsKg": 15000 }
      ],
      "topSuppliers": [],
      "topFacilities": []
    }
  }
  ```

### 2. `POST /api/activities`
Records bulk greenhouse gas activities and computes emissions on-the-fly.
- **Request Format**:
  ```json
  {
    "activities": [
      {
        "type": "FUEL",
        "factorCategory": "diesel",
        "amount": 250,
        "unit": "litres",
        "dateRecorded": "2025-02-15T00:00:00Z"
      }
    ]
  }
  ```

### 3. `GET /api/suppliers`
Lists all active supplier profiles configured under this organization.
