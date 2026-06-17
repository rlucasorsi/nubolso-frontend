import { COOKIE_KEYS } from '@/shared/constants/cookie-keys.constant';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import { getCookie, deleteCookie } from '@/shared/utils/cookies';
import { getApiUrl } from '@/shared/utils/get-api-url';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

const enum HttpMethod {
  POST = 'POST',
  GET = 'GET',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  PUT = 'PUT',
}

const enum ErrorMessages {
  UNHANDLED_ERROR = 'Erro não tratado na requisição',
}

const enum HeaderKeys {
  CONTENT_TYPE = 'Content-Type',
  AUTHORIZATION = 'Authorization',
}

const CONTENT_TYPE_JSON = 'application/json';

// Endpoints that legitimately return 401 on bad credentials (not an expired session)
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-code',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/google',
];

interface HttpRequestOptions extends RequestInit {
  includeToken?: boolean;
  params?: Record<string, any>;
}

export class HttpClient {
  public static get = <T, K extends Record<string, any> | undefined>(
    url: string,
    options?: HttpRequestOptions & { params?: K },
  ) => this.request<T, K>(url, HttpMethod.GET, options);

  public static post = <T, K>(url: string, data?: K, options?: HttpRequestOptions) =>
    this.request<T, K>(url, HttpMethod.POST, options, data);

  public static put = <T, K>(url: string, data: K, options?: HttpRequestOptions) =>
    this.request<T, K>(url, HttpMethod.PUT, options, data);

  public static patch = <T, K>(url: string, data: K, options?: HttpRequestOptions) =>
    this.request<T, K>(url, HttpMethod.PATCH, options, data);

  public static delete = <T>(url: string, options?: HttpRequestOptions) =>
    this.request<T, undefined>(url, HttpMethod.DELETE, options);

  public static deleteWithBody = <T, K>(url: string, data: K, options?: HttpRequestOptions) =>
    this.request<T, K>(url, HttpMethod.DELETE, { ...options, body: JSON.stringify(data) });

  private static async getHeaders(includeToken: boolean, customHeaders?: HeadersInit): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      [HeaderKeys.CONTENT_TYPE]: CONTENT_TYPE_JSON,
      ...(customHeaders as Record<string, string>),
    };

    if (includeToken) {
      const token = await getCookie(COOKIE_KEYS.ACCESS_TOKEN);
      if (token) {
        headers[HeaderKeys.AUTHORIZATION] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private static buildUrlWithParams(url: string, params?: Record<string, any>): string {
    if (!params) return url;

    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    return query ? `${url}?${query}` : url;
  }

  // The backend issues a single long-lived access token (no refresh token).
  // A 401 on an authenticated request means the session is gone — clear the
  // local token and send the user back to /login.
  private static async handleSessionExpired() {
    await deleteCookie(COOKIE_KEYS.ACCESS_TOKEN);

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private static async request<T, K>(
    url: string,
    method: HttpMethod,
    options: HttpRequestOptions = {},
    body?: K,
  ): Promise<T> {
    const apiUrl = getApiUrl(url);
    const { includeToken = true, params, ...fetchOptions } = options;
    const fullUrl = this.buildUrlWithParams(apiUrl, params);
    const headers = await this.getHeaders(includeToken, fetchOptions.headers);

    const requestInit: RequestInit = {
      method,
      headers,
      body: ['GET', 'DELETE'].includes(method) ? undefined : JSON.stringify(body),
      ...fetchOptions,
    };

    // Retry only GET requests on 500 — safe because GET is idempotent.
    // Mutations are never retried to avoid duplicate side-effects.
    // Total attempts = 1 initial + 2 retries = 3.
    const maxRetries = method === HttpMethod.GET ? 2 : 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        await new Promise<void>((r) => setTimeout(r, 1000 * attempt));
      }

      try {
        const response = await fetch(fullUrl, requestInit);

        if (!response.ok) {
          const responseData = await response.json().catch(() => ({}));
          const status = response.status;

          if (status === 500 && attempt < maxRetries) {
            this.logHttpError(`Request failed with 500, retrying (${attempt + 1}/${maxRetries})`, {
              url: fullUrl,
              method,
              status,
              params,
              error: responseData,
            });
            continue;
          }

          if (status === 401 && !AUTH_ENDPOINTS.includes(url)) {
            await this.handleSessionExpired();

            throw {
              status,
              sessionExpired: true,
              message: ERROR_KEYS.SESSION_EXPIRED,
              data: responseData,
            };
          }

          // AUTH_ENDPOINTS return expected 4xx for invalid credentials/codes —
          // already surfaced to the user via toast, so don't log as an error.
          if (!AUTH_ENDPOINTS.includes(url)) {
            this.logHttpError('Request failed', {
              url: fullUrl,
              method,
              status,
              params,
              error: responseData,
            });
          }

          throw { status, message: responseData.message, data: responseData };
        }

        const text = await response.text();

        if (!text) {
          return {} as T;
        }

        try {
          return JSON.parse(text) as T;
        } catch {
          return text as unknown as T;
        }
      } catch (error) {
        // Already classified and (if relevant) logged above — avoid double-logging.
        if (typeof error === 'object' && error !== null && ('sessionExpired' in error || 'status' in error)) {
          throw error;
        }

        if (attempt < maxRetries) {
          this.logHttpError(`Request threw, retrying (${attempt + 1}/${maxRetries})`, { url: fullUrl, method, params, error });
          continue;
        }

        this.logHttpError('Unhandled request error', { url: fullUrl, method, body, params, error });
        throw error;
      }
    }

    // Unreachable — loop always returns or throws. TypeScript needs this.
    throw new Error('Servidor temporariamente indisponível');
  }

  private static logHttpError(context: string, details: Record<string, any>) {
    const { error, url, ...rest } = details;

    let host: string | undefined;
    if (typeof url === 'string') {
      try {
        host = new URL(url).host;
      } catch {
        // invalid url - ignore
      }
    }

    const message = extractErrorMessage(error);
    const isProd = process.env.NODE_ENV === 'production';

    const normalizedError =
      error instanceof Error
        ? { message, ...(isProd ? {} : { stack: error.stack }) }
        : typeof error === 'object' && error !== null
          ? error
          : { error: String(error) };

    console.error(
      `[HttpClient] ${context}: ${message || ErrorMessages.UNHANDLED_ERROR}`,
      JSON.stringify({ ...rest, url, host, error: normalizedError }, null, 2),
    );
  }
}
