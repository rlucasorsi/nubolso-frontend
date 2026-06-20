'use client';

import { FlowType } from '@/lib/cashflow';
import { EndType } from '@/lib/schemas/recurring-templates';
import { TypeToggle } from './TypeToggle';
import { TextInputField, AmountInputField, NumberInputField, DateInputField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/useTranslations';

export interface RecurringTemplateFormValues {
  description: string;
  estimatedAmount: string;
  type: FlowType;
  dayOfMonth: number;
  categoryId?: string;
  endType: EndType;
  endDate?: string;
  totalOccurrences?: number;
}

interface RecurringTemplateFormProps {
  values: RecurringTemplateFormValues;
  onChange: (values: RecurringTemplateFormValues) => void;
  errors?: {
    estimatedAmount?: string;
    endDate?: string;
    totalOccurrences?: string;
  };
}

export function RecurringTemplateForm({ values, onChange, errors }: RecurringTemplateFormProps) {
  const t = useTranslations('recurringForm');
  const changeEndType = (endType: EndType) =>
    onChange({ ...values, endType, endDate: undefined, totalOccurrences: undefined });

  const END_OPTIONS: { value: EndType; label: string }[] = [
    { value: 'none', label: t('noDeadline') },
    { value: 'date', label: t('byDate') },
    { value: 'count', label: t('byOccurrences') },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('entryType')} <span className="text-balance-danger">*</span>
        </label>
        <TypeToggle
          value={values.type}
          onChange={(type) => onChange({ ...values, type })}
        />
      </div>

      <TextInputField
        label={t('description')}
        required
        placeholder={t('descriptionPlaceholder')}
        value={values.description}
        onChange={(description) => onChange({ ...values, description })}
      />

      <AmountInputField
        label={t('estimatedAmount')}
        required
        value={values.estimatedAmount}
        onChange={(estimatedAmount) => onChange({ ...values, estimatedAmount })}
        error={errors?.estimatedAmount}
      />

      <NumberInputField
        label={t('dueDay')}
        value={values.dayOfMonth}
        onChange={(dayOfMonth) => onChange({ ...values, dayOfMonth })}
        min={1}
        max={31}
      />

      <div className="space-y-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('termination')}
        </label>
        <div className="flex gap-2">
          {END_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => changeEndType(value)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                values.endType === value
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {values.endType === 'date' && (
          <DateInputField
            label={t('endDate')}
            required
            value={values.endDate ?? ''}
            onChange={(endDate) => onChange({ ...values, endDate })}
            error={errors?.endDate}
          />
        )}

        {values.endType === 'count' && (
          <NumberInputField
            label={t('occurrences')}
            value={values.totalOccurrences ?? 1}
            onChange={(totalOccurrences) => onChange({ ...values, totalOccurrences })}
            min={1}
            max={600}
            error={errors?.totalOccurrences}
          />
        )}
      </div>
    </div>
  );
}

