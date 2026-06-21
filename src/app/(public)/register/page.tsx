'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, Check } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { authService } from '@/services/auth';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthLanguageSwitcher } from '@/components/auth/AuthLanguageSwitcher';
import { toast } from 'sonner';
import { registerSchema } from '@/lib/schemas/auth';

function mapRegisterError(error: unknown, t: (key: string) => string): string {
  const raw = extractErrorMessage(error, '');
  const lower = raw.toLowerCase();

  if (
    lower.includes('disposable') ||
    lower.includes('descartável') ||
    lower.includes('temporário') ||
    lower.includes('temporary') ||
    lower.includes('blocked domain')
  ) {
    return t('disposableEmail');
  }

  if (
    lower.includes('already') ||
    lower.includes('já cadastrado') ||
    lower.includes('duplicate') ||
    lower.includes('exists') ||
    lower.includes('em uso') ||
    lower.includes('in use')
  ) {
    return t('emailAlreadyUsed');
  }

  if (lower.includes('password') || lower.includes('senha')) {
    return raw || t('invalidPassword');
  }

  if (lower.includes('invalid email') || lower.includes('e-mail inválido')) {
    return t('invalidEmail');
  }

  return raw || t('createError');
}

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const PASSWORD_REQUIREMENTS = [
    { label: t('minChars'), test: (p: string) => p.length >= 8 },
    { label: t('uppercase'), test: (p: string) => /[A-Z]/.test(p) },
    { label: t('number'), test: (p: string) => /\d/.test(p) },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = registerSchema.safeParse({ name, email, password });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setFieldErrors({ name: errs.name?.[0], email: errs.email?.[0], password: errs.password?.[0] });
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      await authService.register({ name, email, password });
      toast.success(t('accountCreated'));
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(mapRegisterError(error, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex h-dvh items-center justify-center px-4 overflow-hidden">
      <AuthLanguageSwitcher />
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
            <div className="relative mb-2">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 animate-pulse rounded-full blur-3xl opacity-50"
                style={{ background: 'radial-gradient(circle, rgba(157,124,255,0.55) 0%, transparent 70%)', transform: 'scale(2)' }}
              />
              <img
                src="/logo.svg"
                alt="NuBolso"
                className="h-12 w-auto transition-transform duration-500 hover:scale-105"
                style={{ filter: 'drop-shadow(0 0 6px rgba(157,124,255,0.5))' }}
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('createAccount')}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('joinTagline')}</p>
          </div>

          <form onSubmit={handleRegister} className="mt-6 space-y-3">
            <div className="space-y-1">
              <div className="glass-input flex items-center gap-3 rounded-xl px-4 h-12 transition-all focus-within:ring-1 focus-within:ring-white/20">
                <User className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder={t('fullName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              {fieldErrors.name && <p className="text-xs text-destructive px-1">{fieldErrors.name}</p>}
            </div>

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
              {fieldErrors.email && <p className="text-xs text-destructive px-1">{fieldErrors.email}</p>}
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
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-destructive px-1">{fieldErrors.password}</p>}
              <div className="mt-1 space-y-1 px-1">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const met = password.length > 0 && req.test(password);
                  return (
                    <div
                      key={req.label}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-green-400' : 'text-muted-foreground/60'}`}
                    >
                      {met ? <Check className="h-3 w-3 shrink-0" /> : <div className="h-3 w-3 shrink-0 rounded-full border border-current" />}
                      <span>{req.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary shadow-glow mt-2 h-12 w-full rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? t('creatingAccount') : t('createAccountBtn')}
            </button>
          </form>

          <div className="my-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-muted-foreground">{t('orContinueWith')}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-2">
            <GoogleSignInButton />
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('alreadyHaveAccount')}{' '}
            <Link href="/login" className="font-semibold text-brand-gradient hover:opacity-80">
              {t('loginLink')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
