'use client';

import { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/i18n/useTranslations';
import { cn } from '@/lib/utils';

import { MobileNav } from '@/components/layout/MobileNav';
import { GlobalQuickAdd } from '@/components/layout/GlobalQuickAdd';
import { SideMenuDrawer } from '@/components/layout/SideMenuDrawer';
import { Sidebar } from '@/components/layout/Sidebar';
import { UserMenu } from '@/components/layout/UserMenu';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useGetMe } from '@/modules/users/hooks/use-get-me';
import { useLogout } from '@/hooks/useLogout';
import { InitialSetupDrawer } from '@/components/onboarding/InitialSetupDrawer';
import { SentryUserContext } from '@/components/monitoring/SentryUserContext';
import { useUnreadCount } from '@/modules/notifications/hooks/use-unread-count';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  const { data: me } = useGetMe();
  const needsOnboarding = Boolean(me && !me.balanceStartDate);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  const handleLogout = useLogout();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen={false} className="text-foreground">
      <SentryUserContext />
      <InitialSetupDrawer open={needsOnboarding} />
      <SideMenuDrawer
        open={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        userName={me?.name}
        userEmail={me?.email}
      />
      <Sidebar onLogout={handleLogout} />

      <SidebarInset className="min-w-0">
        <header className="flex h-16 items-center justify-between md:justify-end border-b border-white/5 px-4 lg:px-8 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setSideMenuOpen(true)}
              aria-label={t('openMenu')}
              className="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
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

          <div className="flex items-center gap-1">
            {/* Notification bell */}
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              aria-label="Notificações"
              className="relative h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span
                  className={cn(
                    'absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_6px_var(--primary)]',
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <UserMenu name={me?.name} email={me?.email} onLogout={handleLogout} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-14 md:pb-0">{children}</div>
      </SidebarInset>

      <GlobalQuickAdd />
      <MobileNav onOpenNotifications={() => setNotifOpen(true)} unreadCount={unreadCount} />
      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
    </SidebarProvider>
  );
}
