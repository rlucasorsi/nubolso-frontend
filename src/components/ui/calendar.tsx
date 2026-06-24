'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import type { Locale } from 'date-fns';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useTranslations } from '@/i18n/useTranslations';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

type View = 'days' | 'months' | 'years';

// DayPicker with fixedWeeks renders exactly: head (h-9=36px) + 6 rows × (h-9+mt-2=44px) = 300px
const BODY_HEIGHT = 300;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  month: controlledMonth,
  onMonthChange,
  defaultMonth,
  fromYear,
  toYear,
  locale,
  ...props
}: CalendarProps & { locale?: Locale }) {
  const t = useTranslations('common');
  const today = new Date();
  const currentYear = today.getFullYear();
  const minYear = fromYear ?? currentYear - 10;
  const maxYear = toYear ?? currentYear + 10;

  const getInitialMonth = (): Date => {
    if (controlledMonth) return controlledMonth;
    if (defaultMonth) return defaultMonth;
    const sel = (props as { selected?: unknown }).selected;
    if (sel instanceof Date) return sel;
    return today;
  };

  const [month, setMonth] = React.useState<Date>(getInitialMonth);
  const [view, setView] = React.useState<View>('days');

  React.useEffect(() => {
    if (controlledMonth) setMonth(controlledMonth);
  }, [controlledMonth]);

  const changeMonth = (next: Date) => {
    setMonth(next);
    onMonthChange?.(next);
  };

  const navigate = (direction: 1 | -1) => {
    const next = new Date(month);
    if (view === 'days') next.setMonth(next.getMonth() + direction);
    else if (view === 'months') next.setFullYear(next.getFullYear() + direction);
    else next.setFullYear(next.getFullYear() + direction * 12);
    changeMonth(next);
  };

  const monthLabel = format(month, 'MMMM', { locale });
  const year = month.getFullYear();

  const isCurrentMonth =
    month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();

  const monthAbbrevs = Array.from({ length: 12 }, (_, i) =>
    format(new Date(2000, i, 1), 'MMM', { locale }).replace('.', ''),
  );

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  const navBtn = cn(
    buttonVariants({ variant: 'outline' }),
    'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-white/10',
  );

  return (
    <div className={cn('p-3 select-none min-w-[276px]', className)}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setView((v) => (v === 'months' ? 'days' : 'months'))}
            className="text-sm font-medium capitalize hover:text-primary transition-colors"
          >
            {monthLabel}
          </button>
          <button
            type="button"
            onClick={() => setView((v) => (v === 'years' ? 'days' : 'years'))}
            className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
          >
            {year}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform text-muted-foreground',
                view === 'years' && 'rotate-180',
              )}
            />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => navigate(-1)} className={navBtn}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => navigate(1)} className={navBtn}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Fixed-height body — all three views occupy the same BODY_HEIGHT */}
      <div style={{ height: BODY_HEIGHT }}>
        {view === 'days' && (
          <DayPicker
            showOutsideDays={showOutsideDays}
            fixedWeeks
            month={month}
            onMonthChange={changeMonth}
            locale={locale}
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'hidden',
              nav: 'hidden',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-middle)]:bg-accent first:[&:has([aria-selected].day-range-middle)]:rounded-l-md last:[&:has([aria-selected].day-range-middle)]:rounded-r-md focus-within:relative focus-within:z-20',
              day: cn(
                buttonVariants({ variant: 'ghost' }),
                'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
              ),
              day_range_end: 'day-range-end',
              day_selected:
                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
              day_today: 'border border-primary rounded-full',
              day_outside:
                'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
              day_disabled: 'text-muted-foreground opacity-50',
              day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
              day_hidden: 'invisible',
              ...classNames,
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
            {...props}
          />
        )}

        {view === 'months' && (
          <div className="grid grid-cols-3 gap-x-3 h-full content-around items-center">
            {monthAbbrevs.map((abbr, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const next = new Date(month);
                  next.setMonth(i);
                  changeMonth(next);
                  setView('days');
                }}
                className={cn(
                  'py-1.5 rounded-lg text-sm font-medium transition-colors',
                  i === month.getMonth()
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-white/10 text-foreground',
                )}
              >
                {abbr}
              </button>
            ))}
          </div>
        )}

        {view === 'years' && (
          <div className="grid grid-cols-4 gap-x-2 h-full content-around items-center overflow-y-auto">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  const next = new Date(month);
                  next.setFullYear(y);
                  changeMonth(next);
                  setView('days');
                }}
                className={cn(
                  'py-1.5 rounded-lg text-sm font-medium transition-colors',
                  y === year
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-white/10 text-foreground',
                )}
              >
                {y}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Today button — outside fixed body so it doesn't shift height */}
      {view === 'days' && !isCurrentMonth && (
        <div className="mt-2 flex justify-center border-t border-white/5 pt-2">
          <button
            type="button"
            onClick={() => changeMonth(today)}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-xs text-primary hover:text-primary hover:bg-primary/10 h-7 px-3 rounded-lg',
            )}
          >
            {t('today')}
          </button>
        </div>
      )}
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
