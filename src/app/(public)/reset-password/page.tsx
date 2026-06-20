'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from '@/i18n/useTranslations';
import { authService } from '@/services/auth';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { useCooldown } from '@/hooks/useCooldown';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { resetPasswordSchema } from '@/lib/schemas/auth';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ code?: string; password?: string; confirmPassword?: string }>({});
  const cooldown = useCooldown(60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = resetPasswordSchema.safeParse({ code, password, confirmPassword });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setFieldErrors({ code: errs.code?.[0], password: errs.password?.[0], confirmPassword: errs.confirmPassword?.[0] });
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      await authService.resetPassword({ email, code, newPassword: password });
      toast.success(t('passwordReset'));
      router.push('/login');
    } catch (error) {
      toast.error(extractErrorMessage(error, t('invalidCode')));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown.isActive) return;

    try {
      await authService.forgotPassword({ email });
      toast.success(t('resentCode'));
      cooldown.start();
    } catch (error) {
      toast.error(extractErrorMessage(error, t('resendError')));
    }
  };

  return (
    <main className="relative flex h-dvh items-center justify-center px-4 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl"
        style={{ background: 'var(--gradient-primary)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[26rem] w-[26rem] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, oklch(0.72 0.2 310) 0%, transparent 70%)' }}
      />

      <section className="relative w-full max-w-md">
        <div className="glass-card shadow-card-elegant rounded-3xl px-7 py-6 sm:px-10 sm:py-8">
          <div className="flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <Lock className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('resetTitle')}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {email ? (
                <>
                  {t('resetDescriptionWithEmail', { email: '' }).split(email)[0]}
                  <span className="font-medium text-foreground">{email}</span>
                  {t('resetDescriptionWithEmail', { email: '' }).split(email)[1] ?? ''}
                </>
              ) : (
                t('resetDescriptionNoEmail')
              )}
            </p>
          </div>

          {!email ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t('noEmailFound')}{' '}
              <Link href="/forgot-password" className="font-semibold text-brand-gradient hover:opacity-80">
                {t('requestNewCode')}
              </Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1">
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
                {fieldErrors.code && <p className="text-xs text-destructive text-center">{fieldErrors.code}</p>}
              </div>

              <div className="space-y-1">
                <div className="glass-input flex items-center gap-3 rounded-xl px-4 h-12 transition-all focus-within:ring-1 focus-within:ring-white/20">
                  <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('newPassword')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-destructive px-1">{fieldErrors.password}</p>}
              </div>

              <div className="space-y-1">
                <div className="glass-input flex items-center gap-3 rounded-xl px-4 h-12 transition-all focus-within:ring-1 focus-within:ring-white/20">
                  <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('confirmNewPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
                {fieldErrors.confirmPassword && <p className="text-xs text-destructive px-1">{fieldErrors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-primary shadow-glow h-12 w-full rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? t('saving') : t('resetPassword')}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown.isActive}
                className="w-full text-center text-sm font-medium text-brand-gradient transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cooldown.isActive ? t('resendCodeCooldown', { seconds: cooldown.remaining }) : t('resendCode')}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-brand-gradient hover:opacity-80">
              {t('backToLogin')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
