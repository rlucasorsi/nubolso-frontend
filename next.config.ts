import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turbopack alias (@/ → src/) — Next.js 16 default is Turbopack
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
};

export default nextConfig;
