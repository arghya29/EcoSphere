'use client';

import * as React from 'react';
import { Trash2, Database } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useMutation } from '@/hooks/use-mutation';
import { SupplyChainGraph } from '@/components/graph/supply-chain-graph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { EntityForm, Field, ManageList } from '@/components/builder';
import type { SupplierRecord, FacilityRecord, RouteRecord } from '@/types/api';

const SUPPLIER_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'category', label: 'Category' },
  { key: 'location', label: 'Location' },
  { key: 'latitude', label: 'Latitude', type: 'number' as const },
  { key: 'longitude', label: 'Longitude', type: 'number' as const },
];

const FACILITY_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'type', label: 'Type', placeholder: 'Manufacturing, Storage\u2026' },
  { key: 'location', label: 'Location' },
  { key: 'latitude', label: 'Latitude', type: 'number' as const },
  { key: 'longitude', label: 'Longitude', type: 'number' as const },
];

export default function BuilderPage() {
  const { data: apiSuppliers, refetch: refetchSuppliers } = useApi<SupplierRecord[]>('/api/suppliers');
  const { data: apiFacilities, refetch: refetchFacilities } = useApi<FacilityRecord[]>('/api/facilities');
  const { data: apiRoutes, refetch: refetchRoutes } = useApi<RouteRecord[]>('/api/routes');

  const [suppliers, setSuppliers] = React.useState<SupplierRecord[]>([]);
  const [facilities, setFacilities] = React.useState<FacilityRecord[]>([]);
  const [routes, setRoutes] = React.useState<RouteRecord[]>([]);

  React.useEffect(() => {
    if (apiSuppliers) setSuppliers(apiSuppliers);
  }, [apiSuppliers]);

  React.useEffect(() => {
    if (apiFacilities) setFacilities(apiFacilities);
  }, [apiFacilities]);

  React.useEffect(() => {
    if (apiRoutes) setRoutes(apiRoutes);
  }, [apiRoutes]);

  // Supplier Optimistic Callbacks
  const onMutateSupplierCreate = (newSupplier: any) => {
    const previousSuppliers = suppliers;
    const tempId = `temp-supplier-${Date.now()}`;
    const optimisticSupplier: SupplierRecord = {
      id: tempId,
      name: newSupplier.name || 'New Supplier',
      category: newSupplier.category || null,
      location: newSupplier.location || null,
      latitude: newSupplier.latitude ? Number(newSupplier.latitude) : null,
      longitude: newSupplier.longitude ? Number(newSupplier.longitude) : null,
    };
    setSuppliers((prev) => [...prev, optimisticSupplier]);
    return { previousSuppliers };
  };

  const onErrorSupplierCreate = (err: string, variables: any, context: any) => {
    if (context?.previousSuppliers) {
      setSuppliers(context.previousSuppliers);
    }
  };

  const onSettledSupplierCreate = () => {
    refetchSuppliers();
  };

  const onMutateSupplierDelete = (supplierToDelete: SupplierRecord) => {
    const previousSuppliers = suppliers;
    const previousRoutes = routes;

    setSuppliers((prev) => prev.filter((s) => s.id !== supplierToDelete.id));
    setRoutes((prev) => prev.filter((r) => r.originSupplierId !== supplierToDelete.id));

    return { previousSuppliers, previousRoutes };
  };

  const onErrorSupplierDelete = (err: string, variables: any, context: any) => {
    if (context?.previousSuppliers) setSuppliers(context.previousSuppliers);
    if (context?.previousRoutes) setRoutes(context.previousRoutes);
  };

  const onSettledSupplierDelete = () => {
    refetchSuppliers();
    refetchRoutes();
  };

  // Facility Optimistic Callbacks
  const onMutateFacilityCreate = (newFacility: any) => {
    const previousFacilities = facilities;
    const tempId = `temp-facility-${Date.now()}`;
    const optimisticFacility: FacilityRecord = {
      id: tempId,
      name: newFacility.name || 'New Facility',
      type: newFacility.type || null,
      location: newFacility.location || null,
      latitude: newFacility.latitude ? Number(newFacility.latitude) : null,
      longitude: newFacility.longitude ? Number(newFacility.longitude) : null,
    };
    setFacilities((prev) => [...prev, optimisticFacility]);
    return { previousFacilities };
  };

  const onErrorFacilityCreate = (err: string, variables: any, context: any) => {
    if (context?.previousFacilities) {
      setFacilities(context.previousFacilities);
    }
  };

  const onSettledFacilityCreate = () => {
    refetchFacilities();
  };

  const onMutateFacilityDelete = (facilityToDelete: FacilityRecord) => {
    const previousFacilities = facilities;
    const previousRoutes = routes;

    setFacilities((prev) => prev.filter((f) => f.id !== facilityToDelete.id));
    setRoutes((prev) =>
      prev.filter((r) => r.destinationId !== facilityToDelete.id && r.originFacilityId !== facilityToDelete.id)
    );

    return { previousFacilities, previousRoutes };
  };

  const onErrorFacilityDelete = (err: string, variables: any, context: any) => {
    if (context?.previousFacilities) setFacilities(context.previousFacilities);
    if (context?.previousRoutes) setRoutes(context.previousRoutes);
  };

  const onSettledFacilityDelete = () => {
    refetchFacilities();
    refetchRoutes();
  };

  // Route Optimistic Callbacks
  const onMutateRouteCreate = (newRoute: any) => {
    const previousRoutes = routes;
    const tempId = `temp-route-${Date.now()}`;

    const originSupplier = suppliers.find((s) => s.id === newRoute.originSupplierId);
    const originFacility = facilities.find((f) => f.id === newRoute.originFacilityId);
    const destination = facilities.find((f) => f.id === newRoute.destinationId);

    const optimisticRoute: RouteRecord = {
      id: tempId,
      originSupplierId: newRoute.originSupplierId || null,
      originFacilityId: newRoute.originFacilityId || null,
      destinationId: newRoute.destinationId,
      mode: newRoute.mode,
      distanceKm: Number(newRoute.distanceKm),
      originSupplier: originSupplier || null,
      originFacility: originFacility || null,
      destination: destination || undefined,
    };
    setRoutes((prev) => [...prev, optimisticRoute]);
    return { previousRoutes };
  };

  const onErrorRouteCreate = (err: string, variables: any, context: any) => {
    if (context?.previousRoutes) {
      setRoutes(context.previousRoutes);
    }
  };

  const onSettledRouteCreate = () => {
    refetchRoutes();
  };

  const onMutateRouteDelete = (routeToDelete: RouteRecord) => {
    const previousRoutes = routes;
    setRoutes((prev) => prev.filter((r) => r.id !== routeToDelete.id));
    return { previousRoutes };
  };

  const onErrorRouteDelete = (err: string, variables: any, context: any) => {
    if (context?.previousRoutes) {
      setRoutes(context.previousRoutes);
    }
  };

  const onSettledRouteDelete = () => {
    refetchRoutes();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Supply-Chain Builder</h1>
        <p className="text-sm text-muted-foreground">Add nodes and routes one at a time, and watch the graph update.</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <SupplyChainGraph suppliers={suppliers} facilities={facilities} routes={routes} />
        </CardContent>
      </Card>

      <Tabs defaultValue="supplier">
        <TabsList>
          <TabsTrigger value="supplier">Add supplier</TabsTrigger>
          <TabsTrigger value="facility">Add facility</TabsTrigger>
          <TabsTrigger value="route">Add route</TabsTrigger>
        </TabsList>

        <TabsContent value="supplier">
          <div className="grid gap-6 lg:grid-cols-2">
            <EntityForm
              title="Supplier"
              apiEndpoint="/api/suppliers"
              fields={SUPPLIER_FIELDS}
              payloadKey="suppliers"
              onCreated={refetchSuppliers}
              onMutate={onMutateSupplierCreate}
              onError={onErrorSupplierCreate}
              onSettled={onSettledSupplierCreate}
            />
            <ManageList
              title="Existing suppliers"
              noun="supplier"
              emptyText="No suppliers yet. Add one to get started."
              items={suppliers}
              describe={(s) => s.name}
              deleteUrl={(s) => `/api/suppliers/${s.id}`}
              onDeleted={() => {
                refetchSuppliers();
                refetchRoutes();
              }}
              onMutate={onMutateSupplierDelete}
              onError={onErrorSupplierDelete}
              onSettled={onSettledSupplierDelete}
            />
          </div>
        </TabsContent>

        <TabsContent value="facility">
          <div className="grid gap-6 lg:grid-cols-2">
            <EntityForm
              title="Facility"
              apiEndpoint="/api/facilities"
              fields={FACILITY_FIELDS}
              payloadKey="facilities"
              onCreated={refetchFacilities}
              onMutate={onMutateFacilityCreate}
              onError={onErrorFacilityCreate}
              onSettled={onSettledFacilityCreate}
            />
            <ManageList
              title="Existing facilities"
              noun="facility"
              emptyText="No facilities yet. Add one to get started."
              items={facilities}
              describe={(f) => f.name}
              deleteUrl={(f) => `/api/facilities/${f.id}`}
              onDeleted={() => {
                refetchFacilities();
                refetchRoutes();
              }}
              onMutate={onMutateFacilityDelete}
              onError={onErrorFacilityDelete}
              onSettled={onSettledFacilityDelete}
            />
          </div>
        </TabsContent>

        <TabsContent value="route">
          <div className="grid gap-6 lg:grid-cols-2">
            <AddRouteForm
              suppliers={suppliers}
              facilities={facilities}
              onCreated={refetchRoutes}
              onMutate={onMutateRouteCreate}
              onError={onErrorRouteCreate}
              onSettled={onSettledRouteCreate}
            />
            <ManageList
              title="Existing routes"
              noun="route"
              emptyText="No routes yet. Add one to get started."
              items={routes}
              describe={describeRoute}
              deleteUrl={(r) => `/api/routes/${r.id}`}
              onDeleted={refetchRoutes}
              onMutate={onMutateRouteDelete}
              onError={onErrorRouteDelete}
              onSettled={onSettledRouteDelete}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function describeRoute(route: RouteRecord): string {
  const origin = route.originSupplier?.name ?? route.originFacility?.name ?? 'Unknown origin';
  const destination = route.destination?.name ?? 'Unknown destination';
  return `${origin} → ${destination} · ${route.mode} · ${route.distanceKm}km`;
}

function AddRouteForm({
  suppliers,
  facilities,
  onCreated,
  onMutate,
  onError,
  onSettled,
}: {
  suppliers: SupplierRecord[];
  facilities: FacilityRecord[];
  onCreated: () => void;
  onMutate?: (variables: any) => Promise<unknown> | unknown;
  onError?: (error: string, variables: any, context: unknown) => void;
  onSettled?: (data: any, error: string | null, variables: any, context: unknown) => void;
}) {
  const { toast } = useToast();
  const [originType, setOriginType] = React.useState<'supplier' | 'facility'>('supplier');
  const [originId, setOriginId] = React.useState('');
  const [destinationId, setDestinationId] = React.useState('');
  const [mode, setMode] = React.useState<'TRUCK' | 'RAIL' | 'AIR' | 'SEA' | 'OTHER'>('TRUCK');
  const [distanceKm, setDistanceKm] = React.useState('');

  const { mutate: createRoute, isLoading: isSubmitting } = useMutation({
    url: '/api/routes',
    method: 'POST',
    onMutate: async (variables) => {
      return await onMutate?.((variables as any)?.routes?.[0]);
    },
    onSuccess: () => {
      toast.success('Route added');
      setOriginId('');
      setDestinationId('');
      setDistanceKm('');
      onCreated();
    },
    onError: (err, variables, context) => {
      toast.error('Could not add route', err);
      onError?.(err, (variables as any)?.routes?.[0], context);
    },
    onSettled: (data, errorMsg, variables, context) => {
      onSettled?.(data, errorMsg, (variables as any)?.routes?.[0], context);
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originId || !destinationId || !distanceKm) {
      toast.error('Fill in all fields');
      return;
    }
    await createRoute({
      routes: [
        {
          originSupplierId: originType === 'supplier' ? originId : undefined,
          originFacilityId: originType === 'facility' ? originId : undefined,
          destinationId,
          mode,
          distanceKm: Number(distanceKm),
        },
      ],
    });
  };

  if (suppliers.length === 0 && facilities.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="No suppliers or facilities yet"
        description="Add at least one supplier or facility in the tabs above before creating routes."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">New route</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Origin type</Label>
            <Select value={originType} onValueChange={(v) => { setOriginType(v as 'supplier' | 'facility'); setOriginId(''); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="facility">Facility</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Origin</Label>
            <Select value={originId} onValueChange={setOriginId}>
              <SelectTrigger><SelectValue placeholder="Select origin" /></SelectTrigger>
              <SelectContent>
                {(originType === 'supplier' ? suppliers : facilities).map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Destination facility</Label>
            <Select value={destinationId} onValueChange={setDestinationId}>
              <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
              <SelectContent>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Transport mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TRUCK">Truck</SelectItem>
                <SelectItem value="RAIL">Rail</SelectItem>
                <SelectItem value="AIR">Air</SelectItem>
                <SelectItem value="SEA">Sea</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="Distance (km)" value={distanceKm} onChange={setDistanceKm} type="number" />
          <Button type="submit" disabled={isSubmitting} className="sm:col-span-2 sm:w-fit">
            {isSubmitting ? 'Adding\u2026' : 'Add route'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
