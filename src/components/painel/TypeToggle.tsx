import { FlowType } from '@/lib/cashflow';
import { useTranslations } from '@/i18n/useTranslations';

const ACTIVE_STYLES: Record<FlowType, string> = {
  income: 'bg-success/20 text-success border-success/50 shadow-[0_0_10px_rgba(74,222,128,0.2)]',
  expense: 'bg-error/20 text-error border-error/50 shadow-[0_0_10px_rgba(248,113,113,0.2)]',
  investment:
    'bg-blue-500/20 text-blue-500 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
};

interface TypeToggleProps {
  value: FlowType;
  onChange: (v: FlowType) => void;
  disabled?: boolean;
}

export function TypeToggle({ value, onChange, disabled }: TypeToggleProps) {
  const t = useTranslations('entry');

  const TYPE_LABELS: Record<FlowType, string> = {
    income: t('income'),
    expense: t('expense'),
    investment: t('investment'),
  };

  return (
    <div className="flex gap-2">
      {(['income', 'expense', 'investment'] as FlowType[]).map((type) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onChange(type)}
          className={`flex-1 flex items-center justify-center py-2 h-12 text-[12px] font-bold rounded-xl transition-all duration-300 border disabled:cursor-not-allowed disabled:opacity-60 ${
            value === type
              ? ACTIVE_STYLES[type]
              : 'border-white/5 bg-surface-container text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          {TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  );
}
