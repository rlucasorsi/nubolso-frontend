'use client';

import { useMemo, useState } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/cashflow';
import { AmountInputField } from '@/components/ui/form-field';
import { useGetCardInvoices } from '@/modules/credit-cards/hooks/use-get-card-invoices';
import { useAnticipateInstallments } from '@/modules/credit-cards/hooks/use-anticipate-installments';
import { useTranslations } from '@/i18n/useTranslations';

interface Props {
  open: boolean;
  onClose: () => void;
  cardId: string;
  invoiceId: string;
  invoicePaymentDate: string;
  purchaseId: string;
  purchaseDescription: string;
}

export function AnticipateInstallmentsDrawer({
  open,
  onClose,
  cardId,
  invoiceId,
  invoicePaymentDate,
  purchaseId,
  purchaseDescription,
}: Props) {
  const t = useTranslations('anticipateDrawer');
  const { data: invoices, isLoading } = useGetCardInvoices(cardId, open);
  const anticipateMutation = useAnticipateInstallments();

  type InputMode = 'final' | 'discount';

  const [selectedCount, setSelectedCount] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('final');
  const [amountStr, setAmountStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  const futureInstallments = useMemo(() => {
    if (!invoices) return [];

    const eligible = invoices
      .filter((inv) => !inv.isPaid && inv.paymentDate > invoicePaymentDate)
      .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));

    return eligible.flatMap((inv) =>
      inv.installments.filter((i) => i.purchaseId === purchaseId && !i.isAnticipated),
    );
  }, [invoices, invoicePaymentDate, purchaseId]);

  const options = useMemo(() => {
    return futureInstallments.map((_, i) => ({
      count: i + 1,
      originalAmount: futureInstallments
        .slice(0, i + 1)
        .reduce((sum, inst) => sum + inst.amount, 0),
    }));
  }, [futureInstallments]);

  const selectedOption = options.find((o) => o.count === selectedCount) ?? null;
  const rawAmount = parseFloat(amountStr.replace(',', '.'));
  const paidAmount =
    inputMode === 'final'
      ? rawAmount
      : selectedOption && !Number.isNaN(rawAmount)
        ? selectedOption.originalAmount - rawAmount
        : NaN;
  const discountAmount =
    inputMode === 'discount'
      ? rawAmount
      : selectedOption && !Number.isNaN(rawAmount)
        ? selectedOption.originalAmount - rawAmount
        : NaN;

  const isValid =
    selectedCount !== null &&
    !Number.isNaN(paidAmount) &&
    paidAmount > 0 &&
    paidAmount <= (selectedOption?.originalAmount ?? 0) + 0.005;

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    setAmountStr('');
    setError(null);
  };

  const handleConfirm = async () => {
    if (selectedCount === null) return;
    if (!isValid) {
      setError(t('errorInvalid'));
      return;
    }
    setError(null);
    try {
      await anticipateMutation.mutateAsync({
        cardId,
        invoiceId,
        purchaseId,
        installmentsCount: selectedCount,
        paidAmount,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorInvalid'));
    }
  };

  const handleClose = () => {
    setSelectedCount(null);
    setInputMode('final');
    setAmountStr('');
    setError(null);
    onClose();
  };

  const reversedOptions = [...options].reverse();

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DrawerContent>
        <DrawerHeader onClose={handleClose}>
          <SheetTitle className="text-xl font-bold font-display text-primary">
            {t('title')}
          </SheetTitle>
          <SheetDescription className="text-sm font-medium text-white/80 mt-0.5">
            {purchaseDescription}
          </SheetDescription>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
          ) : options.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-sm text-muted-foreground">{t('noEligible')}</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {t('selectCount')}
              </p>
              <div className="space-y-2">
                {reversedOptions.map((opt) => (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => {
                      setSelectedCount(opt.count);
                      setAmountStr('');
                      setError(null);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm font-bold ${
                      selectedCount === opt.count
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 bg-white/5 text-foreground hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedCount === opt.count ? 'border-primary' : 'border-white/40'
                      }`}
                    >
                      {selectedCount === opt.count && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="flex-1 text-left">{t('option', { n: opt.count })}</span>
                    <span>{formatCurrency(opt.originalAmount)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {selectedCount !== null && selectedOption && (
          <div className="px-6 py-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('originalAmount')}</span>
              <span className="font-bold">{formatCurrency(selectedOption.originalAmount)}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('final')}
                className={cn(
                  'flex-1 h-9 rounded-xl text-xs font-bold transition-all',
                  inputMode === 'final'
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
                )}
              >
                {t('modeFinal')}
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('discount')}
                className={cn(
                  'flex-1 h-9 rounded-xl text-xs font-bold transition-all',
                  inputMode === 'discount'
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
                )}
              >
                {t('modeDiscount')}
              </button>
            </div>

            <div className="space-y-1">
              <AmountInputField
                label={inputMode === 'final' ? t('paidAmountLabel') : t('discountLabel')}
                value={amountStr}
                onChange={(v) => {
                  setAmountStr(v);
                  setError(null);
                }}
              />
              {inputMode === 'final' &&
                !Number.isNaN(rawAmount) &&
                rawAmount > selectedOption.originalAmount + 0.005 && (
                  <p className="text-xs text-destructive font-medium">{t('paidExceedsOriginal')}</p>
                )}
              {inputMode === 'discount' &&
                !Number.isNaN(rawAmount) &&
                rawAmount >= selectedOption.originalAmount && (
                  <p className="text-xs text-destructive font-medium">
                    {t('discountExceedsOriginal')}
                  </p>
                )}
            </div>

            {isValid && (
              <div className="flex items-center justify-between text-sm">
                {inputMode === 'final' ? (
                  <>
                    <span className="text-muted-foreground">{t('savings')}</span>
                    <span className="font-bold text-green-400">
                      {formatCurrency(Math.max(0, discountAmount))}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">{t('finalAmountResult')}</span>
                    <span className="font-bold text-white">
                      {formatCurrency(Math.max(0, paidAmount))}
                    </span>
                  </>
                )}
              </div>
            )}

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          </div>
        )}

        <DrawerFooter>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
            onClick={handleClose}
          >
            {t('cancel')}
          </Button>
          <Button
            className="flex-1 h-11 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-all"
            onClick={handleConfirm}
            disabled={selectedCount === null || anticipateMutation.isPending}
          >
            {anticipateMutation.isPending ? t('confirming') : t('confirm')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
