'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CircleDollarSign, Plus, RotateCw, CreditCard } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { triggerQuickAdd } from '@/lib/quickAdd';

export function MobileNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const NAV_ITEMS = [
    { label: t('dashboard').toUpperCase(), href: `/${locale}/dashboard`, icon: LayoutDashboard },
    { label: t('entries').toUpperCase(), href: `/${locale}/entries`, icon: CircleDollarSign },
    { label: t('cards').toUpperCase(), href: `/${locale}/cards`, icon: CreditCard },
    { label: t('recurring').toUpperCase(), href: `/${locale}/recurring`, icon: RotateCw },
  ];

  const handleQuickAdd = () => {
    if (!triggerQuickAdd()) {
      router.push(`/${locale}/dashboard`);
    }
  };

  const [left, right] = [NAV_ITEMS.slice(0, 2), NAV_ITEMS.slice(2)];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-0.5 flex justify-around items-center border-t border-white/10 bg-background/95 backdrop-blur-3xl shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.8)] animate-fade-in">
      {left.map((item) => (
        <NavLink key={item.href} item={item} isActive={pathname === item.href} />
      ))}

      <button
        type="button"
        onClick={handleQuickAdd}
        aria-label={t('newEntry')}
        className="relative flex flex-col items-center group transition-all duration-300 py-1.5 text-muted-foreground/60"
      >
        <div className="p-1.5 rounded-lg bg-gradient-primary text-white shadow-glow transition-transform group-active:scale-95">
          <Plus className="h-6 w-6" />
        </div>
      </button>

      {right.map((item) => (
        <NavLink key={item.href} item={item} isActive={pathname === item.href} />
      ))}
    </nav>
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
        <Icon className={cn('h-6 w-6 transition-transform', isActive && 'drop-shadow-[0_0_8px_var(--primary)]')} />
      </div>

      {isActive && (
        <span className="absolute bottom-0 h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
      )}
    </Link>
  );
}
