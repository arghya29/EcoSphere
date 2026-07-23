# Component Reference

## UI Primitives (`components/ui/`)

Reusable, accessible base components built on Radix UI primitives with shadcn/ui-style APIs.

| Component      | Props                                                       | Description                                                                                                                     |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `Button`       | `variant`, `size`, `asChild`                                | CVA-based button with 7 variants (default, destructive, outline, secondary, ghost, link, accent) and 4 sizes                    |
| `Card`         | —                                                           | Composable: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`                                           |
| `Input`        | `type`                                                      | Styled input with focus ring and disabled state                                                                                 |
| `Label`        | —                                                           | Radix Label wrapper for accessible form labels                                                                                  |
| `Badge`        | `variant`                                                   | Badge with scope-specific colors (scope1, scope2, scope3)                                                                       |
| `Tabs`         | —                                                           | Radix Tabs: `TabsList`, `TabsTrigger`, `TabsContent`                                                                            |
| `Select`       | —                                                           | Radix Select with ChevronDown icon                                                                                              |
| `Dialog`       | —                                                           | Radix Dialog with overlay and animation                                                                                         |
| `DropdownMenu` | —                                                           | Radix DropdownMenu for account menu                                                                                             |
| `Toast`        | `variant`                                                   | Context-based toast with auto-dismiss (5s)                                                                                      |
| `EmptyState`   | `icon`, `title`, `description`, `actionLabel`, `actionHref` | Empty state display for pages with no data                                                                                      |
| `ErrorDisplay` | `title`, `description`, `error`, `onRetry`, `showHomeLink`  | Rich error display with icon, dev-mode stack traces                                                                             |
| `Skeleton`     | —                                                           | Pulse animation placeholder; variants include `SkeletonText`, `SkeletonTitle`, `SkeletonCard`, `SkeletonChart`, `SkeletonTable` |

## Feature Components

### Auth (`components/auth/`)

| Component   | Description                                                                          |
| ----------- | ------------------------------------------------------------------------------------ |
| `LoginForm` | react-hook-form login with Zod validation, server error display, Google OAuth button |

### Shared (`components/shared/`)

| Component             | Description                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| `AuthSessionProvider` | NextAuth SessionProvider wrapper                                                |
| `ThemeProvider`       | Client-side theme management with localStorage persistence and flash prevention |
| `ThemeToggle`         | Sun/Moon icon button for dark/light toggle                                      |
| `SkipToContent`       | Keyboard-accessible skip navigation link                                        |
| `ErrorLogger`         | Client-side error and promise rejection console reporter                        |

### Dashboard (`components/dashboard/`)

| Component        | Description                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| `DashboardNav`   | Responsive sidebar (desktop) / hamburger menu (mobile) with account dropdown |
| `DashboardStats` | 4 stat cards (Total, Scope 1/2/3) using formatKg()                           |
| `InsightCard`    | Renders InsightRecord with kind-based icon/color                             |

### Graph (`components/graph/`)

| Component          | Description                                                                             |
| ------------------ | --------------------------------------------------------------------------------------- |
| `SupplyChainGraph` | React Flow network graph with custom SupplierNode, FacilityNode, and CustomerNode types |

### Map (`components/map/`)

| Component       | Description                                                                         |
| --------------- | ----------------------------------------------------------------------------------- |
| `MapViewClient` | Dynamic import wrapper for MapView (ssr: false)                                     |
| `MapView`       | Leaflet MapContainer with markers for suppliers/facilities and Polylines for routes |

### Charts (`components/charts/`)

| Component   | Description                                                               |
| ----------- | ------------------------------------------------------------------------- |
| `ChartPie`  | Recharts PieChart for Scope 1/2/3 breakdown with accessible sr-only table |
| `ChartBar`  | Recharts horizontal BarChart for top emitters                             |
| `ChartLine` | Recharts LineChart for monthly trend                                      |

### Upload (`components/upload/`)

| Component    | Description                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| `UploadForm` | Drag-and-drop zone for CSV/Excel with PapaParse parsing, column validation, preview table, and confirm upload |

### Builder (`components/builder/`)

| Component    | Description                                                                    |
| ------------ | ------------------------------------------------------------------------------ |
| `EntityForm` | Reusable form for creating supplier/facility entities with configurable fields |
| `ManageList` | Generic list with delete confirmation dialog for managing existing entities    |

## Component Patterns

### All UI components:

- Use `React.forwardRef` for ref forwarding
- Set `displayName` for debugging
- Use `cn()` from `@/lib/utils` for class merging
- Accept `className` prop for customization
- Use semantic HTML and ARIA attributes

### Client vs Server Components:

- Interactive components use `'use client'` directive
- Static/presentational components remain server components
- `map-view-client.tsx` uses `dynamic(() => import(...), { ssr: false })` for Leaflet

### Accessibility:

- All icons use `aria-hidden="true"` when decorative
- Loading states use `role="status"` and `aria-live="polite"`
- Form inputs use `aria-invalid` for validation
- Error messages use `role="alert"`
- Navigation uses `aria-current="page"` for active state
