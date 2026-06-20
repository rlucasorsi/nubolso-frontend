'use client';

import { TextInputField, NumberInputField } from '@/components/ui/form-field';
import { useTranslations } from 'next-intl';

export interface CreditCardFormValues {
  name: string;
  closingDay: number;
  dueDay: number;
  paymentDay: number;
}

interface CreditCardFormProps {
  values: CreditCardFormValues;
  onChange: (values: CreditCardFormValues) => void;
  error?: string;
}

export function CreditCardForm({ values, onChange, error }: CreditCardFormProps) {
  const t = useTranslations('creditCardForm');
  return (
    <div className="space-y-4">
      <TextInputField
        label={t('cardName')}
        required
        placeholder="Ex: Nubank, Inter, Itaú..."
        value={values.name}
        onChange={(name) => onChange({ ...values, name })}
        error={error}
      />

      <NumberInputField
        label={t('closingDay')}
        value={values.closingDay}
        onChange={(closingDay) => onChange({ ...values, closingDay })}
        min={1}
        max={31}
      />

      <NumberInputField
        label={t('dueDay')}
        value={values.dueDay}
        onChange={(dueDay) => onChange({ ...values, dueDay })}
        min={1}
        max={31}
      />

      <div className="space-y-2">
        <NumberInputField
          label={t('paymentDay')}
          value={values.paymentDay}
          onChange={(paymentDay) => onChange({ ...values, paymentDay })}
          min={1}
          max={31}
        />
        <p className="text-xs text-muted-foreground pl-1">
          {t('paymentDayNote')}
        </p>
      </div>
    </div>
  );
}
