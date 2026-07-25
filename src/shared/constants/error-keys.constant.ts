export const ERROR_KEYS = {
  AN_ERROR_OCCURED: 'Ocorreu um erro',
  UNAUTHORIZED: 'Não autorizado',
  SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
};

// Server Actions can only pass a plain `message` string back to the client
// (thrown errors are re-wrapped, and `{ success: false }` results never
// reject at all), so this is the one signal that reliably survives the
// server -> client boundary for every action in the codebase. Compares by
// prefix because callers pass the message through `extractErrorMessage`,
// which trims a trailing period.
export function isSessionExpiredMessage(message?: string | null): boolean {
  if (!message) return false;
  return message.startsWith('Sua sessão expirou');
}
