import { ExpenseType, FlowType } from '@/lib/cashflow';
import { TypeToggle } from './TypeToggle';
import { TextInputField, AmountInputField, DateInputField } from '@/components/ui/form-field';
import { useTranslations } from '@/i18n/useTranslations';
import { cn } from '@/lib/utils';
import { ExpenseTypeHint } from './ExpenseTypeHelp';

export interface EntryFormValues {
  date: string;
  amount: string;
  type: FlowType;
  description: string;
  categoryId?: string;
  tipoDespesa?: ExpenseType;
}

// tipoDespesa só existe para despesas — para receita/investimento é sempre null.
export function resolveTipoDespesa(
  values: Pick<EntryFormValues, 'type' | 'tipoDespesa'>,
): ExpenseType {
  return values.type === 'expense' ? (values.tipoDespesa ?? null) : null;
}

interface EntryFormProps {
  values: EntryFormValues;
  onChange: (values: EntryFormValues) => void;
  errors?: { date?: string; amount?: string; tipoDespesa?: string };
  minDate?: string;
}

export function EntryForm({ values, onChange, errors, minDate }: EntryFormProps) {
  const t = useTranslations('entry');

  const expenseTypeOptions: { value: 'fixa' | 'variavel'; label: string }[] = [
    { value: 'fixa', label: t('expenseTypeFixed') },
    { value: 'variavel', label: t('expenseTypeVariable') },
  ];

  return (
    <div className="space-y-4">
      <DateInputField
        label={t('entryDate')}
        required
        value={values.date}
        onChange={(date) => onChange({ ...values, date })}
        minDate={minDate}
        error={errors?.date}
      />

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('typeLabel')} <span className="text-balance-danger">*</span>
        </label>
        <TypeToggle
          value={values.type}
          onChange={(type) =>
            onChange({
              ...values,
              type,
              // Ao sair de "despesa", zera a classificação (regra: null para outros tipos).
              tipoDespesa: type === 'expense' ? values.tipoDespesa : null,
            })
          }
        />
      </div>

      {values.type === 'expense' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('expenseTypeLabel')} <span className="text-balance-danger">*</span>
          </label>
          <div className="flex gap-2">
            {expenseTypeOptions.map((opt) => {
              const active = values.tipoDespesa === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...values, tipoDespesa: opt.value })}
                  className={cn(
                    'flex-1 flex items-center justify-center py-2 h-11 text-[12px] font-bold rounded-xl transition-all duration-300 border',
                    active
                      ? 'bg-primary/20 text-primary border-primary/50'
                      : 'border-white/5 bg-surface-container text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {errors?.tipoDespesa && (
            <p className="text-xs text-balance-danger">{errors.tipoDespesa}</p>
          )}
          <div className="pt-0.5">
            <ExpenseTypeHint />
          </div>
        </div>
      )}

      <TextInputField
        label={t('descriptionLabel')}
        placeholder={t('descriptionLabel')}
        value={values.description}
        onChange={(description) => onChange({ ...values, description })}
      />

      <AmountInputField
        label={t('amount')}
        required
        value={values.amount}
        onChange={(amount) => onChange({ ...values, amount })}
        error={errors?.amount}
      />
    </div>
  );
}
