'use client';

import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslations } from '@/i18n/useTranslations';

// Definições de despesa fixa x variável, com exemplos. Fonte única de verdade
// reutilizada no bloco visível (ExpenseTypeHint) e no popover (ExpenseTypeHelp).
function ExpenseTypeLines() {
  const t = useTranslations('entry');
  return (
    <div className="space-y-1">
      <p className="text-[11px] leading-snug text-muted-foreground/70">
        <span className="font-semibold text-foreground/80">{t('expenseTypeFixed')}:</span>{' '}
        {t('expenseTypeFixedHint')}
      </p>
      <p className="text-[11px] leading-snug text-muted-foreground/70">
        <span className="font-semibold text-foreground/80">{t('expenseTypeVariable')}:</span>{' '}
        {t('expenseTypeVariableHint')}
      </p>
    </div>
  );
}

// Bloco de texto sempre visível — usado abaixo do seletor nos formulários.
export function ExpenseTypeHint() {
  return <ExpenseTypeLines />;
}

// Ícone de ajuda (ⓘ) com popover — usado onde não há espaço para o texto (ex.: filtro).
export function ExpenseTypeHelp() {
  const t = useTranslations('entry');
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('expenseTypeHelpTitle')}
          className="inline-flex items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 rounded-2xl border-white/10 bg-card p-4 shadow-2xl"
      >
        <p className="text-sm font-bold text-foreground mb-2">{t('expenseTypeHelpTitle')}</p>
        <ExpenseTypeLines />
      </PopoverContent>
    </Popover>
  );
}
