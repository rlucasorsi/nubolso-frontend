'use client';

import type { ReactNode } from 'react';
import { FlowType } from '@/lib/cashflow';
import { EndType, PaymentMode } from '@/lib/schemas/recurring-templates';
import { TypeToggle } from './TypeToggle';
import { CategorySelect } from './CategorySelect';
import {
  TextInputField,
  AmountInputField,
  NumberInputField,
  DateInputField,
} from '@/components/ui/form-field';
import { CreditCardSelect } from '@/components/credit-cards/CreditCardSelect';
import { useGetCreditCards } from '@/modules/credit-cards/hooks/use-get-credit-cards';
import { cn } from '@/lib/utils';
import { Wallet, CreditCard as CreditCardIcon } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';

export interface RecurringTemplateFormValues {
  description: string;
  estimatedAmount: string;
  type: FlowType;
  dayOfMonth: number;
  categoryId?: string;
  // UI-only discriminator (like endType): 'credit' reveals the card select
  paymentMode: PaymentMode;
  creditCardId?: string;
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
    creditCardId?: string;
  };
}

export function RecurringTemplateForm({ values, onChange, errors }: RecurringTemplateFormProps) {
  const t = useTranslations('recurringForm');
  const { data: creditCards, isLoading: isLoadingCards } = useGetCreditCards();
  const activeCards = (creditCards ?? []).filter((card) => card.isActive);

  const changeEndType = (endType: EndType) =>
    onChange({ ...values, endType, endDate: undefined, totalOccurrences: undefined });

  const changePaymentMode = (paymentMode: PaymentMode) =>
    onChange({
      ...values,
      paymentMode,
      // Débito nunca carrega cartão; ao voltar para débito, limpamos o vínculo
      creditCardId: paymentMode === 'debit' ? undefined : values.creditCardId,
    });

  const END_OPTIONS: { value: EndType; label: string }[] = [
    { value: 'none', label: t('noDeadline') },
    { value: 'date', label: t('byDate') },
    { value: 'count', label: t('byOccurrences') },
  ];

  const PAYMENT_OPTIONS: { value: PaymentMode; label: string; icon: ReactNode }[] = [
    { value: 'debit', label: t('debit'), icon: <Wallet className="h-4 w-4" /> },
    { value: 'credit', label: t('credit'), icon: <CreditCardIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('entryType')} <span className="text-balance-danger">*</span>
        </label>
        <TypeToggle
          value={values.type}
          onChange={(type) =>
            // Receita não vai no cartão: volta para débito e limpa o vínculo
            onChange({
              ...values,
              type,
              paymentMode: type === 'income' ? 'debit' : values.paymentMode,
              creditCardId: type === 'income' ? undefined : values.creditCardId,
              // Categorias são por tipo: ao trocar o tipo, limpa a categoria selecionada.
              categoryId: type === values.type ? values.categoryId : undefined,
            })
          }
        />
      </div>

      {values.type !== 'income' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('paymentMethod')}
          </label>
          <div className="flex gap-2">
            {PAYMENT_OPTIONS.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => changePaymentMode(value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 h-12 rounded-xl text-xs font-bold border transition-all',
                  values.paymentMode === value
                    ? 'bg-primary/20 text-primary border-primary/50'
                    : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10',
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {values.paymentMode === 'credit' &&
            (activeCards.length > 0 || isLoadingCards ? (
              <div className="space-y-1.5 pt-1">
                <CreditCardSelect
                  cards={activeCards}
                  value={values.creditCardId}
                  onChange={(creditCardId) =>
                    onChange({ ...values, creditCardId: creditCardId || undefined })
                  }
                  isLoading={isLoadingCards}
                  error={errors?.creditCardId}
                />
                <p className="text-xs text-muted-foreground/60 pl-1">{t('creditCardHint')}</p>
              </div>
            ) : (
              <p className="pt-1 text-xs text-muted-foreground/70">{t('noCardsHint')}</p>
            ))}
        </div>
      )}

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

      <CategorySelect
        type={values.type}
        value={values.categoryId}
        onChange={(categoryId) => onChange({ ...values, categoryId })}
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
