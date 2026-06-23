'use client';

import { useLanguage, type Locale } from '@/i18n/LanguageContext';

const LOCALE_FLAGS: Record<Locale, { src: string; alt: string }> = {
  en: { src: 'https://flagcdn.com/w20/us.png', alt: 'US' },
  'pt-BR': { src: 'https://flagcdn.com/w20/br.png', alt: 'BR' },
  es: { src: 'https://flagcdn.com/w20/es.png', alt: 'ES' },
};

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português',
  es: 'Español',
};

const LOCALES: Locale[] = ['en', 'pt-BR', 'es'];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex gap-2 flex-wrap">
      {LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            locale === loc
              ? 'bg-primary/20 text-primary border-primary/50'
              : 'border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          <img
            src={LOCALE_FLAGS[loc].src}
            alt={LOCALE_FLAGS[loc].alt}
            width={20}
            height={14}
            className="rounded-[2px]"
          />
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
