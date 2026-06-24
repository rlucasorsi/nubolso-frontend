'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useTranslations } from '@/i18n/useTranslations';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  month: controlledMonth,
  onMonthChange,
  defaultMonth,
  fromYear,
  toYear,
  ...props
}: CalendarProps) {
  const t = useTranslations('common');
  const today = new Date();
  const currentYear = today.getFullYear();

  // Derive initial month: controlled prop → defaultMonth → selected (if Date) → today
  const getInitialMonth = (): Date => {
    if (controlledMonth) return controlledMonth;
    if (defaultMonth) return defaultMonth;
    const sel = (props as { selected?: unknown }).selected;
    if (sel instanceof Date) return sel;
    return today;
  };

  const [month, setMonth] = React.useState<Date>(getInitialMonth);

  // Sync when controlled month prop changes externally
  React.useEffect(() => {
    if (controlledMonth) setMonth(controlledMonth);
  }, [controlledMonth]);

  const handleMonthChange = (newMonth: Date) => {
    setMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const isCurrentMonth =
    month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();

  const footer = !isCurrentMonth ? (
    <div className="pt-1 pb-1 flex justify-center border-t border-white/5">
      <button
        type="button"
        onClick={() => handleMonthChange(today)}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'text-xs text-primary hover:text-primary hover:bg-primary/10 h-7 px-3 rounded-lg',
        )}
      >
        {t('today')}
      </button>
    </div>
  ) : undefined;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      month={month}
      onMonthChange={handleMonthChange}
      captionLayout="dropdown-buttons"
      fromYear={fromYear ?? currentYear - 10}
      toYear={toYear ?? currentYear + 10}
      footer={footer}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'hidden',
        caption_dropdowns: 'flex gap-1 items-center',
        dropdown:
          'appearance-none bg-white/5 border border-white/10 text-sm text-foreground rounded-lg px-2 py-1 cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-primary/50',
        dropdown_month: 'w-[7.5rem]',
        dropdown_year: 'w-[5rem]',
        vhidden: 'hidden',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
