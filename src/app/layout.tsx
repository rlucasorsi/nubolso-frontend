import '@/index.css';
import { Providers } from './providers';
import { LanguageProvider } from '@/i18n/LanguageContext';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

const BASE_URL = 'https://nubolso.com';
const APP_NAME = 'NuBolso';
const APP_DESCRIPTION =
  'Controle financeiro pessoal. Registre entradas e saídas, acompanhe faturas de cartão, crie metas e visualize projeções de saldo.';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${APP_NAME} — Controle Financeiro Pessoal`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    'controle financeiro',
    'finanças pessoais',
    'orçamento',
    'cartão de crédito',
    'metas financeiras',
  ],
  authors: [{ name: APP_NAME, url: BASE_URL }],
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/logo.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/logo.png',
  },
  openGraph: {
    title: `${APP_NAME} — Controle Financeiro Pessoal`,
    description: APP_DESCRIPTION,
    type: 'website',
    locale: 'pt_BR',
    siteName: APP_NAME,
    url: BASE_URL,
    images: [{ url: '/logo.png', width: 512, height: 512, alt: APP_NAME }],
  },
  twitter: {
    card: 'summary',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ['/logo.png'],
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#1e1b26',
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    url: BASE_URL,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
  },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <LanguageProvider>
          <Providers>{children}</Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}
