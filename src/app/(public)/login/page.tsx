'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Check, Apple } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { authService } from '@/services/auth';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthLanguageSwitcher } from '@/components/auth/AuthLanguageSwitcher';
import { toast } from 'sonner';
import { loginSchema } from '@/lib/schemas/auth';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setFieldErrors({ email: errs.email?.[0], password: errs.password?.[0] });
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      await authService.login({ email, password });
      toast.success(t('welcomeBack'));
      router.push('/dashboard');
    } catch (error) {
      const err = error as { data?: { errorCode?: string } };

      if (err?.data?.errorCode === 'EMAIL_NOT_VERIFIED') {
        await authService.resendCode({ email });
        toast.info(t('confirmEmail'));
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      toast.error(extractErrorMessage(error, t('loginError')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex h-dvh items-center justify-center px-4 overflow-hidden">
      <AuthLanguageSwitcher />

      <section className="relative w-full max-w-md">
        <div className="glass-card shadow-card-elegant rounded-3xl px-7 py-6 sm:px-10 sm:py-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-2">
              <img
                src="/logo.svg"
                alt="NuBolso"
                className="h-12 w-auto transition-transform duration-500 hover:scale-105"
                style={{ filter: 'drop-shadow(0 0 6px rgba(157,124,255,0.5))' }}
              />
            </div>
            <h1
              className="text-4xl font-bold tracking-tight text-white"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)' }}
            >
              NuBolso
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xs">
              {t('tagline')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <div className="space-y-1">
              <div className="glass-input flex items-center gap-3 rounded-xl px-4 h-12 transition-all focus-within:ring-1 focus-within:ring-white/20">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="email"
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-destructive px-1">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="glass-input flex items-center gap-3 rounded-xl px-4 h-12 transition-all focus-within:ring-1 focus-within:ring-white/20">
                <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('password')}
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
              {fieldErrors.password && (
                <p className="text-xs text-destructive px-1">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setRemember((r) => !r)}
                className="flex items-center gap-2 text-sm text-foreground/90 hover:text-foreground"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                    remember ? 'border-transparent bg-primary' : 'border-white/20 bg-white/5'
                  }`}
                >
                  {remember && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </span>
                {t('rememberMe')}
              </button>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-brand-gradient hover:opacity-80 transition-opacity"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-primary mt-2 h-12 w-full rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <div className="my-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-muted-foreground">{t('orContinueWith')}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-2">
            <GoogleSignInButton />
            <button
              type="button"
              className="glass-input flex h-12 w-full items-center justify-center gap-3 rounded-xl text-sm font-medium text-foreground transition-all hover:bg-white/10"
            >
              <Apple className="h-5 w-5 fill-current" />
              {t('continueWithApple')}
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/register" className="font-semibold text-brand-gradient hover:opacity-80">
              {t('signUp')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
