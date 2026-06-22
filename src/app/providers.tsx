'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CookieConsent } from '@/components/CookieConsent';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Inicializamos o QueryClient no estado para garantir que os dados não
  // sejam compartilhados entre diferentes usuários e requisições no caso de SSR
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2,
            gcTime: 1000 * 60 * 10,
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      }),
  );
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
