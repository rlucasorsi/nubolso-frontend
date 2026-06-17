export function getApiUrl(pathname = '/'): string {
  const isServer = typeof window === 'undefined';

  const baseUrl = isServer
    ? process.env.API_URL
    : process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error('API_URL não definida');
  }

  const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return `${normalizedBase}${cleanPath}`;
}