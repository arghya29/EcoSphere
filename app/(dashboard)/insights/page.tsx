'use client';

import { useApi } from '@/hooks/use-api';
import { InsightCard } from '@/components/dashboard/insight-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';
import type { InsightRecord } from '@/types/api';

export default function InsightsPage() {
  const { data, isLoading } = useApi<{ insights: InsightRecord[] }>('/api/insights');
  const insights = data?.insights ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Rule-based observations generated from your data — no AI, just thresholds and arithmetic.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2" role="status" aria-live="polite">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No insights yet"
          description="Insights appear once you have enough activity data for a clear pattern to emerge — for example, one supplier dominating your footprint, or a high-carbon transport mode."
          actionLabel="Upload data"
          actionHref="/upload"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
