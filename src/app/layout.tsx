import '@/index.css';
import { Providers } from './providers';
import { LanguageProvider } from '@/i18n/LanguageContext';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

const APP_NAME = 'NuBolso';
const APP_DESCRIPTION =
  'Controle financeiro pessoal. Registre entradas e saídas, acompanhe faturas de cartão, crie metas e visualize projeções de saldo.';

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: '/manifest.json',
  icons: { icon: '/logo.svg', apple: '/logo.svg' },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    type: 'website',
    locale: 'pt_BR',
    siteName: APP_NAME,
  },
  twitter: {
    card: 'summary',
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#1e1b26',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <Providers>{children}</Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}
