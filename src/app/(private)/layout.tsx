'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  CircleDollarSign,
  Target,
  LayoutDashboard,
  RotateCw,
  CreditCard,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/i18n/useTranslations';

import { MobileNav } from '@/components/layout/MobileNav';
import { SideMenuDrawer } from '@/components/layout/SideMenuDrawer';
import { UserMenu } from '@/components/layout/UserMenu';
import { useGetMe } from '@/modules/users/hooks/use-get-me';
import { useLogout } from '@/hooks/useLogout';
import { InitialSetupDrawer } from '@/components/onboarding/InitialSetupDrawer';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  const { data: me } = useGetMe();
  const needsOnboarding = Boolean(me && !me.balanceStartDate);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  const handleLogout = useLogout();

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <InitialSetupDrawer open={needsOnboarding} />
      <SideMenuDrawer
        open={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        userName={me?.name}
        userEmail={me?.email}
      />

      <header className="flex h-16 items-center justify-between border-b border-white/5 px-4 lg:px-8 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSideMenuOpen(true)}
            aria-label={t('openMenu')}
            className="sm:hidden h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard">
            <img
              src="/logo.svg"
              alt="NuBolso"
              className="h-8 w-auto"
              style={{ filter: 'drop-shadow(0 0 4px rgba(157,124,255,0.5))' }}
              fetchPriority="high"
            />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
          >
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              <span>{t('dashboard')}</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
          >
            <Link href="/entries">
              <CircleDollarSign className="h-4 w-4" />
              <span>{t('entries')}</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
          >
            <Link href="/cards">
              <CreditCard className="h-4 w-4" />
              <span>{t('cards')}</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
          >
            <Link href="/recurring">
              <RotateCw className="h-4 w-4" />
              <span>{t('recurring')}</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
          >
            <Link href="/goals">
              <Target className="h-4 w-4" />
              <span>{t('goals')}</span>
            </Link>
          </Button>
          <UserMenu name={me?.name} email={me?.email} onLogout={handleLogout} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-14 sm:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
