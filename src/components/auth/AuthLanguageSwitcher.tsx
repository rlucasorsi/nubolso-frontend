'use client';

import { Globe } from 'lucide-react';
import { useLanguage, type Locale } from '@/i18n/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇺🇸',
  'pt-BR': '🇧🇷',
  es: '🇪🇸',
};

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português',
  es: 'Español',
};

const LOCALES: Locale[] = ['en', 'pt-BR', 'es'];

export function AuthLanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="absolute top-4 right-4 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="glass-input flex items-center gap-1.5 rounded-xl px-3 h-9 text-xs font-medium text-foreground transition-all hover:bg-white/10"
          >
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span>{LOCALE_FLAGS[locale]}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#1c1a24] border-white/10">
          {LOCALES.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => setLocale(loc)}
              className={`gap-2 text-xs font-medium cursor-pointer ${
                locale === loc ? 'text-primary' : 'text-foreground'
              }`}
            >
              <span>{LOCALE_FLAGS[loc]}</span>
              <span>{LOCALE_LABELS[loc]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
