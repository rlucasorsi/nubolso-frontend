// Next.js sanitizes Server Action errors in production and adds a `digest` property.
// The sanitized message is never useful — always fall back to a user-friendly string.
function isNextjsSanitizedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const err = error as Record<string, any>;
  if ('digest' in err) return true;
  if (typeof err.message === 'string' && err.message.includes('Server Components render')) return true;
  return false;
}

export function extractErrorMessage(error: unknown, fallback = 'Erro interno do servidor'): string {
  try {
    const cleanMessage = (msg: string) => msg.trim().replace(/\.+$/, '');

    if (isNextjsSanitizedError(error)) return fallback;

    if (typeof error === 'string') {
      return cleanMessage(error);
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, any>;

      // NestJS error response body: { statusCode, message, error }
      // `message` may be a single string or an array of validation messages.
      const data = err.data ?? err.response?.data;

      if (data) {
        if (Array.isArray(data.message) && typeof data.message[0] === 'string') {
          return cleanMessage(data.message[0]);
        }

        if (typeof data.message === 'string' && data.message.trim()) {
          return cleanMessage(data.message);
        }

        if (typeof data.error === 'string' && data.error.trim()) {
          return cleanMessage(data.error);
        }
      }

      if (typeof err.message === 'string' && err.message.trim()) {
        return cleanMessage(err.message);
      }

      if (Array.isArray(err.errors) && typeof err.errors[0]?.message === 'string') {
        return cleanMessage(err.errors[0].message);
      }
    }

    if (error instanceof Error && error.message) {
      return cleanMessage(error.message);
    }

    return fallback;
  } catch {
    return fallback;
  }
}
