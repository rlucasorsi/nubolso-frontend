'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from '@/i18n/useTranslations';
import { authService } from '@/services/auth';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { forgotPasswordSchema } from '@/lib/schemas/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.flatten().fieldErrors.email?.[0]);
      return;
    }
    setEmailError(undefined);
    setLoading(true);

    try {
      await authService.forgotPassword({ email });
      toast.success(t('forgotSuccess'));
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(extractErrorMessage(error, t('forgotError')));
    } finally {
      setLoading(false);
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
              <Mail className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('forgotTitle')}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('forgotDescription')}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
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
              {emailError && <p className="text-xs text-destructive px-1">{emailError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary shadow-glow mt-2 h-12 w-full rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? t('sending') : t('sendCode')}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-semibold text-brand-gradient hover:opacity-80"
            >
              <ArrowLeft className="h-4 w-4" /> {t('backToLogin')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
