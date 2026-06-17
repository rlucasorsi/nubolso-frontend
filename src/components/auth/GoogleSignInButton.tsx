'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/services/auth';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export function GoogleSignInButton() {
  const router = useRouter();

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
        locale="pt-BR"
        onSuccess={async (credentialResponse) => {
          if (!credentialResponse.credential) {
            toast.error('Não foi possível continuar com o Google.');
            return;
          }

          try {
            await authService.googleLogin({ idToken: credentialResponse.credential });
            toast.success('Bem-vindo!');
            router.push('/painel');
          } catch (error) {
            toast.error(extractErrorMessage(error, 'Erro ao continuar com o Google.'));
          }
        }}
        onError={() => {
          toast.error('Não foi possível continuar com o Google.');
        }}
      />
    </div>
  );
}
