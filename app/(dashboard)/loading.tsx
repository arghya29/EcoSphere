import { SkeletonTitle, SkeletonCard, SkeletonChart } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div
      className="flex flex-col gap-6 p-6"
      role="status"
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      <SkeletonTitle />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <SkeletonChart />
    </div>
  );
}
