'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/auth';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { useCooldown } from '@/hooks/useCooldown';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const cooldown = useCooldown(60);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6 || loading) return;
    setLoading(true);

    try {
      await authService.verifyEmail({ email, code });
      toast.success('E-mail confirmado!');
      router.push('/painel');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Código inválido ou expirado.'));
      setCode('');
    } finally {
      setLoading(false);
    }
  }, [code, email, loading, router]);

  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleResend = async () => {
    if (cooldown.isActive) return;

    try {
      await authService.resendCode({ email });
      toast.success('Enviamos um novo código para o seu e-mail.');
      cooldown.start();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Erro ao reenviar o código.'));
    }
  };

  return (
    <main className="relative flex h-dvh items-center justify-center px-4 overflow-hidden">
      {/* Decorative glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl"
        style={{ background: 'var(--gradient-primary)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[26rem] w-[26rem] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, oklch(0.72 0.2 310) 0%, transparent 70%)',
        }}
      />

      <section className="relative w-full max-w-md">
        <div className="glass-card shadow-card-elegant rounded-3xl px-7 py-6 sm:px-10 sm:py-8">
          {/* Brand */}
          <div className="flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <Mail className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Confirme seu e-mail</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {email ? (
                <>
                  Enviamos um código de 6 dígitos para{' '}
                  <span className="font-medium text-foreground">{email}</span>.
                </>
              ) : (
                'Informe o código de 6 dígitos enviado para o seu e-mail.'
              )}
            </p>
          </div>

          {!email ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Não encontramos o e-mail para confirmar.{' '}
              <Link href="/register" className="font-semibold text-brand-gradient hover:opacity-80">
                Criar conta
              </Link>
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
              }}
              className="mt-6 space-y-4"
            >
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 text-lg font-semibold text-foreground"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="bg-gradient-primary shadow-glow h-12 w-full rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? 'Confirmando...' : 'Confirmar'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown.isActive}
                className="w-full text-center text-sm font-medium text-brand-gradient transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cooldown.isActive ? `Reenviar código (${cooldown.remaining}s)` : 'Reenviar código'}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Errou o e-mail?{' '}
                <Link href="/register" className="font-semibold text-brand-gradient hover:opacity-80">
                  Alterar e-mail
                </Link>
              </p>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-brand-gradient hover:opacity-80">
              Voltar para o login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
