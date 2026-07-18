'use client';

import { TrendingUp, Wallet } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { formatCurrency } from './investment-helpers';

interface InvestmentsSummaryProps {
  totalBalance: number;
  totalYield: number;
  totalContributed: number;
  fixedBalance: number;
  variableBalance: number;
  count: number;
}

export function InvestmentsSummary({
  totalBalance,
  totalYield,
  totalContributed,
  fixedBalance,
  variableBalance,
  count,
}: InvestmentsSummaryProps) {
  const t = useTranslations('investmentsView');
  const tc = useTranslations('createInvestmentDrawer');
  const isPositiveYield = totalYield >= 0;
  const yieldPercentage = totalContributed > 0 ? (totalYield / totalContributed) * 100 : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {t('totalBalance')}
        </span>
        <span className="text-2xl font-bold font-display text-primary">
          {formatCurrency(totalBalance)}
        </span>
        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mt-2">
          <Wallet className="h-3.5 w-3.5 shrink-0" />
          <span className="font-semibold truncate">
            {tc('fixedIncome')} {formatCurrency(fixedBalance)} · {tc('variableIncome')}{' '}
            {formatCurrency(variableBalance)}
          </span>
        </div>
      </div>

      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {t('totalYield')}
        </span>
        <span
          className={`text-2xl font-bold font-display ${isPositiveYield ? 'text-success' : 'text-destructive'}`}
        >
          {isPositiveYield ? '+' : ''}
          {formatCurrency(totalYield)}
          {yieldPercentage !== null && (
            <span className="ml-1.5 text-sm font-bold align-middle">
              ({yieldPercentage >= 0 ? '+' : ''}
              {yieldPercentage.toFixed(2)}%)
            </span>
          )}
        </span>
        <div className="flex items-center gap-2 text-success text-xs mt-2">
          <TrendingUp className="h-4 w-4" />
          <span className="font-bold">{t('yieldNote')}</span>
        </div>
      </div>

      <div className="bg-surface-container border border-white/5 rounded-base shadow-lg p-7 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {t('activeInvestments')}
        </span>
        <span className="text-2xl font-bold font-display">
          {count} {count === 1 ? t('investment') : t('investments')}
        </span>
        <span className="text-xs font-medium text-muted-foreground mt-2">{t('subtitle')}</span>
      </div>
    </div>
  );
}
