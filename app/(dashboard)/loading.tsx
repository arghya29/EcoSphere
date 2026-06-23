export default function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar skeleton */}
      <aside className="hidden md:block w-64 border-r border-border p-4 space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-full animate-pulse rounded-md bg-muted"
              style={{ animationDelay: `${i * 75}ms` }}
            />
          ))}
        </div>
      </aside>

      {/* Content area skeleton */}
      <main className="flex-1 p-6 space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-muted"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </main>
    </div>
  );
}
