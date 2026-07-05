'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

interface EntityField {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  spanFull?: boolean;
}

interface EntityFormProps {
  title: string;
  apiEndpoint: string;
  fields: EntityField[];
  payloadKey: string;
  onCreated: () => void;
}

export function EntityForm({ title, apiEndpoint, fields, payloadKey, onCreated }: EntityFormProps) {
  const { toast } = useToast();
  const initialForm = Object.fromEntries(fields.map((f) => [f.key, '']));
  const [form, setForm] = React.useState<Record<string, string>>(initialForm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.latitude && form.latitude.trim() !== '') {
      const lat = Number(form.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        toast.error('Validation Error', 'Latitude must be a valid number between -90 and 90');
        return;
      }
    }
    if (form.longitude && form.longitude.trim() !== '') {
      const lng = Number(form.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        toast.error('Validation Error', 'Longitude must be a valid number between -180 and 180');
        return;
      }
    }

    setIsSubmitting(true);

    const body = Object.fromEntries(
      Object.entries(form).map(([key, value]) => {
        if (key === 'latitude' || key === 'longitude') {
          return [key, value ? Number(value) : undefined];
        }
        return [key, value];
      })
    );

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [payloadKey]: [body] }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        toast.error(
          `Could not add ${title.toLowerCase()}`,
          json.error ?? 'Something went wrong. Please try again.'
        );
        return;
      }

      toast.success(`${title} added`, form.name || form[fields[0]?.key]);
      setForm(initialForm);
      onCreated();
    } catch {
      toast.error(
        `Could not add ${title.toLowerCase()}`,
        'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const setValue = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">New {title.toLowerCase()}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.spanFull ? 'sm:col-span-2' : ''}>
              <Field
                label={field.label}
                value={form[field.key]}
                onChange={(v) => setValue(field.key, v)}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
              />
            </div>
          ))}
          <Button type="submit" disabled={isSubmitting} className="sm:col-span-2 sm:w-fit">
            {isSubmitting ? 'Adding\u2026' : `Add ${title.toLowerCase()}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function Field({
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
