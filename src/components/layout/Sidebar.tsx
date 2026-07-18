'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CircleDollarSign,
  CreditCard,
  RotateCw,
  Target,
  LineChart,
  Wallet,
  Tag,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const NAV_ITEMS = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'entries', href: '/entries', icon: CircleDollarSign },
  { key: 'cards', href: '/cards', icon: CreditCard },
  { key: 'recurring', href: '/recurring', icon: RotateCw },
  { key: 'goals', href: '/goals', icon: Target },
  { key: 'investments', href: '/investments', icon: LineChart },
  { key: 'budget', href: '/orcamento', icon: Wallet },
  { key: 'categories', href: '/categories', icon: Tag },
] as const;

interface SidebarProps {
  onLogout: () => void;
}

// Menu lateral fixo pra telas md+, no mecanismo de colapso do componente
// Sidebar do shadcn/ui (SidebarProvider, régua só de ícones quando fechado),
// mas abrindo/fechando no hover — igual ao mini-sidebar do Materialize UI —
// em vez de exigir clique num trigger. A seta no canto permite fixar aberto
// (persiste mesmo tirando o mouse); clicar de novo solta e recolhe.
// MobileNav e SideMenuDrawer continuam cobrindo telas < md.
export function Sidebar({ onLogout }: SidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    setOpen(pinned || hovering);
  }, [pinned, hovering, setOpen]);

  return (
    <SidebarPrimitive
      collapsible="icon"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <SidebarHeader className="h-16 justify-center px-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0 flex-1">
            <img
              src="/logo.svg"
              alt="NuBolso"
              className="h-7 w-auto shrink-0"
              style={{ filter: 'drop-shadow(0 0 4px rgba(157,124,255,0.5))' }}
              fetchPriority="high"
            />
            <div className="flex flex-col gap-0.5 min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-base font-bold font-display leading-tight truncate">
                <span className="text-white">Nu</span>
                <span className="text-brand-gradient">Bolso</span>
              </span>
              <span className="text-[11px] text-muted-foreground/60 truncate">{t('tagline')}</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setPinned((p) => !p)}
            aria-label={pinned ? t('collapseSidebar') : t('expandSidebar')}
            className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors group-data-[collapsible=icon]:hidden"
          >
            {pinned ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2 py-2">
          {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={t(key)}>
                  <Link href={href}>
                    <Icon className={isActive ? 'drop-shadow-[0_0_6px_var(--primary)]' : undefined} />
                    <span>{t(key)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip={t('settings')}>
              <Link href="/settings">
                <Settings />
                <span>{t('settings')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} tooltip={t('logout')}>
              <LogOut />
              <span>{t('logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
