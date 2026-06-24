'use client';

import Link from 'next/link';
import { Settings, LogOut, Globe, Check } from 'lucide-react';
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
  const { locale, setLocale } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full ring-2 ring-transparent hover:ring-primary/40 transition-all focus-visible:outline-none focus-visible:ring-primary/60"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold select-none">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={16} className="w-52">
        {name && (
          <>
            <DropdownMenuLabel className="pb-1">
              <p className="font-semibold text-sm leading-tight truncate">{name}</p>
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
