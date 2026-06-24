'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === 'ArrowLeft' && canPrev) onPrev();
      if (e.key === 'ArrowRight' && canNext) onNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canPrev, canNext, onPrev, onNext]);

  return (
    <div className="flex items-center gap-2">
      {/* Nav group — arrows tight to label */}
      <div className="flex items-center rounded-xl bg-white/5 border border-white/8 p-0.5 gap-0.5">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          title="← Período anterior"
          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-white/8 hover:text-foreground transition-colors disabled:opacity-20 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center px-2 min-w-[120px]">
          <div className="flex items-baseline gap-1.5 leading-none">
            {isStandardMonth ? (
              <>
                <span className="text-sm font-bold font-display text-foreground">{parts[0]}</span>
                <span className="text-xs font-medium text-muted-foreground">{year}</span>
              </>
            ) : (
              <>
                <span className="text-sm font-bold font-display text-foreground">
                  {parts[0].slice(0, 3)}
                  <span className="mx-1 text-muted-foreground/60 font-normal text-xs">→</span>
                  {parts[1].slice(0, 3)}
                </span>
                <span className="text-xs font-medium text-muted-foreground">{year}</span>
              </>
            )}
          </div>

          {!isStandardMonth && (
            <span className="text-[9px] text-muted-foreground/40 leading-none mt-0.5">
              {fmtShort(period.startDate)} – {fmtShort(period.endDate)}
            </span>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!canNext}
          title="→ Próximo período"
          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-white/8 hover:text-foreground transition-colors disabled:opacity-20 disabled:pointer-events-none"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Today pill — outside the nav group */}
      {onToday && !isCurrentPeriod && (
        <button
          onClick={onToday}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 transition-colors"
        >
          {t('today')}
        </button>
      )}
    </div>
  );
}
