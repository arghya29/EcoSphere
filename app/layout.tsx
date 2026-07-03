import type { Metadata } from 'next';
import { Inter, Lexend, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { AuthSessionProvider } from '@/components/shared/session-provider';
import { SkipToContent } from '@/components/shared/skip-to-content';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { THEME_INIT_SCRIPT } from '@/components/shared/theme-script';

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
    <html lang="en" className={`${inter.variable} ${lexend.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
      </head>
      <body className="font-sans">
        <SkipToContent />
        <AuthSessionProvider>
          <ThemeProvider>
            <ToastProvider>
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>
            </ToastProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
