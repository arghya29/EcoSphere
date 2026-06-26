'use client';

import * as React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Factory, Truck, Warehouse } from 'lucide-react';
import { formatKg } from '@/lib/utils';
import type { SupplierRecord, FacilityRecord, RouteRecord } from '@/types/api';

function SupplierNode({ data }: { data: { label: string } }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <Truck className="h-3.5 w-3.5 shrink-0 text-scope3" aria-hidden="true" />
      <span className="font-medium">{data.label}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function FacilityNode({ data }: { data: { label: string; sublabel?: string } }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-primary bg-primary px-3 py-2 text-xs text-primary-foreground shadow-sm">
      <Factory className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <div>
        <div className="font-medium">{data.label}</div>
        {data.sublabel && <div className="opacity-80">{data.sublabel}</div>}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function CustomerNode({ data }: { data: { label: string } }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs shadow-sm">
      <Warehouse className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="font-medium">{data.label}</span>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

const nodeTypes = { supplier: SupplierNode, facility: FacilityNode, customer: CustomerNode };

const MODE_LABEL: Record<string, string> = { TRUCK: 'Truck', RAIL: 'Rail', AIR: 'Air', SEA: 'Sea', OTHER: 'Other' };

export function SupplyChainGraph({
  suppliers,
  facilities,
  routes,
  emissionsByRoute,
}: {
  suppliers: SupplierRecord[];
  facilities: FacilityRecord[];
  routes: RouteRecord[];
  emissionsByRoute?: Map<string, number>;
}) {
  const { nodes, edges } = React.useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    suppliers.forEach((s, i) => {
      nodes.push({
        id: `supplier-${s.id}`,
        type: 'supplier',
        position: { x: 0, y: i * 80 },
        data: { label: s.name },
      });
    });

    // Facilities that are route destinations sit in the middle/right
    // column; facilities that only originate routes sit with suppliers.
    const destinationIds = new Set(routes.map((r) => r.destinationId));
    let midCol = 0;
    let rightCol = 0;
    facilities.forEach((f) => {
      const isDestination = destinationIds.has(f.id);
      nodes.push({
        id: `facility-${f.id}`,
        type: isDestination ? 'customer' : 'facility',
        position: isDestination ? { x: 560, y: rightCol++ * 80 } : { x: 280, y: midCol++ * 80 },
        data: { label: f.name, sublabel: f.type ?? undefined },
      });
    });

    routes.forEach((r) => {
      const sourceId = r.originSupplierId ? `supplier-${r.originSupplierId}` : `facility-${r.originFacilityId}`;
      const targetId = `facility-${r.destinationId}`;
      const emissions = emissionsByRoute?.get(r.id);
      edges.push({
        id: `route-${r.id}`,
        source: sourceId,
        target: targetId,
        label: emissions !== undefined ? `${MODE_LABEL[r.mode]} · ${formatKg(emissions)}` : `${MODE_LABEL[r.mode]} · ${r.distanceKm}km`,
        animated: r.mode === 'AIR',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: r.mode === 'AIR' ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))' },
        labelStyle: { fontSize: 10 },
      });
    });

    return { nodes, edges };
  }, [suppliers, facilities, routes, emissionsByRoute]);

  if (nodes.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-md border border-dashed border-border text-center text-sm text-muted-foreground">
        <p>No suppliers or facilities yet.</p>
        <p>Upload data to see your network here.</p>
      </div>
    );
  }

  return (
    <div className="h-[420px] w-full rounded-md border border-border" role="img" aria-label="Supply chain network diagram">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView proOptions={{ hideAttribution: true }}>
        <Background />
        <Controls
          className="!bg-background/80 !border-border !shadow-sm [&>button]:!bg-background [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
          aria-label="Graph zoom and pan controls"
        />
        <MiniMap
          className="!bg-background/80 !border-border !shadow-sm !rounded-md"
          pannable
          zoomable
          ariaLabel="Graph minimap"
        />
      </ReactFlow>
    </div>
  );
}
