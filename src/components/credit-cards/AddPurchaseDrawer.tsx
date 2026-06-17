'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { TextInputField, AmountInputField, DateInputField, NumberInputField } from '@/components/ui/form-field';
import { useSimulatePurchase } from '@/modules/credit-cards/hooks/use-simulate-purchase';
import { useCreatePurchase } from '@/modules/credit-cards/hooks/use-create-purchase';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { PurchaseSimulationPreview } from './PurchaseSimulationPreview';
import { purchaseFormSchema } from '@/lib/schemas/credit-cards';
import { cn } from '@/lib/utils';

type InputMode = 'total' | 'installment';

interface AddPurchaseDrawerProps {
  open: boolean;
  onClose: () => void;
  cardId: string | null;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AddPurchaseDrawer({ open, onClose, cardId }: AddPurchaseDrawerProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState(getTodayDateString());
  const [inputMode, setInputMode] = useState<InputMode>('total');
  const [error, setError] = useState<string | null>(null);

  const simulateMutation = useSimulatePurchase();
  const createMutation = useCreatePurchase();

  const numericAmount = parseFloat(amount.replace(',', '.'));

  // Total amount sent to backend depends on input mode
  const totalAmount = inputMode === 'installment' && !Number.isNaN(numericAmount)
    ? numericAmount * installmentsCount
    : numericAmount;

  const isFormValid =
    !!cardId &&
    description.trim() !== '' &&
    amount !== '' &&
    !Number.isNaN(numericAmount) &&
    numericAmount > 0 &&
    purchaseDate !== '';

  useEffect(() => {
    if (open) return;
    setDescription('');
    setAmount('');
    setInstallmentsCount(1);
    setPurchaseDate(getTodayDateString());
    setInputMode('total');
    setError(null);
    simulateMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounced preview: re-simulate whenever the form is valid and any value changes.
  useEffect(() => {
    if (!open || !isFormValid || !cardId) return;

    const timeout = setTimeout(() => {
      simulateMutation.mutate({
        cardId,
        description,
        totalAmount,
        installmentsCount,
        purchaseDate,
      });
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cardId, description, totalAmount, installmentsCount, purchaseDate, isFormValid]);

  async function handleConfirm() {
    const result = purchaseFormSchema.safeParse({
      cardId: cardId ?? '',
      description,
      amount,
      installmentsCount,
      purchaseDate,
    });
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? 'Dados inválidos');
      return;
    }

    setError(null);
    try {
      await createMutation.mutateAsync({
        cardId,
        description,
        totalAmount,
        installmentsCount,
        purchaseDate,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Não foi possível registrar a compra'));
    }
  }

  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
  };

  // Derived display: when in installment mode, show computed total alongside
  const computedTotal = inputMode === 'installment' && !Number.isNaN(numericAmount) && numericAmount > 0
    ? numericAmount * installmentsCount
    : null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-2xl font-bold font-display text-primary">
            Nova Compra
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Registre uma compra parcelada e veja o impacto nas próximas faturas antes de confirmar.
          </p>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4 space-y-4">
          <TextInputField
            label="Descrição"
            required
            placeholder="Ex: Notebook, Supermercado..."
            value={description}
            onChange={setDescription}
          />

          {/* Mode toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
              Forma de Entrada
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setInputMode('total'); setAmount(''); }}
                className={cn(
                  'flex-1 h-10 rounded-xl text-sm font-bold transition-all',
                  inputMode === 'total'
                    ? 'bg-primary text-white shadow-glow'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
                )}
              >
                Valor Total
              </button>
              <button
                type="button"
                onClick={() => { setInputMode('installment'); setAmount(''); }}
                className={cn(
                  'flex-1 h-10 rounded-xl text-sm font-bold transition-all',
                  inputMode === 'installment'
                    ? 'bg-primary text-white shadow-glow'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
                )}
              >
                Valor da Parcela
              </button>
            </div>
          </div>

          <AmountInputField
            label={inputMode === 'total' ? 'Valor Total' : 'Valor da Parcela'}
            required
            value={amount}
            onChange={setAmount}
          />

          <NumberInputField
            label="Número de Parcelas"
            value={installmentsCount}
            onChange={setInstallmentsCount}
            min={1}
            max={48}
            suffix="x"
          />

          {/* Show computed total when in installment mode */}
          {computedTotal !== null && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total da compra
              </span>
              <span className="text-sm font-black font-display text-white">
                R$ {computedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <DateInputField
            label="Data da Compra"
            value={purchaseDate}
            onChange={setPurchaseDate}
          />

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <PurchaseSimulationPreview
            simulation={simulateMutation.data}
            isLoading={simulateMutation.isPending}
          />
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            className="flex-1 h-11 rounded-xl bg-gradient-primary text-white font-bold shadow-glow hover:scale-[1.02] transition-all"
            onClick={handleConfirm}
            disabled={!isFormValid || createMutation.isPending}
          >
            {createMutation.isPending ? 'Confirmando...' : 'Confirmar Compra'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
