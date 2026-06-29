'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TextInputField,
  AmountInputField,
  DateInputField,
  NumberInputField,
} from '@/components/ui/form-field';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PurchaseSimulationPreview } from './PurchaseSimulationPreview';
import type { SimulatePurchaseResponse } from '@/modules/credit-cards/model/api/purchase';
import type {
  PurchaseInputMode,
  PurchaseStrategy,
} from '@/modules/credit-cards/hooks/use-purchase-form';
import { useTranslations } from '@/i18n/useTranslations';

interface CreditPurchaseFieldsProps {
  description: string;
  onDescriptionChange: (v: string) => void;
  inputMode: PurchaseInputMode;
  onInputModeChange: (v: PurchaseInputMode) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  amountError?: string;
  installmentsCount: number;
  onInstallmentsCountChange: (v: number) => void;
  strategy: PurchaseStrategy;
  onStrategyChange: (v: PurchaseStrategy) => void;
  computedTotal: number | null;
  purchaseDate: string;
  onPurchaseDateChange: (v: string) => void;
  purchaseDateError?: string;
  minDate?: string;
  apiError?: string | null;
  simulation?: SimulatePurchaseResponse;
  isSimulating: boolean;
}

export function CreditPurchaseFields({
  description,
  onDescriptionChange,
  inputMode,
  onInputModeChange,
  amount,
  onAmountChange,
  amountError,
  installmentsCount,
  onInstallmentsCountChange,
  strategy,
  onStrategyChange,
  computedTotal,
  purchaseDate,
  onPurchaseDateChange,
  purchaseDateError,
  minDate,
  apiError,
  simulation,
  isSimulating,
}: CreditPurchaseFieldsProps) {
  const t = useTranslations('creditPurchase');
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);

  return (
    <>
      <TextInputField
        label={t('descriptionLabel')}
        placeholder={t('descriptionPlaceholder')}
        value={description}
        onChange={onDescriptionChange}
      />

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
          {t('inputMode')}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onInputModeChange('total');
              onAmountChange('');
            }}
            className={cn(
              'flex-1 h-10 rounded-xl text-sm font-bold transition-all',
              inputMode === 'total'
                ? 'bg-primary text-white'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
            )}
          >
            {t('totalAmount')}
          </button>
          <button
            type="button"
            onClick={() => {
              onInputModeChange('installment');
              onAmountChange('');
            }}
            className={cn(
              'flex-1 h-10 rounded-xl text-sm font-bold transition-all',
              inputMode === 'installment'
                ? 'bg-primary text-white'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
            )}
          >
            {t('installmentAmount')}
          </button>
        </div>
      </div>

      <AmountInputField
        label={inputMode === 'total' ? t('totalAmount') : t('installmentAmount')}
        required
        value={amount}
        onChange={onAmountChange}
        error={amountError}
      />

      <NumberInputField
        label={t('numberOfInstallments')}
        value={installmentsCount}
        onChange={onInstallmentsCountChange}
        min={1}
        max={48}
      />

      {installmentsCount > 1 && (
        <Collapsible open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors pl-1">
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', moreOptionsOpen && 'rotate-180')}
            />
            {t('moreOptions')}
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
              {t('centDifference')}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onStrategyChange('FIRST')}
                className={cn(
                  'flex-1 h-10 rounded-xl text-sm font-bold transition-all',
                  strategy === 'FIRST'
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
                )}
              >
                {t('firstInstallment')}
              </button>
              <button
                type="button"
                onClick={() => onStrategyChange('LAST')}
                className={cn(
                  'flex-1 h-10 rounded-xl text-sm font-bold transition-all',
                  strategy === 'LAST'
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
                )}
              >
                {t('lastInstallment')}
              </button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {computedTotal !== null && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('purchaseTotal')}
          </span>
          <span className="text-sm font-black font-display text-white">
            R${' '}
            {computedTotal.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      )}

      <DateInputField
        label={t('purchaseDate')}
        required
        value={purchaseDate}
        onChange={onPurchaseDateChange}
        minDate={minDate}
        error={purchaseDateError}
      />

      {apiError && <p className="text-xs text-destructive text-center">{apiError}</p>}

      <PurchaseSimulationPreview simulation={simulation} isLoading={isSimulating} />
    </>
  );
}
