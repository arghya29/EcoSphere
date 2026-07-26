'use client';

import * as React from 'react';

interface LiveRegionContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const LiveRegionContext = React.createContext<LiveRegionContextValue | null>(null);

export function useAnnouncer() {
  const ctx = React.useContext(LiveRegionContext);
  if (!ctx) {
    throw new Error('useAnnouncer must be used within a LiveRegionProvider');
  }
  return ctx;
}

export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = React.useState('');
  const [assertiveMessage, setAssertiveMessage] = React.useState('');
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const announce = React.useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (priority === 'assertive') {
        setAssertiveMessage(message);
        timerRef.current = setTimeout(() => setAssertiveMessage(''), 3000);
      } else {
        setPoliteMessage(message);
        timerRef.current = setTimeout(() => setPoliteMessage(''), 3000);
      }
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {politeMessage}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
}
