'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatCurrency, formatDateLong } from '@/lib/cashflow';
import { MONTH_KEYS } from '@/components/painel/config';
import { useCashFlow } from '@/hooks/useCashFlow';
import type { SimulatePurchaseResponse } from '@/modules/credit-cards/model/api/purchase';
import { useTranslations } from '@/i18n/useTranslations';

interface PurchaseSimulationPreviewProps {
  simulation?: SimulatePurchaseResponse;
  isLoading: boolean;
}

export function PurchaseSimulationPreview({ simulation, isLoading }: PurchaseSimulationPreviewProps) {
  const t = useTranslations('creditPurchase');
  const td = useTranslations('dateNames');
  const { allDays } = useCashFlow();

  // For each day, sum the delta of every impacted invoice whose paymentDate has
  // already passed (or is today) to estimate the cumulative effect of this purchase.
  const negativeDays = useMemo(() => {
    if (!simulation) return [];

    return allDays
      .map((day) => {
        const totalDelta = simulation.impactedInvoices
          .filter((invoice) => invoice.paymentDate <= day.date)
          .reduce((sum, invoice) => sum + invoice.delta, 0);
        return { date: day.date, current: day.saldoAcumulado, projected: day.saldoAcumulado - totalDelta };
      })
      .filter((day) => day.current >= 0 && day.projected < 0);
  }, [simulation, allDays]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      </div>
    );
  }

  if (!simulation) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">
          {t('installments')}
        </h3>
        <div className="space-y-2">
          {simulation.installments.map((installment) => (
            <div
              key={installment.number}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {t('installment', { n: installment.number, total: installment.totalCount })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('invoiceMonth', { month: td(MONTH_KEYS[installment.referenceMonth - 1]), year: installment.referenceYear })} · {t('paidOn', { date: formatDateLong(installment.paymentDate) })}
                </p>
              </div>
              <span className="text-sm font-bold text-red-500 shrink-0">
                {formatCurrency(installment.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">
          {t('impactedInvoices')}
        </h3>
        <div className="space-y-2">
          {simulation.impactedInvoices.map((invoice) => (
            <div
              key={`${invoice.referenceYear}-${invoice.referenceMonth}`}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {t('invoiceMonth', { month: td(MONTH_KEYS[invoice.referenceMonth - 1]), year: invoice.referenceYear })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('dueOn', { date: formatDateLong(invoice.paymentDate) })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground line-through">
                  {formatCurrency(invoice.currentTotal)}
                </p>
                <p className="text-sm font-bold text-red-500">
                  {formatCurrency(invoice.projectedTotal)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {negativeDays.length > 0 ? (
        <div className="glass-card rounded-2xl p-4 border border-destructive/30 space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-bold">{t('balanceWarning')}</span>
          </div>
          <div className="space-y-1">
            {negativeDays.slice(0, 3).map((day) => (
              <p key={day.date} className="text-xs text-muted-foreground">
                {t('projectedBalance', { date: formatDateLong(day.date), amount: formatCurrency(day.projected) })}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-4 flex items-center gap-2 text-emerald-500">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="text-sm font-bold">{t('noNegativeImpact')}</span>
        </div>
      )}
    </div>
  );
}
