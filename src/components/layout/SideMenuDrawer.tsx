'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  LayoutDashboard,
  CircleDollarSign,
  CreditCard,
  RotateCw,
  Target,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/useLogout';

interface SideMenuDrawerProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
}

export function SideMenuDrawer({ open, onClose, userName }: SideMenuDrawerProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const logout = useLogout();

  const NAV_ITEMS = [
    { label: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { label: t('entries'), href: '/entries', icon: CircleDollarSign },
    { label: t('cards'), href: '/cards', icon: CreditCard },
    { label: t('recurring'), href: '/recurring', icon: RotateCw },
    { label: t('goals'), href: '/goals', icon: Target },
    { label: t('settings'), href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="left"
        className="w-[280px] p-0 bg-card border-r border-white/10 flex flex-col [&>button]:hidden"
      >
        <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
        <SheetDescription className="sr-only">{t('menuDescription')}</SheetDescription>

        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/5">
          <span className="text-xl font-bold font-display">
            <span className="text-white">Nu</span><span className="text-brand-gradient">Bolso</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {userName && (
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-xs text-muted-foreground">{t('hello')}</p>
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive && 'drop-shadow-[0_0_6px_var(--primary)]')} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all duration-200"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t('logout')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
