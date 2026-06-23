import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const isValidDsn = typeof dsn === 'string' && dsn.startsWith('https://') && dsn.includes('@');

Sentry.init({
  dsn: isValidDsn ? dsn : undefined,
  tracesSampleRate: 0.2,
  enabled: isValidDsn,
});
