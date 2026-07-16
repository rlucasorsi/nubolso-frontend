'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/app-drawer';
import { Button } from '@/components/ui/button';
import { AmountInputField, DateInputField } from '@/components/ui/form-field';
import { useAdvanceInvoicePayment } from '@/modules/credit-cards/hooks/use-advance-invoice-payment';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { formatCurrency } from '@/lib/cashflow';
import { MONTH_KEYS } from '@/components/painel/config';
import type { CreditCardInvoice } from '@/modules/credit-cards/model/api/invoice';
import { useTranslations } from '@/i18n/useTranslations';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface AdvancePaymentDrawerProps {
  invoice: CreditCardInvoice;
  remainingAmount: number;
  open: boolean;
  onClose: () => void;
}

export function AdvancePaymentDrawer({
  invoice,
  remainingAmount,
  open,
  onClose,
}: AdvancePaymentDrawerProps) {
  const t = useTranslations('advancePaymentDrawer');
  const td = useTranslations('dateNames');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [error, setError] = useState<string | null>(null);

  const advanceMutation = useAdvanceInvoicePayment();

  useEffect(() => {
    if (open) {
      setAmount('');
      setPaymentDate(getTodayDateString());
      setError(null);
    }
  }, [open]);

  const numericAmount = parseFloat(amount.replace(',', '.'));
  const amountExceedsRemaining =
    !Number.isNaN(numericAmount) && numericAmount > remainingAmount + 0.005;
  const isAmountValid =
    !Number.isNaN(numericAmount) && numericAmount > 0 && !amountExceedsRemaining;

  async function handleConfirm() {
    setError(null);
    try {
      await advanceMutation.mutateAsync({ id: invoice.id, amount: numericAmount, paymentDate });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, t('confirmError')));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader onClose={onClose}>
          <SheetTitle className="text-xl font-bold font-display text-primary">
            {t('title')}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {t('invoiceHeader', {
              month: td(MONTH_KEYS[invoice.referenceMonth - 1]),
              year: invoice.referenceYear,
            })}{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(remainingAmount)}
            </span>
          </p>
          <SheetDescription className="sr-only">{t('srDescription')}</SheetDescription>
        </DrawerHeader>

        <div className="flex-1 px-6 py-4 space-y-4">
          <DateInputField label={t('paymentDate')} value={paymentDate} onChange={setPaymentDate} />

          <AmountInputField
            label={t('amount')}
            required
            value={amount}
            onChange={setAmount}
            error={
              amountExceedsRemaining
                ? t('amountExceeds', { amount: formatCurrency(remainingAmount) })
                : undefined
            }
          />

          <p className="text-xs text-muted-foreground">{t('hint')}</p>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={advanceMutation.isPending}
            className="flex-1 h-11 rounded-xl border-white/10 hover:bg-white/5"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isAmountValid || advanceMutation.isPending}
            className="flex-1 h-11 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {advanceMutation.isPending ? t('processing') : t('confirm')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Sheet>
  );
}
