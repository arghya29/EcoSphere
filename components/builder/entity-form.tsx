'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/ToastProvider';
import { useMutation } from '@/hooks/use-mutation';

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
  onMutate?: (variables: any) => Promise<unknown> | unknown;
  onError?: (error: string, variables: any, context: unknown) => void;
  onSettled?: (data: any, error: string | null, variables: any, context: unknown) => void;
}

export function EntityForm({
  title,
  apiEndpoint,
  fields,
  payloadKey,
  onCreated,
  onMutate,
  onError,
  onSettled,
}: EntityFormProps) {
  const { toast } = useToast();
  const initialForm = Object.fromEntries(fields.map((f) => [f.key, '']));
  const [form, setForm] = React.useState<Record<string, string>>(initialForm);

  const { mutate: createEntity, isLoading: isSubmitting } = useMutation({
    url: apiEndpoint,
    method: 'POST',
    onMutate: async (variables) => {
      return await onMutate?.((variables as any)?.[payloadKey]?.[0]);
    onMutate: async (variables: any) => {
      return await onMutate?.(variables?.[payloadKey]?.[0]);
    },
    onSuccess: () => {
      toast.success(`${title} added`, form.name || form[fields[0]?.key]);
      setForm(initialForm);
      onCreated();
    },
    onError: (errorMsg, variables, context) => {
    onError: (errorMsg, variables: any, context) => {
      toast.error(
        `Could not add ${title.toLowerCase()}`,
        errorMsg ?? 'Something went wrong. Please try again.'
      );
      onError?.(errorMsg, (variables as any)?.[payloadKey]?.[0], context);
    },
    onSettled: (data, errorMsg, variables, context) => {
      onSettled?.(data, errorMsg, (variables as any)?.[payloadKey]?.[0], context);
      onError?.(errorMsg, variables?.[payloadKey]?.[0], context);
    },
    onSettled: (data, errorMsg, variables: any, context) => {
      onSettled?.(data, errorMsg, variables?.[payloadKey]?.[0], context);
    },
  });

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

    const body = Object.fromEntries(
      Object.entries(form).map(([key, value]) => {
        if (key === 'latitude' || key === 'longitude') {
          return [key, value ? Number(value) : undefined];
        }
        return [key, value];
      })
    );

    await createEntity({ [payloadKey]: [body] });
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
