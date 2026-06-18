'use client';

import * as React from 'react';
import { DEMO_SCENARIOS } from '@/lib/demo-data';
import { formatKg, cn } from '@/lib/utils';

const MODE_COLOR: Record<string, string> = {
  Truck: 'hsl(var(--scope1))',
  Rail: '#2f6f4f',
  Air: 'hsl(var(--destructive))',
  Sea: 'hsl(var(--scope2))',
};

export function InteractiveDemo() {
  const [scenarioId, setScenarioId] = React.useState(DEMO_SCENARIOS[0].id);
  const [showScope3, setShowScope3] = React.useState(true);
  const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId) ?? DEMO_SCENARIOS[0];
  const total = scenario.scope1 + scenario.scope2 + scenario.scope3;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Demo industry scenario">
          {DEMO_SCENARIOS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === scenarioId}
              onClick={() => setScenarioId(s.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                s.id === scenarioId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-secondary'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showScope3}
            onChange={(e) => setShowScope3(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Show Scope 3 (transport)
        </label>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[1.4fr_1fr]">
        <div className="overflow-x-auto rounded-md border border-dashed border-border bg-muted/40 p-2">
          <svg
            viewBox="0 0 600 260"
            className="h-auto w-full min-w-[480px]"
            role="img"
            aria-label={`Network diagram for ${scenario.label}: suppliers feeding into a factory, then onward to a distribution node, connected by transport routes.`}
          >
            {scenario.edges.map((edge) => {
              const source = scenario.nodes.find((n) => n.id === edge.source)!;
              const target = scenario.nodes.find((n) => n.id === edge.target)!;
              const isFreight = true; // all edges in the demo represent Scope 3 freight
              if (isFreight && !showScope3) return null;
              return (
                <g key={edge.id}>
                  <line
                    x1={source.x + 90}
                    y1={source.y + 20}
                    x2={target.x}
                    y2={target.y + 20}
                    stroke={MODE_COLOR[edge.mode]}
                    strokeWidth={2}
                    strokeDasharray={edge.mode === 'Air' ? '6 4' : undefined}
                  />
                  <text
                    x={(source.x + 90 + target.x) / 2}
                    y={(source.y + target.y) / 2 + 14}
                    fontSize="10"
                    textAnchor="middle"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {edge.mode}
                  </text>
                </g>
              );
            })}
            {scenario.nodes.map((node) => (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={90}
                  height={40}
                  rx={6}
                  fill={node.kind === 'factory' ? 'hsl(var(--primary))' : 'hsl(var(--card))'}
                  stroke="hsl(var(--border))"
                />
                <text
                  x={node.x + 45}
                  y={node.y + 17}
                  fontSize="9"
                  textAnchor="middle"
                  fill={node.kind === 'factory' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'}
                  fontWeight={600}
                >
                  {node.label.split(' — ')[0]}
                </text>
                <text
                  x={node.x + 45}
                  y={node.y + 29}
                  fontSize="8"
                  textAnchor="middle"
                  fill={node.kind === 'factory' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'}
                >
                  {node.label.split(' — ')[1]}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <ScopeBar label="Scope 1" value={scenario.scope1} total={total} colorVar="--scope1" />
          <ScopeBar label="Scope 2" value={scenario.scope2} total={total} colorVar="--scope2" />
          <ScopeBar label="Scope 3" value={showScope3 ? scenario.scope3 : 0} total={total} colorVar="--scope3" />
          <div className="manifest-rule mt-1 pt-3">
            <p className="font-mono-data text-2xl font-semibold">
              {formatKg(scenario.scope1 + scenario.scope2 + (showScope3 ? scenario.scope3 : 0))}
            </p>
            <p className="text-xs text-muted-foreground">Total estimated emissions, this scenario</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScopeBar({ label, value, total, colorVar }: { label: string; value: number; total: number; colorVar: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono-data text-muted-foreground">{formatKg(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: `hsl(var(${colorVar}))` }}
        />
      </div>
    </div>
  );
}
