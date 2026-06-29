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
import { AmountInputField } from '@/components/ui/form-field';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/cashflow';
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

  const [selectedCount, setSelectedCount] = useState<number | null>(null);
  const [paidAmountStr, setPaidAmountStr] = useState('');
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

  const paidAmount = parseFloat(paidAmountStr.replace(',', '.'));
  const selectedOption = options.find((o) => o.count === selectedCount) ?? null;
  const discount = selectedOption ? selectedOption.originalAmount - paidAmount : 0;

  const isValid =
    selectedCount !== null &&
    !Number.isNaN(paidAmount) &&
    paidAmount > 0 &&
    paidAmount <= (selectedOption?.originalAmount ?? 0) + 0.005;

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
    setPaidAmountStr('');
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
                      setPaidAmountStr('');
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

            <AmountInputField
              label={t('paidAmountLabel')}
              value={paidAmountStr}
              onChange={(value) => {
                setPaidAmountStr(value);
                setError(null);
              }}
              placeholder={t('paidAmountPlaceholder')}
              error={
                !Number.isNaN(paidAmount) && paidAmount > selectedOption.originalAmount + 0.005
                  ? t('paidExceedsOriginal')
                  : undefined
              }
            />

            {!Number.isNaN(paidAmount) &&
              paidAmount > 0 &&
              paidAmount <= selectedOption.originalAmount + 0.005 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('savings')}</span>
                  <span className="font-bold text-green-400">
                    {formatCurrency(Math.max(0, discount))}
                  </span>
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
