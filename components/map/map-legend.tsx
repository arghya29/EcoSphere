'use client';

import * as React from 'react';

const MODE_COLOR: Record<string, string> = {
  TRUCK: '#1e3a5f',
  RAIL: '#2f6f4f',
  AIR: '#b3261e',
  SEA: '#b8860b',
  OTHER: '#6b7280',
};

export function MapLegend() {
  return (
    <div className="flex flex-wrap gap-3 p-3 text-xs bg-muted rounded-md border mt-2">
      <div className="font-semibold text-muted-foreground uppercase tracking-wider mr-1">
        Route Legend:
      </div>
      {Object.entries(MODE_COLOR).map(([mode, color]) => (
        <div key={mode} className="flex items-center gap-1">
          <span
            className="w-3 h-0.5 inline-block"
            style={{
              backgroundColor: color,
              borderTop: `2px ${mode === 'AIR' ? 'dashed' : 'solid'} ${color}`,
            }}
          />
          <span className="font-medium text-foreground">{mode}</span>
        </div>
      ))}
    </div>
  );
}
