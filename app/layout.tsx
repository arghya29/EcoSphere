import type { Metadata } from 'next';
import { Inter, Lexend, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { AuthSessionProvider } from '@/components/shared/session-provider';
import { ErrorLogger } from '@/components/shared/error-logger';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend', display: 'swap', weight: ['500', '600', '700'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'EcoSphere — Supply-Chain Carbon Intelligence',
  description:
    'Map your suppliers, routes, and facilities, then see exactly where Scope 1, 2, and 3 emissions originate in your supply chain.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lexend.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <AuthSessionProvider>
          <ToastProvider>
            {children}
            <ErrorLogger />
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
