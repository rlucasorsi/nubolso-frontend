import * as Sentry from '@sentry/nextjs';

type LogExtra = Record<string, unknown>;

const isDev = process.env.NODE_ENV !== 'production';

function captureForSentry(
  level: 'warn' | 'error',
  message: string,
  extra?: LogExtra,
  err?: unknown,
) {
  if (level === 'error') {
    if (err instanceof Error) {
      Sentry.captureException(err, { extra });
    } else {
      const fullExtra = err !== undefined ? { ...extra, err } : extra;
      Sentry.captureMessage(message, { level: 'error', extra: fullExtra });
    }
  } else {
    Sentry.addBreadcrumb({ level: 'warning', message, data: extra });
  }
}

export const logger = {
  debug(message: string, extra?: LogExtra) {
    if (isDev) {
      console.debug(`[debug] ${message}`, extra);
    }
    Sentry.logger.debug(message, extra);
  },

  info(message: string, extra?: LogExtra) {
    if (isDev) {
      console.info(`[info] ${message}`, extra);
    }
    Sentry.logger.info(message, extra);
  },

  warn(message: string, extra?: LogExtra) {
    console.warn(`[warn] ${message}`, extra);
    Sentry.logger.warn(message, extra);
    captureForSentry('warn', message, extra);
  },

  error(message: string, extra?: LogExtra & { err?: unknown }) {
    const { err, ...rest } = extra ?? {};
    console.error(`[error] ${message}`, extra);
    Sentry.logger.error(message, rest);
    captureForSentry('error', message, rest, err);
  },
};
