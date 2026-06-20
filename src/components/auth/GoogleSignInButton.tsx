'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { authService } from '@/services/auth';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export function GoogleSignInButton() {
  const t = useTranslations('auth');
  const router = useRouter();
  const locale = useLocale();

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
            toast.success(t('welcome'));
            router.push(`/${locale}/dashboard`);
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
