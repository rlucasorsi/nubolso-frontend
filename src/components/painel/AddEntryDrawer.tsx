import { useEffect, useMemo, useState } from 'react';
import { EntryForm, EntryFormValues } from './EntryForm';
import { entryFormSchema } from '@/lib/schemas/transactions';
import { purchaseFormSchema } from '@/lib/schemas/credit-cards';
import { Button } from '@/components/ui/button';
import { AddButton } from '@/components/ui/add-button';
import { FlowType } from '@/lib/cashflow';
import { cn } from '@/lib/utils';
import { Wallet, CreditCard as CreditCardIcon } from 'lucide-react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { TextInputField, AmountInputField, DateInputField, NumberInputField } from '@/components/ui/form-field';
import { CreditCardSelect } from '@/components/credit-cards/CreditCardSelect';
import { PurchaseSimulationPreview } from '@/components/credit-cards/PurchaseSimulationPreview';
import { useGetCreditCards } from '@/modules/credit-cards/hooks/use-get-credit-cards';
import { useSimulatePurchase } from '@/modules/credit-cards/hooks/use-simulate-purchase';
import { useCreatePurchase } from '@/modules/credit-cards/hooks/use-create-purchase';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

type EntryMode = 'debito' | 'credito';

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
  const getInitialDate = () => defaultDate || new Date().toISOString().split('T')[0];

  const [mode, setMode] = useState<EntryMode>('debito');

  // Débito (entrada/saída/gasto avulso)
  const [values, setValues] = useState<EntryFormValues>({
    date: getInitialDate(),
    amount: '',
    type: defaultType,
    description: '',
  });
  const [entryErrors, setEntryErrors] = useState<{ date?: string; amount?: string }>({});

  // Crédito (compra parcelada no cartão)
  const cardsQuery = useGetCreditCards();
  const activeCards = useMemo(() => (cardsQuery.data ?? []).filter((c) => c.isActive), [cardsQuery.data]);
  const simulateMutation = useSimulatePurchase();
  const createPurchaseMutation = useCreatePurchase();

  const [purchaseCardId, setPurchaseCardId] = useState<string | undefined>(undefined);
  const [purchaseDescription, setPurchaseDescription] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState(getInitialDate());
  const [purchaseErrors, setPurchaseErrors] = useState<{ amount?: string; purchaseDate?: string }>({});
  const [purchaseApiError, setPurchaseApiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('debito');

      setValues({
        date: getInitialDate(),
        amount: '',
        type: defaultType,
        description: '',
      });
      setEntryErrors({});

      setPurchaseCardId(undefined);
      setPurchaseDescription('');
      setPurchaseAmount('');
      setInstallmentsCount(1);
      setPurchaseDate(getInitialDate());
      setPurchaseErrors({});
      setPurchaseApiError(null);
      simulateMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultType, defaultDate]);

  // Pré-seleciona o primeiro cartão ativo assim que a lista carregar.
  useEffect(() => {
    if (isOpen && !purchaseCardId && activeCards.length > 0) {
      setPurchaseCardId(activeCards[0].id);
    }
  }, [isOpen, purchaseCardId, activeCards]);

  const numericPurchaseAmount = parseFloat(purchaseAmount.replace(',', '.'));
  const isPurchaseValid =
    !!purchaseCardId &&
    purchaseAmount !== '' &&
    !Number.isNaN(numericPurchaseAmount) &&
    numericPurchaseAmount > 0 &&
    purchaseDate !== '';

  // Preview com debounce: re-simula sempre que o formulário de crédito é válido e muda.
  useEffect(() => {
    if (mode !== 'credito' || !isOpen || !isPurchaseValid || !purchaseCardId) return;

    const timeout = setTimeout(() => {
      simulateMutation.mutate({
        cardId: purchaseCardId,
        description: purchaseDescription,
        totalAmount: numericPurchaseAmount,
        installmentsCount,
        purchaseDate,
      });
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isOpen, purchaseCardId, purchaseDescription, numericPurchaseAmount, installmentsCount, purchaseDate, isPurchaseValid]);

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

  async function handleConfirmPurchase() {
    const result = purchaseFormSchema.safeParse({
      cardId: purchaseCardId ?? '',
      description: purchaseDescription,
      amount: purchaseAmount,
      installmentsCount,
      purchaseDate,
    });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setPurchaseErrors({ amount: errs.amount?.[0], purchaseDate: errs.purchaseDate?.[0] });
      return;
    }

    setPurchaseErrors({});
    setPurchaseApiError(null);
    try {
      await createPurchaseMutation.mutateAsync({
        cardId: purchaseCardId,
        description: purchaseDescription,
        totalAmount: numericPurchaseAmount,
        installmentsCount,
        purchaseDate,
      });
      onCancel();
    } catch (err) {
      setPurchaseApiError(extractErrorMessage(err, 'Não foi possível registrar a compra'));
    }
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

  const isSaving = createPurchaseMutation.isPending;

  return (
    <>
      <AddButton onClick={onOpen} label="Lançamento" />

      <Sheet open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader onClose={handleCancel}>
            <SheetTitle className="text-2xl font-bold font-display text-primary">
              Novo Lançamento
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              Adicione uma entrada, saída ou gasto avulso, ou registre uma compra no cartão de crédito.
            </p>
          </DrawerHeader>

          <div className="flex-1 px-6 py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                Tipo de Lançamento
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('debito')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 h-12 text-xs font-bold rounded-xl transition-all duration-300 border',
                    mode === 'debito'
                      ? 'bg-primary/20 text-primary border-primary/50 shadow-glow'
                      : 'border-white/5 bg-surface-container text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  <Wallet className="h-4 w-4" />
                  Débito
                </button>
                <button
                  type="button"
                  onClick={() => activeCards.length > 0 && setMode('credito')}
                  disabled={activeCards.length === 0}
                  title={activeCards.length === 0 ? 'Cadastre um cartão de crédito para lançar compras' : undefined}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 h-12 text-xs font-bold rounded-xl transition-all duration-300 border',
                    mode === 'credito'
                      ? 'bg-primary/20 text-primary border-primary/50 shadow-glow'
                      : activeCards.length === 0
                        ? 'border-white/5 bg-surface-container/50 text-muted-foreground/30 cursor-not-allowed'
                        : 'border-white/5 bg-surface-container text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  <CreditCardIcon className="h-4 w-4" />
                  Crédito
                </button>
              </div>
              {activeCards.length === 0 && (
                <p className="text-[10px] text-muted-foreground/60 font-medium pl-1">
                  Cadastre um cartão de crédito na aba &quot;Cartões&quot; para lançar compras parceladas.
                </p>
              )}
            </div>

            {mode === 'debito' ? (
              <EntryForm values={values} onChange={setValues} errors={entryErrors} minDate={minDate} />
            ) : (
              <div className="space-y-4">
                <CreditCardSelect
                  cards={activeCards}
                  value={purchaseCardId}
                  onChange={setPurchaseCardId}
                  isLoading={cardsQuery.isLoading}
                />

                <TextInputField
                  label="Descrição"
                  placeholder="Ex: Notebook, Supermercado..."
                  value={purchaseDescription}
                  onChange={setPurchaseDescription}
                />

                <AmountInputField
                  label="Valor Total"
                  required
                  value={purchaseAmount}
                  onChange={setPurchaseAmount}
                  error={purchaseErrors.amount}
                />

                <DateInputField
                  label="Data da Compra"
                  required
                  value={purchaseDate}
                  onChange={setPurchaseDate}
                  minDate={minDate}
                  error={purchaseErrors.purchaseDate}
                />

                <NumberInputField
                  label="Número de Parcelas"
                  value={installmentsCount}
                  onChange={setInstallmentsCount}
                  min={1}
                  max={48}
                  suffix="x"
                />

                {purchaseApiError && (
                  <p className="text-xs text-destructive text-center">{purchaseApiError}</p>
                )}

                <PurchaseSimulationPreview
                  simulation={simulateMutation.data}
                  isLoading={simulateMutation.isPending}
                />
              </div>
            )}
          </div>

          <DrawerFooter>
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>

            {mode === 'debito' ? (
              <Button
                className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all"
                onClick={handleSave}
              >
                Salvar
              </Button>
            ) : (
              <Button
                className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all"
                onClick={handleConfirmPurchase}
                disabled={!isPurchaseValid || isSaving}
              >
                {isSaving ? 'Confirmando...' : 'Confirmar Compra'}
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Sheet>
    </>
  );
}
