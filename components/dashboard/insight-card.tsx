import { AlertTriangle, Lightbulb, TrendingUp, PieChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { InsightRecord } from '@/types/api';

const KIND_CONFIG: Record<InsightRecord['kind'], { icon: typeof AlertTriangle; label: string; accent: string }> = {
  hotspot: { icon: AlertTriangle, label: 'Hotspot', accent: 'text-accent' },
  recommendation: { icon: Lightbulb, label: 'Recommendation', accent: 'text-scope1' },
  anomaly: { icon: TrendingUp, label: 'Anomaly', accent: 'text-destructive' },
  breakdown: { icon: PieChart, label: 'Breakdown', accent: 'text-scope2' },
};

export function InsightCard({ insight }: { insight: InsightRecord }) {
  const config = KIND_CONFIG[insight.kind];
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="flex gap-3 pt-5">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.accent}`} aria-hidden="true" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{config.label}</p>
          <p className="mt-1 text-sm font-medium">{insight.text}</p>
          {insight.detail && <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
