'use client';

import { CreditCard, Wallet, Calendar, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDateLong } from '@/lib/cashflow';
import { useTranslations } from '@/i18n/useTranslations';

interface CreditCardsSummaryProps {
  activeCardsCount: number;
  totalOpenInvoices: number;
  nextDueDate: string | null;
  currentMonthTotal: number;
}

export function CreditCardsSummary({
  activeCardsCount,
  totalOpenInvoices,
  nextDueDate,
  currentMonthTotal,
}: CreditCardsSummaryProps) {
  const t = useTranslations('creditCardsSummary');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {t('activeCards')}
        </span>
        <span className="text-2xl font-bold font-display text-primary">
          {activeCardsCount}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
          <CreditCard className="h-4 w-4" />
          <span className="font-bold">
            {activeCardsCount === 1 ? t('card') : t('cards')}
          </span>
        </div>
      </div>

      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {t('openInvoices')}
        </span>
        <span className="text-2xl font-bold font-display text-red-500">
          {formatCurrency(totalOpenInvoices)}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
          <Wallet className="h-4 w-4" />
          <span className="font-bold">{t('allUnpaid')}</span>
        </div>
      </div>

      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {t('nextDue')}
        </span>
        <span className="text-2xl font-bold font-display">
          {nextDueDate ? formatDateLong(nextDueDate) : '—'}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
          <Calendar className="h-4 w-4" />
          <span className="font-bold">
            {nextDueDate ? t('nextDueNote') : t('noInvoicesPending')}
          </span>
        </div>
      </div>

      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {t('currentMonth')}
        </span>
        <span className="text-2xl font-bold font-display">
          {formatCurrency(currentMonthTotal)}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
          <TrendingDown className="h-4 w-4" />
          <span className="font-bold">{t('thisMonthNote')}</span>
        </div>
      </div>
    </div>
  );
}

