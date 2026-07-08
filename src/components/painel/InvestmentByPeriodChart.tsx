'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, PiggyBank } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CashFlowEntry, Period, formatCurrency, formatCurrencyCompact } from '@/lib/cashflow';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';

const INVEST_COLOR = '#3b82f6';
// Janela de períodos exibidos, centrada no período selecionado, para manter legível.
const WINDOW = 12;
const ARROW_PADDING = 56; // px-7 on each side (28px × 2)
const MAX_BAR_HEIGHT = 140;
const MIN_BAR_HEIGHT = 4;
const TOP_LABEL_HEIGHT = 16;
const LABEL_GAP = 4;
const Y_AXIS_WIDTH = 44;
// Frações do valor máximo em que as linhas de grade horizontais são desenhadas.
const GRID_TICKS = [1, 0.75, 0.5, 0.25, 0];

// Soma dos investimentos (por data) de uma lista de lançamentos dentro do período.
function sumInvestment(list: CashFlowEntry[], start: string, end: string): number {
  let sum = 0;
  for (const e of list) {
    if (e.type === 'investment' && !e.isCardBilled && e.date >= start && e.date <= end) {
      sum += e.amount;
    }
  }
  return sum;
}

interface InvestmentByPeriodChartProps {
  periods: Period[];
  entries: CashFlowEntry[];
  virtualEntries: CashFlowEntry[];
  selectedIndex: number;
  onSelectPeriod?: (index: number) => void;
}

export function InvestmentByPeriodChart({
  periods,
  entries,
  virtualEntries,
  selectedIndex,
  onSelectPeriod,
}: InvestmentByPeriodChartProps) {
  const t = useTranslations('dashboard');
  // Recorrências = estimativas virtuais de recorrentes. Reais (inclui recorrentes
  // já efetivados) sempre aparecem; o flag liga/desliga só as projeções.
  const [showRecurrences, setShowRecurrences] = useState(true);

  const [itemWidth, setItemWidth] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCenteredIndexRef = useRef<number | null>(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, hasDragged: false });

  const onDragStart = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    dragRef.current = {
      active: true,
      startX: e.pageX,
      scrollLeft: scrollRef.current.scrollLeft,
      hasDragged: false,
    };
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.scrollBehavior = 'auto';
  };

  const onDragMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active || !scrollRef.current) return;
    const delta = e.pageX - dragRef.current.startX;
    if (Math.abs(delta) > 4) dragRef.current.hasDragged = true;
    scrollRef.current.scrollLeft = dragRef.current.scrollLeft - delta;
  };

  const onDragEnd = () => {
    dragRef.current.active = false;
    if (!scrollRef.current) return;
    scrollRef.current.style.cursor = '';
    scrollRef.current.style.scrollBehavior = '';
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (dragRef.current.hasDragged) {
      e.stopPropagation();
      dragRef.current.hasDragged = false;
    }
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const visibleItems = el.clientWidth < 480 ? 5 : 10;
    setItemWidth((el.clientWidth - ARROW_PADDING) / visibleItems);
  }, [periods.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth <= 0) return;
      const visibleItems = el.clientWidth < 480 ? 5 : 10;
      setItemWidth((el.clientWidth - ARROW_PADDING) / visibleItems);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    if (periods.length === 0) return [];
    let start = 0;
    let end = periods.length;
    if (periods.length > WINDOW) {
      start = Math.min(
        Math.max(selectedIndex - Math.floor(WINDOW / 2), 0),
        periods.length - WINDOW,
      );
      end = start + WINDOW;
    }
    return periods.slice(start, end).map((p, i) => {
      const [, sMonth, sDay] = p.startDate.split('-');
      // Período alinhado ao mês (começa no dia 1): rótulo é o mês.
      // Período que começa no meio do mês: rótulo é a data inicial (ex.: 20/07).
      const startsOnFirst = sDay === '01';
      const axisLabel = startsOnFirst
        ? new Date(p.startDate + 'T00:00:00')
            .toLocaleDateString(undefined, { month: 'short' })
            .replace('.', '')
        : `${sDay}/${sMonth}`;
      const realInv = sumInvestment(entries, p.startDate, p.endDate);
      const virtInv = showRecurrences ? sumInvestment(virtualEntries, p.startDate, p.endDate) : 0;
      return {
        idx: start + i,
        label: axisLabel,
        value: realInv + virtInv,
      };
    });
  }, [periods, selectedIndex, entries, virtualEntries, showRecurrences]);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = data.some((d) => d.value > 0);
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const formatAxisValue = (v: number) => formatCurrencyCompact(v).replace('R$', '').trim();

  // Mantém o período selecionado visível (centralizado) ao navegar pelo topo do painel.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || itemWidth <= 0 || data.length === 0) return;
    if (lastCenteredIndexRef.current === selectedIndex) return;
    const dataIdx = data.findIndex((d) => d.idx === selectedIndex);
    if (dataIdx < 0) return;
    const isFirstCenter = lastCenteredIndexRef.current === null;
    lastCenteredIndexRef.current = selectedIndex;
    const target = Math.max(dataIdx * itemWidth - el.clientWidth / 2 + itemWidth / 2, 0);
    el.scrollTo({ left: target, behavior: isFirstCenter ? 'auto' : 'smooth' });
  }, [selectedIndex, itemWidth, data]);

  const scrollByItems = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * itemWidth * 3, behavior: 'smooth' });
  };

  return (
    <Card className="bg-[#1c1a24] border-none rounded-[2rem] p-5 sm:p-7 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-blue-500 shrink-0">
            <PiggyBank className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white font-display leading-tight">
              {t('investedByPeriodTitle')}
            </h3>
            <p className="text-xs text-muted-foreground/60">{t('investedByPeriodSubtitle')}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
            {t('investedTotal')}
          </p>
          <p className="text-sm font-bold text-blue-500 font-display">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowRecurrences((v) => !v)}
          aria-pressed={showRecurrences}
          className={cn(
            'h-7 px-3 rounded-lg text-[11px] font-bold border transition-all',
            showRecurrences
              ? 'bg-primary/20 text-primary border-primary/40'
              : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white',
          )}
        >
          {t('investedRecurrences')}
        </button>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground/50 font-medium">
            {t('investedByPeriodEmpty')}
          </p>
        </div>
      ) : (
        <div className="flex gap-1">
          <div
            className="relative shrink-0 text-right"
            style={{ width: Y_AXIS_WIDTH, height: MAX_BAR_HEIGHT, marginTop: TOP_LABEL_HEIGHT }}
          >
            {GRID_TICKS.map((frac) => (
              <span
                key={frac}
                className="absolute right-0 pr-2 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground/40 leading-none"
                style={{ bottom: frac * MAX_BAR_HEIGHT }}
              >
                {formatAxisValue(maxValue * frac)}
              </span>
            ))}
          </div>

          <div className="relative flex-1 min-w-0 -mx-1">
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: TOP_LABEL_HEIGHT, height: MAX_BAR_HEIGHT }}
            >
              {GRID_TICKS.map((frac) => (
                <div
                  key={frac}
                  className="absolute left-0 right-0 border-t border-white/[0.06]"
                  style={{ bottom: frac * MAX_BAR_HEIGHT }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollByItems(-1)}
              aria-label={t('investedPreviousPeriods')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-lg bg-[#1c1a24]/90 text-muted-foreground/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              ref={scrollRef}
              className="relative flex overflow-x-auto px-7 scroll-smooth cursor-grab"
              style={{ scrollbarWidth: 'none' }}
              onMouseDown={onDragStart}
              onMouseMove={onDragMove}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onClickCapture={onClickCapture}
            >
              {data.map((d) => {
                const isSelected = d.idx === selectedIndex;
                const barHeight =
                  d.value > 0
                    ? Math.max(MIN_BAR_HEIGHT, (d.value / maxValue) * MAX_BAR_HEIGHT)
                    : MIN_BAR_HEIGHT;

                return (
                  <button
                    key={d.idx}
                    type="button"
                    onClick={() => onSelectPeriod?.(d.idx)}
                    className="shrink-0 flex flex-col items-center cursor-pointer"
                    style={{ minWidth: itemWidth || 44 }}
                  >
                    <div
                      className="relative flex items-end justify-center"
                      style={{ height: MAX_BAR_HEIGHT + TOP_LABEL_HEIGHT }}
                    >
                      {d.value > 0 && (
                        <span
                          className="absolute text-[8px] font-bold text-muted-foreground/60 leading-none whitespace-nowrap"
                          style={{ bottom: barHeight + LABEL_GAP }}
                        >
                          {formatCurrencyCompact(d.value)}
                        </span>
                      )}
                      <div
                        className="rounded-[4px] transition-all"
                        style={{
                          height: barHeight,
                          width: Math.max(8, (itemWidth || 44) * 0.55),
                          backgroundColor: INVEST_COLOR,
                          opacity: d.value === 0 ? 0.15 : isSelected ? 1 : 0.5,
                        }}
                      />
                    </div>
                    <span
                      className={cn(
                        'pt-2 text-[9px] font-bold leading-none',
                        isSelected ? 'text-blue-500' : 'text-muted-foreground/60',
                      )}
                    >
                      {d.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollByItems(1)}
              aria-label={t('investedNextPeriods')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-lg bg-[#1c1a24]/90 text-muted-foreground/60 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
