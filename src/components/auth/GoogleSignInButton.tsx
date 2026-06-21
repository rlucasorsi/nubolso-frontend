'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from '@/i18n/useTranslations';
import { useLanguage } from '@/i18n/LanguageContext';
import { authService } from '@/services/auth';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export function GoogleSignInButton() {
  const t = useTranslations('auth');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useLanguage();

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="flex justify-center [&>div]:w-full">
      <GoogleLogin
        theme="filled_black"
        shape="pill"
        size="large"
        text="continue_with"
        locale={locale === 'pt-BR' ? 'pt-BR' : locale === 'es' ? 'es' : 'en'}
        onSuccess={async (credentialResponse) => {
          if (!credentialResponse.credential) {
            toast.error(t('googleError'));
            return;
          }

          try {
            await authService.googleLogin({ idToken: credentialResponse.credential });
            // Clear any stale cache from a previous session on this tab so this
            // user never sees the prior account's entries/cards/recurring data.
            queryClient.clear();
            toast.success(t('welcome'));
            router.push('/dashboard');
          } catch (error) {
            toast.error(extractErrorMessage(error, t('googleLoginError')));
          }
        }}
        onError={() => {
          toast.error(t('googleError'));
        }}
      />
    </div>
  );
}
