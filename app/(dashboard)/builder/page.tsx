'use client';

import * as React from 'react';
import { useApi } from '@/hooks/use-api';
import { SupplyChainGraph } from '@/components/graph/supply-chain-graph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import type { SupplierRecord, FacilityRecord, RouteRecord } from '@/types/api';

export default function BuilderPage() {
  const { data: suppliers, refetch: refetchSuppliers } = useApi<SupplierRecord[]>('/api/suppliers');
  const { data: facilities, refetch: refetchFacilities } = useApi<FacilityRecord[]>('/api/facilities');
  const { data: routes, refetch: refetchRoutes } = useApi<RouteRecord[]>('/api/routes');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Supply-Chain Builder</h1>
        <p className="text-sm text-muted-foreground">Add nodes and routes one at a time, and watch the graph update.</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <SupplyChainGraph suppliers={suppliers ?? []} facilities={facilities ?? []} routes={routes ?? []} />
        </CardContent>
      </Card>

      <Tabs defaultValue="supplier">
        <TabsList>
          <TabsTrigger value="supplier">Add supplier</TabsTrigger>
          <TabsTrigger value="facility">Add facility</TabsTrigger>
          <TabsTrigger value="route">Add route</TabsTrigger>
        </TabsList>
        <TabsContent value="supplier">
          <AddSupplierForm onCreated={refetchSuppliers} />
        </TabsContent>
        <TabsContent value="facility">
          <AddFacilityForm onCreated={refetchFacilities} />
        </TabsContent>
        <TabsContent value="route">
          <AddRouteForm suppliers={suppliers ?? []} facilities={facilities ?? []} onCreated={refetchRoutes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AddSupplierForm({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({ name: '', location: '', category: '', latitude: '', longitude: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suppliers: [{ ...form, latitude: form.latitude || undefined, longitude: form.longitude || undefined }] }),
    });
    const json = await res.json();
    setIsSubmitting(false);
    if (!res.ok || !json.success) {
      toast({ title: 'Could not add supplier', description: json.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Supplier added', description: form.name });
    setForm({ name: '', location: '', category: '', latitude: '', longitude: '' });
    onCreated();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">New supplier</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <div className="flex gap-2">
            <Field label="Latitude" value={form.latitude} onChange={(v) => setForm({ ...form, latitude: v })} type="number" />
            <Field label="Longitude" value={form.longitude} onChange={(v) => setForm({ ...form, longitude: v })} type="number" />
          </div>
          <Button type="submit" disabled={isSubmitting} className="sm:col-span-2 sm:w-fit">
            {isSubmitting ? 'Adding…' : 'Add supplier'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AddFacilityForm({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({ name: '', type: '', location: '', latitude: '', longitude: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await fetch('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilities: [{ ...form, latitude: form.latitude || undefined, longitude: form.longitude || undefined }] }),
    });
    const json = await res.json();
    setIsSubmitting(false);
    if (!res.ok || !json.success) {
      toast({ title: 'Could not add facility', description: json.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Facility added', description: form.name });
    setForm({ name: '', type: '', location: '', latitude: '', longitude: '' });
    onCreated();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">New facility</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} placeholder="Manufacturing, Storage…" />
          <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <div className="flex gap-2">
            <Field label="Latitude" value={form.latitude} onChange={(v) => setForm({ ...form, latitude: v })} type="number" />
            <Field label="Longitude" value={form.longitude} onChange={(v) => setForm({ ...form, longitude: v })} type="number" />
          </div>
          <Button type="submit" disabled={isSubmitting} className="sm:col-span-2 sm:w-fit">
            {isSubmitting ? 'Adding…' : 'Add facility'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AddRouteForm({
  suppliers,
  facilities,
  onCreated,
}: {
  suppliers: SupplierRecord[];
  facilities: FacilityRecord[];
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [originType, setOriginType] = React.useState<'supplier' | 'facility'>('supplier');
  const [originId, setOriginId] = React.useState('');
  const [destinationId, setDestinationId] = React.useState('');
  const [mode, setMode] = React.useState<'TRUCK' | 'RAIL' | 'AIR' | 'SEA' | 'OTHER'>('TRUCK');
  const [distanceKm, setDistanceKm] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originId || !destinationId || !distanceKm) {
      toast({ title: 'Fill in all fields', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const res = await fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routes: [
          {
            originSupplierId: originType === 'supplier' ? originId : undefined,
            originFacilityId: originType === 'facility' ? originId : undefined,
            destinationId,
            mode,
            distanceKm: Number(distanceKm),
          },
        ],
      }),
    });
    const json = await res.json();
    setIsSubmitting(false);
    if (!res.ok || !json.success) {
      toast({ title: 'Could not add route', description: json.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Route added' });
    setOriginId('');
    setDestinationId('');
    setDistanceKm('');
    onCreated();
  };

  if (suppliers.length === 0 && facilities.length === 0) {
    return <p className="text-sm text-muted-foreground">Add at least one supplier or facility before creating routes.</p>;
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
            {isSubmitting ? 'Adding…' : 'Add route'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} />
    </div>
  );
}
