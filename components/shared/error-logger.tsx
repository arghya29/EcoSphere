'use client';

import * as React from 'react';

function reportClientError(payload: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') return;
  console.error('[EcoSphere Client Error]', payload);
}

export function ErrorLogger() {
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      reportClientError({
        type: 'error',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });

      if (process.env.NODE_ENV === 'development') {
        console.group('[EcoSphere Error]');
        console.error('Message:', event.message);
        console.error('Source:', event.filename);
        console.error('Line:', event.lineno);
        console.groupEnd();
      }
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      reportClientError({
        type: 'unhandledrejection',
        reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      });

      if (process.env.NODE_ENV === 'development') {
        console.group('[EcoSphere Unhandled Promise Rejection]');
        console.error('Reason:', event.reason);
        console.groupEnd();
      }
    };

    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  return null;
}
