'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Mail, Lock, Eye, EyeOff, Check, Apple } from 'lucide-react';
import { authService } from '@/services/auth';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { toast } from 'sonner';
import { loginSchema } from '@/lib/schemas/auth';

export default function LoginPage() {
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
      toast.success('Bem-vindo de volta!');
      router.push('/painel');
    } catch (error) {
      const err = error as { data?: { errorCode?: string } };

      if (err?.data?.errorCode === 'EMAIL_NOT_VERIFIED') {
        await authService.resendCode({ email });
        toast.info('Confirme seu e-mail para continuar. Enviamos um novo código.');
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      toast.error(extractErrorMessage(error, 'Erro ao entrar. Verifique suas credenciais.'));
    } finally {
      setLoading(false);
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
              <BarChart3 className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-white">Nu</span><span className="text-brand-gradient">Bolso</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xs">
              Organize suas finanças e tenha clareza para decidir melhor.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <div className="space-y-1">
              <div className="glass-input flex items-center gap-3 rounded-xl px-4 h-12 transition-all focus-within:ring-1 focus-within:ring-white/20">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="email"
                  placeholder="E-mail"
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
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
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
                    remember
                      ? 'border-transparent bg-gradient-primary shadow-glow'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  {remember && (
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  )}
                </span>
                Lembrar de mim
              </button>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-brand-gradient hover:opacity-80 transition-opacity"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary shadow-glow mt-2 h-12 w-full rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-muted-foreground">ou continue com</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Social */}
          <div className="space-y-2">
            <GoogleSignInButton />
            <button
              type="button"
              className="glass-input flex h-12 w-full items-center justify-center gap-3 rounded-xl text-sm font-medium text-foreground transition-all hover:bg-white/10"
            >
              <Apple className="h-5 w-5 fill-current" />
              Continuar com Apple
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link
              href="/register"
              className="font-semibold text-brand-gradient hover:opacity-80"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
