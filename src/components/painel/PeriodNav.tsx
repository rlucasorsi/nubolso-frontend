'use client';

import { Period } from '@/lib/cashflow';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import { useLanguage } from '@/i18n/LanguageContext';

interface PeriodNavProps {
  periods: Period[];
  periodIdx: number;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
  isCurrentPeriod?: boolean;
}

export function PeriodNav({
  periods,
  periodIdx,
  onPrev,
  onNext,
  onToday,
  isCurrentPeriod,
}: PeriodNavProps) {
  const t = useTranslations('periodNav');
  const { locale } = useLanguage();
  const period = periods[periodIdx];

  const parts = period.label.split(' / ');
  const year = period.startDate.split('-')[0];
  const isStandardMonth = /^\d{4}$/.test(parts[1] ?? '');

  const canPrev = periodIdx > 0;
  const canNext = periodIdx < periods.length - 1;

  const fmtShort = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="flex items-center gap-1 w-full">
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className="h-8 w-8 shrink-0 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
        <div className="flex items-baseline gap-1.5 leading-none">
          {isStandardMonth ? (
            <>
              <span className="text-base font-bold font-display text-foreground">{parts[0]}</span>
              <span className="text-sm font-medium text-muted-foreground">{year}</span>
            </>
          ) : (
            <>
              <span className="text-base font-bold font-display text-foreground">
                {parts[0].slice(0, 3)}
                <span className="mx-1 text-muted-foreground font-normal">→</span>
                {parts[1].slice(0, 3)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">{year}</span>
            </>
          )}
        </div>

        {!isStandardMonth && (
          <span className="text-[10px] text-muted-foreground/50 leading-none">
            {fmtShort(period.startDate)} – {fmtShort(period.endDate)}
          </span>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!canNext}
        className="h-8 w-8 shrink-0 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {onToday && !isCurrentPeriod && (
        <button
          onClick={onToday}
          className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 transition-colors"
        >
          {t('today')}
        </button>
      )}
    </div>
  );
}
