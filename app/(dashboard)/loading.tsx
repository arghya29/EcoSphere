export default function DashboardLoading() {
  const cardDelay = [
    "[animation-delay:0ms]",
    "[animation-delay:100ms]",
    "[animation-delay:200ms]",
  ];

  return (
    <div
      className="flex flex-col gap-6 p-6"
      role="status"
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      {/* Page title skeleton */}
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`h-32 animate-pulse rounded-lg bg-muted ${cardDelay[i]}`}
          />
        ))}
      </div>

      {/* Chart/graph area skeleton */}
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}