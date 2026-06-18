'use client';

import { useApi } from '@/hooks/use-api';
import { InsightCard } from '@/components/dashboard/insight-card';
import { Card, CardContent } from '@/components/ui/card';
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
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : insights.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No insights yet — they appear once you have enough activity data for a clear pattern to emerge (e.g.
            one supplier dominating your footprint, or a high-carbon transport mode).
          </CardContent>
        </Card>
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
