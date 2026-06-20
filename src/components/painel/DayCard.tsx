'use client';

import { DayData } from '@/lib/cashflow';
import { cn } from '@/lib/utils';
import { Eye, RotateCw } from 'lucide-react';
import { MONTH_SHORT, WEEK_DAYS } from './config';
import { BalanceSettings } from '@/hooks/useCashFlow';
import { useTranslations } from 'next-intl';

interface DayCardProps {
  day: DayData;
  isExpanded: boolean;
  isToday: boolean;
  onToggle: () => void;
  balanceSettings: BalanceSettings;
  onOpenSheet?: (date: string, filter: any) => void;
  onAddEntry?: (entry: any) => void;
}

type SaldoStatus = 'ok' | 'warning' | 'critical';

const getSaldoStatus = (value: number, settings: BalanceSettings): SaldoStatus => {
  if (value >= settings.greenThreshold) return 'ok';
  if (value >= settings.yellowThreshold) return 'warning';
  return 'critical';
};

const saldoBorderClass = (status: SaldoStatus) => {
  if (status === 'warning') return 'border-b border-orange-400 pb-0.5';
  if (status === 'critical') return 'border-b border-red-500 pb-0.5';
  return 'border-b border-emerald-500 pb-0.5';
};

const saldoValueClass = (_status: SaldoStatus) => 'text-white';

export function DayCard({
  day,
  isExpanded,
  isToday,
  onToggle,
  onOpenSheet,
  balanceSettings,
}: DayCardProps) {
  const t = useTranslations('dayCard');
  const d = new Date(day.date + 'T00:00:00');
  const isNegative = day.saldoAcumulado < 0;
  const isDisabled = day.isBeforeStartDate;

  const saldoStatus = isDisabled ? 'ok' : getSaldoStatus(day.saldoAcumulado, balanceSettings);

  const statusLine = isToday
    ? t('today')
    : day.isBeforeStartDate
      ? t('noHistory')
      : isNegative
        ? t('goesNegative')
        : null;

  return (
    <div
      className={cn(
        "relative bg-[#1c1a24] rounded-3xl overflow-hidden transition-all border border-transparent",
        isDisabled
          ? "opacity-40 grayscale cursor-not-allowed"
          : "cursor-pointer hover:border-white/5",
        isToday && !isDisabled ? 'ring-1 ring-primary/20' : '',
      )}
    >
      {/* Sidebar Accent */}
      <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${
        isToday ? 'bg-primary' : isNegative ? 'bg-red-500' : 'bg-muted-foreground/10'
      }`} />

      <div className="p-5">
        {/* Header row: date/weekday — saldo + eye button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center leading-none shrink-0">
              <span className="text-2xl font-black font-display text-white">{String(d.getDate()).padStart(2, '0')}</span>
              <span className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-[0.1em]">{MONTH_SHORT[d.getMonth()]}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white tracking-tight font-display leading-none">
                  {WEEK_DAYS[d.getDay()]}
                </h4>
                {day.hasPendingRecurring && (
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center text-amber-400 shrink-0"
                    title="Recurring estimated entries pending on this day"
                  >
                    <RotateCw className="w-3 h-3" />
                  </div>
                )}
              </div>
              {statusLine && (
                <p className={cn(
                  "hidden sm:block text-[9px] font-semibold mt-0.5",
                  isNegative && !isToday && !day.isBeforeStartDate ? 'text-red-400' : 'text-muted-foreground/50'
                )}>
                  {statusLine}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn("flex items-baseline gap-1.5 text-right", saldoBorderClass(saldoStatus))}>
              <span className="text-[8px] font-black uppercase tracking-wide text-white">{t('balance')}</span>
              {isDisabled ? (
                <span className="text-sm font-black font-display text-white/30">—</span>
              ) : (
                <span className={cn("text-sm font-black font-display", saldoValueClass(saldoStatus))}>
                  <span className="text-[9px] opacity-60 mr-0.5">R$</span>
                  {day.saldoAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); if (!isDisabled) onOpenSheet?.(day.date, 'all'); }}
              disabled={isDisabled}
              className={cn(
                "w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground/60 transition-all shrink-0",
                isDisabled ? "cursor-not-allowed" : "hover:bg-primary/20 hover:text-primary",
              )}
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Data Grid */}
        <div
          onClick={isDisabled ? undefined : onToggle}
          className={cn(
            "flex justify-between mt-3 pt-3 border-t border-white/5",
            isDisabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          <div className="space-y-1">
            <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.15em]">{t('income')}</p>
            <p className="text-xs font-bold font-display text-emerald-500">
              <span className="text-[8px] font-black mr-0.5">+</span>
              {day.income.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.15em]">{t('expense')}</p>
            <p className="text-xs font-bold font-display text-red-500">
              <span className="text-[8px] font-black mr-0.5">-</span>
              {day.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.15em]">{t('spending')}</p>
            <p className="text-xs font-bold font-display text-orange-400">
              <span className="text-[8px] font-black mr-0.5">-</span>
              {day.spending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
