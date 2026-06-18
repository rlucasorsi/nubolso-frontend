import type { NextConfig } from 'next';
import path from 'path';

const securityHeaders = [
  // Prevent browsers from MIME-sniffing the Content-Type
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Block the app from being embedded in iframes (clickjacking protection)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Don't send the full URL in the Referer header to third parties
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict access to browser features we don't use
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Enforce HTTPS for 1 year once the site is visited over HTTPS (production only)
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turbopack alias (@/ → src/) — Next.js 16 default is Turbopack
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
