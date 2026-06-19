'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { COOKIE_KEYS } from '@/shared/constants/cookie-keys.constant';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, CircleDollarSign, Target, LayoutDashboard, RotateCw, CreditCard, Menu } from 'lucide-react';
import Link from 'next/link';

import { MobileNav } from '@/components/layout/MobileNav';
import { SideMenuDrawer } from '@/components/layout/SideMenuDrawer';
import { authService } from '@/services/auth';
import { useGetMe } from '@/modules/users/hooks/use-get-me';
import { InitialSetupDrawer } from '@/components/onboarding/InitialSetupDrawer';

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: me } = useGetMe();
  const needsOnboarding = Boolean(me && !me.balanceStartDate);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  useEffect(() => {
    const token = getCookie(COOKIE_KEYS.ACCESS_TOKEN);
    if (!token) router.replace('/login');
  }, [router]);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <InitialSetupDrawer open={needsOnboarding} />
      <SideMenuDrawer
        open={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        userName={me?.name}
      />

      <header className="flex h-16 items-center justify-between border-b border-white/5 px-4 lg:px-8 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setSideMenuOpen(true)}
            aria-label="Abrir menu"
            className="sm:hidden h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/painel" className="text-xl font-bold font-display">
            <span className="text-white">Nu</span><span className="text-brand-gradient">Bolso</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/painel">
              <LayoutDashboard className="h-4 w-4" />
              <span>Painel</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/entries">
              <CircleDollarSign className="h-4 w-4" />
              <span>Lançamentos</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/cartoes">
              <CreditCard className="h-4 w-4" />
              <span>Cartões</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/recorrentes">
              <RotateCw className="h-4 w-4" />
              <span>Recorrentes</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/metas">
              <Target className="h-4 w-4" />
              <span>Metas</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </Button>
          {/* Logout — desktop only; mobile uses side menu */}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-14 sm:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
