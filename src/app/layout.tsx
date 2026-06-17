import '@/index.css';
import { Providers } from './providers';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Fluxo de Caixa',
  description: 'Sistema de controle de fluxo de caixa',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#1e1b26',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
