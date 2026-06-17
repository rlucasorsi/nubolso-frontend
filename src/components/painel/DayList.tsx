import { useState } from 'react';
import { Period, CashFlowEntry } from '@/lib/cashflow';
import { DayCard } from './DayCard';
import { DailyEntriesState } from './DailyEntriesDrawer';
import { useCashFlow } from '@/hooks/useCashFlow';

interface DayListProps {
  period: Period;
  today: string;
  onOpenSheet: (state: DailyEntriesState) => void;
  onAddEntry: (entry: Omit<CashFlowEntry, 'id'>) => void;
}

export function DayList({
  period,
  today,
  onOpenSheet,
  onAddEntry,
}: DayListProps) {
  const { balanceSettings } = useCashFlow();
  const [expandedDate, setExpandedDate] = useState<string | null>(today);

  function toggleDay(date: string) {
    setExpandedDate((prev) => (prev === date ? null : date));
  }

  return (
    <div className="px-4 space-y-2 pb-6">
      {period.days.map((day) => (
        <DayCard
          key={day.date}
          day={day}
          isExpanded={expandedDate === day.date}
          isToday={day.date === today}
          balanceSettings={balanceSettings}
          onToggle={() => toggleDay(day.date)}
          onOpenSheet={(date, filter) => onOpenSheet({ date, filter })}
          onAddEntry={onAddEntry}
        />
      ))}
    </div>
  );
}