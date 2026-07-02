'use client';

import * as React from 'react';

export function ErrorLogger() {
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (process.env.NODE_ENV === 'development') {
        console.group('[EcoSphere Error]');
        console.error('Message:', event.message);
        console.error('Source:', event.filename);
        console.error('Line:', event.lineno);
        console.groupEnd();
      }
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
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
