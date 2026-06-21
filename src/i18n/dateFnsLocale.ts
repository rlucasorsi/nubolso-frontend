import { enUS, ptBR, es } from 'date-fns/locale';
import type { Locale } from './LanguageContext';

const DATE_FNS_LOCALES = { en: enUS, 'pt-BR': ptBR, es } as const;

export function getDateFnsLocale(locale: Locale) {
  return DATE_FNS_LOCALES[locale];
}
