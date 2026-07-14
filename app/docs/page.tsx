'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DocsPage() {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    // Avoid loading if already loaded
    if (document.getElementById('swagger-ui-css')) {
      setLoaded(true);
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.id = 'swagger-ui-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css';
    document.head.appendChild(link);

    // Load Bundle Script
    const bundleScript = document.createElement('script');
    bundleScript.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js';
    bundleScript.charset = 'UTF-8';
    document.head.appendChild(bundleScript);

    // Load Preset Script
    const presetScript = document.createElement('script');
    presetScript.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js';
    presetScript.charset = 'UTF-8';
    document.head.appendChild(presetScript);

    bundleScript.onload = () => {
      const interval = setInterval(() => {
        if ((window as any).SwaggerUIBundle) {
          clearInterval(interval);
          (window as any).SwaggerUIBundle({
            url: '/api/docs',
            dom_id: '#swagger-ui',
            presets: [
              (window as any).SwaggerUIBundle.presets.apis,
              (window as any).SwaggerUIStandalonePreset,
            ],
            layout: 'BaseLayout',
            deepLinking: true,
          });
          setLoaded(true);
        }
      }, 50);
    };
  }, []);

  return (
    <div className="bg-[#fafafa] min-h-screen">
      {/* Premium API Docs Header */}
      <div className="bg-white border-b border-border py-4 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="font-display text-lg font-semibold text-foreground">Interactive API Explorer</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-full">
            OpenAPI 3.0
          </span>
        </div>
      </div>

      <div className="container mx-auto py-6 max-w-7xl">
        {!loaded && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Initializing interactive Swagger UI...</p>
          </div>
        )}
        {/* Swagger container */}
        <div className={loaded ? 'block bg-white rounded-lg border border-border shadow-sm p-4' : 'hidden'}>
          <div id="swagger-ui" />
        </div>
      </div>
    </div>
  );
}
