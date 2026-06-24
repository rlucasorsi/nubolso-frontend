'use client';

import Link from 'next/link';
import { Settings, LogOut, Globe, Check, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/i18n/useTranslations';
import { useLanguage, type Locale } from '@/i18n/LanguageContext';
import { usePlan } from '@/modules/billing/hooks/use-plan';
import { useUpgrade } from '@/modules/billing/hooks/use-billing';

const LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português',
  es: 'Español',
};
const FLAGS: Record<Locale, { src: string; alt: string }> = {
  en: { src: 'https://flagcdn.com/w20/us.png', alt: 'EN' },
  'pt-BR': { src: 'https://flagcdn.com/w20/br.png', alt: 'BR' },
  es: { src: 'https://flagcdn.com/w20/es.png', alt: 'ES' },
};

interface UserMenuProps {
  name?: string;
  email?: string;
  onLogout: () => void;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function UserMenu({ name, email, onLogout }: UserMenuProps) {
  const t = useTranslations('nav');
  const tb = useTranslations('billing');
  const { locale, setLocale } = useLanguage();
  const { isFree, isPro } = usePlan();
  const { upgrade, isLoading: isUpgrading } = useUpgrade();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative rounded-full ring-2 ring-transparent hover:ring-primary/40 transition-all focus-visible:outline-none focus-visible:ring-primary/60"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold select-none">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          {isFree && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-400 flex items-center justify-center ring-2 ring-background">
              <Sparkles className="h-2 w-2 text-background" />
            </span>
          )}
          {isPro && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
              <Sparkles className="h-2 w-2 text-white" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={16} className="w-52">
        {name && (
          <>
            <DropdownMenuLabel className="pb-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm leading-tight truncate">{name}</p>
                <span
                  className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isPro ? 'bg-primary/20 text-primary' : 'bg-amber-400/15 text-amber-400'
                  }`}
                >
                  {isPro ? 'PRO' : 'FREE'}
                </span>
              </div>
              {email && (
                <p className="text-xs text-muted-foreground font-normal truncate">{email}</p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Globe className="h-4 w-4" />
              {t('language')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {LOCALES.map((l) => (
                <DropdownMenuItem key={l} onClick={() => setLocale(l)} className="gap-2">
                  <img
                    src={FLAGS[l].src}
                    alt={FLAGS[l].alt}
                    width={16}
                    height={12}
                    className="rounded-[2px] shrink-0"
                  />
                  {LOCALE_LABELS[l]}
                  {locale === l && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem asChild>
            <Link href="/settings" className="gap-2">
              <Settings className="h-4 w-4" />
              {t('settings')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {isFree && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={upgrade}
              disabled={isUpgrading}
              className="gap-2 text-amber-400 focus:text-amber-400 focus:bg-amber-400/10"
            >
              <Sparkles className="h-4 w-4" />
              {tb('subscribePro')}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onLogout}
          className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
