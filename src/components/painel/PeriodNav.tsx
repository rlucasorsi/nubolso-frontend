import { Period } from '@/lib/cashflow';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const period = periods[periodIdx];

  const formatCycleDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  };

  const cycleText = `Ciclo: ${formatCycleDate(period.startDate)} - ${formatCycleDate(period.endDate)}`;

  return (
    <div className="flex flex-col gap-1.5 py-0.5 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            disabled={periodIdx === 0}
            className="p-1 rounded-lg text-muted-foreground/40 disabled:opacity-0 hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <span className="text-sm font-bold text-muted-foreground tracking-widest font-display leading-none min-w-[140px]">
            {period.label.toUpperCase().split(' / ')[0]} {period.label.includes('/') ? `/ ${period.label.split(' / ')[1].toUpperCase()}` : ''}
          </span>

          <button
            onClick={onNext}
            disabled={periodIdx === periods.length - 1}
            className="p-1 rounded-lg text-muted-foreground/40 disabled:opacity-0 hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onToday && !isCurrentPeriod && (
            <button
              onClick={onToday}
              className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-primary/40 text-primary hover:border-primary hover:bg-primary/5 transition-colors"
            >
              Hoje
            </button>
          )}
          <span className="text-sm font-bold text-muted-foreground tracking-widest font-display leading-none">
            {period.startDate.split('-')[0]}
          </span>
        </div>
      </div>

      <div className="pl-8">
        <span className="text-[9px] font-medium text-muted-foreground/40 leading-none tracking-wide">
          {cycleText}
        </span>
      </div>
    </div>
  );
}
