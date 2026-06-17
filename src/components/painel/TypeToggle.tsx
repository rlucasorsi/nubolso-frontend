import { FlowType } from '@/lib/cashflow';

const TYPE_LABELS: Record<FlowType, string> = {
  income: 'Receita',
  expense: 'Despesa',
  spending: 'Gasto',
};

const ACTIVE_STYLES: Record<FlowType, string> = {
  income: 'bg-success/20 text-success border-success/50 shadow-[0_0_10px_rgba(74,222,128,0.2)]',
  expense: 'bg-error/20 text-error border-error/50 shadow-[0_0_10px_rgba(248,113,113,0.2)]',
  spending: 'bg-warning/20 text-warning border-warning/50 shadow-[0_0_10px_rgba(251,146,60,0.2)]',
};

interface TypeToggleProps {
  value: FlowType;
  onChange: (v: FlowType) => void;
}

export function TypeToggle({ value, onChange }: TypeToggleProps) {
  return (
    <div className="flex gap-2">
      {(['income', 'expense', 'spending'] as FlowType[]).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`flex-1 flex items-center justify-center py-2 h-12 text-[12px] font-bold rounded-xl transition-all duration-300 border ${
            value === t
              ? ACTIVE_STYLES[t]
              : 'border-white/5 bg-surface-container text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          {TYPE_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
