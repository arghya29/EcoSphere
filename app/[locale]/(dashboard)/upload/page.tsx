'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UploadForm } from '@/components/upload/upload-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Info } from 'lucide-react';

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Upload data</h1>
        <p className="text-sm text-muted-foreground">
          Import your suppliers, facilities, and activity data. We&apos;ll show a preview before
          anything is saved.
        </p>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="flex items-start gap-3 py-4 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="text-muted-foreground">
            <p className="font-medium text-foreground">Before you start</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>Download a template for the correct column format</li>
              <li>Use the Supply-Chain Builder to find entity IDs for linking</li>
              <li>Latitude and longitude are optional but improve map accuracy</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="suppliers">
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="activities">Activity data</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="flex flex-col gap-3">
          <TemplateLink href="/templates/suppliers-template.csv" label="suppliers-template.csv" />
          <UploadForm kind="suppliers" />
        </TabsContent>

        <TabsContent value="facilities" className="flex flex-col gap-3">
          <TemplateLink href="/templates/facilities-template.csv" label="facilities-template.csv" />
          <UploadForm kind="facilities" />
        </TabsContent>

        <TabsContent value="activities" className="flex flex-col gap-3">
          <TemplateLink href="/templates/activities-template.csv" label="activities-template.csv" />
          <p className="text-xs text-muted-foreground">
            Use a <code className="font-mono-data">factor_category</code> from your emission factors
            (e.g. <code className="font-mono-data">diesel</code>,{' '}
            <code className="font-mono-data">electricity_UK-grid</code>,{' '}
            <code className="font-mono-data">air_freight</code>). Link a row to a facility, route,
            or supplier by ID where relevant — you can find IDs on the Supply-Chain Builder page.
          </p>
          <UploadForm kind="activities" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline" size="sm" className="self-start">
      <a href={href} download>
        <Download className="h-4 w-4" aria-hidden="true" />
        Download {label}
      </a>
    </Button>
  );
}
