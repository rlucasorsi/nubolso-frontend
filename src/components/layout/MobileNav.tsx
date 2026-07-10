'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CircleDollarSign,
  Plus,
  CreditCard,
  MoreHorizontal,
  RotateCw,
  Target,
  Wallet,
  Tag,
  Settings,
  Bell,
  X,
} from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { cn } from '@/lib/utils';
import { triggerQuickAdd } from '@/lib/quickAdd';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface MobileNavProps {
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export function MobileNav({ onOpenNotifications, unreadCount = 0 }: MobileNavProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const NAV_ITEMS = [
    { label: t('dashboard').toUpperCase(), href: '/dashboard', icon: LayoutDashboard },
    { label: t('entries').toUpperCase(), href: '/entries', icon: CircleDollarSign },
    { label: t('cards').toUpperCase(), href: '/cards', icon: CreditCard },
  ];

  const MORE_ITEMS = [
    { label: t('goals'), href: '/goals', icon: Target },
    { label: t('recurring'), href: '/recurring', icon: RotateCw },
    { label: t('budget'), href: '/orcamento', icon: Wallet },
    { label: t('categories'), href: '/categories', icon: Tag },
    { label: t('settings'), href: '/settings', icon: Settings },
  ];

  const isMoreActive = MORE_ITEMS.some((item) => pathname === item.href);

  const handleQuickAdd = () => {
    if (!triggerQuickAdd()) {
      router.push('/dashboard');
    }
  };

  const [left, right] = [NAV_ITEMS.slice(0, 2), NAV_ITEMS.slice(2)];

  return (
    <>
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 px-2 py-2 flex justify-around items-center rounded-2xl border border-white/10 bg-background/95 backdrop-blur-3xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.8)] animate-fade-in">
        {left.map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname === item.href} />
        ))}

        <button
          type="button"
          onClick={handleQuickAdd}
          aria-label={t('newEntry')}
          className="relative flex flex-col items-center group transition-all duration-300 py-1.5 text-muted-foreground/60"
        >
          <div className="p-1.5 rounded-lg bg-primary text-white transition-transform group-active:scale-95">
            <Plus className="h-6 w-6" />
          </div>
        </button>

        {right.map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname === item.href} />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            'relative flex flex-col items-center group transition-all duration-300 py-1.5',
            isMoreActive ? 'text-primary' : 'text-muted-foreground/60 hover:text-foreground',
          )}
        >
          <div
            className={cn(
              'p-1.5 rounded-lg transition-all duration-300',
              isMoreActive ? 'bg-primary/10 scale-110' : 'bg-transparent group-active:scale-95',
            )}
          >
            <MoreHorizontal
              className={cn(
                'h-6 w-6 transition-transform',
                isMoreActive && 'drop-shadow-[0_0_8px_var(--primary)]',
              )}
            />
          </div>
          {isMoreActive && (
            <span className="absolute bottom-0 h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
          )}
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl bg-card border-white/10 p-0 [&>button]:hidden"
        >
          <SheetTitle className="sr-only">{t('more')}</SheetTitle>
          <SheetDescription className="sr-only">{t('more')}</SheetDescription>

          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
            <span className="text-base font-bold">{t('more')}</span>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="px-3 py-4 space-y-1">
            {onOpenNotifications && (
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onOpenNotifications();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all duration-200 text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <span className="relative shrink-0">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[0.9rem] h-[0.9rem] px-0.5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
                <span>{t('notifications')}</span>
              </button>
            )}
            {MORE_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0',
                      isActive && 'drop-shadow-[0_0_6px_var(--primary)]',
                    )}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="h-6" />
        </SheetContent>
      </Sheet>
    </>
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex flex-col items-center group transition-all duration-300 py-1.5',
        isActive ? 'text-primary' : 'text-muted-foreground/60 hover:text-foreground',
      )}
    >
      <div
        className={cn(
          'p-1.5 rounded-lg transition-all duration-300',
          isActive ? 'bg-primary/10 scale-110' : 'bg-transparent group-active:scale-95',
        )}
      >
        <Icon
          className={cn(
            'h-6 w-6 transition-transform',
            isActive && 'drop-shadow-[0_0_8px_var(--primary)]',
          )}
        />
      </div>

      {isActive && (
        <span className="absolute bottom-0 h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
      )}
    </Link>
  );
}
