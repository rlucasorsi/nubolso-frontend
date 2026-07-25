'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CookieConsent } from '@/components/CookieConsent';
import { useState } from 'react';
import { isSessionExpiredMessage } from '@/shared/constants/error-keys.constant';

// Server Actions never surface a 401 as an HTTP status on the client — by the
// time an expired session reaches here it's either a thrown Error (queries,
// via QueryCache) or a `{ success: false, message }` result that resolved
// normally (mutations, via MutationCache — most module actions swallow their
// own errors and return this shape instead of rejecting). Checking both
// callbacks here is the one place that covers every module without having
// to touch each action/hook individually.
function isSessionExpiredResult(result: unknown): boolean {
  if (result instanceof Error) return isSessionExpiredMessage(result.message);

  if (typeof result === 'object' && result !== null) {
    const r = result as Record<string, unknown>;
    if (r.success === false && typeof r.message === 'string') {
      return isSessionExpiredMessage(r.message);
    }
  }

  return false;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Inicializamos o QueryClient no estado para garantir que os dados não
  // sejam compartilhados entre diferentes usuários e requisições no caso de SSR
  const [queryClient] = useState(() => {
    const handleSessionExpired = (result: unknown) => {
      if (!isSessionExpiredResult(result)) return;
      if (typeof window === 'undefined' || window.location.pathname === '/login') return;

      client.clear();
      window.location.href = '/login';
    };

    const client = new QueryClient({
      queryCache: new QueryCache({ onError: handleSessionExpired }),
      mutationCache: new MutationCache({
        onError: handleSessionExpired,
        onSuccess: handleSessionExpired,
      }),
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 2,
          gcTime: 1000 * 60 * 10,
          refetchOnWindowFocus: false,
          retry: false,
        },
      },
    });

    return client;
  });
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const content = (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {children}
      <CookieConsent />
    </TooltipProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>
      ) : (
        content
      )}
    </QueryClientProvider>
  );
}
