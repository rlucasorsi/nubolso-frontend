import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const isValidDsn = typeof dsn === 'string' && dsn.startsWith('https://') && dsn.includes('@');

Sentry.init({
  dsn: isValidDsn ? dsn : undefined,
  enabled: isValidDsn,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: 0.2,
  enableLogs: true,
  tracePropagationTargets: ['localhost', /^https:\/\/nubolso\.com/],
  dataCollection: {
    userInfo: false,
  },
});
