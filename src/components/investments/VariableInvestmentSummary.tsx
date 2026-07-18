'use client';

import { Info } from 'lucide-react';
import type { Investment } from '@/modules/investments/model/api/investment';
import { useInvestmentQuote } from '@/modules/investments/hooks/use-investment-quote';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations } from '@/i18n/useTranslations';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  getDividendsTotal,
  getSharePosition,
  getVariableResult,
} from './investment-helpers';

interface VariableInvestmentSummaryProps {
  investment: Investment;
  variant?: 'card' | 'detail';
}

function InfoHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <Info className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px] text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function Row({
  label,
  value,
  valueClassName,
  hint,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-1 text-muted-foreground">
        {label}
        {hint && <InfoHint text={hint} />}
      </span>
      <span className={cn('font-bold text-right', valueClassName)}>{value}</span>
    </div>
  );
}

export function VariableInvestmentSummary({
  investment,
  variant = 'card',
}: VariableInvestmentSummaryProps) {
  const t = useTranslations('investmentCard');
  const quote = useInvestmentQuote(investment.ticker);
  const currentPrice = quote.data?.available ? quote.data.price : null;

  const position = getSharePosition(investment);
  const result = getVariableResult(investment, currentPrice);
  const dividends = getDividendsTotal(investment);
  const isPositive = result.profit >= 0;

  const wrapperClass = variant === 'detail' ? 'space-y-4' : 'space-y-3';
  const sectionLabelClass =
    'text-[10px] font-bold text-muted-foreground uppercase tracking-widest';

  return (
    <div className={wrapperClass}>
      <div className="space-y-1">
        <span className="flex items-center gap-1">
          <span className={sectionLabelClass}>{t('position')}</span>
          {position.hasPartialData && <InfoHint text={t('partialDataHint')} />}
        </span>
        <Row label={t('quantity')} value={position.quantity !== null ? String(position.quantity) : '—'} />
        <Row
          label={t('avgPrice')}
          value={position.avgPrice !== null ? formatCurrency(position.avgPrice) : '—'}
          hint={t('avgPriceTooltip')}
        />
      </div>

      <div className="space-y-1">
        <span className={sectionLabelClass}>{t('market')}</span>
        {quote.isLoading ? (
          <p className="text-[11px] text-muted-foreground">…</p>
        ) : currentPrice === null ? (
          <p className="text-[11px] text-muted-foreground">{t('quoteUnavailable')}</p>
        ) : (
          <Row label={t('currentPrice')} value={formatCurrency(currentPrice)} hint={t('currentPriceTooltip')} />
        )}
        <Row label={t('marketValue')} value={formatCurrency(result.totalValue)} />
      </div>

      <div className="space-y-1">
        <span className={sectionLabelClass}>{t('result')}</span>
        <Row
          label={t('yield')}
          value={`${isPositive ? '+' : ''}${formatCurrency(result.profit)}${
            result.profitPercent !== null
              ? ` (${isPositive ? '+' : ''}${result.profitPercent.toFixed(2)}%)`
              : ''
          }`}
          valueClassName={isPositive ? 'text-success' : 'text-destructive'}
          hint={t('resultTooltip')}
        />
        {dividends > 0 && (
          <Row
            label={t('dividendsReceived')}
            value={`+${formatCurrency(dividends)}`}
            valueClassName="text-success font-semibold"
          />
        )}
      </div>
    </div>
  );
}
