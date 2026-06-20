'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { routing } from '@/i18n/routing';

const LOCALE_LABELS: Record<string, string> = {
  en: '🇺🇸 English',
  'pt-BR': '🇧🇷 Português',
  es: '🇪🇸 Español',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            locale === loc
              ? 'bg-primary/20 text-primary border-primary/50 shadow-glow'
              : 'border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
