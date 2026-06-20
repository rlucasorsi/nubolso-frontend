import { useEffect, useMemo, useState } from 'react';
import { EntryForm, EntryFormValues } from './EntryForm';
import { entryFormSchema } from '@/lib/schemas/transactions';
import { Button } from '@/components/ui/button';
import { AddButton } from '@/components/ui/add-button';
import { FlowType } from '@/lib/cashflow';
import { cn } from '@/lib/utils';
import { Wallet, CreditCard as CreditCardIcon } from 'lucide-react';
import { useTranslations } from '@/i18n/useTranslations';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { CreditCardSelect } from '@/components/credit-cards/CreditCardSelect';
import { CreditPurchaseFields } from '@/components/credit-cards/CreditPurchaseFields';
import { useGetCreditCards } from '@/modules/credit-cards/hooks/use-get-credit-cards';
import { usePurchaseForm } from '@/modules/credit-cards/hooks/use-purchase-form';

type EntryMode = 'debit' | 'credit';

interface AddEntryDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onSave: (values: EntryFormValues) => void;
  onCancel: () => void;
  defaultType?: FlowType;
  defaultDate?: string;
  minDate?: string;
}

export function AddEntryDrawer({
  isOpen,
  onOpen,
  onSave,
  onCancel,
  defaultType = 'income',
  defaultDate,
  minDate,
}: AddEntryDrawerProps) {
  const t = useTranslations('entry');
  const getInitialDate = () => defaultDate || new Date().toISOString().split('T')[0];

  const [mode, setMode] = useState<EntryMode>('debit');

  const [values, setValues] = useState<EntryFormValues>({
    date: getInitialDate(),
    amount: '',
    type: defaultType,
    description: '',
  });
  const [entryErrors, setEntryErrors] = useState<{ date?: string; amount?: string }>({});

  const cardsQuery = useGetCreditCards();
  const activeCards = useMemo(() => (cardsQuery.data ?? []).filter((c) => c.isActive), [cardsQuery.data]);
  const [purchaseCardId, setPurchaseCardId] = useState<string | undefined>(undefined);

  const purchaseForm = usePurchaseForm({
    isOpen,
    cardId: purchaseCardId,
    defaultDate,
    enabled: mode === 'credit',
  });

  useEffect(() => {
    if (!isOpen) return;
    setMode('debit');
    setValues({
      date: getInitialDate(),
      amount: '',
      type: defaultType,
      description: '',
    });
    setEntryErrors({});
    setPurchaseCardId(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultType, defaultDate]);

  useEffect(() => {
    if (isOpen && !purchaseCardId && activeCards.length > 0) {
      setPurchaseCardId(activeCards[0].id);
    }
  }, [isOpen, purchaseCardId, activeCards]);

  function handleSave() {
    const result = entryFormSchema.safeParse(values);
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setEntryErrors({ date: errs.date?.[0], amount: errs.amount?.[0] });
      return;
    }

    setEntryErrors({});
    onSave(values);

    setValues({
      date: getInitialDate(),
      amount: '',
      type: defaultType,
      description: '',
      categoryId: undefined,
    });
  }

  function handleCancel() {
    setValues({
      date: getInitialDate(),
      amount: '',
      type: defaultType,
      description: '',
    });
    setEntryErrors({});
    onCancel();
  }

  return (
    <>
      <AddButton onClick={onOpen} label={t('addButtonLabel')} />

      <Sheet open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader onClose={handleCancel}>
            <SheetTitle className="text-2xl font-bold font-display text-primary">
              {t('newEntry')}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {t('description')}
            </p>
          </DrawerHeader>

          <div className="flex-1 px-6 py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                {t('entryType')}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('debit')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 h-12 text-xs font-bold rounded-xl transition-all duration-300 border',
                    mode === 'debit'
                      ? 'bg-primary/20 text-primary border-primary/50 shadow-glow'
                      : 'border-white/5 bg-surface-container text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  <Wallet className="h-4 w-4" />
                  {t('debit')}
                </button>
                <button
                  type="button"
                  onClick={() => activeCards.length > 0 && setMode('credit')}
                  disabled={activeCards.length === 0}
                  title={activeCards.length === 0 ? t('registerCardHint') : undefined}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 h-12 text-xs font-bold rounded-xl transition-all duration-300 border',
                    mode === 'credit'
                      ? 'bg-primary/20 text-primary border-primary/50 shadow-glow'
                      : activeCards.length === 0
                        ? 'border-white/5 bg-surface-container/50 text-muted-foreground/30 cursor-not-allowed'
                        : 'border-white/5 bg-surface-container text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  <CreditCardIcon className="h-4 w-4" />
                  {t('credit')}
                </button>
              </div>
              {activeCards.length === 0 && (
                <p className="text-[10px] text-muted-foreground/60 font-medium pl-1">
                  {t('registerCardDescription')}
                </p>
              )}
            </div>

            {mode === 'debit' ? (
              <EntryForm values={values} onChange={setValues} errors={entryErrors} minDate={minDate} />
            ) : (
              <div className="space-y-4">
                <CreditCardSelect
                  cards={activeCards}
                  value={purchaseCardId}
                  onChange={setPurchaseCardId}
                  isLoading={cardsQuery.isLoading}
                />

                <CreditPurchaseFields
                  description={purchaseForm.description}
                  onDescriptionChange={purchaseForm.setDescription}
                  inputMode={purchaseForm.inputMode}
                  onInputModeChange={purchaseForm.setInputMode}
                  amount={purchaseForm.amount}
                  onAmountChange={purchaseForm.setAmount}
                  amountError={purchaseForm.errors.amount}
                  installmentsCount={purchaseForm.installmentsCount}
                  onInstallmentsCountChange={purchaseForm.setInstallmentsCount}
                  strategy={purchaseForm.strategy}
                  onStrategyChange={purchaseForm.setStrategy}
                  computedTotal={purchaseForm.computedTotal}
                  purchaseDate={purchaseForm.purchaseDate}
                  onPurchaseDateChange={purchaseForm.setPurchaseDate}
                  purchaseDateError={purchaseForm.errors.purchaseDate}
                  minDate={minDate}
                  apiError={purchaseForm.apiError}
                  simulation={purchaseForm.adjustedSimulation}
                  isSimulating={purchaseForm.isSimulating}
                />
              </div>
            )}
          </div>

          <DrawerFooter>
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
              onClick={handleCancel}
              disabled={purchaseForm.isConfirming}
            >
              {t('cancel')}
            </Button>

            {mode === 'debit' ? (
              <Button
                className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all"
                onClick={handleSave}
              >
                {t('save')}
              </Button>
            ) : (
              <Button
                className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all"
                onClick={() => purchaseForm.handleConfirm(onCancel)}
                disabled={!purchaseForm.isValid || purchaseForm.isConfirming}
              >
                {purchaseForm.isConfirming ? t('confirming') : t('confirmPurchase')}
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Sheet>
    </>
  );
}

