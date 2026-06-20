import { useLanguage } from './LanguageContext';
import en from '../../messages/en.json';
import ptBR from '../../messages/pt-BR.json';
import es from '../../messages/es.json';

type Messages = typeof en;
type Namespace = keyof Messages;
type NamespaceKeys<N extends Namespace> = keyof Messages[N] & string;

const messages: Record<string, Messages> = { en, 'pt-BR': ptBR, es };

export function useTranslations<N extends Namespace>(namespace: N) {
  const { locale } = useLanguage();
  const ns = ((messages[locale] ?? messages.en)[namespace] ?? (messages.en)[namespace]) as Record<string, string>;
  const fallback = (messages.en)[namespace] as Record<string, string>;

  return function t(key: NamespaceKeys<N>, params?: Record<string, string | number>): string {
    let value: string = ns[key as string] ?? fallback[key as string] ?? (key as string);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replaceAll(`{${k}}`, String(v));
      });
    }
    return value;
  };
}
