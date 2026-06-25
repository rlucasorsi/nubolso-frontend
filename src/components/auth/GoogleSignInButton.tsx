'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from '@/i18n/useTranslations';
import { useLanguage } from '@/i18n/LanguageContext';
import { authService } from '@/services/auth';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export function GoogleSignInButton() {
  const t = useTranslations('auth');
  const router = useRouter();
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
        // Safari (iOS) blocks third-party cookies by default, which can make Google's
        // SDK fall back to a redirect that POSTs the credential as a real form
        // submission instead of calling onSuccess. FedCM/popup reduce how often that
        // happens; login_uri gives the fallback itself a real handler to land on.
        ux_mode="popup"
        use_fedcm_for_button
        login_uri="/auth/google-callback"
        onSuccess={async (credentialResponse) => {
          if (!credentialResponse.credential) {
            toast.error(t('googleError'));
            return;
          }

          try {
            await authService.googleLogin({ idToken: credentialResponse.credential });
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
